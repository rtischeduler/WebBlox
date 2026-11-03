// Step 3b host: paints the runtime's draw list on a 2D canvas and feeds pointer input back.
//   const g = attachCanvasGui(canvas, runtime, { resolveImage(src) -> url|Promise<url> })
//   g.stop()
export function paintList(ctx, list, imgs = {}, requestImage = () => {}) {
  const clips = [];
  const path = (x, y, w, h, r) => { ctx.beginPath(); if (r > 0 && ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
  for (const c of list) {
    switch (c.k) {
      case "clip": ctx.save(); path(c.x, c.y, c.w, c.h, 0); ctx.clip(); clips.push(1); break;
      case "unclip": if (clips.pop()) ctx.restore(); break;
      case "rect": ctx.globalAlpha = c.a; ctx.fillStyle = c.c; path(c.x, c.y, c.w, c.h, c.r); ctx.fill(); break;
      case "stroke": ctx.globalAlpha = c.a; ctx.strokeStyle = c.c; ctx.lineWidth = c.t; path(c.x + c.t / 2, c.y + c.t / 2, c.w - c.t, c.h - c.t, c.r); ctx.stroke(); break;
      case "image": {
        const im = imgs[c.src];
        if (!im) { requestImage(c.src); break; }
        if (im === "failed") break;
        ctx.globalAlpha = c.a;
        ctx.save(); path(c.x, c.y, c.w, c.h, c.r); ctx.clip();
        if (c.sw > 0 && c.sh > 0) ctx.drawImage(im, c.sx, c.sy, c.sw, c.sh, c.x, c.y, c.w, c.h);
        else ctx.drawImage(im, c.x, c.y, c.w, c.h);
        ctx.restore(); break;
      }
      case "text": {
        ctx.globalAlpha = c.a;
        ctx.font = fontOf(c);
        ctx.textBaseline = "top";
        const lines = c.wrap ? wrap(ctx, c.text, c.w) : c.text.split("\n");
        const lh = Math.ceil(c.size * 1.15), total = lh * lines.length;
        let y = c.ay === "Top" ? c.y : c.ay === "Bottom" ? c.y + c.h - total : c.y + (c.h - total) / 2;
        ctx.save(); path(c.x, c.y, c.w, c.h, 0); ctx.clip();
        for (const ln of lines) {
          const tw = ctx.measureText(ln).width;
          const x = c.ax === "Left" ? c.x : c.ax === "Right" ? c.x + c.w - tw : c.x + (c.w - tw) / 2;
          if (c.sc < 1) { ctx.globalAlpha = c.a * (1 - c.sc); ctx.strokeStyle = c.scc; ctx.lineWidth = 2; ctx.strokeText(ln, x, y); ctx.globalAlpha = c.a; }
          ctx.fillStyle = c.c; ctx.fillText(ln, x, y); y += lh;
        }
        ctx.restore(); break;
      }
    }
  }
  while (clips.pop()) ctx.restore();
  ctx.globalAlpha = 1;
}

export const fontOf = (c) => `${c.weight >= 700 ? 700 : c.weight >= 500 ? 600 : 400} ${c.size}px 'Source Sans Pro', 'Builder Sans', system-ui, sans-serif`;

export function wrap(ctx, text, width) {
  const out = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const t = line ? line + " " + word : word;
      if (line && ctx.measureText(t).width > width) { out.push(line); line = word; } else line = t;
    }
    out.push(line);
  }
  return out;
}

// text measurement for the layout engine (same fonts as the painter)
export function makeMeasure(ctx) {
  return (text, size, _family, width) => {
    ctx.font = `400 ${size}px 'Source Sans Pro', system-ui, sans-serif`;
    const lh = Math.ceil(size * 1.15);
    if (!width || width <= 0 || !isFinite(width)) { const ls = text.split("\n"); return [Math.ceil(Math.max(...ls.map((l) => ctx.measureText(l).width))), lh * ls.length]; }
    const ls = wrap(ctx, text, width);
    return [Math.min(Math.ceil(Math.max(...ls.map((l) => ctx.measureText(l).width))), width), lh * ls.length];
  };
}

export function attachCanvasGui(canvas, rt, { resolveImage = (s) => s, inset = 36, status = () => "" } = {}) {
  const ctx = canvas.getContext("2d");
  const imgs = {}, asked = new Set();
  let dirty = true, last = performance.now(), raf = 0, stopped = false, size = "";
  const requestImage = (src) => {
    if (asked.has(src)) return; asked.add(src);
    Promise.resolve(resolveImage(src)).then((u) => new Promise((ok, no) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => ok(im); im.onerror = no; im.src = u; }))
      .then((im) => { imgs[src] = im; dirty = true; }, () => { imgs[src] = "failed"; });
  };
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * (cssW() / r.width), (e.clientY - r.top) * (cssH() / r.height)]; };
  const cssW = () => canvas.clientWidth || canvas.width, cssH = () => canvas.clientHeight || canvas.height;
  const on = (t, f) => canvas.addEventListener(t, f);
  on("pointermove", (e) => { rt.pointer("move", ...pos(e)); });
  on("pointerdown", (e) => { rt.pointer("down", ...pos(e), e.button === 2 ? 2 : 1); dirty = true; });
  on("pointerup", (e) => { rt.pointer("up", ...pos(e), e.button === 2 ? 2 : 1); dirty = true; });
  on("wheel", (e) => { rt.pointer("wheel", ...pos(e), e.deltaY); });
  const frame = (now) => {
    if (stopped) return;
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    const dpr = Math.min(devicePixelRatio || 1, 2), w = cssW(), h = cssH(), k = w + "x" + h + "@" + dpr;
    if (k !== size) { size = k; canvas.width = Math.max(1, Math.floor(w * dpr)); canvas.height = Math.max(1, Math.floor(h * dpr)); rt.layout(w, h, inset); dirty = true; }
    try { rt.step(dt); } catch (e) { console.error("[gui] step", e); }
    if (dirty || rt.needsPaint()) {
      dirty = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      try {
        const list = JSON.parse(rt.draw());
        if (!list.length) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h); ctx.fillStyle = "#6d6f73"; ctx.font = "13px system-ui, sans-serif"; ctx.textBaseline = "alphabetic"; const ls = String(status() || "CoreGui running; nothing drawn yet").split("\n"); ls.forEach((t, i) => ctx.fillText(t.slice(0, 200), 16, h - 16 - 18 * (ls.length - 1 - i))); }
        else paintList(ctx, list, imgs, requestImage);
      } catch (e) { console.error("[gui] paint", e); }
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return { stop() { stopped = true; cancelAnimationFrame(raf); }, invalidate() { dirty = true; } };
}
