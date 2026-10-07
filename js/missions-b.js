// Vila das Contas — situações-molde (parte B): Granja, Casa da Lia e Ponto de ônibus.
(function (VC) {
  'use strict';
  const U = VC.U, R = U.rand, W = VC.W, C = VC.Cont, H = VC.MH;
  const add = t => VC.TPL.push(t);
  const OV = ['ovo', 'ovos'], CX = ['caixinha', 'caixinhas'], GA = ['galinha', 'galinhas'], PA = ['pata', 'patas'], ES = ['espiga', 'espigas'];

  // ---------------- GRANJA (multiplicação) ----------------
  add({
    id: 'ovos', loc: 'granja', ideia: 'grupos iguais', levels: [1, 2, 3], unit: OV, item: 'ovo',
    gen: L => { const o = L === 1 ? [[2, 2], [2, 3], [3, 2]] : [[2, 2], [2, 3], [2, 4], [2, 5], [3, 2], [3, 3], [5, 2]]; const s = U.pick(o); return { G: s[0], K: s[1] }; },
    ans: p => p.G * p.K,
    story: p => `Cada caixinha leva ${H.qt(p.G, OV)}. Tio Zé vai encher ${H.qt(p.K, CX)}.`,
    ask: () => 'Quantos ovos ele guardou ao todo?',
    build(p) {
      const cw = p.G * 0.27 + 0.1, xs = H.row(p.K, cw, 0.3, 0.7);
      const boxes = xs.map((x, i) => W.cont(C.carton(p.G, '#c9a77a', H.SY[i][0], H.SY[i][1]), x, -0.7));
      const n = p.G * p.K, cesto = W.cont(C.basket(5, H.rows(n), 0.3, 0.32, '#b98a52'), -2.3, 1.05);
      W.row(boxes, 0.3, 0.4); W.moveCont(cesto, boxes[0].x - boxes[0].w / 2 + cesto.w / 2, 0.7);
      W.fill('ovo', cesto, n);
      return {
        resultCont: cesto, result: () => H.units([].concat.apply([], boxes.map(W.inC))),
        phases: [{ act: 'Coloque os ovos nas caixinhas. Cada vão leva um ovo.', canDrag: it => it.cont === cesto, canDrop: (it, c) => boxes.includes(c) || 'lugar',
          check: () => W.count(cesto) === 0, solve: () => { const mv = [], its = W.inC(cesto); let k = 0; boxes.forEach(b => b.items.forEach(x => { if (!x && its[k]) mv.push([its[k++], b]); })); return mv; } }]
      };
    },
    eq: p => { const r = p.G * p.K; return { t: [p.K, '×', p.G, '=', r], g: [null, null, 0, null, 'r'], alts: [[p.G, '×', p.K, '=', r]], extra: [Array(p.K).fill(p.G).join(' + ') + ' = ' + r], w: [H.qt(p.K, CX), 'com', H.qt(p.G, OV), '=', H.qt(r, OV)] }; },
    draw: p => Array.from({ length: p.K }, (_, i) => ({ parts: [{ kind: 'ovo', n: p.G }], label: 'caixinha ' + (i + 1), c: 0, box: true })),
    wrongOp: p => p.G + p.K
  });

  add({
    id: 'patas', loc: 'granja', ideia: 'grupos iguais', levels: [1, 2, 3], unit: PA, item: 'galinha',
    gen: L => ({ K: L === 1 ? R(2, 3) : R(2, 5) }),
    ans: p => p.K * 2,
    story: p => `Cada galinha tem 2 patas. Tio Zé tem ${H.qt(p.K, GA)}.`,
    ask: p => `Quantas patas têm as ${p.K} galinhas juntas? Toque em cada galinha para contar as patas.`,
    build(p) {
      const coop = W.cont(C.patch(3, 2, 0.6, 0.6, '#c9a77a', '🐔'), -2.2, 0.3);
      const pen = W.cont(H.marks(H.exact(C.pen(Math.min(p.K, 3), Math.ceil(p.K / 3), 0.65, 0.65), p.K)), 1.4, 0);
      W.row([coop, pen], 0.9, 0.4);
      W.fill('galinha', coop, p.K, { value: 2 });
      return {
        countValue: 2, result: () => H.units(W.inC(pen)),
        phases: [{ act: 'Leve as galinhas para o cercado.', canDrag: it => it.cont === coop, canDrop: (it, c) => c === pen || 'lugar',
          check: () => W.count(coop) === 0, solve: () => H.moves(W.inC(coop), pen) }]
      };
    },
    eq: p => { const r = p.K * 2; return { t: [p.K, '×', 2, '=', r], g: [null, null, 0, null, 'r'], alts: [[2, '×', p.K, '=', r]], extra: [Array(p.K).fill(2).join(' + ') + ' = ' + r], w: [H.qt(p.K, GA), 'com', '2 patas', '=', H.qt(r, PA)] }; },
    draw: p => Array.from({ length: p.K }, () => ({ parts: [{ kind: 'pata', n: 2 }], label: '🐔', c: 0, box: true })),
    wrongOp: p => p.K + 2
  });

  add({
    id: 'dobro', loc: 'granja', ideia: 'dobro', levels: [1, 2, 3], unit: ES, item: 'milho',
    gen: L => ({ A: L === 1 ? R(2, 3) : R(2, 5) }),
    ans: p => p.A * 2,
    story: p => `De manhã, Tio Zé colheu ${H.qt(p.A, ES)} de milho. À tarde, ele colheu o dobro. Dobro é duas vezes a mesma quantidade.`,
    ask: () => 'Quantas espigas ele colheu à tarde?',
    build(p) {
      const manha = W.cont(C.basket(p.A, 1, 0.42, 0.5, '#e3c76a', 'circle', '#f28c28'), -2.2, -0.8);
      const tarde = W.cont(H.marks(C.basket(p.A, 2, 0.42, 0.5, '#e3c76a', 'star', '#e5487a')), 1.6, -0.5);
      const monte = W.cont(C.patch(5, 2, 0.42, 0.5, '#c9a77a'), -1.2, 0.75);
      W.row([[manha, monte], tarde], 0.8, 0.4);
      W.fill('milho', manha, p.A); W.fill('milho', monte, p.A * 2);
      return {
        resultCont: monte, result: () => H.units(W.inC(tarde)),
        phases: [{ act: 'Encha o cesto da tarde, o da estrela: duas fileiras iguais à da manhã.', canDrag: it => it.cont === monte, canDrop: (it, c) => c === tarde || 'lugar',
          check: () => W.free(tarde) === -1, solve: () => H.toFill(monte, tarde), countCont: tarde }]
      };
    },
    eq: p => { const r = p.A * 2; return { t: [2, '×', p.A, '=', r], g: [null, null, 0, null, 'r'], alts: [[p.A, '×', 2, '=', r], [p.A, '+', p.A, '=', r]], extra: [p.A + ' + ' + p.A + ' = ' + r], w: ['o dobro de', H.qt(p.A, ES), '=', H.qt(r, ES)] }; },
    draw: p => [{ parts: [{ kind: 'milho', n: p.A }], label: 'manhã', c: 0, box: true }, { rows: true, parts: [{ kind: 'milho', n: p.A }, { kind: 'milho', n: p.A }], label: 'tarde', c: 1, box: true }],
    wrongOp: p => p.A + 2
  });

  // ---------------- CASA DA LIA (divisão) ----------------
  const BR = ['brigadeiro', 'brigadeiros'], PR = ['pratinho', 'pratinhos'], BA = ['balão', 'balões'], CR = ['criança', 'crianças'], FI = ['figurinha', 'figurinhas'], LP = ['lápis', 'lápis'];

  add({
    id: 'repartir', loc: 'lia', ideia: 'repartir', levels: [1, 2, 3], unit: BR, item: 'brig',
    gen: L => { const o = L === 1 ? [[4, 2], [6, 2], [6, 3]] : [[4, 2], [6, 2], [6, 3], [8, 2], [8, 4], [9, 3], [10, 2], [10, 5]]; const s = U.pick(o); return { N: s[0], P: s[1] }; },
    ans: p => p.N / p.P,
    story: p => `Lia tem ${H.qt(p.N, BR)} e ${H.qt(p.P, PR)}. Todos os pratinhos precisam ficar com a mesma quantidade.`,
    ask: () => 'Quantos brigadeiros ficaram em cada pratinho?',
    build(p) {
      const plates = H.row(p.P, 0.9, 0.18, 0.7).map((x, i) => W.cont(C.plate(H.SY[i][1], H.SY[i][0]), x, -0.35));
      const band = W.cont(C.tray(5, H.rows(p.N), 0.36, 0.36, '#f3c6d6'), -2.4, 1.2);
      W.row(plates, 0.18, 0.4); W.moveCont(band, plates[0].x - 0.45 + band.w / 2, 0.95);
      W.fill('brig', band, p.N);
      return {
        resultCont: plates[0], result: () => H.units(W.inC(plates[0])),
        phases: [{ act: 'Dê um brigadeiro para cada pratinho, uma rodada de cada vez.', canDrag: it => it.cont === band, canDrop: H.rounds(plates, band),
          check: () => W.count(band) === 0, solve: () => H.solveRounds(plates, band) }]
      };
    },
    eq: p => { const r = p.N / p.P; return { t: [p.N, '÷', p.P, '=', r], g: [0, null, 1, null, 'r'], alts: [], extra: [Array(p.P).fill(r).join(' + ') + ' = ' + p.N], w: [H.qt(p.N, BR), 'para', H.qt(p.P, PR), '=', H.qt(r, BR) + ' em cada'] }; },
    draw: (p, solved) => solved ? Array.from({ length: p.P }, (_, i) => ({ parts: [{ kind: 'brig', n: p.N / p.P }], label: 'pratinho', c: 1, box: true }))
      : [{ parts: [{ kind: 'brig', n: p.N }], label: 'brigadeiros', c: 0 }].concat(Array.from({ length: p.P }, () => ({ parts: [], label: 'pratinho', c: 1, box: true }))),
    wrongOp: p => p.N - p.P
  });

  add({
    id: 'baloes', loc: 'lia', ideia: 'quantos cabem', levels: [1, 2, 3], unit: CR, item: 'balao',
    gen: L => ({ N: U.pick(L === 1 ? [4, 6] : [4, 6, 8, 10]) }),
    ans: p => p.N / 2,
    story: p => `Há ${p.N} balões na festa. Cada criança leva 2 balões.`,
    ask: () => 'Quantas crianças ganharam balão?',
    build(p) {
      const nk = Math.min(6, p.N / 2 + 1);
      const kids = H.row(nk, 0.6, 0.12, 0.85).map((x, i) => W.cont(C.kid(i), x, -0.2, { kid: true }));
      const pile = W.cont(C.patch(3, Math.ceil(p.N / 3), 0.36, 0.36, '#c9a4e0', '🎈'), -2.7, 0.2);
      W.row([pile].concat(kids), 0.2, 0.4);
      W.fill('balao', pile, p.N);
      return {
        result: () => kids.filter(k => W.count(k) === 2).map(k => ({ items: W.inC(k), value: 1 })),
        countKey: it => (it.cont && it.cont.kid ? it.cont : it),
        phases: [{ act: 'Entregue 2 balões para cada criança. Arraste os balões até as crianças.', canDrag: () => true,
          canDrop: (it, c) => c === pile || (c.kid ? (W.count(c) < 2 ? true : 'Cada criança leva só 2 balões.') : 'lugar'),
          check: () => W.count(pile) === 0 && kids.every(k => W.count(k) !== 1),
          stuck: () => W.count(pile) === 0 && kids.some(k => W.count(k) === 1) ? 'Uma criança está com 1 balão só. Cada criança leva 2!' : null,
          solve: () => { const mv = [], its = W.inC(pile); let k = 0; kids.forEach(kd => kd.items.forEach(x => { if (!x && its[k]) mv.push([its[k++], kd]); })); return mv; } }]
      };
    },
    eq: p => { const r = p.N / 2; return { t: [p.N, '÷', 2, '=', r], g: [0, null, 1, null, 'r'], alts: [], extra: [Array(r).fill(2).join(' + ') + ' = ' + p.N], w: [H.qt(p.N, BA), 'de 2 em 2', '=', H.qt(r, CR)] }; },
    draw: (p, solved) => solved ? Array.from({ length: p.N / 2 }, () => ({ parts: [{ kind: 'balao', n: 2 }], label: '🧒', c: 1, box: true })) : [{ parts: [{ kind: 'balao', n: p.N }], label: 'balões', c: 0 }],
    wrongOp: p => p.N
  });

  add({
    id: 'metade', loc: 'lia', ideia: 'metade', levels: [1, 2, 3], unit: FI, item: 'figu',
    gen: L => ({ N: U.pick(L === 1 ? [2, 4, 6] : [4, 6, 8, 10]) }),
    ans: p => p.N / 2,
    story: p => `Lia e o irmão vão dividir ${H.qt(p.N, FI)} pela metade. Metade é dividir em duas partes iguais.`,
    ask: () => 'Quantas figurinhas ficaram para cada um?',
    build(p) {
      const lia = W.cont(C.mat(3, 2, 0.34, 0.42, '#e5487a', 'star'), 0.3, -0.6);
      const irm = W.cont(C.mat(3, 2, 0.34, 0.42, '#2f7fd0', 'circle'), 2.4, -0.6);
      const boy = VC.person({ skin: '#e0a57a', shirt: '#2f7fd0', pants: '#3b4a6b', hair: '#3a2a1a', hat: 'bone', scale: 0.62 }); boy.position.set(0, -0.2, -2.0); irm.group.add(boy);
      const pile = W.cont(C.basket(5, H.rows(p.N), 0.32, 0.4, '#fff3c4'), -2.3, 0.5);
      W.row([pile, lia, irm], 0.5, 0.4);
      W.fill('figu', pile, p.N);
      return {
        resultCont: lia, result: () => H.units(W.inC(lia)),
        phases: [{ act: 'Dê uma figurinha para a Lia, na estrela, e uma para o irmão, no círculo. Uma rodada de cada vez.', canDrag: it => it.cont === pile, canDrop: H.rounds([lia, irm], pile),
          check: () => W.count(pile) === 0, solve: () => H.solveRounds([lia, irm], pile) }]
      };
    },
    eq: p => { const r = p.N / 2; return { t: [p.N, '÷', 2, '=', r], g: [0, null, null, null, 'r'], alts: [], extra: [r + ' + ' + r + ' = ' + p.N], w: [H.qt(p.N, FI), 'pela metade', '=', H.qt(r, FI) + ' para cada um'] }; },
    draw: (p, solved) => solved ? [{ parts: [{ kind: 'figu', n: p.N / 2 }], label: 'Lia ★', c: 1, box: true }, { parts: [{ kind: 'figu', n: p.N / 2 }], label: 'irmão ●', c: 1, box: true }]
      : [{ parts: [{ kind: 'figu', n: p.N }], label: 'figurinhas', c: 0 }, { parts: [], label: 'Lia ★', c: 1, box: true }, { parts: [], label: 'irmão ●', c: 1, box: true }],
    wrongOp: p => p.N
  });

  add({
    id: 'sobra', loc: 'lia', ideia: 'repartir com sobra', levels: [3], desafio: true, unit: LP, item: 'lapis',
    gen: () => { const s = U.pick([[5, 2], [7, 2], [9, 2], [7, 3], [8, 3], [10, 3], [10, 4]]); return { N: s[0], P: s[1] }; },
    ans: p => Math.floor(p.N / p.P), ans2: p => p.N % p.P,
    story: p => `São ${p.N} lápis para ${H.qt(p.P, CR)}. Cada criança deve ganhar a mesma quantidade.`,
    ask: () => 'Quantos lápis cada criança ganhou? E quantos sobraram?',
    build(p) {
      const mats = H.row(p.P, 0.65, 0.35, 0.6).map((x, i) => {
        const c = W.cont(C.mat(1, 5, 0.45, 0.2, H.SY[i][1], H.SY[i][0]), x, -0.5);
        const kid = VC.person({ skin: ['#c68b5e', '#f1c7a1', '#8a5a3a', '#e0a57a'][i], shirt: H.SY[i][1], hair: '#3a2a1a', scale: 0.4 }); kid.position.set(0, 0, -0.95); c.group.add(kid); return c;
      });
      const pile = W.cont(C.basket(2, Math.ceil(p.N / 2), 0.45, 0.22, '#d9a066'), -2.6, 0.6);
      const sobra = W.cont(C.basket(1, 3, 0.45, 0.22, '#8f9aa3', 'diamond', '#2b2a4a'), 3.1, 0.6);
      W.row([pile].concat(mats, [sobra]), 0.3, 0.4);
      W.fill('lapis', pile, p.N);
      return {
        resultCont: mats[0], result: () => H.units(W.inC(mats[0])), result2: () => H.units(W.inC(sobra)),
        phases: [{ act: 'Dê um lápis para cada criança, uma rodada de cada vez. O que não der para repartir vai para a caixinha cinza, a da sobra.', canDrag: it => it.cont === pile, canDrop: H.rounds(mats, pile, sobra),
          check: () => W.count(pile) === 0, solve: () => H.solveRounds(mats, pile, sobra) }]
      };
    },
    eq: p => { const q = Math.floor(p.N / p.P), r = p.N % p.P; return { t: [p.N, '÷', p.P, '=', q, 'sobra', r], fixed: [5], g: [0, null, 1, null, 'r', null, 2], alts: [], w: [H.qt(p.N, LP), 'para', H.qt(p.P, CR), '=', q + ' para cada', 'e sobra', String(r)] }; },
    draw: (p, solved) => {
      const q = Math.floor(p.N / p.P), r = p.N % p.P;
      return solved ? Array.from({ length: p.P }, () => ({ parts: [{ kind: 'lapis', n: q }], label: '🧒', c: 1, box: true })).concat([{ parts: [{ kind: 'lapis', n: r }], label: 'sobra', c: 2, box: true }])
        : [{ parts: [{ kind: 'lapis', n: p.N }], label: 'lápis', c: 0 }].concat(Array.from({ length: p.P }, () => ({ parts: [], label: '🧒', c: 1, box: true })));
    },
    wrongOp: p => p.N - p.P
  });

  // ---------------- PONTO DE ÔNIBUS (revisão: duas operações) ----------------
  const PS = ['passageiro', 'passageiros'], ME = ['mesa', 'mesas'], CO = ['copo', 'copos'];

  add({
    id: 'sobedesce', loc: 'onibus', ideia: 'duas operações', levels: [1, 2, 3], unit: PS, item: 'pessoa',
    gen: L => {
      let A, B, Cc;
      if (L === 1) { A = R(1, 3); B = R(1, 5 - A); Cc = R(1, A + B - 1); }
      else if (L === 2) { A = R(2, 6); B = R(1, Math.min(4, 10 - A)); Cc = R(1, Math.min(5, A + B - 1)); }
      else { A = R(5, 10); B = R(2, 6); Cc = R(2, Math.min(6, A + B - 2)); }
      return { A, B, C: Cc };
    },
    ans: p => p.A + p.B - p.C,
    story: p => `Havia ${H.qt(p.A, PS)} no ônibus da Cida. No ponto, subiram ${p.B} e desceram ${p.C}.`,
    ask: () => 'Quantos passageiros seguem viagem?',
    build(p) {
      const big = p.A + p.B > 10;
      const bus = W.cont(C.bus(big ? 6 : 5, big ? 3 : 2), -1.0, -0.4);
      const ponto = W.cont(C.patch(3, 2, 0.42, 0.42, '#b9c0c7', '🚏'), 2.6, -0.8);
      const calc = W.cont(H.marks(H.exact(C.patch(3, 2, 0.42, 0.42, '#d9d4c7', '🏠'), p.C)), 2.6, 0.8);
      W.row([bus, [ponto, calc]], 0.7, 0.4);
      W.fill('pessoa', bus, p.A); W.fill('pessoa', ponto, p.B);
      return {
        resultCont: bus, result: () => H.units(W.inC(bus)),
        phases: [
          { act: `Primeiro, coloque no ônibus quem está no ponto.`, canDrag: it => it.cont === ponto, canDrop: (it, c) => c === bus || 'lugar', check: () => W.count(ponto) === 0, solve: () => H.moves(W.inC(ponto), bus), countCont: bus },
          { act: `Agora, ${p.C} ${p.C === 1 ? 'passageiro vai' : 'passageiros vão'} descer. Tire do ônibus e coloque na calçada.`, canDrag: it => it.cont === bus, canDrop: (it, c) => c === calc || 'lugar', check: () => W.free(calc) === -1, solve: () => H.toFill(bus, calc), countCont: calc }
        ]
      };
    },
    eq: p => { const r = p.A + p.B - p.C; return { t: [p.A, '+', p.B, '−', p.C, '=', r], g: [0, null, 1, null, 2, null, 'r'], alts: [[p.A, '−', p.C, '+', p.B, '=', r]], w: [H.qt(p.A, PS), '+', p.B + ' subiram', '−', p.C + ' desceram', '=', H.qt(r, PS)] }; },
    draw: p => [{ parts: [{ kind: 'pessoa', n: p.A }], label: 'no ônibus', c: 0 }, { parts: [{ kind: 'pessoa', n: p.B }], label: 'subiram', c: 1 }, { parts: [{ kind: 'pessoa', n: p.C, style: 'crossed' }], label: 'desceram', c: 2 }],
    wrongOp: p => p.A + p.B + p.C
  });

  add({
    id: 'copos', loc: 'onibus', ideia: 'duas operações', levels: [3], desafio: true, unit: CO, item: 'copo',
    gen: () => ({ K: R(2, 4), G: R(2, 3), Q: R(1, 2) }),
    ans: p => p.K * p.G - p.Q,
    story: p => `Para a Festa da Vila, ${H.qt(p.K, ME)} vão receber ${H.qt(p.G, CO)} cada uma.`,
    ask: () => 'Quantos copos inteiros ficaram nas mesas?',
    build(p) {
      const mesas = H.row(p.K, 0.9, 0.2, 0.6).map((x, i) => W.cont(C.table(p.G, H.SY[i][0], H.SY[i][1]), x, -0.5));
      const n = p.K * p.G, tray = W.cont(C.tray(4, Math.ceil(n / 4), 0.3, 0.3), -2.6, -0.4);
      const lixo = W.cont(C.bin(), 3.1, 1.0);
      W.row([[tray, lixo]].concat(mesas), 0.3, 0.4);
      W.fill('copo', tray, n);
      return {
        result: () => H.units([].concat.apply([], mesas.map(W.inC)).filter(it => !it.broken)),
        phases: [
          { act: 'Coloque os copos nas mesas.', canDrag: it => it.cont === tray, canDrop: (it, c) => mesas.includes(c) || 'lugar', check: () => W.count(tray) === 0,
            solve: () => { const mv = [], its = W.inC(tray); let k = 0; mesas.forEach(m => m.items.forEach(x => { if (!x && its[k]) mv.push([its[k++], m]); })); return mv; } },
          { act: `Ops! ${p.Q === 1 ? '1 copo quebrou' : '2 copos quebraram'}. Leve os copos quebrados para o lixo.`,
            enter: () => { U.shuffle([].concat.apply([], mesas.map(W.inC))).slice(0, p.Q).forEach(it => { it.broken = true; VC.breakCup(it); }); VC.sfx('crack'); },
            canDrag: it => !!it.broken, canDrop: (it, c) => c === lixo || 'lugar', check: () => W.count(lixo) === p.Q,
            solve: () => H.moves(W.items.filter(it => it.broken && it.cont !== lixo), lixo) }
        ]
      };
    },
    eq: p => { const r = p.K * p.G - p.Q; return { t: [p.K, '×', p.G, '−', p.Q, '=', r], g: [null, null, 0, null, 2, null, 'r'], alts: [[p.G, '×', p.K, '−', p.Q, '=', r]], w: [H.qt(p.K, ME), 'com', H.qt(p.G, CO), '−', p.Q + ' quebrados', '=', H.qt(r, CO)] }; },
    draw: p => Array.from({ length: p.K }, (_, i) => {
      const brk = Math.max(0, Math.min(p.G, p.Q - (p.K - 1 - i) * p.G));
      return { parts: [{ kind: 'copo', n: p.G - brk }, { kind: 'copo', n: brk, style: 'crossed' }], label: 'mesa', c: 0, box: true };
    }),
    wrongOp: p => p.K * p.G
  });

  // Ordem das situações em cada lugar, por nível.
  VC.listFor = (loc, L) => VC.TPL.filter(t => t.loc === loc && t.levels.includes(L));
})(window.VC);
