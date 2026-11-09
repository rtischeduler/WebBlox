// Roblox sign-in through Singuloxy (sandstone ProxyFrame + libcurl over wisp), no service worker.
// The login page is shown in a ProxyFrame; the libcurl session keeps the cookies, and every later
// Roblox request (webbloxProxyFetch) goes through that same session.
(() => {
  let frame, pendingSignIn, timer;
  const JAR_KEY = 'proxy_libcurl_jar';
  const AUTH_URL = 'https://users.roblox.com/v1/users/authenticated';
  try {
    localStorage.removeItem('cobalt-cookies');
    if (localStorage.getItem('webblox.launcher.theme') === 'Truffled') {
      localStorage.setItem('webblox.launcher.theme', 'Default');
    }
  } catch {}

  const hasSecurityCookie = () => {
    try { return /ROBLOSECURITY\t[^\s]{20,}/.test(localStorage.getItem(JAR_KEY) || ''); } catch { return false; }
  };
  const proxy = () => window.proxyTransport.start();
  const isSignedIn = async () => {
    try {
      const { libcurl } = await proxy();
      const res = await libcurl.fetch(AUTH_URL, { headers: { accept: 'application/json' } });
      return res.status === 200 && !!JSON.parse(await res.text()).id;
    } catch { return false; }
  };
  const closeFrame = () => {
    clearInterval(timer);
    if (frame) { frame.iframe.remove(); frame = null; }
  };

  window.webbloxProxySignIn = (quiet = false) => {
    if (pendingSignIn) return pendingSignIn;
    const run = (async () => {
      if (await isSignedIn()) return true;
      if (quiet) return false;
      const st = await proxy();
      const { ProxyFrame } = st.sandstone.controller;
      frame = new ProxyFrame();
      frame.iframe.title = 'Sign in with Roblox';
      frame.iframe.className = 'session-prompt';
      frame.iframe.setAttribute('allow', 'autoplay; fullscreen; clipboard-write');
      Object.assign(frame.iframe.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', border: '0', background: '#fff', zIndex: 2147483000 });
      document.body.append(frame.iframe);
      await frame.wait_for_libcurl();
      frame.navigate_to('https://www.roblox.com/login').catch(e => console.warn('[signin] navigate failed', e));
      return new Promise((resolve, reject) => {
        const started = Date.now();
        let busy = false;
        timer = setInterval(async () => {
          if (busy) return;
          if (Date.now() - started > 15 * 60000) { closeFrame(); return reject(new Error('Roblox sign-in timed out.')); }
          if (!hasSecurityCookie()) return;
          busy = true;
          try { if (await isSignedIn()) { closeFrame(); resolve(true); } }
          finally { busy = false; }
        }, 2000);
      });
    })();
    pendingSignIn = run.finally(() => { pendingSignIn = null; });
    return pendingSignIn;
  };

  window.webbloxProxyResume = async () => {
    try { return await window.webbloxProxySignIn(true); } catch { return false; }
  };

  window.webbloxProxyFetch = async (url, init = {}) => {
    if (!(await window.webbloxProxySignIn())) throw new Error('Not signed in to Roblox.');
    const { libcurl } = await proxy();
    const headers = {};
    for (const [k, v] of new Headers(init.headers || {})) {
      if (!['cookie', 'host', 'content-length'].includes(k.toLowerCase())) headers[k] = v;
    }
    let body = init.body ?? undefined;
    if (body instanceof Blob) body = await body.arrayBuffer();
    const method = init.method || 'GET';
    const res = await libcurl.fetch(String(url), { method, headers, body, redirect: 'follow' });
    const out = new Headers();
    for (const [k, v] of res.headers.entries()) {
      if (!['set-cookie', 'content-encoding', 'content-length', 'transfer-encoding'].includes(k.toLowerCase())) out.append(k, v);
    }
    const empty = [204, 205, 304].includes(res.status) || method === 'HEAD';
    return new Response(empty ? null : await res.arrayBuffer(), { status: res.status, headers: out });
  };
})();
