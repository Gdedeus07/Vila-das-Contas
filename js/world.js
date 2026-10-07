// Vila das Contas — mundo 3D: vila, câmera fixa, Tico, mesa de trabalho e arrastar/soltar.
(function (VC) {
  'use strict';
  const T = window.THREE, U = VC.U;
  const W = VC.W = {};
  const V = (x, y, z) => new T.Vector3(x, y, z);

  VC.LOC = {
    padaria: { b: V(-12.5, 0, -1.2), ws: V(-12.5, 0, 3.4), nome: 'Padaria', emoji: '🥖', morador: 'Seu Joaquim' },
    feira: { b: V(-7.8, 0, -10.2), ws: V(-7.8, 0, -6), nome: 'Feira', emoji: '🍊', morador: 'Dona Rosa' },
    granja: { b: V(0, 0, -13.6), ws: V(0, 0, -9.2), nome: 'Granja', emoji: '🥚', morador: 'Tio Zé' },
    lia: { b: V(7.8, 0, -10.2), ws: V(7.8, 0, -6), nome: 'Casa da Lia', emoji: '🎂', morador: 'Lia' },
    onibus: { b: V(12.5, 0, -1.2), ws: V(12.5, 0, 3.4), nome: 'Ponto de ônibus', emoji: '🚌', morador: 'Cida' }
  };
  const TABLE_Y = 0.2, DRAG_Y = 0.75;

  let renderer, scene, camera, clock, raycaster, host;
  const camPos = V(0, 17, 22), camTgt = V(0, 0, -3);
  W.view = 'praca';
  W.items = []; W.conts = []; W.ghosts = []; W.halos = [];
  W.rules = null; W.inputOn = false;
  W.residents = {}; W.ws = {}; W.deco = {};
  W.onFrame = null; W.onPracaTap = null; W.onTicoTap = null;

  W.init = function () {
    host = document.getElementById('scene');
    renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;
    host.appendChild(renderer.domElement);
    scene = new T.Scene(); scene.background = new T.Color('#bfe6f5'); scene.fog = new T.Fog('#bfe6f5', 38, 75);
    camera = new T.PerspectiveCamera(45, 1, 0.1, 200);
    scene.add(new T.HemisphereLight('#ffffff', '#7fae5a', 0.75));
    const sun = new T.DirectionalLight('#fff3d6', 0.75); sun.position.set(-10, 22, 14); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 70 });
    sun.shadow.bias = -0.0008; scene.add(sun);
    raycaster = new T.Raycaster(); clock = new T.Clock();
    buildVillage();
    window.addEventListener('resize', resize); resize();
    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', onDown); window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
    renderer.setAnimationLoop(frame);
  };

  function resize() {
    const w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (!W.moving) {
      if (W.framed && W.framed.v === W.view && W.conts.length) W.frameContent(0);
      else { const v = viewFor(W.view); camPos.copy(v.pos); camTgt.copy(v.tgt); }
    }
  }
  // Câmera fixa por lugar, afastando-se em telas estreitas.
  function viewFor(v) {
    const a = camera.aspect || 1.5;
    if (v === 'praca') { const s = Math.max(1, 30 / (24.3 * a)); return { pos: V(0, 17 * s, 22 * s - 3 * (s - 1)), tgt: V(0, 0, -3.5) }; }
    if (v === 'festa') { const s = Math.max(1, 9 / (6.5 * a)); return { pos: V(0, 5.5 * s, 3.5 + 8.5 * s), tgt: V(0, 1, 3) }; }
    const ws = VC.LOC[v].ws, s = Math.max(0.72, 8.0 / (6.81 * a));
    return { pos: V(ws.x, 5.6 * s + 0.2, ws.z + 6.3 * s + 0.5), tgt: V(ws.x, 0, ws.z + 0.55) };
  }

  // ---------- Vila ----------
  function buildVillage() {
    const B = VC.Build;
    const ground = new T.Mesh(new T.CircleGeometry(60, 40), new T.MeshPhongMaterial({ color: '#9ccc65', flatShading: true }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const praca = new T.Mesh(new T.CircleGeometry(6.4, 28), new T.MeshPhongMaterial({ color: '#efe2c6' })); praca.rotation.x = -Math.PI / 2; praca.position.y = 0.02; praca.receiveShadow = true; scene.add(praca);
    const fountain = B.fountain(); scene.add(fountain);
    Object.entries(VC.LOC).forEach(([k, L]) => {
      const path = new T.Mesh(new T.PlaneGeometry(1.6, L.ws.length()), new T.MeshPhongMaterial({ color: '#e6d5b0' }));
      path.rotation.x = -Math.PI / 2; path.rotation.z = Math.atan2(-L.ws.x, -L.ws.z) + Math.PI; path.position.set(L.ws.x / 2, 0.015, L.ws.z / 2); path.receiveShadow = true; scene.add(path);
      const b = B[k](); b.position.copy(L.b); b.traverse(o => { o.userData.loc = k; }); scene.add(b); L.group = b;
      const ws = new T.Group(); ws.position.copy(L.ws); scene.add(ws); W.ws[k] = ws;
      const top = new T.Mesh(new T.BoxGeometry(7.4, TABLE_Y, 4), new T.MeshPhongMaterial({ color: '#d9a066', flatShading: true })); top.position.y = TABLE_Y / 2; top.receiveShadow = true; ws.add(top);
      const edge = new T.Mesh(new T.BoxGeometry(7.6, 0.08, 4.2), new T.MeshPhongMaterial({ color: '#b97f48' })); edge.position.y = 0.04; ws.add(edge);
      const r = VC.residents[k](); r.position.set(0.6, 0, -2.6); ws.add(r); W.residents[k] = r;
    });
    [[-17, -8], [-15, -15], [-6, -18], [6, -18], [15, -15], [17, -8], [-19, 4], [19, 4], [-9, 9], [9, 9], [-4, -16], [4, -17]].forEach((p, i) => { const t = B.tree(0.9 + (i % 3) * 0.2); t.position.set(p[0], 0, p[1]); scene.add(t); });
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, h = new T.Mesh(new T.IcosahedronGeometry(6 + (i % 3) * 2, 0), new T.MeshPhongMaterial({ color: i % 2 ? '#86bf58' : '#79b34f', flatShading: true })); h.position.set(Math.cos(a) * 45, -2, Math.sin(a) * 45 - 8); h.scale.y = 0.6; scene.add(h); }
    const lamps = [V(-4.6, 0, -2.4), V(4.6, 0, -2.4), V(-4.2, 0, 3.6), V(4.2, 0, 3.6)];
    lamps.forEach(p => { const l = B.lamp(); l.position.copy(p); scene.add(l); });
    [[-3, 5.2, 0.2], [3, 5.2, -0.2]].forEach(p => { const b = B.bench(); b.position.set(p[0], 0, p[1]); b.rotation.y = Math.PI + p[2]; scene.add(b); });
    // Enfeites que aparecem quando cada missão é concluída.
    const cols = ['#e5487a', '#ffc53d', '#2f7fd0', '#3fa45b', '#f28c28'];
    const g1 = new T.Group(); g1.add(B.bunting(V(-4.6, 2.5, -2.4), V(4.6, 2.5, -2.4), cols), B.bunting(V(-4.2, 2.5, 3.6), V(4.2, 2.5, 3.6), cols), B.bunting(V(-4.6, 2.5, -2.4), V(-4.2, 2.5, 3.6), cols), B.bunting(V(4.6, 2.5, -2.4), V(4.2, 2.5, 3.6), cols));
    const g2 = new T.Group(); lamps.forEach((p, i) => { const l = B.lantern(cols[i]); l.position.set(p.x, 2.05, p.z); g2.add(l); }); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, l = B.lantern(cols[i % 5]); l.position.set(Math.cos(a) * 2.6, 1.6, Math.sin(a) * 2.6); l.scale.setScalar(0.8); g2.add(l); const pole = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1.4, 4), new T.MeshPhongMaterial({ color: '#6b6890' })); pole.position.set(Math.cos(a) * 2.6, 0.7, Math.sin(a) * 2.6); g2.add(pole); }
    const g3 = new T.Group(); [[-2.6, -2.6], [2.6, -2.6], [-3.4, 1.4], [3.4, 1.4]].forEach(p => { const f = B.flowers(); f.position.set(p[0], 0, p[1]); g3.add(f); });
    const g4 = B.festaTable(); g4.position.set(0, 0, 3.3);
    const g5 = new T.Group(); for (let i = 0; i < 9; i++) { const b = VC.Items.balao(); b.scale.setScalar(2.2); b.position.set(Math.cos(i) * 0.5, 1.45, Math.sin(i) * 0.5); g5.add(b); }
    [['padaria', g1], ['feira', g2], ['granja', g3], ['lia', g4], ['onibus', g5]].forEach(([k, g]) => { g.visible = false; scene.add(g); W.deco[k] = g; });
    W.festaSpot = V(0, 0, 3.3);
    W.tico = VC.tico(); W.tico.scale.setScalar(1.25); W.tico.position.set(0, 0, 6.2); W.tico.rotation.y = -Math.PI / 2; scene.add(W.tico);
    // Confete da festa
    W.confetti = new T.Group(); for (let i = 0; i < 140; i++) { const c = new T.Mesh(new T.PlaneGeometry(0.12, 0.08), new T.MeshBasicMaterial({ color: cols[i % 5], side: T.DoubleSide })); c.userData.v = V((Math.random() - .5) * 0.6, -0.8 - Math.random(), (Math.random() - .5) * 0.6); c.position.set((Math.random() - .5) * 12, Math.random() * 8, 3 + (Math.random() - .5) * 8); W.confetti.add(c); }
    W.confetti.visible = false; scene.add(W.confetti);
  }

  W.showDeco = function (k, anim) {
    const g = W.deco[k]; if (!g || (g.visible && anim)) return Promise.resolve();
    g.visible = true; if (!anim) { g.scale.setScalar(1); return Promise.resolve(); }
    VC.sfx('sparkle'); return VC.tween(0.9, t => g.scale.setScalar(Math.max(0.001, t)), U.back);
  };

  // ---------- Câmera e Tico ----------
  W.moveCam = function (v, dur) {
    const to = viewFor(v), p0 = camPos.clone(), t0 = camTgt.clone();
    W.moving = true; W.view = v;
    return VC.tween(dur || 1.6, k => { camPos.lerpVectors(p0, to.pos, k); camTgt.lerpVectors(t0, to.tgt, k); }).then(() => { W.moving = false; });
  };
  function ticoSpot(v) {
    if (v === 'praca') return { p: V(0, 0, 6.2), r: -Math.PI / 2 };
    if (v === 'festa') return { p: V(1.8, 0, 5.4), r: -Math.PI / 2 - 0.4 };
    const ws = VC.LOC[v].ws; return { p: V(ws.x - 3.2, TABLE_Y, ws.z - 1.45), r: -1.1 };
  }
  W.ticoRoll = function (v, dur) {
    const s = ticoSpot(v), t = W.tico, p0 = t.position.clone(), d = p0.distanceTo(s.p);
    t.userData.stand.visible = false; t.userData.ball.visible = true; VC.sfx('whoosh');
    const dir = Math.atan2(s.p.x - p0.x, s.p.z - p0.z);
    return VC.tween(dur || 1.6, k => {
      t.position.lerpVectors(p0, s.p, k); t.position.y += Math.abs(Math.sin(k * Math.PI * 3)) * 0.25 * (1 - k) + Math.sin(k * Math.PI) * 0.4;
      t.rotation.y = dir - Math.PI / 2; t.userData.ball.rotation.z = -k * d / 0.38;
    }).then(() => { t.userData.ball.visible = false; t.userData.stand.visible = true; t.rotation.y = s.r; t.position.copy(s.p); });
  };
  // Enquadra só o que está na mesa: poucos objetos = câmera mais perto, objetos maiores para o dedo.
  W.frameContent = function (dur) {
    const v = W.view; if (!VC.LOC[v] || !W.conts.length) return Promise.resolve();
    let x0 = 0, x1 = 1.2, z0 = 1e9, z1 = -1e9;
    W.conts.forEach(c => { x0 = Math.min(x0, c.x - c.w / 2); x1 = Math.max(x1, c.x + c.w / 2); z0 = Math.min(z0, c.z - c.d / 2); z1 = Math.max(z1, c.z + c.d / 2); });
    const tx = Math.max(-3.3, x0 - 0.7), tz = U.clamp(z0 - 0.2, -1.6, 0.6);
    x0 = Math.min(x0, tx - 0.55); z0 = Math.min(z0, -1.7);
    const a = camera.aspect || 1.5, s = Math.max(0.5, (x1 - x0 + 0.7) / (6.81 * a), 0.17 * (z1 - z0 + 1.6));
    const ws = VC.LOC[v].ws, cx = ws.x + (x0 + x1) / 2, cz = ws.z + (z0 + z1) / 2;
    const to = { pos: V(cx, 5.6 * s + 0.2, cz + 6.3 * s + 0.5), tgt: V(cx, 0, cz + 0.5) };
    W.framed = { v, tx, tz };
    const t = W.tico, tp0 = t.position.clone(), tp1 = V(ws.x + tx, TABLE_Y, ws.z + tz);
    if (!dur) { camPos.copy(to.pos); camTgt.copy(to.tgt); t.position.copy(tp1); return Promise.resolve(); }
    const p0 = camPos.clone(), t0 = camTgt.clone(); W.moving = true;
    return VC.tween(dur, k => { camPos.lerpVectors(p0, to.pos, k); camTgt.lerpVectors(t0, to.tgt, k); t.position.lerpVectors(tp0, tp1, k); t.position.y += Math.sin(k * Math.PI) * 0.4; }).then(() => { W.moving = false; });
  };
  W.go = function (v, dur) { return Promise.all([W.moveCam(v, dur), W.ticoRoll(v, dur)]); };
  W.setView = function (v) { const to = viewFor(v); camPos.copy(to.pos); camTgt.copy(to.tgt); W.view = v; const s = ticoSpot(v); W.tico.position.copy(s.p); W.tico.rotation.y = s.r; };

  W.react = function (loc, mood) {
    const r = W.residents[loc]; if (!r) return Promise.resolve();
    const y0 = r.position.y, arms = r.userData.arms;
    if (mood === 'happy') { VC.tween(0.9, k => { arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (0.15 + Math.sin(k * Math.PI) * 2.4); }); }); return VC.tween(0.7, k => { r.position.y = y0 + Math.sin(k * Math.PI * 2) ** 2 * 0.35; }); }
    return VC.tween(1, k => { r.rotation.z = Math.sin(k * Math.PI * 2) * 0.08; arms[1].rotation.z = 0.15 + Math.sin(k * Math.PI) * 1.2; });
  };
  W.ticoHop = function () { const t = W.tico, y0 = VC.LOC[W.view] ? TABLE_Y : 0; return VC.tween(0.5, k => { t.position.y = y0 + Math.sin(k * Math.PI) * 0.4; }); };

  // ---------- Mesa de trabalho: recipientes e itens ----------
  W.clearWs = function () {
    W.items.concat(W.conts).forEach(o => { const m = o.mesh || o.group; m.parent && m.parent.remove(m); });
    W.ghosts.forEach(g => g.parent && g.parent.remove(g));
    W.items = []; W.conts = []; W.ghosts = []; W.halos = [];
  };
  W.cont = function (built, x, z, props) {
    const ws = W.ws[W.view];
    built.group.position.set(x, TABLE_Y, z); ws.add(built.group);
    const hl = new T.Mesh(new T.PlaneGeometry(built.w + 0.3, built.d + 0.3), new T.MeshBasicMaterial({ color: '#ffc53d', transparent: true, opacity: 0, depthWrite: false }));
    hl.rotation.x = -Math.PI / 2; hl.position.y = 0.012; built.group.add(hl);
    const c = Object.assign({ group: built.group, slots: built.slots, x, z, w: built.w, d: built.d, items: built.slots.map(() => null), hl, extra: built }, props || {});
    built.group.userData.cont = c; W.conts.push(c); return c;
  };
  // Arruma recipientes lado a lado (um array dentro da lista vira uma coluna). Chamar antes de encher.
  W.moveCont = (c, x, z) => { c.x = x; c.group.position.x = x; if (z != null) { c.z = z; c.group.position.z = z; } };
  W.row = function (list, gap, cx) {
    const cols = list.map(e => Array.isArray(e) ? e : [e]);
    const ws = cols.map(col => Math.max.apply(null, col.map(c => c.w)));
    let x = (cx || 0) - (ws.reduce((a, b) => a + b, 0) + gap * (cols.length - 1)) / 2;
    cols.forEach((col, i) => { col.forEach(c => W.moveCont(c, x + ws[i] / 2)); x += ws[i] + gap; });
  };
  W.slotPos = (c, i) => V(c.x + c.slots[i].x, TABLE_Y + c.slots[i].y, c.z + c.slots[i].z);
  W.free = c => c.items.indexOf(null);
  W.count = c => c.items.filter(Boolean).length;
  W.inC = c => c.items.filter(Boolean);
  W.item = function (kind, c, slot, props) {
    const m = VC.Items[kind](); const it = Object.assign({ mesh: m, kind, cont: null, slot: -1, value: 1 }, props || {});
    m.traverse(o => { o.userData.item = it; });
    W.ws[W.view].add(m); W.items.push(it);
    if (c) { const s = slot == null ? W.free(c) : slot; c.items[s] = it; it.cont = c; it.slot = s; m.position.copy(W.slotPos(c, s)); }
    return it;
  };
  W.fill = (kind, c, n, props) => { const out = []; for (let i = 0; i < n; i++) out.push(W.item(kind, c, null, props)); return out; };
  W.place = function (it, c, slot, dur) {
    if (it.cont) it.cont.items[it.slot] = null;
    const s = slot == null || slot < 0 ? W.free(c) : slot; c.items[s] = it; it.cont = c; it.slot = s;
    const from = it.mesh.position.clone(), to = W.slotPos(c, s);
    return VC.tween(dur == null ? 0.28 : dur, k => { it.mesh.position.lerpVectors(from, to, k); it.mesh.position.y += Math.sin(k * Math.PI) * 0.25; }, U.easeOut);
  };
  W.remove = function (it) { if (it.cont) it.cont.items[it.slot] = null; it.mesh.parent && it.mesh.parent.remove(it.mesh); W.items = W.items.filter(x => x !== it); };
  W.jump = function (it, h) { const m = it.mesh, y0 = it.cont ? W.slotPos(it.cont, it.slot).y : m.position.y; return VC.tween(0.35, k => { m.position.y = y0 + Math.sin(k * Math.PI) * (h || 0.35); }); };
  W.halo = function (it, on, color) {
    if (it.halo) { it.mesh.remove(it.halo); W.halos = W.halos.filter(h => h !== it.halo); it.halo = null; }
    if (!on) return;
    const h = new T.Mesh(new T.TorusGeometry(0.2, 0.035, 4, 18), new T.MeshBasicMaterial({ color: color || '#ffc53d' }));
    h.rotation.x = Math.PI / 2; h.position.y = 0.02; it.mesh.add(h); it.halo = h; W.halos.push(h);
  };
  W.ghost = function (kind, c, i) {
    const m = VC.Items[kind](); const mat = new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.4, depthWrite: false });
    m.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = false; } });
    // Usa o i-ésimo lugar vazio sem ocupá-lo; se não houver, fica ao lado do último.
    const frees = c.items.map((x, k) => x ? -1 : k).filter(k => k >= 0), s = frees[i];
    let p;
    if (s != null) p = W.slotPos(c, s); else { const last = W.inC(c).pop(); p = last ? last.mesh.position.clone() : V(c.x, TABLE_Y, c.z); p.x += 0.4 * (i - frees.length + 1); }
    m.position.copy(p); W.ws[W.view].add(m); W.ghosts.push(m);
  };
  W.clearGhosts = function () { W.ghosts.forEach(g => g.parent && g.parent.remove(g)); W.ghosts = []; };

  // Número que sobe acima do objeto tocado.
  W.floater = function (obj, text, dy) {
    const p = new T.Vector3(); obj.getWorldPosition(p); p.y += dy || 0.6; p.project(camera);
    const el = document.createElement('div'); el.className = 'floater'; el.textContent = text;
    el.style.left = ((p.x + 1) / 2 * host.clientWidth) + 'px'; el.style.top = ((1 - p.y) / 2 * host.clientHeight) + 'px';
    document.getElementById('floaters').appendChild(el); setTimeout(() => el.remove(), 1300);
  };
  W.project = function (v3) { const p = v3.clone().project(camera); return { x: (p.x + 1) / 2 * host.clientWidth, y: (1 - p.y) / 2 * host.clientHeight, behind: p.z > 1 }; };

  // ---------- Toque e arrasto ----------
  const ndc = new T.Vector2(), plane = new T.Plane(V(0, 1, 0), -DRAG_Y);
  let drag = null;
  function setRay(e) { const r = renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); raycaster.setFromCamera(ndc, camera); }
  function onDown(e) {
    VC.audioStart && VC.audioStart();
    setRay(e);
    if (W.view === 'praca' && !W.moving) {
      const hits = raycaster.intersectObjects(Object.values(VC.LOC).map(l => l.group), true);
      if (hits.length && W.onPracaTap) W.onPracaTap(hits[0].object.userData.loc);
      return;
    }
    if (!W.inputOn || W.moving) return;
    const th = raycaster.intersectObject(W.tico, true);
    const hits = raycaster.intersectObjects(W.items.map(i => i.mesh), true);
    if (!hits.length) { if (th.length && W.onTicoTap) W.onTicoTap(); return; }
    const it = hits[0].object.userData.item; if (!it || it.busy) return;
    drag = { it, x: e.clientX, y: e.clientY, id: e.pointerId, moving: false, can: W.rules && W.rules.canDrag(it) };
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moving) {
      if (!drag.can || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 10) return;
      drag.moving = true; VC.sfx('pick'); drag.it.mesh.scale.setScalar(1.15);
    }
    setRay(e); const p = V(0, 0, 0); if (!raycaster.ray.intersectPlane(plane, p)) return;
    const ws = W.ws[W.view].position;
    const lx = U.clamp(p.x - ws.x, -3.9, 3.9), lz = U.clamp(p.z - ws.z, -2.2, 2.4);
    drag.it.mesh.position.set(lx, DRAG_Y, lz);
    const c = findCont(lx, lz, drag.it);
    W.conts.forEach(k => { k.hl.material.opacity = k === c ? 0.5 : 0; });
    drag.over = c;
  }
  function findCont(x, z, it) {
    let best = null, bd = 1e9;
    W.conts.forEach(c => { const dx = Math.abs(x - c.x) - c.w / 2, dz = Math.abs(z - c.z) - c.d / 2, d = Math.max(dx, dz);
      if (d < 0.35 && d < bd && (!c.accepts || c.accepts.includes(it.kind))) { bd = d; best = c; } });
    return best;
  }
  async function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; W.conts.forEach(k => { k.hl.material.opacity = 0; });
    const it = d.it;
    if (!d.moving) { W.rules && W.rules.onTap(it); return; }
    it.mesh.scale.setScalar(1); it.busy = true;
    const c = d.over, from = it.cont;
    let ok = false;
    if (c && c !== from) {
      const res = W.rules.canDrop(it, c);
      if (res === true && W.free(c) >= 0) { ok = true; VC.sfx('drop'); await W.place(it, c); it.busy = false; W.rules.onDrop(it, from, c); return; }
      W.rules.onReject(it, c, res === true ? 'cheio' : res);
    }
    if (!ok) { VC.sfx('back'); if (from) await W.place(it, from, it.slot, 0.3); }
    it.busy = false;
  }
  W.cancelDrag = () => { if (drag && drag.moving && drag.it.cont) { drag.it.mesh.scale.setScalar(1); W.place(drag.it, drag.it.cont, drag.it.slot, 0.2); } drag = null; };

  // ---------- Festa ----------
  W.festa = function (on) {
    W.confetti.visible = on; VC.setFestaMusic(on);
    const spots = [V(-2.6, 0, 4.9), V(-1.3, 0, 5.4), V(1.1, 0, 5.6), V(2.6, 0, 4.9), V(-0.1, 0, 5.9)];
    VC.LOCS.forEach((k, i) => {
      const r = W.residents[k], ws = W.ws[k];
      if (on) { scene.attach(r); r.position.copy(spots[i]); r.rotation.y = 0; }
      else { ws.attach(r); r.position.set(0.6, 0, -2.6); r.rotation.set(0, 0, 0); }
    });
  };

  // ---------- Laço de animação ----------
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    VC.updateTweens(dt);
    camera.position.copy(camPos); camera.lookAt(camTgt);
    const st = W.tico.userData.stand; if (st.visible) st.scale.y = 1 + Math.sin(t * 3) * 0.03;
    W.halos.forEach(h => { const s = 1 + Math.sin(t * 6) * 0.15; h.scale.set(s, s, 1); });
    if (W.confetti.visible) W.confetti.children.forEach(c => { c.position.addScaledVector(c.userData.v, dt); c.rotation.x += dt * 4; c.rotation.y += dt * 3; if (c.position.y < 0) c.position.y = 8; });
    if (W.festaOn) VC.LOCS.forEach((k, i) => { const r = W.residents[k]; r.position.y = Math.abs(Math.sin(t * 4 + i)) * 0.25; });
    if (W.onFrame) W.onFrame(dt);
    renderer.render(scene, camera);
  }
})(window.VC);
