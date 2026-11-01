# Join flow notes (from engine snapshot, version-75f1039cb4964863)

Source: strings and imports in engine/ (wasm is engine/WebClient.wasm.gz.part000, 100 MB raw).
Rebuild: `cat engine/WebClient.wasm.gz.part* | gunzip > WebClient.wasm`

Verified from imports (engine/wasm-imports.txt)
- Networking is only `emscripten_websocket_*` (new, send_binary, send_utf8_text, callbacks) plus `emscripten_start_fetch` / `js_fetch_file` for HTTP. No WebRTC/UDP.
- Memory is shared (pthreads), so `SharedArrayBuffer` / cross-origin isolation is mandatory.

Inferred from strings (not yet confirmed at runtime)
- HTTP join: `/v1/join-game`, `/v2/join-game`, `*-instance` variants (PlaceLauncher), `/v1/authentication-ticket/redeem`. Response is parsed as a GameJoinResponse JSON.
- Fields seen: MachineAddress, UdmuxEndpoints (UdMuxIp / UdMuxPort / UdmuxToken), ClientTicket, SessionId.
- CORRECTION: `utpprotocols/uts/*.proto` (Handshake{run_id, role}, ImageBegin/Chunk/End, ProfilingControl) is an automated test harness (screenshots, profiling), NOT the game join protocol. The game connection is not described by any embedded protobuf schema; it is Roblox's native binary replication carried over WebSocket and must be reconstructed from captured frames.
- Chat/game state ride the replication stream after the handshake.

Next: capture real websocket frames and join-game request/response in a live session.
