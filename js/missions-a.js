// Vila das Contas — situações-molde (parte A): ajudantes, Padaria e Feira.
// Cada molde sorteia números dentro do nível e monta a mesa com objetos 3D.
(function (VC) {
  'use strict';
  const T = window.THREE, U = VC.U, R = U.rand, W = VC.W, C = VC.Cont;
  VC.TPL = [];
  const H = VC.MH = {};

  H.qt = (n, u) => n + ' ' + (n === 1 ? u[0] : u[1]);
  H.SY = [['star', '#e5487a'], ['circle', '#2f7fd0'], ['tri', '#3fa45b'], ['heart', '#9b6ad6'], ['square', '#f28c28'], ['diamond', '#2b2a4a']];
  // Deixa o recipiente com o número exato de lugares e desenha cada lugar vazio.
  H.exact = (b, n) => { b.slots = b.slots.slice(0, n); return b; };
  H.marks = b => {
    const mat = new T.MeshBasicMaterial({ color: '#2b2a4a', transparent: true, opacity: 0.28, depthWrite: false });
    b.slots.forEach(s => { const r = new T.Mesh(new T.RingGeometry(0.1, 0.14, 16), mat); r.rotation.x = -Math.PI / 2; r.position.set(s.x, s.y + 0.006, s.z); b.group.add(r); });
    return b;
  };
  H.cols = n => n <= 5 ? Math.max(n, 1) : 5;
  H.rows = n => Math.max(1, Math.ceil(n / 5));
  H.units = items => items.map(it => ({ items: [it], value: it.value || 1 }));
  H.moves = (items, to) => items.map(it => [it, to]);
  // Movimentos até o destino ficar cheio.
  H.toFill = (src, dst) => H.moves(W.inC(src).slice(0, dst.items.filter(x => !x).length), dst);
  // Regra de repartir em rodadas (todos com a mesma quantidade).
  H.rounds = (targets, pile, sobra) => (it, c) => {
    if (c === pile) return true;
    const cs = targets.map(W.count), min = Math.min.apply(null, cs), eq = cs.every(x => x === min);
    if (sobra && c === sobra) return W.count(pile) < targets.length && eq ? true : 'sobraCedo';
    if (!targets.includes(c)) return 'lugar';
    if (W.count(c) > min) return 'rodada';
    if (sobra && W.count(pile) < targets.length && eq) return 'desigual';
    return true;
  };
  H.solveRounds = (targets, pile, sobra) => {
    const items = W.inC(pile), cs = targets.map(W.count), mv = [];
    items.forEach((it, i) => {
      const left = items.length - i, min = Math.min.apply(null, cs);
      if (sobra && left < targets.length && cs.every(x => x === min)) { mv.push([it, sobra]); return; }
      const k = cs.indexOf(min); cs[k]++; mv.push([it, targets[k]]);
    });
    return mv;
  };
  H.row = (n, w, gap, cx) => Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * (w + gap) + (cx || 0));
  const add = t => VC.TPL.push(t);

  // ---------------- PADARIA (adição) ----------------
  const PQ = ['pão de queijo', 'pães de queijo'], PF = ['pão francês', 'pães franceses'];
  function genSum(L, maxPart) {
    let tot, a;
    if (L === 1) { tot = R(2, 5); a = R(1, tot - 1); }
    else if (L === 2) { tot = R(5, 10); a = R(2, tot - 1); }
    else { tot = R(11, 20); a = R(Math.max(5, tot - (maxPart || 15)), Math.min(tot - 2, maxPart || 15)); }
    return { a, b: tot - a };
  }

  add({
    id: 'acrescentar', loc: 'padaria', ideia: 'acrescentar', levels: [1, 2, 3], unit: PQ, item: 'paoq',
    gen: L => genSum(L, 15),
    ans: p => p.a + p.b,
    story: p => `Seu Joaquim assou ${H.qt(p.a, PQ)}. Depois, assou mais ${p.b}.`,
    ask: () => 'Quantos pães de queijo estão na bandeja agora?',
    build(p) {
      const tot = p.a + p.b;
      const band = W.cont(C.tray(5, H.rows(tot), 0.42, 0.42), 1.3, 0);
      const forno = W.cont(C.tray(H.cols(p.b), H.rows(p.b), 0.42, 0.42, '#6b6890'), -2.1, 0);
      W.row([forno, band], 0.9, 0.4);
      W.fill('paoq', band, p.a); W.fill('paoq', forno, p.b);
      return {
        resultCont: band, result: () => H.units(W.inC(band)),
        phases: [{ act: 'Coloque os pães que saíram do forno na bandeja.', canDrag: it => it.cont === forno, canDrop: (it, c) => c === band || 'lugar',
          check: () => W.count(forno) === 0, solve: () => H.moves(W.inC(forno), band), countCont: band }]
      };
    },
    eq: p => { const r = p.a + p.b; return { t: [p.a, '+', p.b, '=', r], g: [0, null, 1, null, 'r'], alts: [[p.b, '+', p.a, '=', r]], w: [H.qt(p.a, PQ), '+', H.qt(p.b, PQ), '=', H.qt(r, PQ)] }; },
    draw: p => [{ parts: [{ kind: 'paoq', n: p.a }], label: 'já estavam', c: 0 }, { parts: [{ kind: 'paoq', n: p.b }], label: 'saíram do forno', c: 1 }],
    wrongOp: p => Math.abs(p.a - p.b) || null
  });

  add({
    id: 'juntar', loc: 'padaria', ideia: 'juntar', levels: [1, 2, 3], unit: PF, item: 'paof',
    gen: L => genSum(L, 10),
    ans: p => p.a + p.b,
    story: p => `Uma cesta tem ${H.qt(p.a, PF)}. A outra cesta tem ${H.qt(p.b, PF)}.`,
    ask: () => 'Quantos pães franceses vão para o vizinho?',
    build(p) {
      const tot = p.a + p.b;
      const A = W.cont(C.basket(H.cols(p.a), H.rows(p.a), 0.46, 0.32, '#c8443c', 'star', '#c8443c'), 0, 0);
      const B = W.cont(C.basket(H.cols(p.b), H.rows(p.b), 0.46, 0.32, '#2f7fd0', 'circle', '#2f7fd0'), 0, 0);
      W.moveCont(A, 0, -(A.d / 2 + 0.25)); W.moveCont(B, 0, B.d / 2 + 0.25);
      const saco = W.cont(C.basket(5, Math.ceil(tot / 5), 0.46, 0.32, '#c9a77a', 'tri', '#3fa45b'), 1.5, 0.1);
      W.row([[A, B], saco], 0.9, 0.4);
      W.fill('paof', A, p.a); W.fill('paof', B, p.b);
      return {
        resultCont: saco, result: () => H.units(W.inC(saco)),
        phases: [{ act: 'Junte tudo no saco do vizinho, o do triângulo.', canDrag: it => it.cont === A || it.cont === B, canDrop: (it, c) => c === saco || 'lugar',
          check: () => W.count(A) + W.count(B) === 0, solve: () => H.moves(W.inC(A).concat(W.inC(B)), saco), countCont: saco }]
      };
    },
    eq: p => { const r = p.a + p.b; return { t: [p.a, '+', p.b, '=', r], g: [0, null, 1, null, 'r'], alts: [[p.b, '+', p.a, '=', r]], w: [H.qt(p.a, PF), '+', H.qt(p.b, PF), '=', H.qt(r, PF)] }; },
    draw: p => [{ parts: [{ kind: 'paof', n: p.a }], label: 'cesta ★', c: 0, box: true }, { parts: [{ kind: 'paof', n: p.b }], label: 'cesta ●', c: 1, box: true }],
    wrongOp: p => Math.abs(p.a - p.b) || null
  });

  add({
    id: 'completar', loc: 'padaria', ideia: 'completar', levels: [3], desafio: true, unit: PF, item: 'paof',
    gen: () => { const N = R(8, 15); return { N, a: R(Math.ceil(N / 2), N - 2) }; },
    ans: p => p.N - p.a,
    story: p => `A cliente quer ${H.qt(p.N, PF)}. Ela já tem ${p.a} no saquinho.`,
    ask: () => 'Quantos pães faltavam?',
    build(p) {
      const falta = p.N - p.a;
      const pile = W.cont(C.tray(4, Math.ceil((falta + 2) / 4), 0.46, 0.34), -2.3, 0.4);
      const saco = W.cont(H.marks(H.exact(C.basket(5, H.rows(p.N), 0.46, 0.32, '#c9a77a', 'tri', '#3fa45b'), p.N)), 1.3, 0);
      W.row([pile, saco], 0.9, 0.4);
      W.fill('paof', saco, p.a); W.fill('paof', pile, falta + 2);
      return {
        resultCont: pile, result: () => H.units(W.inC(saco).filter(it => it.added)),
        onDrop: (it, from, to) => { if (to === saco) { it.added = true; W.halo(it, true, '#3fa45b'); } else { it.added = false; W.halo(it, false); } },
        phases: [{ act: 'Coloque pães até o saquinho ficar cheio. Os pães novos ficam com um anel verde.', canDrag: it => it.cont === pile, canDrop: (it, c) => c === saco || 'lugar',
          check: () => W.free(saco) === -1, solve: () => H.toFill(pile, saco) }]
      };
    },
    eq: p => { const r = p.N - p.a; return { t: [p.a, '+', r, '=', p.N], g: [0, null, 'r', null, 1], alts: [[p.N, '−', p.a, '=', r]], w: [H.qt(p.a, PF), '+', H.qt(r, PF), '=', H.qt(p.N, PF)] }; },
    draw: (p, solved) => [{ parts: [{ kind: 'paof', n: p.a }, { kind: 'paof', n: p.N - p.a, style: solved ? '' : 'empty' }], label: 'saquinho', c: 0, box: true }],
    wrongOp: p => p.N
  });

  // ---------------- FEIRA (subtração) ----------------
  const LA = ['laranja', 'laranjas'], RE = ['real', 'reais'];

  add({
    id: 'retirar', loc: 'feira', ideia: 'retirar', levels: [1, 2, 3], unit: LA, item: 'laranja',
    gen: L => { let a, b; if (L === 1) { a = R(3, 5); b = R(1, a - 1); } else if (L === 2) { a = R(6, 10); b = R(2, a - 2); } else { a = R(11, 20); b = R(3, Math.min(10, a - 3)); } return { a, b }; },
    ans: p => p.a - p.b,
    story: p => `Dona Rosa tinha ${H.qt(p.a, LA)} na banca. Ela vendeu ${H.qt(p.b, LA)}.`,
    ask: () => 'Quantas laranjas sobraram na banca?',
    build(p) {
      const banca = W.cont(C.basket(5, H.rows(p.a), 0.42, 0.42, '#8a5a3a'), -1.2, 0);
      const sacola = W.cont(H.marks(H.exact(C.basket(H.cols(p.b), H.rows(p.b), 0.42, 0.42, '#e5487a', 'heart', '#e5487a'), p.b)), 2.3, 0.3);
      W.row([banca, sacola], 0.9, 0.4);
      W.fill('laranja', banca, p.a);
      return {
        resultCont: banca, result: () => H.units(W.inC(banca)),
        phases: [{ act: `Coloque ${H.qt(p.b, LA)} na sacola da cliente, a do coração.`, canDrag: it => it.cont === banca, canDrop: (it, c) => c === sacola || 'lugar',
          check: () => W.free(sacola) === -1, solve: () => H.toFill(banca, sacola), countCont: sacola }]
      };
    },
    eq: p => { const r = p.a - p.b; return { t: [p.a, '−', p.b, '=', r], g: [0, null, 1, null, 'r'], alts: [], w: [H.qt(p.a, LA), '−', H.qt(p.b, LA), '=', H.qt(r, LA)] }; },
    draw: p => [{ parts: [{ kind: 'laranja', n: p.a - p.b }, { kind: 'laranja', n: p.b, style: 'crossed' }], label: 'banca', c: 0 }],
    wrongOp: p => p.a + p.b
  });

  add({
    id: 'comparar', loc: 'feira', ideia: 'comparar', levels: [3], desafio: true, unit: ['banana', 'bananas'], item: 'banana',
    gen: () => { const a = R(6, 12); return { a, b: R(2, Math.min(8, a - 2)) }; },
    ans: p => p.a - p.b,
    story: p => `Na banca há ${H.qt(p.a, ['banana', 'bananas'])} e ${H.qt(p.b, ['maçã', 'maçãs'])}.`,
    ask: () => 'Quantas bananas tem a mais que maçãs?',
    build(p) {
      const mac = W.cont(C.mat(p.b, 1, 0.44, 0.42, '#f6d6d6'), 0.9, -1.1);
      const par = W.cont(H.marks(C.mat(p.b, 1, 0.44, 0.42, '#fff3c4')), 0.9, -0.45);
      const pile = W.cont(C.basket(4, Math.ceil(p.a / 4), 0.42, 0.42, '#d9a066'), -2.55, 0.5);
      W.row([pile, [mac, par]], 0.6, 0.4);
      W.fill('maca', mac, p.b); W.fill('banana', pile, p.a);
      return {
        resultCont: pile, result: () => H.units(W.inC(pile)),
        phases: [{ act: 'Coloque uma banana na frente de cada maçã.', canDrag: it => it.cont === pile, canDrop: (it, c) => c === par || 'lugar',
          check: () => W.free(par) === -1, solve: () => H.toFill(pile, par) }]
      };
    },
    eq: p => { const r = p.a - p.b; return { t: [p.a, '−', p.b, '=', r], g: [0, null, 1, null, 'r'], alts: [[p.b, '+', r, '=', p.a]], w: [H.qt(p.a, ['banana', 'bananas']), '−', H.qt(p.b, ['maçã', 'maçãs']), '=', H.qt(r, ['banana', 'bananas']) + ' a mais'] }; },
    draw: p => [{ rows: true, parts: [{ kind: 'banana', n: p.a }, { kind: 'maca', n: p.b }], label: 'bananas e maçãs', c: 0 }],
    wrongOp: p => p.a + p.b
  });

  add({
    id: 'troco', loc: 'feira', ideia: 'troco', levels: [1, 2, 3], unit: RE, item: 'moeda',
    gen: L => L === 1 ? { N: 5, P: R(1, 4) } : L === 2 ? { N: 10, P: R(2, 9) } : { N: 20, P: R(5, 15) },
    ans: p => p.N - p.P,
    story: p => `O caju custa ${p.P} ${p.P === 1 ? 'real' : 'reais'}. Você paga com ${p.N} reais. Cada moeda vale 1 real.`,
    ask: () => 'Quanto volta de troco?',
    build(p) {
      const cart = W.cont(C.basket(5, p.N / 5, 0.36, 0.36, '#6b4a1e'), -1.6, 0.5);
      const caixa = W.cont(H.marks(H.exact(C.basket(H.cols(p.P), H.rows(p.P), 0.36, 0.36, '#2f7fd0', 'square', '#2f7fd0'), p.P)), 1.9, 0.2);
      W.row([cart, caixa], 1.0, 0.4);
      W.fill('moeda', cart, p.N);
      const caju = new T.Group();
      const fr = new T.Mesh(new T.SphereGeometry(0.2, 9, 7), new T.MeshPhongMaterial({ color: '#e8562a', flatShading: true })); fr.scale.set(0.9, 1.25, 0.9); fr.position.y = 0.25; caju.add(fr);
      const nut = new T.Mesh(new T.SphereGeometry(0.09, 7, 5), new T.MeshPhongMaterial({ color: '#8f9aa3', flatShading: true })); nut.scale.set(1.4, 0.8, 0.8); nut.position.y = 0.55; caju.add(nut);
      const tag = VC.tex.plane(0.7, 0.35, VC.tex.text('R$ ' + p.P, '#fffaf0')); tag.position.set(0, 0.5, 0.25); caju.add(tag);
      caju.position.set(0, 0, -(caixa.d / 2 + 0.45)); caixa.group.add(caju);
      return {
        resultCont: cart, result: () => H.units(W.inC(cart)),
        phases: [{ act: `Dê ${p.P} ${p.P === 1 ? 'moeda' : 'moedas'} para a Dona Rosa: coloque no caixa do quadrado.`, canDrag: it => it.cont === cart, canDrop: (it, c) => c === caixa || 'lugar',
          check: () => W.free(caixa) === -1, solve: () => H.toFill(cart, caixa), countCont: caixa }]
      };
    },
    eq: p => { const r = p.N - p.P; return { t: [p.N, '−', p.P, '=', r], g: [0, null, 1, null, 'r'], alts: [], w: [H.qt(p.N, RE), '−', H.qt(p.P, RE), '=', H.qt(r, RE) + ' de troco'] }; },
    draw: p => [{ parts: [{ kind: 'moeda', n: p.N - p.P }, { kind: 'moeda', n: p.P, style: 'crossed' }], label: 'seu dinheiro', c: 0 }],
    wrongOp: p => p.N + p.P
  });

  add({
    id: 'antes', loc: 'feira', ideia: 'quanto tinha antes', levels: [3], desafio: true, unit: LA, item: 'laranja',
    gen: () => ({ b: R(3, 8), c: R(4, 10) }),
    ans: p => p.b + p.c,
    story: p => `Dona Rosa vendeu ${H.qt(p.b, LA)}. Na banca ainda ficaram ${H.qt(p.c, LA)}.`,
    ask: () => 'Quantas laranjas Dona Rosa tinha antes de vender?',
    build(p) {
      const banca = W.cont(C.basket(5, 4, 0.42, 0.42, '#8a5a3a'), -1.3, 0);
      const sacola = W.cont(C.basket(4, Math.ceil(p.b / 4), 0.42, 0.42, '#e5487a', 'heart', '#e5487a'), 2.3, 0.2);
      W.row([banca, sacola], 0.9, 0.4);
      W.fill('laranja', banca, p.c); W.fill('laranja', sacola, p.b);
      return {
        resultCont: banca, result: () => H.units(W.inC(banca)),
        phases: [{ act: 'Vamos desfazer a venda: devolva as laranjas da sacola para a banca.', canDrag: it => it.cont === sacola, canDrop: (it, c) => c === banca || 'lugar',
          check: () => W.count(sacola) === 0, solve: () => H.moves(W.inC(sacola), banca), countCont: banca }]
      };
    },
    eq: p => { const r = p.b + p.c; return { t: [p.c, '+', p.b, '=', r], g: [0, null, 1, null, 'r'], alts: [[p.b, '+', p.c, '=', r], [r, '−', p.b, '=', p.c]], w: [H.qt(p.c, LA), '+', H.qt(p.b, LA), '=', H.qt(r, LA)] }; },
    draw: p => [{ parts: [{ kind: 'laranja', n: p.c }], label: 'ficaram', c: 0 }, { parts: [{ kind: 'laranja', n: p.b }], label: 'vendeu', c: 1, box: true }],
    wrongOp: p => Math.abs(p.c - p.b) || null
  });
})(window.VC);
