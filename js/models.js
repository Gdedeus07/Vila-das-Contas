// Vila das Contas — modelos 3D low-poly feitos com formas simples.
(function (VC) {
  'use strict';
  const T = window.THREE;
  const cache = {};
  function M(color, o) {
    const key = color + JSON.stringify(o || {});
    if (!cache[key]) cache[key] = new T.MeshPhongMaterial(Object.assign({ color, flatShading: true, shininess: 6, specular: 0x111111 }, o || {}));
    return cache[key];
  }
  function mesh(geo, color, o, noShadow) {
    const m = new T.Mesh(geo, color && color.isMaterial ? color : M(color, o));
    m.castShadow = !noShadow; m.receiveShadow = true; return m;
  }
  function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }
  const G = () => new T.Group();
  const box = (w, h, d, c, o) => mesh(new T.BoxGeometry(w, h, d), c, o);
  const cyl = (rt, rb, h, c, seg, o) => mesh(new T.CylinderGeometry(rt, rb, h, seg || 10), c, o);
  const sph = (r, c, o, ws, hs) => mesh(new T.SphereGeometry(r, ws || 10, hs || 8), c, o);

  // ---------- Texturas de placa (desenho em canvas) ----------
  const SYMS = { star: '★', circle: '●', tri: '▲', heart: '♥', square: '■', diamond: '◆' };
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); draw(ctx, w, h);
    const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  function signTex(emoji, text, bg) {
    return canvasTex(512, 160, (ctx, w, h) => {
      ctx.fillStyle = bg || '#fffaf0'; rr(ctx, 6, 6, w - 12, h - 12, 30); ctx.fill();
      ctx.lineWidth = 10; ctx.strokeStyle = '#2b2a4a'; ctx.stroke();
      ctx.font = '96px ' + EMOJI_FONT; ctx.textBaseline = 'middle'; ctx.fillText(emoji, 26, h / 2 + 6);
      ctx.fillStyle = '#2b2a4a'; ctx.font = '800 58px "Baloo 2","Trebuchet MS",sans-serif'; ctx.fillText(text, 150, h / 2 + 6);
    });
  }
  function symTex(sym, color) {
    return canvasTex(128, 128, (ctx, w, h) => {
      ctx.fillStyle = '#fffaf0'; rr(ctx, 4, 4, w - 8, h - 8, 22); ctx.fill();
      ctx.lineWidth = 8; ctx.strokeStyle = color; ctx.stroke();
      ctx.fillStyle = color; ctx.font = '800 84px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(SYMS[sym] || sym, w / 2, h / 2 + 6);
    });
  }
  function emojiTex(e, bg) {
    return canvasTex(128, 128, (ctx, w, h) => {
      if (bg) { ctx.fillStyle = bg; rr(ctx, 4, 4, w - 8, h - 8, 22); ctx.fill(); }
      ctx.font = '88px ' + EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, w / 2, h / 2 + 6);
    });
  }
  function textTex(text, bg, fg) {
    return canvasTex(256, 128, (ctx, w, h) => {
      ctx.fillStyle = bg; rr(ctx, 4, 4, w - 8, h - 8, 24); ctx.fill();
      ctx.fillStyle = fg || '#2b2a4a'; ctx.font = '800 76px "Baloo 2",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2 + 6);
    });
  }
  function plane(w, h, tex) {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, transparent: true }));
    return m;
  }
  // Plaquinha em pé com símbolo (cor nunca sozinha).
  function symFlag(sym, color, hgt) {
    const g = G();
    g.add(at(cyl(0.02, 0.02, hgt || 0.5, '#8a5a3a', 5), 0, (hgt || 0.5) / 2, 0));
    const p = plane(0.3, 0.3, symTex(sym, color)); at(p, 0, (hgt || 0.5) + 0.1, 0.01); g.add(p);
    return g;
  }

  // ---------- Itens ----------
  const I = {};
  I.paoq = () => { const g = G(); const m = mesh(new T.IcosahedronGeometry(0.16, 1), '#e9b44c'); m.scale.set(1, 0.72, 1); at(m, 0, 0.115, 0); g.add(m); return g; };
  I.paof = () => { const g = G(); const m = sph(0.15, '#d8994a', null, 9, 6); m.scale.set(1.3, 0.62, 0.72); at(m, 0, 0.09, 0); g.add(m);
    for (let i = -1; i <= 1; i++) { const s = box(0.04, 0.02, 0.12, '#f3c98a'); at(s, i * 0.1, 0.18, 0); s.rotation.y = 0.5; g.add(s); } return g; };
  I.laranja = () => { const g = G(); g.add(at(mesh(new T.IcosahedronGeometry(0.15, 1), '#f28c28'), 0, 0.15, 0)); const l = box(0.08, 0.02, 0.04, '#3fa45b'); at(l, 0.03, 0.3, 0); l.rotation.z = 0.4; g.add(l); return g; };
  I.banana = () => { const g = G(); const m = mesh(new T.TorusGeometry(0.15, 0.048, 5, 10, 2.1), '#f4d03f'); m.rotation.x = -Math.PI / 2; at(m, -0.02, 0.05, 0.08); g.add(m);
    const tip = sph(0.03, '#6b4a1e'); at(tip, 0.13, 0.05, 0.02); g.add(tip); return g; };
  I.maca = () => { const g = G(); const m = sph(0.145, '#d63c3c'); m.scale.set(1, 0.9, 1); at(m, 0, 0.14, 0); g.add(m); g.add(at(cyl(0.012, 0.012, 0.08, '#6b4a1e', 5), 0, 0.3, 0));
    const l = box(0.08, 0.015, 0.04, '#3fa45b'); at(l, 0.05, 0.3, 0); g.add(l); return g; };
  let coinMats = null;
  I.moeda = () => {
    if (!coinMats) { const t = canvasTex(128, 128, (ctx) => { ctx.fillStyle = '#e8bd45'; ctx.fillRect(0, 0, 128, 128); ctx.strokeStyle = '#b88a1a'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(64, 64, 52, 0, 7); ctx.stroke(); ctx.fillStyle = '#7a5a0a'; ctx.font = '800 70px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1', 64, 70); });
      coinMats = [M('#d9ab2c'), new T.MeshPhongMaterial({ map: t, shininess: 30 }), M('#d9ab2c')]; }
    const g = G(); const m = new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.04, 18), coinMats); m.castShadow = true; at(m, 0, 0.02, 0); g.add(m); return g;
  };
  I.ovo = () => { const g = G(); const m = sph(0.095, '#f6ead2'); m.scale.set(1, 1.3, 1); at(m, 0, 0.12, 0); g.add(m); return g; };
  I.galinha = () => {
    const g = G(); const body = sph(0.2, '#fbfbf5'); body.scale.set(1.15, 0.95, 0.9); at(body, 0, 0.33, 0); g.add(body);
    const tail = mesh(new T.ConeGeometry(0.1, 0.22, 5), '#f0efe6'); at(tail, -0.22, 0.45, 0); tail.rotation.z = 0.7; g.add(tail);
    g.add(at(sph(0.11, '#fbfbf5'), 0.18, 0.52, 0));
    for (let i = 0; i < 3; i++) g.add(at(box(0.04, 0.06, 0.03, '#d93a3a'), 0.13 + i * 0.05, 0.64, 0));
    const beak = mesh(new T.ConeGeometry(0.035, 0.09, 4), '#f2a516'); beak.rotation.z = -Math.PI / 2; at(beak, 0.31, 0.51, 0); g.add(beak);
    g.add(at(sph(0.02, '#2b2a4a'), 0.24, 0.55, 0.07)); g.add(at(sph(0.02, '#2b2a4a'), 0.24, 0.55, -0.07));
    g.add(at(sph(0.03, '#d93a3a'), 0.27, 0.45, 0));
    const paws = [];
    [-0.07, 0.07].forEach(z => { g.add(at(cyl(0.018, 0.018, 0.16, '#f2a516', 5), 0.02, 0.1, z)); const f = box(0.12, 0.02, 0.07, '#f2a516'); at(f, 0.05, 0.01, z); g.add(f); paws.push(f); });
    g.userData.paws = paws; return g;
  };
  I.milho = () => { const g = G(); const m = cyl(0.065, 0.055, 0.3, '#f2c12e', 7); m.rotation.x = Math.PI / 2; at(m, 0, 0.07, -0.03); g.add(m);
    [0.05, -0.05].forEach(x => { const h = mesh(new T.ConeGeometry(0.045, 0.18, 4), '#6dbb4a'); h.rotation.x = -Math.PI / 2; at(h, x, 0.07, 0.17); g.add(h); }); return g; };
  const SPR = ['#ffc53d', '#e5487a', '#2f7fd0', '#3fa45b', '#fffaf0'];
  I.brig = () => { const g = G(); const cup = mesh(new T.CylinderGeometry(0.1, 0.075, 0.08, 10, 1, true), '#e5487a', { side: T.DoubleSide }); at(cup, 0, 0.04, 0); g.add(cup);
    g.add(at(sph(0.095, '#4a2a1a'), 0, 0.13, 0));
    for (let i = 0; i < 6; i++) { const a = i * 1.05, s = box(0.035, 0.012, 0.012, SPR[i % 5]); at(s, Math.cos(a) * 0.06, 0.2 - (i % 2) * 0.03, Math.sin(a) * 0.06); s.rotation.y = a; g.add(s); } return g; };
  const BAL = ['#e5487a', '#2f7fd0', '#ffc53d', '#3fa45b', '#f28c28', '#9b6ad6'];
  let balN = 0;
  I.balao = () => { const g = G(); const c = BAL[balN++ % BAL.length]; const b = sph(0.15, c, { shininess: 40 }); b.scale.set(1, 1.2, 1); at(b, 0, 0.64, 0); g.add(b);
    const k = mesh(new T.ConeGeometry(0.03, 0.05, 5), c); at(k, 0, 0.45, 0); g.add(k); g.add(at(cyl(0.006, 0.006, 0.42, '#6b6890', 4), 0, 0.22, 0)); return g; };
  let figN = 0;
  I.figu = () => { const g = G(); const t = emojiTex(['⭐', '🐶', '⚽', '🌈', '🚀', '🦋'][figN++ % 6], ['#2f7fd0', '#e5487a', '#3fa45b'][figN % 3]);
    const m = new T.Mesh(new T.BoxGeometry(0.22, 0.02, 0.3), [M('#fffaf0'), M('#fffaf0'), new T.MeshPhongMaterial({ map: t }), M('#fffaf0'), M('#fffaf0'), M('#fffaf0')]);
    m.castShadow = true; at(m, 0, 0.01, 0); g.add(m); return g; };
  let lapN = 0;
  I.lapis = () => { const g = G(); const c = ['#e5487a', '#2f7fd0', '#3fa45b', '#ffc53d'][lapN++ % 4]; const b = cyl(0.035, 0.035, 0.3, c, 6); b.rotation.z = Math.PI / 2; at(b, 0, 0.035, 0); g.add(b);
    const tip = mesh(new T.ConeGeometry(0.035, 0.08, 6), '#e8c99a'); tip.rotation.z = -Math.PI / 2; at(tip, 0.19, 0.035, 0); g.add(tip); return g; };
  const SKIN = ['#8a5a3a', '#c68b5e', '#f1c7a1', '#5e3b24', '#e0a57a'], SHIRT = ['#2f7fd0', '#e5487a', '#3fa45b', '#f28c28', '#9b6ad6', '#ffc53d'];
  let pN = 0;
  I.pessoa = () => { const i = pN++; const g = G(); g.add(at(cyl(0.1, 0.13, 0.32, SHIRT[i % 6], 8), 0, 0.2, 0)); g.add(at(sph(0.1, SKIN[i % 5]), 0, 0.46, 0));
    const hair = sph(0.105, ['#2b2a4a', '#6b4a1e', '#3a2a1a'][i % 3], null, 8, 4); hair.scale.y = 0.6; at(hair, 0, 0.52, -0.01); g.add(hair); return g; };
  I.copo = () => { const g = G(); const m = mesh(new T.CylinderGeometry(0.08, 0.065, 0.18, 10, 1, true), '#bfe0f0', { transparent: true, opacity: 0.75, side: T.DoubleSide });
    at(m, 0, 0.09, 0); g.add(m); g.add(at(cyl(0.065, 0.065, 0.015, '#a8d3e8'), 0, 0.008, 0)); g.userData.cup = m; return g; };
  VC.breakCup = item => { const g = item.mesh; g.userData.cup.material = M('#8f9aa3', { transparent: true, opacity: 0.85, side: T.DoubleSide });
    for (let i = 0; i < 3; i++) { const s = box(0.012, 0.12, 0.012, '#2b2a4a'); at(s, Math.cos(i * 2) * 0.075, 0.1, Math.sin(i * 2) * 0.075); s.rotation.z = 0.5 - i * 0.4; g.add(s); }
    g.rotation.z = 0.15; };
  VC.Items = I;

  // ---------- Recipientes ----------
  // Grade de lugares centrada; ordem: da esquerda para a direita, do fundo para a frente.
  function grid(n, cols, sx, sz, y) {
    const rows = Math.ceil(n / cols), out = [];
    for (let i = 0; i < n; i++) { const c = i % cols, r = Math.floor(i / cols); out.push(new T.Vector3((c - (cols - 1) / 2) * sx, y || 0, (r - (rows - 1) / 2) * sz)); }
    return out;
  }
  VC.grid = grid;
  const C = {};
  C.tray = (cols, rows, sx, sz, color) => { const w = cols * sx + 0.24, d = rows * sz + 0.24, g = G();
    g.add(at(box(w, 0.05, d, color || '#b9c0c7'), 0, 0.025, 0));
    [[w, 0.06, 0.04, 0, d / 2], [w, 0.06, 0.04, 0, -d / 2], [0.04, 0.06, d, w / 2, 0], [0.04, 0.06, d, -w / 2, 0]].forEach(a => g.add(at(box(a[0], a[1], a[2], '#9aa3ab'), a[3], 0.07, a[4])));
    return { group: g, w, d, top: 0.05, slots: grid(cols * rows, cols, sx, sz, 0.05) }; };
  C.basket = (cols, rows, sx, sz, color, sym, symColor) => { const w = cols * sx + 0.24, d = rows * sz + 0.24, g = G(), c = color || '#b98a52';
    g.add(at(box(w, 0.05, d, c), 0, 0.025, 0));
    [[w, 0.2, 0.05, 0, d / 2], [w, 0.2, 0.05, 0, -d / 2], [0.05, 0.2, d, w / 2, 0], [0.05, 0.2, d, -w / 2, 0]].forEach(a => g.add(at(box(a[0], a[1], a[2], c), a[3], 0.1, a[4])));
    if (sym) { const p = plane(0.26, 0.26, symTex(sym, symColor || '#2b2a4a')); at(p, 0, 0.13, d / 2 + 0.03); g.add(p); }
    return { group: g, w, d, top: 0.05, slots: grid(cols * rows, cols, sx, sz, 0.05) }; };
  C.carton = (n, color, sym, symColor) => { const w = n * 0.27 + 0.1, g = G();
    g.add(at(box(w, 0.1, 0.36, color), 0, 0.05, 0));
    const slots = grid(n, n, 0.27, 0.27, 0.06);
    slots.forEach(s => g.add(at(cyl(0.11, 0.08, 0.04, '#8a6a42', 8), s.x, 0.085, s.z)));
    [[w, 0.05, 0.03, 0, -0.18], [w, 0.05, 0.03, 0, 0.18]].forEach(a => g.add(at(box(a[0], a[1], a[2], color), a[3], 0.125, a[4])));
    if (sym) { const p = plane(0.24, 0.24, symTex(sym, symColor || '#2b2a4a')); at(p, 0, 0.05, 0.19); p.rotation.x = -0.3; g.add(p); }
    return { group: g, w, d: 0.36, top: 0.06, slots }; };
  C.plate = (color, sym, n) => { const g = G(); g.add(at(cyl(0.42, 0.36, 0.05, '#fffaf0', 18), 0, 0.025, 0));
    const rim = mesh(new T.TorusGeometry(0.4, 0.03, 4, 18), color); rim.rotation.x = Math.PI / 2; at(rim, 0, 0.05, 0); g.add(rim);
    if (sym) { const f = symFlag(sym, color, 0.35); at(f, 0, 0, -0.52); g.add(f); }
    const slots = []; const k = n || 6;
    for (let i = 0; i < k; i++) { const a = i / k * Math.PI * 2 - Math.PI / 2; slots.push(new T.Vector3(Math.cos(a) * 0.22, 0.05, Math.sin(a) * 0.22)); }
    if (k > 4) slots.push(new T.Vector3(0, 0.05, 0));
    return { group: g, w: 0.9, d: 0.9, top: 0.05, slots }; };
  C.mat = (cols, rows, sx, sz, color, sym) => { const w = cols * sx + 0.2, d = rows * sz + 0.2, g = G();
    g.add(at(box(w, 0.03, d, color), 0, 0.015, 0));
    if (sym) { const f = symFlag(sym, color, 0.3); at(f, w / 2 + 0.05, 0, -d / 2); g.add(f); }
    return { group: g, w, d, top: 0.03, slots: grid(cols * rows, cols, sx, sz, 0.03) }; };
  C.pen = (cols, rows, sx, sz) => { const w = cols * sx + 0.3, d = rows * sz + 0.3, g = G();
    g.add(at(box(w, 0.02, d, '#e3c76a'), 0, 0.01, 0));
    const posts = [];
    for (let x = -w / 2; x <= w / 2 + 0.01; x += w / Math.max(2, Math.round(w / 0.5))) { posts.push([x, -d / 2], [x, d / 2]); }
    for (let z = -d / 2; z <= d / 2 + 0.01; z += d / Math.max(2, Math.round(d / 0.5))) { posts.push([-w / 2, z], [w / 2, z]); }
    posts.forEach(p => g.add(at(box(0.05, 0.3, 0.05, '#fffaf0'), p[0], 0.15, p[1])));
    [[w, 0, -d / 2], [w, 0, d / 2]].forEach(r => g.add(at(box(r[0], 0.04, 0.03, '#fffaf0'), 0, 0.22, r[2])));
    [[-w / 2], [w / 2]].forEach(r => g.add(at(box(0.03, 0.04, d, '#fffaf0'), r[0], 0.22, 0)));
    return { group: g, w, d, top: 0.02, slots: grid(cols * rows, cols, sx, sz, 0.02) }; };
  C.bus = (cols, rows) => { const sx = 0.36, sz = 0.42, w = cols * sx + 0.7, d = rows * sz + 0.3, g = G();
    g.add(at(box(w, 0.1, d, '#ffc53d'), 0, 0.12, 0));
    [[w, 0.3, 0.06, 0, d / 2], [w, 0.3, 0.06, 0, -d / 2], [0.06, 0.3, d, -w / 2, 0]].forEach(a => g.add(at(box(a[0], a[1], a[2], '#ffc53d'), a[3], 0.32, a[4])));
    g.add(at(box(0.45, 0.6, d, '#f2a516'), w / 2 - 0.22, 0.45, 0));
    g.add(at(box(0.05, 0.35, d - 0.1, '#bfe6f5'), w / 2 + 0.01, 0.55, 0));
    [[-w / 2 + 0.4, d / 2], [w / 2 - 0.4, d / 2], [-w / 2 + 0.4, -d / 2], [w / 2 - 0.4, -d / 2]].forEach(p => { const wh = cyl(0.16, 0.16, 0.1, '#2b2a4a', 10); wh.rotation.x = Math.PI / 2; at(wh, p[0], 0.1, p[1]); g.add(wh); });
    const slots = grid(cols * rows, cols, sx, sz, 0.17).map(s => { s.x -= 0.2; return s; });
    slots.forEach(s => g.add(at(box(0.26, 0.08, 0.26, '#2f7fd0'), s.x, 0.21, s.z)));
    slots.forEach(s => { s.y = 0.25; });
    return { group: g, w, d, top: 0.25, slots }; };
  C.patch = (cols, rows, sx, sz, color, emoji) => { const w = cols * sx + 0.2, d = rows * sz + 0.2, g = G();
    g.add(at(box(w, 0.04, d, color), 0, 0.02, 0));
    if (emoji) { const p = plane(0.4, 0.4, emojiTex(emoji)); at(p, -w / 2 - 0.05, 0.45, -d / 2); g.add(p); g.add(at(cyl(0.02, 0.02, 0.3, '#6b6890', 5), -w / 2 - 0.05, 0.15, -d / 2)); }
    return { group: g, w, d, top: 0.04, slots: grid(cols * rows, cols, sx, sz, 0.04) }; };
  C.table = (n, sym, color) => { const g = G(); g.add(at(cyl(0.42, 0.42, 0.05, '#c98d4e', 14), 0, 0.3, 0)); g.add(at(cyl(0.05, 0.08, 0.3, '#8a5a3a', 6), 0, 0.15, 0));
    if (sym) { const f = symFlag(sym, color, 0.55); at(f, 0, 0, -0.5); g.add(f); }
    const slots = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.4; slots.push(new T.Vector3(Math.cos(a) * 0.22, 0.325, Math.sin(a) * 0.22)); }
    return { group: g, w: 0.9, d: 0.9, top: 0.325, slots }; };
  C.bin = () => { const g = G(); const b = mesh(new T.CylinderGeometry(0.28, 0.22, 0.45, 10, 1, true), '#3fa45b', { side: T.DoubleSide }); at(b, 0, 0.225, 0); g.add(b);
    g.add(at(cyl(0.22, 0.22, 0.02, '#2f7d45'), 0, 0.01, 0)); const p = plane(0.26, 0.26, emojiTex('🗑️', '#fffaf0')); at(p, 0, 0.3, 0.3); g.add(p);
    return { group: g, w: 0.6, d: 0.6, top: 0.05, slots: grid(4, 2, 0.16, 0.16, 0.05) }; };
  // Criança que segura 2 balões.
  C.kid = (i) => { const g = G(); const k = person({ skin: SKIN[i % 5], shirt: SHIRT[(i + 2) % 6], hat: 'festa', scale: 0.55, hair: '#3a2a1a' }); g.add(k);
    return { group: g, w: 0.6, d: 0.6, top: 0.45, slots: [new T.Vector3(-0.2, 0.45, 0.12), new T.Vector3(0.2, 0.45, 0.12)], person: k }; };
  VC.Cont = C;

  // ---------- Personagens ----------
  function person(o) {
    const g = G(), s = o.scale || 1, sk = o.skin || '#c68b5e';
    const legs = o.pants || '#3b4a6b';
    [-0.1, 0.1].forEach(x => g.add(at(cyl(0.07, 0.07, 0.5, legs, 6), x, 0.25, 0)));
    const body = cyl(0.22, 0.27, 0.6, o.shirt || '#2f7fd0', 8); at(body, 0, 0.8, 0); g.add(body);
    if (o.apron) g.add(at(box(0.36, 0.5, 0.05, '#ffffff'), 0, 0.75, 0.24));
    const arms = [];
    [-1, 1].forEach(sd => { const a = G(); at(a, sd * 0.3, 1.05, 0); const arm = cyl(0.06, 0.06, 0.45, o.shirt || '#2f7fd0', 6); at(arm, 0, -0.22, 0); a.add(arm); a.add(at(sph(0.07, sk), 0, -0.47, 0)); a.rotation.z = sd * 0.15; g.add(a); arms.push(a); });
    const head = sph(0.24, sk); at(head, 0, 1.36, 0); g.add(head);
    [-0.08, 0.08].forEach(x => g.add(at(sph(0.035, '#2b2a4a'), x, 1.4, 0.21)));
    const smile = mesh(new T.TorusGeometry(0.07, 0.015, 4, 10, Math.PI), '#7a2a2a'); smile.rotation.z = Math.PI; at(smile, 0, 1.31, 0.22); g.add(smile);
    const hair = sph(0.25, o.hair || '#2b2a4a', null, 10, 5); hair.scale.y = 0.55; at(hair, 0, 1.47, -0.03); g.add(hair);
    if (o.long) g.add(at(box(0.44, 0.4, 0.12, o.hair), 0, 1.25, -0.17));
    const h = o.hat;
    if (h === 'chef') { g.add(at(cyl(0.2, 0.2, 0.25, '#ffffff'), 0, 1.65, 0)); g.add(at(sph(0.25, '#ffffff'), 0, 1.82, 0)); }
    if (h === 'lenco') { const l = sph(0.27, '#e5487a', null, 10, 5); l.scale.y = 0.6; at(l, 0, 1.48, -0.02); g.add(l); }
    if (h === 'palha') { g.add(at(cyl(0.45, 0.45, 0.03, '#e3c76a', 12), 0, 1.58, 0)); g.add(at(cyl(0.2, 0.24, 0.2, '#e3c76a', 10), 0, 1.68, 0)); g.add(at(cyl(0.245, 0.245, 0.05, '#c8443c', 10), 0, 1.62, 0)); }
    if (h === 'festa') { const c = mesh(new T.ConeGeometry(0.15, 0.35, 8), '#ffc53d'); at(c, 0, 1.72, 0); g.add(c); g.add(at(sph(0.05, '#e5487a'), 0, 1.9, 0)); }
    if (h === 'bone') { const c = sph(0.26, '#2f7fd0', null, 10, 5); c.scale.y = 0.5; at(c, 0, 1.5, 0); g.add(c); g.add(at(box(0.3, 0.03, 0.2, '#2f7fd0'), 0, 1.5, 0.25)); }
    g.scale.setScalar(s); g.userData.arms = arms; return g;
  }
  VC.person = person;
  VC.residents = {
    padaria: () => person({ skin: '#f1c7a1', shirt: '#fffaf0', pants: '#6b4a1e', hat: 'chef', apron: true, hair: '#8a8a8a' }),
    feira: () => person({ skin: '#8a5a3a', shirt: '#3fa45b', pants: '#9b6ad6', hat: 'lenco', apron: true, hair: '#2b2a4a' }),
    granja: () => person({ skin: '#c68b5e', shirt: '#c8443c', pants: '#2f5f9e', hat: 'palha', hair: '#3a2a1a' }),
    lia: () => person({ skin: '#e0a57a', shirt: '#e5487a', pants: '#ffc53d', hat: 'festa', hair: '#3a2a1a', long: true, scale: 0.72 }),
    onibus: () => person({ skin: '#5e3b24', shirt: '#2f7fd0', pants: '#2b2a4a', hat: 'bone', hair: '#2b2a4a', long: true })
  };

  // Tico, o tatu-bola: em pé ou enrolado como bola.
  VC.tico = function () {
    const g = G(), stand = G(), ball = G();
    const shell = mesh(new T.SphereGeometry(0.36, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#a48b72'); shell.scale.set(1.3, 0.95, 1); at(shell, 0, 0.12, 0); stand.add(shell);
    for (let i = -2; i <= 2; i++) { const b = mesh(new T.TorusGeometry(0.33 - Math.abs(i) * 0.04, 0.025, 4, 16, Math.PI), '#7d6550'); b.rotation.y = Math.PI / 2; at(b, i * 0.1, 0.12, 0); b.scale.y = 0.95; stand.add(b); }
    const head = sph(0.15, '#c9b49b'); head.scale.set(1.35, 1, 1); at(head, 0.5, 0.25, 0); stand.add(head);
    stand.add(at(sph(0.03, '#2b2a4a'), 0.69, 0.27, 0));
    [-0.07, 0.07].forEach(z => { stand.add(at(sph(0.028, '#2b2a4a'), 0.56, 0.33, z * 1.1)); const e = mesh(new T.ConeGeometry(0.045, 0.14, 5), '#c9b49b'); at(e, 0.42, 0.42, z * 1.4); stand.add(e); });
    const scarf = mesh(new T.TorusGeometry(0.14, 0.04, 5, 12), '#ffc53d'); scarf.rotation.y = Math.PI / 2; at(scarf, 0.38, 0.22, 0); stand.add(scarf);
    const tail = mesh(new T.ConeGeometry(0.05, 0.25, 5), '#a48b72'); tail.rotation.z = Math.PI / 2 + 0.5; at(tail, -0.52, 0.12, 0); stand.add(tail);
    [[0.25, 0.15], [0.25, -0.15], [-0.25, 0.15], [-0.25, -0.15]].forEach(p => stand.add(at(sph(0.07, '#8a7360'), p[0], 0.06, p[1])));
    const core = sph(0.3, '#a48b72', null, 12, 10); ball.add(core);
    for (let i = -2; i <= 2; i++) { const b = mesh(new T.TorusGeometry(Math.sqrt(0.09 - (i * 0.09) ** 2) + 0.01, 0.025, 4, 16), '#7d6550'); b.rotation.y = Math.PI / 2; at(b, i * 0.09, 0, 0); ball.add(b); }
    at(ball, 0, 0.3, 0); ball.visible = false;
    g.add(stand, ball); g.userData = { stand, ball }; return g;
  };

  // ---------- Prédios e cenário ----------
  function house(w, d, h, wall, roof) {
    const g = G(); g.add(at(box(w, h, d, wall), 0, h / 2, 0));
    const ang = 0.55, len = (w / 2) / Math.cos(ang) + 0.15;
    [-1, 1].forEach(s => { const r = box(len, 0.12, d + 0.3, roof); r.rotation.z = -s * ang; at(r, s * w / 4, h + Math.tan(ang) * w / 4, 0); g.add(r); });
    const tri = new T.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, Math.tan(ang) * w / 2); tri.lineTo(-w / 2, 0);
    [d / 2, -d / 2 - 0.02].forEach(z => { const m = mesh(new T.ShapeGeometry(tri), wall, { side: T.DoubleSide }); at(m, 0, h, z + 0.01); g.add(m); });
    g.add(at(box(0.8, 1.3, 0.06, '#6b4a1e'), 0, 0.65, d / 2 + 0.02));
    [-1, 1].forEach(s => g.add(at(box(0.7, 0.6, 0.06, '#bfe6f5'), s * w * 0.3, h * 0.6, d / 2 + 0.02)));
    return g;
  }
  function sign(emoji, text, w) { const p = plane(w || 2.4, (w || 2.4) * 0.31, signTex(emoji, text)); return p; }
  function awning(w, c1, c2) { const g = G(); const n = 6; for (let i = 0; i < n; i++) { const s = box(w / n, 0.06, 0.8, i % 2 ? c1 : c2); at(s, (i - (n - 1) / 2) * w / n, 0, 0); g.add(s); } g.rotation.x = 0.35; return g; }
  function tree(s) { const g = G(); g.add(at(cyl(0.12, 0.16, 1, '#8a5a3a', 6), 0, 0.5, 0)); const c = ['#3fa45b', '#56b86a', '#2f8a4a'];
    for (let i = 0; i < 3; i++) g.add(at(mesh(new T.IcosahedronGeometry(0.75 - i * 0.18, 0), c[i]), (i - 1) * 0.15, 1.3 + i * 0.45, (i % 2) * 0.1));
    g.scale.setScalar(s || 1); return g; }
  function stall(c1, fruit) { const g = G(); g.add(at(box(1.6, 0.7, 0.8, '#c98d4e'), 0, 0.35, 0));
    [[-0.75, -0.35], [0.75, -0.35], [-0.75, 0.35], [0.75, 0.35]].forEach(p => g.add(at(cyl(0.04, 0.04, 1.6, '#8a5a3a', 5), p[0], 0.8, p[1])));
    const a = awning(1.8, c1, '#fffaf0'); at(a, 0, 1.65, 0); g.add(a);
    for (let i = 0; i < 9; i++) g.add(at(sph(0.11, fruit), -0.6 + (i % 5) * 0.3, 0.8, -0.15 + Math.floor(i / 5) * 0.3)); return g; }
  const B = {};
  B.padaria = () => { const g = house(3.6, 2.6, 2.2, '#f3e3c3', '#8a5a3a'); const a = awning(2.2, '#c8443c', '#fffaf0'); at(a, 0, 1.75, 1.55); g.add(a);
    const s = sign('🥖', 'PADARIA'); at(s, 0, 2.95, 1.45); g.add(s); g.add(at(cyl(0.2, 0.2, 1.2, '#b9a48b', 8), 1.1, 3, -0.5)); return g; };
  B.feira = () => { const g = G(); const s1 = stall('#3fa45b', '#f28c28'); at(s1, -1.1, 0, 0); g.add(s1); const s2 = stall('#e5487a', '#d63c3c'); at(s2, 1.1, 0, -0.2); g.add(s2);
    const s = sign('🍊', 'FEIRA'); at(s, 0, 2.6, 0.3); g.add(s); return g; };
  B.granja = () => { const g = house(3.6, 2.8, 2.4, '#c8443c', '#5a5a6a');
    const x1 = box(0.08, 1.4, 0.04, '#ffffff'); x1.rotation.z = 0.55; at(x1, 0, 0.65, 1.44); g.add(x1); const x2 = x1.clone(); x2.rotation.z = -0.55; g.add(x2);
    g.add(at(cyl(0.6, 0.6, 3.2, '#d9d4c7', 10), 2.6, 1.6, -0.4)); g.add(at(mesh(new T.SphereGeometry(0.6, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), '#8f9aa3'), 2.6, 3.2, -0.4));
    const s = sign('🥚', 'GRANJA'); at(s, 0, 3.4, 1.5); g.add(s); return g; };
  B.lia = () => { const g = house(3.2, 2.6, 2.2, '#c9a4e0', '#e5487a');
    for (let i = 0; i < 5; i++) { const b = I.balao(); b.scale.setScalar(1.6); at(b, 1.8 + (i % 3) * 0.25, 0.4 + (i % 2) * 0.3, 1.3 - i * 0.1); g.add(b); }
    const s = sign('🎂', 'CASA DA LIA', 2.6); at(s, 0, 2.95, 1.45); g.add(s); return g; };
  B.onibus = () => { const g = G(); g.add(at(box(2.4, 1.6, 0.1, '#bfe0f0', { transparent: true, opacity: 0.6 }), 0, 1, -0.6));
    [-1.15, 1.15].forEach(x => g.add(at(cyl(0.06, 0.06, 2, '#6b6890', 6), x, 1, -0.6))); g.add(at(box(2.7, 0.12, 1.2, '#2f7fd0'), 0, 2.05, -0.2));
    g.add(at(box(1.8, 0.1, 0.4, '#8a5a3a'), 0, 0.5, -0.35));
    const bus = G(); bus.add(at(box(3.4, 1.4, 1.4, '#ffc53d'), 0, 0.95, 0)); for (let i = 0; i < 4; i++) bus.add(at(box(0.6, 0.5, 0.05, '#bfe6f5'), -1.2 + i * 0.75, 1.25, 0.71));
    [-1.1, 1.1].forEach(x => { const w = cyl(0.3, 0.3, 1.45, '#2b2a4a', 10); w.rotation.x = Math.PI / 2; at(w, x, 0.3, 0); bus.add(w); });
    at(bus, 3.4, 0, 0.2); g.add(bus); const s = sign('🚌', 'PONTO'); at(s, 0, 2.6, 0.45); g.add(s); return g; };
  B.tree = tree;
  B.fountain = () => { const g = G(); g.add(at(cyl(1.6, 1.7, 0.4, '#d9d4c7', 16), 0, 0.2, 0)); g.add(at(cyl(1.4, 1.4, 0.05, '#7cc4e8', 16, { shininess: 60 }), 0, 0.38, 0));
    g.add(at(cyl(0.2, 0.25, 1, '#d9d4c7', 8), 0, 0.8, 0)); g.add(at(cyl(0.6, 0.4, 0.15, '#d9d4c7', 12), 0, 1.3, 0)); g.add(at(sph(0.25, '#7cc4e8', { shininess: 60 }), 0, 1.45, 0)); return g; };
  B.lamp = () => { const g = G(); g.add(at(cyl(0.06, 0.08, 2.4, '#2b2a4a', 6), 0, 1.2, 0)); g.add(at(sph(0.18, '#fff3c4', { emissive: '#7a6a2a' }), 0, 2.5, 0)); return g; };
  B.bench = () => { const g = G(); g.add(at(box(1.2, 0.08, 0.4, '#c98d4e'), 0, 0.45, 0)); g.add(at(box(1.2, 0.3, 0.06, '#c98d4e'), 0, 0.7, -0.18));
    [-0.5, 0.5].forEach(x => g.add(at(box(0.06, 0.45, 0.35, '#2b2a4a'), x, 0.22, 0))); return g; };
  // Enfeites da praça
  B.bunting = (a, b, colors) => { const g = G(); const n = 14;
    for (let i = 0; i <= n; i++) { const t = i / n, p = a.clone().lerp(b, t); p.y -= Math.sin(Math.PI * t) * 0.6;
      if (i < n) { const f = mesh(new T.ConeGeometry(0.16, 0.32, 3), colors[i % colors.length], null, true); f.rotation.x = Math.PI; at(f, p.x, p.y - 0.18, p.z); g.add(f); } }
    const line = new T.Line(new T.BufferGeometry().setFromPoints(Array.from({ length: 21 }, (_, i) => { const t = i / 20, p = a.clone().lerp(b, t); p.y -= Math.sin(Math.PI * t) * 0.6; return p; })), new T.LineBasicMaterial({ color: '#6b6890' }));
    g.add(line); return g; };
  B.lantern = c => { const g = G(); const l = sph(0.22, c, { emissive: c, emissiveIntensity: 0.45 }, 8, 6); l.scale.y = 1.2; g.add(l); g.add(at(cyl(0.12, 0.12, 0.05, '#2b2a4a'), 0, 0.27, 0)); return g; };
  B.flowers = () => { const g = G(); g.add(at(cyl(0.7, 0.75, 0.15, '#6b4a1e', 10), 0, 0.075, 0));
    for (let i = 0; i < 12; i++) { const a = i * 2.4, r = 0.15 + (i % 3) * 0.18; g.add(at(cyl(0.015, 0.015, 0.3, '#3fa45b', 4), Math.cos(a) * r, 0.3, Math.sin(a) * r)); g.add(at(sph(0.08, ['#e5487a', '#ffc53d', '#fffaf0', '#9b6ad6'][i % 4]), Math.cos(a) * r, 0.47, Math.sin(a) * r)); }
    return g; };
  B.festaTable = () => { const g = G(); g.add(at(box(3.4, 0.08, 1.1, '#fffaf0'), 0, 0.8, 0)); g.add(at(box(3.5, 0.3, 1.15, '#e5487a'), 0, 0.68, 0));
    [[-1.5, -0.4], [1.5, -0.4], [-1.5, 0.4], [1.5, 0.4]].forEach(p => g.add(at(cyl(0.05, 0.05, 0.8, '#8a5a3a', 5), p[0], 0.4, p[1])));
    g.add(at(cyl(0.38, 0.38, 0.3, '#fffaf0', 14), 0, 0.99, 0)); g.add(at(cyl(0.28, 0.28, 0.22, '#e5487a', 14), 0, 1.25, 0)); g.add(at(cyl(0.03, 0.03, 0.15, '#ffc53d'), 0, 1.43, 0));
    for (let i = 0; i < 6; i++) { const b = I.brig(); at(b, -1.3 + i * 0.25 + (i > 2 ? 1.6 : 0), 0.84, 0.25); g.add(b); }
    for (let i = 0; i < 4; i++) { const c = I.copo(); at(c, -1.2 + i * 0.8, 0.84, -0.3); g.add(c); } return g; };
  VC.Build = B;
  VC.tex = { sign: signTex, sym: symTex, emoji: emojiTex, text: textTex, plane };
})(window.VC);
