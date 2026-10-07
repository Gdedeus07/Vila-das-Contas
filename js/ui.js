// Vila das Contas — telas: jogadores, praça, álbum, Festa da Vila e painel do professor.
(function (VC) {
  'use strict';
  const U = VC.U, W = VC.W, $ = U.$, S = VC.store;
  const UI = VC.UI = {};
  const LOCS = VC.LOCS, LOC = VC.LOC;
  const PIN_H = { padaria: 4.3, feira: 3.3, granja: 4.6, lia: 4.1, onibus: 3.3 };
  const FACES = { padaria: ['👨‍🍳', 'Seu Joaquim'], feira: ['👩‍🌾', 'Dona Rosa'], granja: ['🧑‍🌾', 'Tio Zé'], lia: ['👧', 'Lia'], onibus: ['👩‍✈️', 'Cida'] };
  let mode = 'start';
  const prof = () => S.profile;

  // ---------- Modos de tela ----------
  UI.mode = function (m) {
    mode = m;
    U.show('#start', m === 'start'); U.show('#topbar', m === 'mission');
    U.show('#praca-hud', m === 'praca'); $('#pins').style.display = m === 'praca' ? '' : 'none';
    if (m !== 'mission') VC.legenda('');
    if (m === 'praca') refreshPins();
  };
  UI.toast = function (t) { U.html('#toast', `<div class="big">${t}</div>`); clearTimeout(UI._tt); UI._tt = setTimeout(() => U.html('#toast', ''), 1800); };

  // ---------- Liberação dos lugares ----------
  const unlocked = l => S.settings.liberarTudo || LOCS.indexOf(l) === 0 || prof().done[LOCS[LOCS.indexOf(l) - 1]] > 0;
  const nextLoc = () => LOCS.find(l => unlocked(l) && !prof().done[l]);
  const allDone = () => LOCS.every(l => prof().done[l] > 0);
  function tryOpen(loc) {
    if (mode !== 'praca' || !loc) return;
    VC.audioStart();
    if (!unlocked(loc)) { const n = nextLoc(); VC.say(`${LOC[loc].nome} ainda está fechada. Primeiro, vamos ${n ? 'à ' + LOC[n].nome : 'ajudar os outros'}!`); return; }
    VC.P.start(loc);
  }
  W.onPracaTap = tryOpen;
  W.onTicoTap = () => VC.repeat();

  // ---------- Marcadores na praça ----------
  const pins = {};
  function buildPins() {
    LOCS.forEach(l => {
      const b = document.createElement('button'); b.className = 'pin'; b.setAttribute('aria-label', LOC[l].nome);
      b.innerHTML = `<div class="stars"></div><div class="bubble">${LOC[l].emoji}<span class="lock">🔒</span></div><div class="tail"></div>`;
      b.onclick = () => tryOpen(l); $('#pins').appendChild(b); pins[l] = b;
    });
  }
  function refreshPins() {
    const n = nextLoc();
    LOCS.forEach(l => {
      const b = pins[l], d = prof().done[l] || 0, lock = !unlocked(l);
      b.classList.toggle('locked', lock); b.classList.toggle('next', l === n);
      b.querySelector('.lock').hidden = !lock;
      b.querySelector('.stars').textContent = d ? '⭐'.repeat(Math.min(3, d)) + (d > 3 ? '+' : '') : '';
    });
    U.show('#btn-festa', allDone());
    $('#who').textContent = prof().avatar;
  }
  function updatePins() {
    if (mode !== 'praca') return;
    LOCS.forEach(l => { const p = W.project(LOC[l].b.clone().setY(PIN_H[l])); const b = pins[l]; b.style.left = p.x + 'px'; b.style.top = p.y + 'px'; b.style.visibility = p.behind ? 'hidden' : ''; });
  }

  // ---------- Quem vai jogar ----------
  function renderProfiles() {
    U.html('#profiles', S.data.profiles.map(p => `<button class="prof" data-id="${p.id}" aria-label="${p.nome}">${p.avatar}<small>${p.nome}</small></button>`).join(''));
    document.querySelectorAll('.prof').forEach(b => b.onclick = () => choose(b.dataset.id));
  }
  function choose(id) {
    VC.audioStart();
    S.data.current = id; S.save();
    LOCS.forEach(l => { W.deco[l].scale.setScalar(1); W.deco[l].visible = prof().done[l] > 0; });
    W.setView('praca'); UI.mode('praca');
    const first = LOCS.every(l => !prof().done[l]);
    VC.say(first ? 'Oi! Eu sou o Tico, um tatu-bola. Você é a nova ajudante da Vila das Contas! Toque na padaria para começar.'
      : allDone() && !prof().festa ? 'Oi de novo! A vila está pronta para a festa. Toque no botão da festa!' : 'Oi de novo! Toque em um lugar da vila para ajudar.');
  }
  UI.afterMission = function (loc) {
    refreshPins();
    if (allDone() && !prof().festa) { VC.say('Você ajudou todos os moradores! Toque no botão da festa para comemorar.'); $('#btn-festa').classList.add('pulse'); }
    else { const n = nextLoc(); if (n && n !== loc) VC.say(`Agora a ${LOC[n].nome} está aberta. Toque nela!`); }
  };
  $('#who').onclick = () => { VC.stopVoice(); renderProfiles(); UI.mode('start'); };
  $('#btn-ouvir2').onclick = () => { VC.audioStart(); VC.repeat(); };

  // ---------- Festa da Vila ----------
  $('#btn-festa').onclick = async () => {
    VC.audioStart(); $('#btn-festa').classList.remove('pulse');
    const id = ++VC.flow; UI.mode('festa');
    W.festa(true); W.festaOn = true;
    await W.go('festa', 2);
    const back = document.createElement('button'); back.className = 'big-btn'; back.id = 'festa-sair'; back.textContent = '🏠'; back.setAttribute('aria-label', 'Voltar para a praça');
    back.style.cssText = 'position:fixed;left:16px;top:calc(env(safe-area-inset-top,0px) + 12px);z-index:30';
    document.body.appendChild(back);
    const end = async () => { back.remove(); VC.flow++; VC.stopVoice(); W.festaOn = false; W.festa(false); await W.go('praca'); UI.mode('praca'); };
    back.onclick = end;
    UI.toast('🎉 Festa da Vila!');
    await VC.say('Viva! A Festa da Vila começou! Seu Joaquim, Dona Rosa, Tio Zé, a Lia e a Cida vieram agradecer. Obrigado, ajudante!');
    if (VC.flow !== id) return;
    if (!prof().festa) { prof().festa = true; S.save(); await VC.say('Você ganhou a figurinha do Tico!'); }
  };

  // ---------- Álbum de figurinhas ----------
  $('#btn-album').onclick = () => {
    const p = prof();
    const card = (face, nome, n) => `<div class="sticker ${n ? '' : 'off'}"><div class="face">${face}</div>${nome}<div class="st">${n ? '⭐'.repeat(Math.min(5, n)) : '?'}</div></div>`;
    U.html('#album-body', `<div class="panel-head"><h2>📒 Álbum de figurinhas</h2><button class="go" id="album-close">Voltar ✓</button></div>
      <div class="stickers">${LOCS.map(l => card(FACES[l][0], FACES[l][1], p.figurinhas[l] || 0)).join('')}${card('<span style="display:inline-block;width:72px">' + VC.ticoFace + '</span>', 'Tico', p.festa ? 1 : 0)}</div>`);
    U.show('#album', true);
    $('#album-close').onclick = () => U.show('#album', false);
    VC.say('Seu álbum de figurinhas. Cada missão completa dá uma figurinha do morador.');
  };

  // ---------- Acesso de adulto: segurar dois botões ----------
  let ha = false, hb = false, shift = false, prog = 0, gateT = null;
  const openGate = () => { U.show('#gate', true); prog = 0; tickGate(); };
  ['#btn-adulto', '#btn-adulto2'].forEach(s => $(s).onclick = openGate);
  $('#gate-close').onclick = () => { U.show('#gate', false); clearInterval(gateT); };
  [['#hold-a', v => { ha = v; }], ['#hold-b', v => { hb = v; }]].forEach(([s, set]) => {
    const el = $(s);
    el.addEventListener('pointerdown', e => { set(true); el.classList.add('on'); try { el.setPointerCapture(e.pointerId); } catch (x) { } });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => el.addEventListener(ev, () => { set(false); el.classList.remove('on'); }));
  });
  window.addEventListener('keydown', e => { if (e.key === 'Shift') shift = true; });
  window.addEventListener('keyup', e => { if (e.key === 'Shift') shift = false; });
  function tickGate() {
    clearInterval(gateT);
    gateT = setInterval(() => {
      const ok = (ha && hb) || ((ha || hb) && shift);
      prog = ok ? prog + 0.1 : Math.max(0, prog - 0.2);
      $('#gate-bar i').style.width = Math.min(100, prog / 1.5 * 100) + '%';
      if (prog >= 1.5) { clearInterval(gateT); ha = hb = false; document.querySelectorAll('.hold').forEach(h => h.classList.remove('on')); U.show('#gate', false); openTeacher(); }
    }, 100);
  }

  // ---------- Painel do professor ----------
  const LOC_N = { padaria: 'Padaria', feira: 'Feira', granja: 'Granja', lia: 'Casa da Lia', onibus: 'Ônibus' };
  const ERR = {
    contagem: ['conta um objeto duas vezes ou pula um', 'contagem um a um ainda instável', 'voltar ao nível 1 e contar tampinhas em sala'],
    total: ['não sabe dizer o total depois de contar', 'ainda não entende que o último número é a quantidade', 'brincadeiras de "quantos tem?" com objetos'],
    operacao: ['soma quando era para tirar (ou o contrário)', 'dificuldade em escolher a operação', 'dramatizar a situação com a turma'],
    grupos: ['em grupos iguais, faz grupos de tamanhos diferentes', 'ideia de "igual" ainda frágil', 'usar a caixinha de ovos com vãos marcados']
  };
  const STR_N = { todos: 'contei tudo', maior: 'continuei do maior', grupos: 'fiz grupos' };
  let tab = 'turma', armed = null;
  function active(p) { return LOCS.some(l => p.done[l]) || Object.keys(p.ideias).length; }
  function topErr(p) { const e = Object.entries(p.erros).filter(([k, v]) => ERR[k] && v > 0).sort((a, b) => b[1] - a[1]); return e[0]; }
  function kidCard(p) {
    if (!active(p)) return `<div class="kid"><div class="kid-head"><span class="av">${p.avatar}</span><input id="nome-${p.id}" data-id="${p.id}" class="nome" value="${p.nome}" aria-label="Nome"><span class="chip warn">ainda não jogou</span></div></div>`;
    const locs = LOCS.map(l => `<div class="loc-cell"><b>${LOC_N[l]}</b><span>${p.done[l] || 0} missão(ões)</span>
      <label>Nível <select id="lv-${p.id}-${l}" data-id="${p.id}" data-l="${l}" class="lv">${[1, 2, 3].map(n => `<option ${p.levels[l] === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      ${p.apoio[l] ? '<span class="chip warn">com apoio extra</span>' : ''}</div>`).join('');
    const ideas = Object.entries(p.ideias).map(([k, v]) => { const t = v.ok + v.err || 1, dom = v.ok >= 3 && v.ok / t >= 0.75;
      return `<div class="idea"><span style="min-width:120px">${k}</span><div class="bar"><i style="width:${v.ok / t * 100}%"></i><u style="width:${v.err / t * 100}%"></u></div><span>${v.ok}✓ ${v.err}✗</span>${dom ? '<span class="chip">domina</span>' : ''}</div>`; }).join('') || '<span>Sem registros ainda.</span>';
    const e = topErr(p), notes = [];
    if (e) notes.push(`<b>Erro mais comum:</b> ${ERR[e[0]][0]} (${e[1]}x). Indica: ${ERR[e[0]][1]}. <b>Sugestão:</b> ${ERR[e[0]][2]}.`);
    const ea = p.estrategiaAdicao; if (ea.todos >= 3 && ea.todos > ea.maior) notes.push('<b>Na adição, conta tudo de novo</b> em vez de continuar do maior: estratégia inicial, esperada na idade. <b>Sugestão:</b> "guardar o 5 na cabeça e contar mais".');
    return `<div class="kid"><div class="kid-head"><span class="av">${p.avatar}</span><input id="nome-${p.id}" data-id="${p.id}" class="nome" value="${p.nome}" aria-label="Nome">
      <span class="chip">${LOCS.reduce((s, l) => s + (p.done[l] || 0), 0)} missões</span>${p.festa ? '<span class="chip">foi à festa</span>' : ''}${p.ultimo ? `<small>último jogo: ${p.ultimo.split('-').reverse().join('/')}</small>` : ''}</div>
      <div class="grid-locs">${locs}</div><div><b>Acertos por ideia</b><div class="ideas">${ideas}</div></div>
      <div><b>Como disse que pensou:</b> ${Object.entries(p.estrategias).map(([k, v]) => `${STR_N[k]} ${v}x`).join(' · ')}</div>
      ${notes.map(n => `<div class="note">${n}</div>`).join('')}
      <div><button class="plain danger" data-zera="${p.id}">${armed === 'z' + p.id ? 'Toque de novo para zerar' : 'Zerar dados desta criança'}</button></div></div>`;
  }
  function csv() {
    const L = []; const q = s => '"' + String(s).replace(/"/g, '""') + '"';
    L.push(['Criança'].concat(LOCS.map(l => LOC_N[l] + ' missões'), LOCS.map(l => LOC_N[l] + ' nível'), ['Contei tudo', 'Continuei do maior', 'Fiz grupos', 'Erro mais comum']).map(q).join(';'));
    S.data.profiles.filter(active).forEach(p => { const e = topErr(p); L.push([p.nome].concat(LOCS.map(l => p.done[l] || 0), LOCS.map(l => p.levels[l]), [p.estrategias.todos, p.estrategias.maior, p.estrategias.grupos, e ? ERR[e[0]][0] : '']).map(q).join(';')); });
    L.push(''); L.push(['Criança', 'Ideia', 'Acertos', 'Erros'].map(q).join(';'));
    S.data.profiles.filter(active).forEach(p => Object.entries(p.ideias).forEach(([k, v]) => L.push([p.nome, k, v.ok, v.err].map(q).join(';'))));
    return L.join('\n');
  }
  function renderTeacher() {
    const s = S.settings, inFrame = window.self !== window.top;
    let body = '';
    if (tab === 'turma') {
      const ps = S.data.profiles.slice().sort((a, b) => !!active(b) - !!active(a));
      body = ps.map(kidCard).join('');
    } else if (tab === 'config') {
      const sl = (k, n) => `<div class="set-row"><label for="vol-${k}">${n}</label><input type="range" id="vol-${k}" data-k="${k}" class="vol" min="0" max="1" step="0.05" value="${s[k]}"></div>`;
      body = sl('voz', 'Volume da voz') + sl('musica', 'Volume da música') + sl('efeitos', 'Volume dos efeitos') +
        `<div class="set-row"><label for="cfg-leg">Legendas</label><input type="checkbox" id="cfg-leg" ${s.legendas ? 'checked' : ''}><span>texto do que o Tico fala, para crianças surdas ou para acompanhar em sala</span></div>
         <div class="set-row"><label for="cfg-lib">Liberar todos os lugares</label><input type="checkbox" id="cfg-lib" ${s.liberarTudo ? 'checked' : ''}><span>sem esperar a ordem Padaria → Feira → Granja → Aniversário → Ônibus</span></div>
         <div class="note">O perfil 👥 <b>Turma toda</b> serve para jogar no projetor com a turma, com o professor arrastando os objetos.</div>
         <div class="note">Os dados ficam só neste aparelho. Nada vai para a internet; não há anúncios, compras ou chat.</div>
         <div><button class="plain danger" id="apaga-tudo">${armed === 'all' ? 'Toque de novo para apagar tudo' : 'Apagar todos os dados'}</button></div>`;
    } else {
      body = `<p>Resumo da turma em formato de planilha (separado por ponto e vírgula). Copie e cole no Excel ou no Google Planilhas.</p>
        <textarea id="csv" readonly>${csv()}</textarea>
        <div class="tabs"><button class="plain" id="copy-csv">Copiar planilha</button>
        ${inFrame ? '' : '<a class="plain" id="dl-csv" download="vila-das-contas-turma.csv">Baixar arquivo .csv</a><button class="plain" id="print">Imprimir ou salvar em PDF</button>'}</div>
        <p id="copy-msg"></p>`;
    }
    U.html('#teacher-body', `<div class="panel-head"><h2>Painel do professor</h2><button class="go" id="t-close">Voltar ao jogo</button></div>
      <div class="tabs">${[['turma', 'Turma'], ['config', 'Configurações'], ['export', 'Exportar']].map(([k, n]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${n}</button>`).join('')}</div>${body}`);
    bindTeacher();
  }
  function bindTeacher() {
    $('#t-close').onclick = () => { U.show('#teacher', false); armed = null; renderProfiles(); if (mode === 'praca') refreshPins(); };
    document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; armed = null; renderTeacher(); });
    document.querySelectorAll('.nome').forEach(i => i.onchange = () => { const p = S.data.profiles.find(x => x.id === i.dataset.id); p.nome = i.value.trim().slice(0, 30) || p.nome; S.save(); });
    document.querySelectorAll('.lv').forEach(i => i.onchange = () => { const p = S.data.profiles.find(x => x.id === i.dataset.id); p.levels[i.dataset.l] = +i.value; p.okRow[i.dataset.l] = 0; S.save(); });
    document.querySelectorAll('[data-zera]').forEach(b => b.onclick = () => {
      const id = b.dataset.zera;
      if (armed !== 'z' + id) { armed = 'z' + id; renderTeacher(); return; }
      const i = S.data.profiles.findIndex(x => x.id === id), old = S.data.profiles[i];
      const fresh = JSON.parse(JSON.stringify(S.data.profiles[i])); Object.assign(fresh, { done: {}, apoio: {}, okRow: {}, errRow: {}, ideias: {}, figurinhas: {}, festa: false, ultimo: null, estrategias: { todos: 0, maior: 0, grupos: 0 }, estrategiaAdicao: { todos: 0, maior: 0, grupos: 0 }, erros: { contagem: 0, total: 0, operacao: 0, grupos: 0, outro: 0 } });
      LOCS.forEach(l => { fresh.done[l] = 0; fresh.apoio[l] = 0; fresh.okRow[l] = 0; fresh.errRow[l] = 0; fresh.levels[l] = 1; });
      fresh.nome = old.nome; S.data.profiles[i] = fresh; S.save(); armed = null; renderTeacher();
    });
    document.querySelectorAll('.vol').forEach(i => i.oninput = () => { S.settings[i.dataset.k] = +i.value; VC.applyVolumes(); S.save(); });
    const leg = $('#cfg-leg'); if (leg) leg.onchange = () => { S.settings.legendas = leg.checked; S.save(); };
    const lib = $('#cfg-lib'); if (lib) lib.onchange = () => { S.settings.liberarTudo = lib.checked; S.save(); };
    const all = $('#apaga-tudo'); if (all) all.onclick = () => { if (armed !== 'all') { armed = 'all'; renderTeacher(); return; } S.reset(); armed = null; LOCS.forEach(l => { W.deco[l].visible = false; }); renderTeacher(); };
    const cp = $('#copy-csv'); if (cp) cp.onclick = () => {
      const ta = $('#csv'), msg = $('#copy-msg');
      const fallback = () => { ta.focus(); ta.select(); msg.textContent = 'Texto selecionado. Use Ctrl+C para copiar.'; };
      try { navigator.clipboard.writeText(ta.value).then(() => { msg.textContent = 'Planilha copiada.'; }, fallback); } catch (e) { fallback(); }
    };
    const dl = $('#dl-csv'); if (dl) dl.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('﻿' + csv());
    const pr = $('#print'); if (pr) pr.onclick = () => { tab = 'turma'; renderTeacher(); setTimeout(() => window.print(), 100); };
  }
  function openTeacher() { tab = 'turma'; armed = null; U.show('#teacher', true); renderTeacher(); }

  // ---------- Início ----------
  function boot() {
    if (!window.THREE) { U.html('#loading', 'Não consegui carregar o 3D.<br>Verifique a internet e abra o jogo de novo.'); return; }
    try { W.init(); } catch (e) { console.error(e); U.html('#loading', 'Este aparelho não conseguiu abrir o 3D (WebGL).'); return; }
    buildPins(); renderProfiles(); W.setView('praca'); W.onFrame = updatePins;
    UI.mode('start'); U.show('#loading', false);
  }
  boot();
})(window.VC);
