// Vila das Contas — fluxo da missão: ouvir → fazer → ver o desenho → escrever a conta.
(function (VC) {
  'use strict';
  const U = VC.U, W = VC.W, H = VC.MH, $ = U.$;
  const P = VC.P = {};
  const COLORS = ['#d9661c', '#2f7fd0', '#9b6ad6'], RC = '#2e9b57';
  const INTRO = {
    padaria: 'Bem-vindo à padaria! Seu Joaquim precisa de ajuda com os pães.',
    feira: 'Na feira, Dona Rosa vende frutas. Vamos ajudar?',
    granja: 'Na granja do Tio Zé tem ovos, galinhas e milho!',
    lia: 'Hoje é aniversário da Lia! Vamos repartir as coisas da festa.',
    onibus: 'A Cida dirige o ônibus da vila. Vamos ver quem sobe e quem desce!'
  };
  const FIG = { padaria: 'Seu Joaquim', feira: 'Dona Rosa', granja: 'Tio Zé', lia: 'Lia', onibus: 'Cida' };
  const REJ = {
    rodada: 'Espere! Primeiro, um para cada um. Depois, outra rodada.',
    desigual: 'Se der mais um, fica desigual. Coloque na caixinha da sobra.',
    sobraCedo: 'Ainda dá para dar mais um para cada criança!',
    cheio: 'Aí já está cheio!',
    lugar: 'Esse não é o lugar. Ouça de novo onde colocar.'
  };
  let st = null, lastAct = Date.now();
  const prof = () => VC.store.profile;
  P.running = () => !!st;
  P.state = () => st;

  function setStep(n) { document.querySelectorAll('.step').forEach(el => { const s = +el.dataset.s; el.classList.toggle('on', s === n); el.classList.toggle('done', s < n); }); }
  function renderProbs() { U.html('#probs', Array.from({ length: st.total }, (_, i) => `<span class="${i < st.i ? 'ok' : i === st.i ? 'now' : ''}"></span>`).join('')); }
  function hideAll() { ['#answer', '#board', '#strategy'].forEach(s => U.show(s, false)); document.body.classList.remove('answering'); }

  // ---------- Início e fim da missão ----------
  P.start = async function (loc) {
    const id = ++VC.flow;
    st = { loc, id, i: 0, total: 4 };
    VC.UI.mode('mission'); renderProbs(); setStep(1);
    try {
      await Promise.all([VC.say(INTRO[loc]), W.go(loc)]); VC.guard(id);
      W.react(loc, 'happy');
      for (st.i = 0; st.i < st.total; st.i++) { renderProbs(); await runProblem(id); VC.guard(id); }
      await finish(id);
    } catch (e) { if (e !== VC.CANCEL) console.error(e); }
  };

  P.home = async function () {
    VC.flow++; st = null; VC.stopVoice(); W.cancelDrag(); W.inputOn = false; hideAll(); W.clearWs();
    VC.UI.mode('praca-moving'); await W.go('praca'); VC.UI.mode('praca');
  };

  async function finish(id) {
    const loc = st.loc, p = prof();
    hideAll(); W.inputOn = false;
    p.done[loc] = (p.done[loc] || 0) + 1; p.figurinhas[loc] = (p.figurinhas[loc] || 0) + 1; VC.store.save();
    VC.sfx('ok'); W.react(loc, 'happy'); VC.UI.toast('⭐ Missão completa!');
    await VC.say(`Missão completa! ${FIG[loc]} agradece a sua ajuda. Você ganhou a figurinha ${loc === 'lia' ? 'da' : loc === 'feira' || loc === 'onibus' ? 'da' : 'do'} ${FIG[loc]}!`); VC.guard(id);
    W.clearWs(); st = null; VC.UI.mode('praca-moving');
    await W.go('praca'); VC.guard(id);
    const novo = !W.deco[loc].visible;
    await W.showDeco(loc, true); VC.UI.mode('praca');
    if (novo) await VC.say('Olha só! A praça ficou mais enfeitada.');
    VC.UI.afterMission(loc);
  }

  // ---------- Um problema ----------
  async function runProblem(id) {
    const loc = st.loc, pf = prof(), L = pf.levels[loc], apoio = pf.apoio[loc] || 0;
    const list = VC.listFor(loc, L);
    const tpl = st.forceTpl || list[st.i % list.length]; st.forceTpl = null;
    const p = tpl.gen(L);
    const pr = st.pr = { tpl, p, L, apoio, ans: tpl.ans(p), errs: 0, hint: 0, counted: new Set(), count: 0, lastTap: 0, countedAll: false, phase: 0, mode: 'ouvir', helped: false, auto: false, grpErr: false };
    hideAll(); W.clearWs(); W.inputOn = false;
    pr.S = tpl.build(p);
    W.rules = rules(pr);
    W.frameContent(0.8);
    setStep(1); pr.mode = 'ouvir';
    await VC.say(tpl.story(p) + ' **' + tpl.ask(p) + '**'); VC.guard(id);
    const L3 = L === 3 && apoio === 0;
    if (L3) {
      const r = await levelThree(pr, id); VC.guard(id);
      if (r === 'auto') pr.helped = true;
    } else {
      await doObjects(pr, id); VC.guard(id);
      await answerCards(pr, id); VC.guard(id);
    }
    await showBoard(pr, id); VC.guard(id);
    if (!pr.helped) { await askStrategy(pr, id); VC.guard(id); }
    else await VC.wait(1200);
    hideAll();
    await record(pr, id);
  }

  function curPhase(pr) { return pr.S.phases[Math.min(pr.phase, pr.S.phases.length - 1)]; }
  function rules(pr) {
    return {
      canDrag: it => pr.mode === 'fazer' && !pr.auto && curPhase(pr).canDrag(it),
      canDrop: (it, c) => curPhase(pr).canDrop(it, c),
      onDrop: (it, from, to) => afterDrop(pr, it, from, to),
      onReject: (it, c, why) => { if (why === 'rodada' || why === 'desigual') pr.grpErr = true; VC.say(REJ[why] || why, { noRepeat: true }); },
      onTap: it => tapCount(pr, it)
    };
  }

  // Passo 2: fazer com os objetos (uma ou mais fases).
  async function doObjects(pr, id) {
    pr.mode = 'fazer'; setStep(2);
    for (let k = 0; k < pr.S.phases.length; k++) {
      pr.phase = k; const ph = pr.S.phases[k];
      if (ph.enter && !ph.entered) { ph.entered = true; ph.enter(); }
      if (ph.check()) continue;
      const done = new Promise(r => { pr.resolvePhase = r; });
      W.inputOn = true;
      let act = ph.act;
      if (k === 0 && st.i === 0 && VC.LOCS.every(l => !prof().done[l])) act += ' Segure com o dedo e arraste até o lugar certo.';
      VC.say(act);
      if (pr.auto) runMoves(pr, ph, id);
      await done; VC.guard(id);
      await VC.wait(350);
    }
    pr.objectsDone = true;
  }
  function afterDrop(pr, it, from, to) {
    lastAct = Date.now();
    pr.counted.clear(); pr.count = 0; pr.countedAll = false;
    if (pr.S.onDrop) pr.S.onDrop(it, from, to);
    const ph = curPhase(pr);
    if ((pr.L === 1 || pr.apoio > 0) && ph.countCont === to && !pr.auto) {
      const n = W.count(to); VC.sfx('tick', n); W.floater(it.mesh, String(n)); VC.sayQuick(n);
    }
    if (ph.check()) { pr.resolvePhase && pr.resolvePhase(); }
    else if (ph.stuck) { const m = ph.stuck(); if (m) VC.say(m, { noRepeat: true }); }
  }
  async function runMoves(pr, ph, id) {
    const mv = ph.solve();
    for (const [it, c] of mv) {
      if (VC.flow !== id || ph.check()) break;
      if (W.free(c) < 0) continue;
      const from = it.cont; VC.sfx('drop'); await W.place(it, c, null, 0.45);
      afterDrop(pr, it, from, c); await VC.wait(150);
    }
  }

  // Contar tocando: cada objeto pula e o Tico fala o número.
  function keyOf(pr, it) { return pr.S.countKey ? pr.S.countKey(it) : it; }
  function tapCount(pr, it) {
    lastAct = Date.now();
    if (Date.now() - pr.lastTap > 9000) { pr.counted.clear(); pr.count = 0; }
    pr.lastTap = Date.now();
    const key = keyOf(pr, it);
    if (pr.counted.has(key)) { W.jump(it, 0.12); VC.sayQuick('Esse já foi contado!'); return; }
    pr.counted.add(key); const v = it.value || 1, before = pr.count; pr.count += v;
    W.jump(it); VC.sfx('tick', pr.count); W.floater(it.mesh, String(pr.count));
    VC.sayQuick(v === 2 ? `${before + 1}, ${pr.count}` : String(pr.count));
    const units = pr.S.result();
    if (units.length && units.every(u => pr.counted.has(keyOf(pr, u.items[0])))) pr.countedAll = true;
  }
  async function countAlong(pr, id, units) {
    units = units || pr.S.result(); let n = 0;
    units.forEach(u => u.items.forEach(it => W.halo(it, true)));
    for (const u of units) {
      if (VC.flow !== id) return;
      const before = n; n += u.value;
      u.items.forEach(it => W.jump(it)); VC.sfx('tick', n); W.floater(u.items[0].mesh, String(n));
      VC.sayQuick(u.value === 2 ? `${before + 1}, ${n}` : String(n));
      await VC.wait(u.value === 2 ? 1100 : 750);
    }
    units.forEach(u => u.items.forEach(it => { if (!it.added) W.halo(it, false); }));
    return n;
  }

  // ---------- Responder com cartões (níveis 1 e 2) ----------
  function options(pr) {
    const a = pr.ans;
    if (pr.L === 1) return Array.from({ length: Math.max(5, a) }, (_, i) => i + 1);
    const s = new Set([a]); const wo = pr.tpl.wrongOp(pr.p);
    if (wo && wo > 0 && wo <= 30) s.add(wo);
    [a + 1, a - 1, a + 2, a - 2, a + 3].forEach(x => { if (s.size < 4 && x > 0) s.add(x); });
    return Array.from(s).sort((x, y) => x - y);
  }
  async function answerCards(pr, id) {
    pr.mode = 'answer'; W.inputOn = true;
    if (pr.auto) { await autoAnswer(pr, id); return; }
    const L1 = pr.L === 1;
    U.html('#answer', options(pr).map(v => `<button class="card ${L1 ? 'l1' : ''}" data-v="${v}" aria-label="${v}">${L1 ? VC.dots(v) + '<span class="num">' + v + '</span>' : '<span class="num">' + v + '</span>' + VC.dots(v)}</button>`).join(''));
    U.show('#answer', true); document.body.classList.add('answering');
    VC.say('Pronto! **' + pr.tpl.ask(pr.p) + '** Toque em cada um para contar e escolha o cartão.');
    return new Promise(res => {
      pr.resolveAnswer = res;
      document.querySelectorAll('#answer .card').forEach(b => b.onclick = async () => {
        if (pr.busy || VC.flow !== id) return; lastAct = Date.now();
        const v = +b.dataset.v; W.clearGhosts(); VC.audioStart();
        if (v === pr.ans) { b.classList.add('right'); pr.busy = true; await correct(pr, id); res(); return; }
        b.classList.add('wrong'); b.disabled = true; pr.busy = true;
        await wrong(pr, id, v); pr.busy = false;
        if (pr.auto && VC.flow === id) { await autoAnswer(pr, id); res(); }
      });
    });
  }
  async function correct(pr, id) {
    VC.sfx('ok'); W.react(st.loc, 'happy'); W.ticoHop(); prof().errRow[st.loc] = 0;
    await VC.say(`Isso! ${H.qt(pr.ans, pr.tpl.unit)}.`); VC.guard(id);
    U.show('#answer', false); document.body.classList.remove('answering');
  }
  // Erro como informação: o morador reage e mostra a diferença.
  async function wrong(pr, id, v) {
    pr.errs++; const pf = prof(), kind = classify(pr, v);
    pf.erros[kind] = (pf.erros[kind] || 0) + 1;
    pf.errRow[st.loc] = (pf.errRow[st.loc] || 0) + 1;
    if (pf.errRow[st.loc] >= 2) { pf.apoio[st.loc] = Math.min(2, (pf.apoio[st.loc] || 0) + 1); pf.errRow[st.loc] = 0; pr.apoio = pf.apoio[st.loc]; }
    VC.store.save();
    const unit = pr.tpl.unit, who = FIG[st.loc], ans = pr.ans;
    let msg;
    if (v > ans) {
      if (pr.S.resultCont && pr.tpl.item) for (let i = 0; i < Math.min(5, v - ans); i++) W.ghost(pr.tpl.item, pr.S.resultCont, i);
      msg = `${who}: Você disse ${v}, mas eu contei ${H.qt(ans, unit)}. O que está transparente não existe.`;
    } else {
      let n = 0; pr.S.result().forEach(u => { n += u.value; if (n > v) u.items.forEach(it => W.halo(it, true, '#e5487a')); });
      msg = `${who}: Você disse ${v}, mas tem mais. Veja os que brilham.`;
    }
    if (kind === 'operacao') msg += ' Lembre o que aconteceu na história.';
    W.react(st.loc, 'think');
    await VC.say(msg); VC.guard(id);
    pr.S.result().forEach(u => u.items.forEach(it => { if (!it.added) W.halo(it, false); }));
    if (pr.errs === 2) { pr.hint = Math.max(pr.hint, 1); await P.hint(true); }
    else if (pr.errs >= 3) { pr.hint = 2; await P.hint(true); }
  }
  function classify(pr, v) {
    if (v === pr.tpl.wrongOp(pr.p)) return 'operacao';
    if (Math.abs(v - pr.ans) === 1) return pr.countedAll ? 'total' : 'contagem';
    return 'outro';
  }
  async function autoAnswer(pr, id) {
    pr.helped = true; U.show('#answer', false); document.body.classList.remove('answering');
    await VC.say('Vamos contar juntos.'); VC.guard(id);
    await countAlong(pr, id); VC.guard(id);
    await VC.say(`São ${H.qt(pr.ans, pr.tpl.unit)}.`); VC.guard(id);
  }

  // ---------- Dicas em três camadas ----------
  P.hint = async function (fromError) {
    if (!st || !st.pr) return;
    const pr = st.pr, id = st.id; lastAct = Date.now();
    if (pr.mode === 'ouvir' || pr.busyHint) return;
    pr.hint = Math.min(3, pr.hint + 1); pr.busyHint = true;
    try {
      if (pr.hint === 1) {
        const ph = pr.mode === 'fazer' ? ' ' + curPhase(pr).act : '';
        await VC.say(pr.tpl.story(pr.p) + ' **' + pr.tpl.ask(pr.p) + '**' + ph);
      } else if (pr.hint === 2) {
        if (pr.mode === 'board') { pr.resolveBuilder && pr.resolveBuilder('objects'); }
        else if (pr.mode === 'fazer') {
          const its = curPhase(pr).solve().map(m => m[0]);
          await VC.say('Vamos contar juntos o que precisa ir para o lugar.', { noRepeat: true });
          await countAlong(pr, id, H.units(its));
          await VC.say(curPhase(pr).act, { noRepeat: true });
        } else {
          await VC.say('Vamos contar juntos.', { noRepeat: true }); await countAlong(pr, id);
          await VC.say('**' + pr.tpl.ask(pr.p) + '**', { noRepeat: true });
        }
      } else {
        pr.auto = true;
        if (st.total < 5) { st.total++; st.forceTpl = pr.tpl; renderProbs(); }
        await VC.say('Eu mostro, passo a passo. Depois você tenta um parecido!', { noRepeat: true });
        if (pr.mode === 'fazer') runMoves(pr, curPhase(pr), id);
        else if (pr.mode === 'answer' && !fromError) { autoAnswer(pr, id).then(() => pr.resolveAnswer && pr.resolveAnswer()); }
        else if (pr.mode === 'board') { pr.resolveBuilder && pr.resolveBuilder('auto'); }
      }
    } finally { pr.busyHint = false; }
  };

  // ---------- Nível 3: começa no desenho e monta a conta com peças ----------
  async function levelThree(pr, id) {
    for (;;) {
      pr.mode = 'board'; setStep(3);
      U.html('#draw', drawHTML(pr.tpl.draw(pr.p, !!pr.objectsDone))); U.html('#eq', '');
      U.show('#board', true);
      setStep(4);
      const r = await builder(pr, id); VC.guard(id);
      if (r === 'objects') {
        U.show('#board', false); pr.auto = false;
        await VC.say('Vamos usar os objetos.'); VC.guard(id);
        await doObjects(pr, id); VC.guard(id);
        if (pr.auto) return 'auto';
        pr.hint = Math.max(pr.hint, 2); continue;
      }
      return r;
    }
  }
  function builder(pr, id) {
    const eq = pr.tpl.eq(pr.p), t = eq.t, fixed = new Set((eq.fixed || []).concat(t.map((x, i) => x === '=' ? i : -1).filter(i => i >= 0)));
    const nums = new Set(t.filter(x => typeof x === 'number'));
    const wo = pr.tpl.wrongOp(pr.p); [pr.ans + 1, pr.ans - 1, wo].forEach(x => { if (x > 0 && x <= 30 && nums.size < 7) nums.add(x); });
    const fill = t.map((x, i) => fixed.has(i) ? x : null);
    const isOp = x => typeof x === 'string';
    U.show('#builder', true);
    U.html('#board-actions', '<button class="go alt" id="btn-obj">✋ Usar os objetos</button>');
    const render = () => {
      U.html('#slots', t.map((x, i) => fixed.has(i) ? `<div class="slot fixed">${x}</div>` : `<button class="slot ${isOp(x) ? 'op' : ''} ${fill[i] != null ? 'filled' : ''}" data-i="${i}">${fill[i] != null ? fill[i] : ''}</button>`).join(''));
      document.querySelectorAll('#slots button.slot').forEach(b => b.onclick = () => { fill[+b.dataset.i] = null; VC.sfx('back'); render(); });
    };
    U.html('#tiles', Array.from(nums).sort((a, b) => a - b).map(n => `<button class="tile" data-v="${n}"><span>${n}</span>${VC.dots(n)}</button>`).join('') + ['+', '−', '×', '÷'].map(o => `<button class="tile op" data-v="${o}">${o}</button>`).join(''));
    render();
    VC.say('Olhe o desenho e monte a conta com as peças. **' + pr.tpl.ask(pr.p) + '**');
    return new Promise(res => {
      const done = r => { pr.resolveBuilder = null; U.show('#builder', false); U.html('#board-actions', ''); res(r); };
      pr.resolveBuilder = r => {
        if (r === 'auto') { t.forEach((x, i) => { fill[i] = x; }); render(); VC.say('A conta é ' + t.join(' ') + '.').then(() => done('auto')); }
        else done(r);
      };
      $('#btn-obj').onclick = () => { lastAct = Date.now(); done('objects'); };
      document.querySelectorAll('#tiles .tile').forEach(b => b.onclick = async () => {
        lastAct = Date.now(); VC.audioStart();
        const raw = b.dataset.v, v = /^\d+$/.test(raw) ? +raw : raw;
        const i = fill.findIndex((f, k) => f == null && isOp(t[k]) === isOp(v));
        if (i < 0) return;
        fill[i] = v; VC.sfx('drop'); render();
        if (fill.some(f => f == null)) return;
        const ok = [t].concat(eq.alts || []).some(a => a.length === fill.length && a.every((x, k) => x === fill[k]));
        if (ok) { VC.sfx('ok'); W.react(st.loc, 'happy'); await VC.say('Isso! ' + fill.join(' ')); done('ok'); return; }
        pr.errs++; const pf = prof();
        const opOnly = t.every((x, k) => isOp(x) || x === fill[k]);
        const kind = opOnly ? 'operacao' : Math.abs(fill[t.indexOf('=') + 1] - pr.ans) === 1 ? 'contagem' : 'outro';
        pf.erros[kind] = (pf.erros[kind] || 0) + 1; VC.store.save();
        t.forEach((x, k) => { if (!fixed.has(k) && x !== fill[k]) { const s = document.querySelector(`#slots [data-i="${k}"]`); s && s.classList.add('bad'); } });
        await VC.say(opOnly ? 'Quase! Os números estão certos. Pense: nessa história, o que aconteceu?' : 'Quase! Olhe o desenho de novo.', { noRepeat: true });
        t.forEach((x, k) => { if (!fixed.has(k) && x !== fill[k]) fill[k] = null; }); render();
        if (pr.errs >= 3 && pr.resolveBuilder) { pr.hint = 2; P.hint(true); }
      });
    });
  }

  // ---------- Passos 3 e 4: desenho e conta escrita ----------
  function figs(pt) { return pt.n ? Array.from({ length: pt.n }, () => VC.fig(pt.kind, pt.style)).join('') : ''; }
  function drawHTML(groups) {
    return groups.map((g, i) => {
      const col = COLORS[g.c || 0];
      const inner = g.rows ? `<div class="rows">${g.parts.map(pt => '<div class="figs">' + figs(pt) + '</div>').join('')}</div>`
        : `<div class="figs">${g.parts.map(figs).join('') || '<div style="width:64px;height:34px"></div>'}</div>`;
      return `<div class="grp ${g.box ? 'box' : ''}" style="color:${col};animation-delay:${i * 0.2}s">${inner}<div class="lbl">${g.label || ''}</div></div>`;
    }).join('');
  }
  function eqHTML(eq) {
    const tok = (x, i) => { const g = eq.g && eq.g[i], col = g === 'r' ? RC : g != null ? COLORS[g] : 'transparent';
      return `<div class="tok" style="border-color:${col};animation-delay:${i * 0.12}s"><span>${x}</span>${typeof x === 'number' ? VC.dots(x) : ''}</div>`; };
    return `<div class="eqline words">${eq.w.join(' ')}</div><div class="eqline main">${eq.t.map(tok).join('')}</div>` +
      (eq.extra || []).map(e => `<div class="eqline extra">${e}</div>`).join('');
  }
  async function showBoard(pr, id) {
    pr.mode = 'board-show'; W.inputOn = false;
    const eq = pr.tpl.eq(pr.p);
    setStep(3); U.show('#builder', false); U.html('#board-actions', ''); U.html('#eq', '');
    U.html('#draw', drawHTML(pr.tpl.draw(pr.p, true))); U.show('#board', true);
    await VC.say('Os objetos viraram desenho.'); VC.guard(id);
    setStep(4); U.html('#eq', eqHTML(eq));
    await VC.say(eq.t.join(' ')); VC.guard(id);
    if (eq.extra) { await VC.say('Também dá para escrever: ' + eq.extra[0]); VC.guard(id); }
  }

  // ---------- Como você pensou? ----------
  const STRAT = [
    ['todos', 'contei tudo', '<svg viewBox="0 0 84 64"><g fill="#2b2a4a">' + [0, 1, 2, 3, 4].map(i => `<circle cx="${10 + i * 16}" cy="40" r="6"/><text x="${10 + i * 16}" y="20" font-size="12" text-anchor="middle" font-weight="800">${i + 1}</text>`).join('') + '</g></svg>'],
    ['maior', 'continuei do maior', '<svg viewBox="0 0 84 64"><circle cx="20" cy="34" r="17" fill="#ffc53d"/><text x="20" y="41" font-size="20" font-weight="800" text-anchor="middle" fill="#2b2a4a">5</text><path d="M40 34h14" stroke="#2b2a4a" stroke-width="4"/><path d="M52 27l8 7-8 7z" fill="#2b2a4a"/><circle cx="68" cy="28" r="5" fill="#2b2a4a"/><circle cx="68" cy="42" r="5" fill="#2b2a4a"/></svg>'],
    ['grupos', 'fiz grupos', '<svg viewBox="0 0 84 64"><g fill="none" stroke="#2f7fd0" stroke-width="3"><rect x="4" y="16" width="34" height="32" rx="12"/><rect x="46" y="16" width="34" height="32" rx="12"/></g><g fill="#2b2a4a"><circle cx="14" cy="32" r="5"/><circle cx="28" cy="32" r="5"/><circle cx="56" cy="32" r="5"/><circle cx="70" cy="32" r="5"/></g></svg>']
  ];
  function askStrategy(pr, id) {
    U.html('#strategy', STRAT.map(s => `<button class="strat" data-s="${s[0]}">${s[2]}<span>${s[1]}</span></button>`).join(''));
    U.show('#strategy', true); document.body.classList.add('answering');
    VC.say('Como você pensou? Contei tudo, continuei do maior, ou fiz grupos?');
    return new Promise(res => document.querySelectorAll('#strategy .strat').forEach(b => b.onclick = () => {
      if (VC.flow !== id) return;
      const s = b.dataset.s, pf = prof(); pf.estrategias[s]++; if (st.loc === 'padaria') pf.estrategiaAdicao[s]++;
      pr.strategy = s; VC.sfx('drop'); VC.stopVoice(); U.show('#strategy', false); res();
    }));
  }

  // ---------- Registro e ajuste automático ----------
  async function record(pr, id) {
    const pf = prof(), loc = st.loc, k = pr.tpl.ideia;
    const r = pf.ideias[k] = pf.ideias[k] || { ok: 0, err: 0 };
    if (!pr.helped) r.ok++;
    r.err += pr.errs + (pr.helped ? 1 : 0);
    if (pr.grpErr) pf.erros.grupos++;
    if (!pr.helped && pr.errs === 0) {
      pf.okRow[loc] = (pf.okRow[loc] || 0) + 1;
      if (pf.okRow[loc] >= 2 && pf.apoio[loc] > 0) pf.apoio[loc]--;
      if (pf.okRow[loc] >= 3 && pf.levels[loc] < 3) {
        pf.levels[loc]++; pf.okRow[loc] = 0; VC.store.save();
        VC.UI.toast('🌟 Nível ' + pf.levels[loc]);
        await VC.say('Você está craque! Os próximos vão ser um pouco mais difíceis.'); VC.guard(id);
      }
    } else pf.okRow[loc] = 0;
    pf.ultimo = new Date().toISOString().slice(0, 10);
    VC.store.save();
  }

  // ---------- Botões do topo e lembrete de dica ----------
  document.addEventListener('pointerdown', () => { lastAct = Date.now(); $('#btn-dica').classList.remove('pulse'); }, true);
  setInterval(() => { if (st && st.pr && ['fazer', 'answer', 'board'].includes(st.pr.mode) && Date.now() - lastAct > 20000) $('#btn-dica').classList.add('pulse'); }, 1000);
  $('#btn-dica').innerHTML = VC.ticoFace;
  $('#btn-dica').onclick = () => { VC.audioStart(); P.hint(); };
  $('#btn-ouvir').onclick = () => { VC.audioStart(); VC.repeat(); };
  $('#btn-home').onclick = () => P.home();
})(window.VC);
