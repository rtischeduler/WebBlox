# Join flow notes (from engine snapshot, version-75f1039cb4964863)

Source: strings, imports and glue code in `engine/` and `analysis/` (wasm is `engine/WebClient.wasm.gz.part000`, 100 MB raw).
Rebuild: `cat engine/WebClient.wasm.gz.part* | gunzip > WebClient.wasm`

## Correction: the game connection is WebTransport, not WebSocket

The earlier notes assumed the replication stream rides a WebSocket. The evidence says otherwise.

- `engine/wasm-imports.txt` has a `rbx_wasm_rna_*` family (`connect_js`, `open_stream_js`, `write_stream_js`, `send_datagram_js`, `close_js`, `is_supported_js`, receive-ring callbacks). That is the game transport.
- `rbx_wasm_rna_connect_js` in `WebClient.js` calls the browser's `new WebTransport(url, { serverCertificateHashes })`. The hashes are base64 SHA-256 strings passed in by the wasm. It then reads `datagrams.readable` and `incomingUnidirectionalStreams`, and opens streams and datagrams on request. Data is handed to the wasm through a shared receive ring.
- Log strings confirm it: `Connecting WASM WebTransport to {}`, `QUIC handshake state changed to {}`, `WASM WebTransport connection to {}:{} completed successfully`, `RbxTransportClient connected to server at {}:{}`.
- The `emscripten_websocket_*` imports and `WebSocketService` strings belong to the TestService / UTP harness (`DebugUTPLauncherWebSocketUri`, `TestServiceConnectionManager`). The old launcher's websocket logging therefore captured nothing about the game.
- The connect function has no `if (T) return M(...)` guard like the websocket glue, so it can run on a pthread worker. A tap installed on the main window will not see it.
- WebTransport is HTTP/3 over QUIC (UDP). It cannot be tunnelled through a TCP/wisp proxy, so this one connection goes straight from the browser to the game server. All HTTP traffic still goes through the proxy.

## HTTP join (high confidence, strings in `analysis/join-context.txt`)

- Endpoints: `/v1/join-game`, `/v1/join-game-instance`, `/v2/join-game`, `/v2/join-game-instance`, `/v1/join-private-game`, `/v1/join-reserved-game`, `/v1/authentication-ticket/redeem`.
- Body fields seen as strings: `placeId`, `isTeleport`, `gameJoinAttemptId`, `gameJoinContext`, `joinOrigin`, `browserTrackerId`, `isPlayTogetherGame`.
- Response is a join reply with `status`, `jobId`, queue position and a join script payload (`GameJoinV2 onResponseReady: status={} jobId={} queuePos={} joinScriptPayloadSize={}`).
- Join script fields seen: `MachineAddress`, `UdmuxEndpoints`, `UdMuxIp`, `UdMuxPort`, `ClientTicket`, `SessionId`, and an `RbxTransportConfig` holding a token, a port, server capabilities and `ephemeralEarlyPublicKey`.
- Certificate hashes can come from config (`RbxTransportCertHashesInNetStackConfig`, `DebugRbxTransportWtCertHash`).
- `join.html` uses `/v1/join-game` and `/v1/join-game-instance` and polls while `status` is 0 or 1. The numeric status meanings other than "2 = joined" are not verified; unknown statuses are shown with their raw code and message.

## Layers above the transport (inferred, not decoded)

1. RbxTransport "RNA" connection: numbered channels with a channel header, reliable (stream) and unreliable (datagram) channels, fragment ids and ACKs (`Received unrecognized channel header`, `Received too large channelId value`, `Received ACK for unknown fragment id`).
2. RUPP token handshake (`Invalid Rupp header length {} > bytes read {}`, `Client failed Rupp setup`).
3. Session keys derived from the ephemeral early public key in the join config.
4. Roblox replication (`Replicator`, `ClientReplicator`) carrying the Players service, instances and chat.

Embedded protobuf schemas (`utpprotocols/uts/*.proto`) are a test harness, not the game protocol.

## What `join.html` does today

1. Loads Singuloxy and picks a wisp server.
2. Gets a CSRF token and calls the join endpoint through the proxy with your cookie (only attached to Roblox hosts).
3. Shows the join script with tickets and session data redacted, and extracts the UDMUX endpoints and any certificate hashes.
4. Finds the server in the public server list and shows its players. The list exposes anonymous player tokens; avatars are fetched through the proxy. Names are not available this way.
5. Optionally opens the WebTransport connection directly and records every datagram and stream chunk into a capture you can download.

## Open questions, in the order they block progress

