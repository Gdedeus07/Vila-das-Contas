// Vila das Contas — núcleo: utilidades, animações, dados no aparelho e áudio.
window.VC = window.VC || {};
(function (VC) {
  'use strict';

  // ---------- Utilidades ----------
  const U = VC.U = {
    rand: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    pick: arr => arr[Math.floor(Math.random() * arr.length)],
    shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    ease: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeOut: t => 1 - Math.pow(1 - t, 3),
    back: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    $: s => document.querySelector(s),
    show(el, on) { (typeof el === 'string' ? document.querySelector(el) : el).hidden = !on; },
    html(el, h) { (typeof el === 'string' ? document.querySelector(el) : el).innerHTML = h; }
  };

  // ---------- Animações (tweens) ----------
  const tweens = [];
  VC.tween = (dur, fn, ease) => new Promise(res => {
    if (dur <= 0) { fn(1); res(); return; }
    tweens.push({ t: 0, dur, fn, ease: ease || U.ease, res });
  });
  VC.updateTweens = dt => {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i]; tw.t += dt;
      const k = Math.min(1, tw.t / tw.dur);
      try { tw.fn(tw.ease(k)); } catch (e) { console.error(e); }
      if (k >= 1) { tweens.splice(i, 1); tw.res(); }
    }
  };
  VC.wait = ms => new Promise(r => setTimeout(r, ms));

  // Cancela fluxos antigos quando a criança volta para a praça.
  VC.flow = 0;
  VC.CANCEL = { cancel: true };
  VC.guard = id => { if (id !== VC.flow) throw VC.CANCEL; };

  // ---------- Dados (somente no aparelho) ----------
  const KEY = 'vila-das-contas-v1';
  const LOCS = ['padaria', 'feira', 'granja', 'lia', 'onibus'];
  VC.LOCS = LOCS;
  const AVATARS = ['🐶', '🐱', '🐰', '🦊', '🐸', '🐼', '🐵', '🦁', '🐯'];
  function newProfile(i, avatar, nome) {
    const z = () => Object.fromEntries(LOCS.map(l => [l, 0]));
    return {
      id: 'p' + i, avatar, nome,
      levels: Object.fromEntries(LOCS.map(l => [l, 1])),
      done: z(), apoio: z(), okRow: z(), errRow: z(),
      ideias: {}, estrategias: { todos: 0, maior: 0, grupos: 0 },
      estrategiaAdicao: { todos: 0, maior: 0, grupos: 0 },
      erros: { contagem: 0, total: 0, operacao: 0, grupos: 0, outro: 0 },
      figurinhas: {}, festa: false, ultimo: null
    };
  }
  function defaults() {
    return {
      settings: { voz: 1, musica: 0.35, efeitos: 0.8, legendas: true, liberarTudo: false },
      profiles: AVATARS.map((a, i) => newProfile(i, a, 'Criança ' + (i + 1))).concat([newProfile(99, '👥', 'Turma toda')]),
      current: null
    };
  }
  VC.store = {
    data: defaults(),
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const d = JSON.parse(raw), base = defaults();
          d.settings = Object.assign(base.settings, d.settings || {});
          d.profiles = (d.profiles || base.profiles).map((p, i) => Object.assign(newProfile(i, p.avatar, p.nome), p));
          this.data = d;
        }
      } catch (e) { /* sem armazenamento: joga sem salvar */ }
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { } },
    reset() { this.data = defaults(); this.save(); },
    get settings() { return this.data.settings; },
    get profile() { return this.data.profiles.find(p => p.id === this.data.current) || this.data.profiles[0]; }
  };
  VC.store.load();

  // ---------- Voz do Tico (português do Brasil) ----------
  const synth = window.speechSynthesis;
  let voice = null;
  function pickVoice() {
    if (!synth) return;
    const vs = synth.getVoices().filter(v => /pt[-_]BR/i.test(v.lang) || /portugu/i.test(v.name));
    voice = vs.find(v => /francisca|google portugu|luciana|maria|thalita/i.test(v.name)) || vs[0] || null;
  }
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }

  // Números de 1 e 2 concordam com palavras femininas: "duas laranjas".
  function falar(t) {
    return t.replace(/\*\*/g, '')
      .replace(/\b([12])\s+([a-zà-ú]+)/gi, (m, n, w) => /(a|as|ã|ãs)$/i.test(w) && !/^(dia|mapa)s?$/i.test(w) ? (n === '1' ? 'uma ' : 'duas ') + w : m)
      .replace(/×/g, ' vezes ').replace(/÷/g, ' dividido por ').replace(/−/g, ' menos ').replace(/\+/g, ' mais ').replace(/=/g, ' é igual a ')
      .replace(/R\$\s?(\d+)/g, '$1 reais');
  }
  VC.falar = falar;
  const leg = () => document.getElementById('legenda');
  VC.legenda = t => { const el = leg(); if (!el) return; el.innerHTML = VC.store.settings.legendas && t ? t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') : ''; };
  VC.last = '';
  let speakId = 0;

  // say: fala a frase inteira e resolve quando termina (com rede de segurança por tempo).
  VC.say = function (text, opts) {
    opts = opts || {};
    if (!opts.noRepeat) VC.last = text;
    VC.legenda(text);
    const id = ++speakId;
    const vol = VC.store.settings.voz;
    const est = 900 + falar(text).length * 62;
    if (!synth || vol <= 0) return VC.wait(Math.min(est, 4500));
    synth.cancel();
    const parts = (falar(text).match(/[^.!?]+[.!?]*/g) || []).map(s => s.trim()).filter(Boolean);
    return new Promise(res => {
      let i = 0, done = false;
      const finish = () => { if (!done) { done = true; res(); } };
      const safety = setTimeout(finish, est * 1.6 + 1500);
      const next = () => {
        if (id !== speakId) { clearTimeout(safety); finish(); return; }
        if (i >= parts.length) { clearTimeout(safety); finish(); return; }
        const u = new SpeechSynthesisUtterance(parts[i++]);
        u.lang = 'pt-BR'; if (voice) u.voice = voice;
        u.rate = opts.rate || 0.95; u.pitch = opts.pitch || 1.15; u.volume = vol;
        u.onend = next; u.onerror = next;
        synth.speak(u);
      };
      next();
    });
  };
  // Fala curta sem esperar (contagem ao tocar).
  VC.sayQuick = function (text) {
    if (!synth || VC.store.settings.voz <= 0) return;
    speakId++; synth.cancel();
    const u = new SpeechSynthesisUtterance(falar(String(text)));
    u.lang = 'pt-BR'; if (voice) u.voice = voice; u.rate = 1.05; u.pitch = 1.2; u.volume = VC.store.settings.voz;
    synth.speak(u);
  };
  VC.stopVoice = () => { speakId++; if (synth) synth.cancel(); };
  VC.repeat = () => { if (VC.last) VC.say(VC.last, { noRepeat: true }); };

  // ---------- Música calma e efeitos (Web Audio) ----------
  let ac = null, musicGain = null, fxGain = null, musicTimer = null;
  VC.audioStart = function () {
    try {
      if (!ac) {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        musicGain = ac.createGain(); fxGain = ac.createGain();
        musicGain.connect(ac.destination); fxGain.connect(ac.destination);
      }
      if (ac.state === 'suspended') ac.resume();
      VC.applyVolumes();
      if (!musicTimer) startMusic();
    } catch (e) { }
  };
  VC.applyVolumes = () => {
    if (!ac) return;
    musicGain.gain.value = VC.store.settings.musica * 0.16;
    fxGain.gain.value = VC.store.settings.efeitos * 0.5;
  };
  function tone(freq, t0, dur, type, gainNode, peak) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak || 0.5, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(gainNode); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  // Pentatônica em Dó, andamento lento.
  const PENTA = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3];
  const CHORDS = [[130.8, 196, 261.6], [110, 164.8, 220], [146.8, 220, 293.7], [98, 146.8, 196]];
  let beat = 0, festa = false;
  VC.setFestaMusic = on => { festa = on; };
  function startMusic() {
    let next = ac.currentTime + 0.1;
    musicTimer = setInterval(() => {
      if (!ac) return;
      while (next < ac.currentTime + 0.4) {
        const step = festa ? 0.3 : 0.62;
        if (beat % 8 === 0) CHORDS[(beat / 8) % 4].forEach(f => tone(f, next, step * 8, 'triangle', musicGain, 0.18));
        if (Math.random() < (festa ? 0.9 : 0.55)) tone(PENTA[(beat * 3 + (Math.random() * 3 | 0)) % PENTA.length], next, step * 1.6, 'sine', musicGain, 0.35);
        beat++; next += step;
      }
    }, 120);
  }
  VC.sfx = function (name, n) {
    if (!ac || VC.store.settings.efeitos <= 0) return;
    const t = ac.currentTime;
    switch (name) {
      case 'pick': tone(520, t, 0.12, 'sine', fxGain, 0.4); break;
      case 'drop': tone(660, t, 0.1, 'triangle', fxGain, 0.5); tone(880, t + 0.07, 0.14, 'triangle', fxGain, 0.4); break;
      case 'back': tone(400, t, 0.15, 'sine', fxGain, 0.3); break;
      case 'tick': tone(440 * Math.pow(2, Math.min(n || 0, 20) / 12), t, 0.16, 'sine', fxGain, 0.45); break;
      case 'ok': [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.3, 'triangle', fxGain, 0.4)); break;
      case 'soft': tone(392, t, 0.25, 'sine', fxGain, 0.25); break;
      case 'whoosh': { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.5); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6); o.connect(g); g.connect(fxGain); o.start(t); o.stop(t + 0.65); break; }
      case 'sparkle': for (let i = 0; i < 6; i++) tone(1047 + i * 180, t + i * 0.06, 0.2, 'sine', fxGain, 0.25); break;
      case 'crack': tone(1200, t, 0.05, 'square', fxGain, 0.12); tone(900, t + 0.05, 0.05, 'square', fxGain, 0.1); break;
    }
  };

  // ---------- Números em dupla forma (algarismo + pontinhos) ----------
  VC.dots = function (n) {
    let h = '<div class="dots">';
    let left = n;
    while (left > 0) {
      const k = Math.min(10, left); left -= k;
      h += '<div class="frame">' + '<i></i>'.repeat(k) + '</div>';
    }
    return h + '</div>';
  };

  // Figuras simples para o passo "Ver o desenho".
  const SVG = {
    paoq: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="18" rx="13" ry="10" fill="#e9b44c"/><ellipse cx="12" cy="14" rx="4" ry="2" fill="#f6d68c"/></svg>',
    paof: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="17" rx="14" ry="8" fill="#d8994a"/><path d="M9 14l3 5M15 13l3 6M21 13l3 5" stroke="#f3c98a" stroke-width="2.5"/></svg>',
    brig: '<svg viewBox="0 0 32 32"><path d="M7 20h18l-3 9H10z" fill="#e5487a"/><circle cx="16" cy="15" r="9" fill="#4a2a1a"/><g fill="#ffc53d"><rect x="12" y="10" width="3" height="1.6"/><rect x="18" y="13" width="3" height="1.6"/><rect x="13" y="17" width="3" height="1.6"/></g></svg>',
    moeda: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#e0b43a" stroke="#b88a1a" stroke-width="2.5"/><text x="16" y="22" font-size="16" font-weight="800" text-anchor="middle" fill="#7a5a0a" font-family="sans-serif">1</text></svg>',
    figu: '<svg viewBox="0 0 32 32"><rect x="7" y="4" width="18" height="24" rx="3" fill="#2f7fd0"/><path d="M16 9l2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5-3.7-3.4 5-.6z" fill="#ffc53d"/></svg>',
    pata: '<svg viewBox="0 0 32 32"><g stroke="#e08a1e" stroke-width="3.2" stroke-linecap="round"><path d="M16 28V14M16 14L8 6M16 14l8-8M16 14V4"/></g></svg>',
    pessoa: '<svg viewBox="0 0 32 32"><circle cx="16" cy="8" r="5" fill="#8a5a3a"/><rect x="9" y="14" width="14" height="15" rx="6" fill="#2f7fd0"/></svg>'
  };
  const EMO = { laranja: '🍊', banana: '🍌', maca: '🍎', ovo: '🥚', galinha: '🐔', milho: '🌽', balao: '🎈', crianca: '🧒', lapis: '✏️', copo: '🥛', caju: '🍐' };
  VC.fig = function (kind, cls) {
    const inner = SVG[kind] || '<span>' + (EMO[kind] || '●') + '</span>';
    return '<div class="fig ' + (cls || '') + '">' + inner + '</div>';
  };
  VC.ticoFace = '<svg class="tico-face" viewBox="0 0 40 40"><ellipse cx="20" cy="22" rx="16" ry="13" fill="#a48b72"/><path d="M8 18q12-8 24 0M7 23q13-8 26 0M8 28q12-7 24 0" stroke="#7d6550" stroke-width="2.4" fill="none"/><ellipse cx="33" cy="25" rx="6" ry="5" fill="#c9b49b"/><circle cx="34" cy="23" r="1.6" fill="#2b2a4a"/><ellipse cx="29" cy="15" rx="2.4" ry="4" fill="#c9b49b"/></svg>';
})(window.VC);