1. The exact WebTransport URL (host, port, path) and where the certificate hashes sit in the join reply. Join with the URL override empty first; the capture records the URL tried and the failure reason.
2. Who speaks first: whether the server sends anything unprompted or waits for a client stream or datagram.
3. Channel header layout and the RUPP handshake.
4. Key agreement from the ephemeral key, and the cipher used per channel.
5. Replication packet layout, starting with the Players service so names can replace the anonymous avatars.

To answer 1 to 4 against the real engine, hook `WebTransport` inside the pthread workers as well as the main thread, and log the constructor arguments plus every chunk. `PlayerList` already has a `replication` source ready for the decoder.

## Extracting the real join request (workflow `extract-join`)

The engine builds the join body inside the wasm, so strings alone do not show it. Run the `extract-join` workflow (Actions tab, "Run workflow"). Tick `refetch` to pull the current production engine first. It unpacks `WebClient.wasm`, finds the functions that reference the body keys (`placeId`, `isTeleport`, `gameJoinAttemptId`, ...) and the join URLs, and writes `analysis/join/join-request.txt` (strings in code order per function), `join-neighbors.txt` and `join-request-functions.wat`. The unpacked wasm is attached as the `WebClient-wasm` artifact.

## Result of the wasm extraction (engine `f2568` joinGame, `f2560` teleport)

Strings in code order for the real builders (`analysis/join/join-request.txt`):

- Standard join, `/v1/join-game` (log: `joinGamePostStandard: URL: {} BODY: {}`): keys `placeId`, `browserTrackerId`, and `forcedPop` only when set.
- Instance join, `/v1/join-game-instance`: `placeId`, `gameId`, `isPlayTogetherGame`, `browserTrackerId`.
- Private server: `placeId`, `linkCode`, `accessCode`, `browserTrackerId`. Reserved server: `placeId`, `accessCode`, `browserTrackerId`.
- `isTeleport` appears only in the teleport functions, not in the first join. `gameJoinAttemptId` is not in any of these bodies.
- The log format `{"browserTrackerId":{},"status":"{}"}` suggests `browserTrackerId` is numeric.
- Not decoded: how the engine obtains `browserTrackerId`, its header set, and when it picks `/v2/join-game`.

## Fix for status 12 "Unable to join Game 211"

`join.html?probe` showed that only the request carrying `user-agent: Roblox/WinInet` was accepted (status 2 with a join script). Browser-style headers, `content-type` only, and a root referer all returned status 12 / 211, and `/v2/join-game` returned 404 for that account. `joinGame` now always sends that user-agent and no `Origin`.

## How the real engine leaves a server (from `engine/WebClient.js`)

The JS half of leaving is small. `rbx_wasm_rna_send_connection_close_js` and `rbx_wasm_rna_close_js` both mark the connection closed and call `WebTransport.close({ closeCode: 0, reason: "" })`; `close_js` also removes the connection from the engine's table and queues a `closeComplete` callback back into the wasm (`rbx_wasm_rna_on_close_complete`). Per stream, `shutdown_stream_write_js` is `writer.close()` and `shutdown_stream_read_js` is `reader.cancel()`.

What the JS does not show: the in-protocol goodbye. The wasm has `ClientDisconnect`, `ClientDisconnectWithCode`, `DisconnectClientInitiated` and `DisconnectClientRequest` strings, so the client almost certainly sends a disconnect message over the RNA channels before it calls `send_connection_close_js`. That message is encrypted and not decoded, so `Transport.leave()` reproduces only the transport half (finish write sides, then `close({ closeCode: 0, reason: "" })`).

## Staying in a server, chat, and what is still missing

`join.html` now keeps the WebTransport session open until you press **Leave server** (or the server closes it), instead of dropping it after 4 seconds. `Session` reports the result honestly: `left` if you left, `dropped` if the server closed it first.

Expect `dropped`. Nothing answers the server's RUPP handshake or keepalives yet, so a real server will close the connection on its own. Staying for real, and reading or sending chat, both need open questions 3 to 5 above (channel header, RUPP, key agreement, replication decoding). `ChatClient` has slots for a `decode` and an `encode` function; until they exist, the chat panel shows connection events only and Send is disabled.

## The engine's loading screen (`engine/WasmPlayer.js`)

The page script for `/games/start` only renders markup. The engine's own JS (class `re`, a `LoadingScreen`) fills it in: title, creator and verified badge from `economy .../v2/assets/{placeId}/details`; icon and background from `thumbnails` after `apis .../universes/v1/places/{placeId}/universe`. The wasm reports progress and failures through `window.__onEngineLoadingStatus({kind, message, errorCode, source, statusCode})`, where `source` is `join`, `teleport` or `gui-service` and picks the error panel title and priority. `join.html` uses the same shape, so a decoded replication layer can report failures through `LoadingScreen.showEngineFailure`.
