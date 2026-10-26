// A phone call with a teammate (the desk phone in the office, and the Suma app on the iPhone).
// It reads like a message thread: the recent conversation for context at the top, then the call as
// it happens, bubble by bubble (you on the right, them on the left), with tap-to-answer choices
// and a box to type in. In the office it floats in a corner so the game keeps going behind it; on
// a phone it fills the screen. The teammate starts talking as soon as their first sentence is
// written, listens for your answer (or you type), and hangs up to get to work once they have what
// they need. Then the next teammate with a question comes on the line, until nobody is waiting.
window.Suma = window.Suma || {};

(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const css = `
  #suma-call { position: fixed; right: 16px; bottom: 16px; z-index: 9999; width: min(420px, calc(100vw - 32px)); height: min(640px, calc(100vh - 32px)); display: flex; flex-direction: column;
    background: rgba(250,250,252,.97); color: #1c1c1e; border-radius: 22px; box-shadow: 0 18px 50px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.06); overflow: hidden;
    font-family: -apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif; animation: c-in .22s ease-out; }
  @keyframes c-in { from { transform: translateY(24px); opacity: 0; } }
  #suma-call.min { height: auto; }
  #suma-call.min .c-log, #suma-call.min .c-chips, #suma-call.min .c-bar { display: none; }
  @media (max-width: 600px) { #suma-call { inset: 0; right: 0; bottom: 0; width: 100%; height: 100%; border-radius: 0; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); } }
  #suma-call .c-head { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(240,240,245,.95); border-bottom: 1px solid rgba(0,0,0,.08); cursor: default; }
  #suma-call .c-face { width: 42px; height: 42px; border-radius: 50%; background: radial-gradient(#fffaf0, #e8dcc0); display: flex; align-items: flex-start; justify-content: center; overflow: hidden; flex: none; transition: box-shadow .2s; }
  #suma-call .c-face canvas { image-rendering: pixelated; width: 34px; height: 42px; margin-top: 6px; }
  #suma-call .c-face.talking { box-shadow: 0 0 0 3px #34c759; }
  #suma-call .c-face.listening { box-shadow: 0 0 0 3px #0a84ff; }
  #suma-call .c-who { flex: 1; min-width: 0; }
  #suma-call .c-name { font-size: 16px; font-weight: 600; }
  #suma-call .c-sub { font-size: 13px; color: #6e6e73; }
  #suma-call .c-hb { width: 34px; height: 34px; border-radius: 50%; border: none; background: rgba(0,0,0,.07); font-size: 16px; cursor: pointer; flex: none; }
  #suma-call .c-hb.on { background: #1c1c1e; color: #fff; }
  #suma-call .c-end { height: 34px; padding: 0 14px; border-radius: 17px; border: none; background: #ff3b30; color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; flex: none; }
  #suma-call .c-log { flex: 1; overflow-y: auto; padding: 12px 12px 6px; display: flex; flex-direction: column; gap: 4px; }
  #suma-call .b { max-width: 80%; padding: 8px 12px; border-radius: 18px; font-size: 15px; line-height: 1.35; white-space: pre-wrap; word-wrap: break-word; }
  #suma-call .b.them { align-self: flex-start; background: #e9e9eb; color: #1c1c1e; border-bottom-left-radius: 6px; }
  #suma-call .b.me { align-self: flex-end; background: #0a84ff; color: #fff; border-bottom-right-radius: 6px; }
  #suma-call .b.old { opacity: .6; }
  #suma-call .b.live { opacity: .7; font-style: italic; }
  #suma-call .b.dots::after { content: '•••'; letter-spacing: 2px; animation: c-dots 1s infinite; }
  @keyframes c-dots { 50% { opacity: .3; } }
  #suma-call .c-sep { align-self: center; font-size: 12px; color: #8e8e93; margin: 8px 0 4px; }
  #suma-call .c-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 6px; justify-content: flex-end; }
  #suma-call .c-chips button { font: inherit; font-size: 14px; padding: 6px 12px; border-radius: 16px; border: 1.5px solid #0a84ff; background: #fff; color: #0a84ff; cursor: pointer; }
  #suma-call .c-bar { display: flex; align-items: center; gap: 8px; padding: 8px 10px 10px; border-top: 1px solid rgba(0,0,0,.08); }
  #suma-call .c-mic { width: 34px; height: 34px; border-radius: 50%; border: none; background: rgba(0,0,0,.07); font-size: 16px; cursor: pointer; flex: none; }
  #suma-call .c-mic.listening { background: #0a84ff; color: #fff; animation: c-pulse 1.2s infinite; }
  @keyframes c-pulse { 50% { box-shadow: 0 0 0 6px rgba(10,132,255,.2); } }
  #suma-call .c-bar input { flex: 1; min-width: 0; font: inherit; font-size: 15px; border: 1px solid rgba(0,0,0,.15); border-radius: 18px; padding: 8px 14px; background: #fff; color: #1c1c1e; outline: none; }
  #suma-call .c-send { width: 34px; height: 34px; border-radius: 50%; border: none; background: #0a84ff; color: #fff; font-size: 16px; cursor: pointer; flex: none; }`;
  let styled = false;
  // Little things people say while they think, so the line is never dead quiet.
  const THINK = ['Mm-hm, okay.', 'Got it.', 'Oh, nice.', 'Okay, okay.', 'Love it.', 'Hmm, good one.', 'Right, right.'];
  const STILL = ['Still here, just checking something.', 'Bear with me, almost there.', 'One more second.'];
  const any = (a) => a[Math.floor(Math.random() * a.length)];
  // Words that mean they're not done talking yet.
  const TRAILING = /\b(and|but|so|or|like|um+|uh+|because|cause|then|with|the|a|an|to|maybe|if|that|which|also)\s*$/i;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // What gets read out (and shown) of a reply that may still be coming in: everything before the
  // first [[...]] marker (choices, notes), as plain words.
  const spoken = (t) => Suma.voice.plain(String(t || '').split('[[')[0]).replace(/\b(Mr|Mrs|Ms|Dr|St)\. /g, '$1 ').trim();
  const choicesOf = (t) => { const m = /\[\[\s*choices\s*:\s*([^\]]+)\]\]/i.exec(t || ''); return m ? m[1].split('|').map((x) => x.trim()).filter(Boolean).slice(0, 5) : []; };

  // o: { npc, name, face, opening, history: [{ role, text }], choices, send(text, onText) -> reply,
  //      voicemail, next() -> next caller or null, openChat(npc), onEnd }
  function start(o) {
    if (document.getElementById('suma-call')) return;
    if (!styled) { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); styled = true; }
    const el = document.createElement('div');
    el.id = 'suma-call';
    el.innerHTML = '<div class="c-head"><div class="c-face"></div><div class="c-who"><div class="c-name"></div><div class="c-sub">calling…</div></div>' +
      '<button class="c-hb" data-b="speaker" title="Speaker">🔊</button><button class="c-hb" data-b="min" title="Make it small">▾</button><button class="c-end">End</button></div>' +
      '<div class="c-log"></div><div class="c-chips"></div>' +
      '<div class="c-bar"><button class="c-mic" title="Mute / unmute your microphone">🎙️</button><input placeholder="Talk, or type here…" enterkeyhint="send"><button class="c-send" title="Send">↑</button></div>';
    document.body.appendChild(el);
    const $ = (s) => el.querySelector(s);
    const log = $('.c-log');
    // Who's on the line right now (the line can pass to the next teammate with a question).
    let cur = { npc: o.npc, name: o.name, face: o.face, send: o.send };
    const showCaller = () => { $('.c-name').textContent = cur.name; $('.c-face').innerHTML = ''; if (cur.face) $('.c-face').appendChild(cur.face); };
    showCaller();
    const S = { live: true, muted: false, speaker: true, phase: 'ringing', started: Date.now(), rec: null, heard: '', silence: null, waiter: null, srBroken: false, pending: null, cut: 0 };
    const near = () => log.scrollHeight - log.scrollTop - log.clientHeight < 80;
    const scroll = (force) => { if (force || near()) log.scrollTop = log.scrollHeight; };
    function bubble(who, text, cls = '') {
      const b = document.createElement('div');
      b.className = 'b ' + who + (cls ? ' ' + cls : '');
      b.textContent = text;
      log.appendChild(b); scroll(true);
      return b;
    }
    const sep = (text) => { const d = document.createElement('div'); d.className = 'c-sep'; d.textContent = text; log.appendChild(d); scroll(true); };
    // The recent conversation, for context.
    const context = (hist) => (hist || []).filter((m) => m.role === 'npc' || m.role === 'user').slice(-6).forEach((m) => { const t = spoken(m.text); if (t) bubble(m.role === 'user' ? 'me' : 'them', t.length > 400 ? t.slice(0, 400) + '…' : t, 'old'); });
    context(o.history);
    sep('📞 ' + (o.voicemail ? 'Voicemail' : 'Call') + ' · ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    // Hands-free, like a real call: they talk, you talk, they answer when you pause. No buttons needed.
    if (SR) sep(o.voicemail ? 'Talk after the beep. It sends when you stop.' : 'Just talk, like a normal call. ' + o.name + ' answers when you pause.');
    const chips = (list) => {
      const box = $('.c-chips'); box.innerHTML = '';
      (list || []).forEach((c) => { const b = document.createElement('button'); b.textContent = c; b.onclick = () => { box.innerHTML = ''; finish(c); }; box.appendChild(b); });
      scroll(true); // the choices take room: keep the newest message in view
    };
    const clock = setInterval(() => {
      const s = Math.floor((Date.now() - S.started) / 1000);
      const t = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      $('.c-sub').textContent = S.phase === 'ringing' ? 'calling…' : S.phase === 'transfer' ? 'connecting…' : t + (S.phase === 'thinking' ? ' · thinking…' : S.phase === 'talking' ? ' · talking' : S.phase === 'listening' ? (S.muted ? ' · you\'re muted' : SR && !S.srBroken ? ' · listening' : ' · your turn') : '');
    }, 250);
    const face = (cls) => { $('.c-face').className = 'c-face' + (cls ? ' ' + cls : ''); };

    // Speaks a reply as it's being written: each sentence as soon as it's complete (made ahead of
    // time while the one before plays), the rest when the reply is done.
    function speaker(npc) {
      let done = 0, chain = Promise.resolve();
      const queue = (s) => {
        if (Suma.voice.prewarm) Suma.voice.prewarm(npc, [s]);
        chain = chain.then(() => { if (!S.live || S.cut) return; S.phase = 'talking'; face('talking'); Suma.voice.setVolume(S.speaker ? 1 : 0.45); return Suma.voice.speak(npc, s); });
      };
      return {
        feed(text, final) {
          const words = spoken(text);
          const rest = words.slice(done);
          const re = /[^.!?]*[.!?]+["')\]]*\s+/g;
          let m, upto = 0;
          while ((m = re.exec(rest))) upto = re.lastIndex;
          if (final) upto = rest.length;
          const piece = rest.slice(0, upto).trim();
          if (piece) { Suma.voice.sentences ? Suma.voice.sentences(piece).forEach(queue) : queue(piece); }
          done += upto;
        },
        lead(p) { chain = chain.then(() => p); },
        idle: () => chain,
      };
    }
    async function say(text) {
      S.cut = 0;
      const b = bubble('them', spoken(text));
      chips(choicesOf(text));
      const sp = speaker(cur.npc); sp.feed(text, true);
      await sp.idle();
      face('');
      return b;
    }
    // Listens until they've really finished (a longer pause if they trail off on "and..." or "um"),
    // or they type, or tap a choice.
    function listen() {
      return new Promise((resolve) => {
        if (S.pending) { const p = S.pending; S.pending = null; return resolve(p); }
        S.phase = 'listening'; face('listening'); S.heard = '';
        S.waiter = resolve;
        if (!SR || S.srBroken) { $('.c-bar input').focus(); return; }
        if (!S.muted) startRec();
      });
    }
    let liveBubble = null;
    function startRec() {
      if (!SR || S.rec || S.srBroken || !S.live || S.phase !== 'listening') return;
      const rec = new SR(); S.rec = rec;
      rec.lang = navigator.language || 'en-US'; rec.interimResults = true; rec.continuous = true;
      let finals = '';
      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finals += e.results[i][0].transcript + ' '; else interim += e.results[i][0].transcript;
        }
        S.heard = (finals + interim).trim();
        if (S.heard) { if (!liveBubble) liveBubble = bubble('me', '', 'live'); liveBubble.textContent = S.heard; scroll(); }
        clearTimeout(S.silence);
        if (!S.heard) return;
        // A natural pause ends their turn (longer if they trail off mid-thought).
        const wait = TRAILING.test(S.heard) ? 2800 : finals.trim() && !interim ? 1100 : 1700;
        S.silence = setTimeout(() => finish(S.heard), wait);
      };
      rec.onend = () => { S.rec = null; if (S.live && S.phase === 'listening' && !S.muted) setTimeout(startRec, 150); };
      rec.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        S.srBroken = true;
        sep(e.error === 'not-allowed' ? '🎙️ The microphone is blocked here, so type your answers below.' : '🎙️ Talking doesn\'t work on this device, so type your answers below.');
        $('.c-mic').disabled = true; $('.c-bar input').focus();
      };
      try { rec.start(); } catch { S.rec = null; }
      micState();
    }
    function stopRec() { clearTimeout(S.silence); if (S.rec) { const r = S.rec; S.rec = null; try { r.abort(); } catch {} } micState(); }
    const micState = () => { $('.c-mic').classList.toggle('listening', !!S.rec && !S.muted); $('.c-mic').textContent = S.muted ? '🔇' : '🎙️'; };
    function finish(text) {
      const t = String(text || '').trim();
      if (!t) return;
      chips([]);
      if (liveBubble) { liveBubble.classList.remove('live'); liveBubble.textContent = t; liveBubble = null; } else bubble('me', t);
      // Said or typed while the teammate was still talking or thinking: they stop and listen.
      if (!S.waiter) {
        if (S.phase === 'talking' || S.phase === 'thinking') { S.pending = t; S.cut = 1; Suma.voice.stop(); }
        return;
      }
      stopRec();
      const w = S.waiter; S.waiter = null;
      w(t);
    }
    $('.c-mic').onclick = () => { S.muted = !S.muted; if (S.muted) stopRec(); else startRec(); micState(); };
    el.querySelector('[data-b="speaker"]').onclick = (e) => { S.speaker = !S.speaker; e.currentTarget.classList.toggle('on', !S.speaker); e.currentTarget.textContent = S.speaker ? '🔊' : '🔈'; Suma.voice.setVolume(S.speaker ? 1 : 0.45); };
    el.querySelector('[data-b="min"]').onclick = (e) => { const m = el.classList.toggle('min'); e.currentTarget.textContent = m ? '▴' : '▾'; if (!m) scroll(true); };
    const input = $('.c-bar input');
    const typed = () => { const v = input.value.trim(); if (!v) return; input.value = ''; finish(v); };
    $('.c-send').onclick = typed;
    input.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); typed(); } });
    input.addEventListener('keyup', (e) => e.stopPropagation());
    let ended = false;
    const hangUp = (why) => {
      if (!S.live) return;
      S.live = false; stopRec(); Suma.voice.stop(); clearInterval(clock);
      if (S.waiter) { const w = S.waiter; S.waiter = null; w(null); }
      ended = true;
      const s = Math.floor((Date.now() - S.started) / 1000);
      $('.c-sub').textContent = 'call ended · ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
      face('');
      $('.c-bar').innerHTML = '';
      chips([]);
      // The call stays on screen for a moment (with a way to keep going in the chat), then gets out of the way.
      if (o.openChat && why !== 'user') {
        const b = document.createElement('button'); b.className = 'c-end'; b.style.background = '#0a84ff'; b.style.margin = '0 auto'; b.textContent = 'Keep going in the chat';
        b.onclick = () => { el.remove(); o.openChat(cur.npc); };
        $('.c-bar').appendChild(b);
      }
      setTimeout(() => el.remove(), why === 'user' ? 300 : 6000);
      if (o.onEnd) o.onEnd();
    };
    $('.c-end').onclick = () => { if (ended) el.remove(); else hangUp('user'); };
    const asks = (t) => /\?/.test(spoken(t)) || /\[\[\s*(ask|choices)\s*:/i.test(t);
    const bye = (t) => /^(bye|goodbye|that'?s all|talk (to you )?later|gotta go|hang up|i'?m done)\b/i.test(t.trim());
    const pause = (ms) => new Promise((r) => setTimeout(r, ms));

    // Their answer, spoken as it's written: a quick "mm-hm" only if nothing has come in yet, and a
    // "still here" if it takes a while, so the line never goes dead.
    async function ask(text) {
      S.phase = 'thinking'; face(''); S.cut = 0;
      const b = bubble('them', '', 'dots');
      const sp = speaker(cur.npc);
      let got = false, reply = null;
      const onText = (t) => {
        const w = spoken(t);
        if (!w) return;
        if (!got) { got = true; b.classList.remove('dots'); }
        b.textContent = w; scroll();
        sp.feed(t, false);
      };
      const filler = setTimeout(() => { if (!got && S.live && S.phase === 'thinking') sp.lead(Suma.voice.speak(cur.npc, any(THINK))); }, 900);
      const still = setTimeout(() => { if (!got && S.live && S.phase === 'thinking') sp.lead(Suma.voice.speak(cur.npc, any(STILL))); }, 9000);
      try { reply = await cur.send(text, onText); } catch { reply = null; }
      clearTimeout(filler); clearTimeout(still);
      if (reply) { b.classList.remove('dots'); b.textContent = spoken(reply); sp.feed(reply, true); chips(choicesOf(reply)); } else b.remove();
      await sp.idle();
      face('');
      return reply;
    }
    // The next teammate who has a question for them comes on the line.
    async function nextCaller() {
      const n = o.next && await o.next(cur.npc);
      if (!n || !S.live) return false;
      S.phase = 'transfer'; face('');
      beep(660, 160); await pause(260); beep(880, 160);
      cur = { npc: n.npc, name: n.name, face: n.face, send: n.send };
      showCaller();
      sep('📞 ' + n.name + ' is on the line');
      context(n.history);
      await say(n.opening);
      return true;
    }

    (async () => {
      await pause(700); // ringing
      if (!S.live) return;
      S.phase = 'talking'; S.started = Date.now();
      await say(o.opening);
      if (o.choices && o.choices.length && !choicesOf(o.opening).length) chips(o.choices);
      if (o.voicemail) {
        beep(880, 450);
        const msg = await listen();
        if (!S.live) return;
        if (msg) { await o.send(msg); await say('Got it, thanks! It goes to the team as soon as the office opens.'); }
        return hangUp();
      }
      while (S.live) {
        const heard = await listen();
        if (!S.live || heard === null) return;
        if (bye(heard)) { await say('Talk soon!'); return hangUp(); }
        const reply = await ask(heard);
        if (!S.live) return;
        if (S.pending) continue; // they cut in: answer that next
        if (!reply) { await say("Sorry, I lost you there for a second. Can you say that again?"); continue; }
        // No more questions: they've got what they need and get to work. Anyone else waiting?
        if (!asks(reply)) {
          await pause(400);
          if (S.pending) continue;
          if (await nextCaller()) continue;
          if (!S.live) return;
          return hangUp();
        }
      }
    })();
    function beep(freq = 880, ms = 450) { try { const a = new (window.AudioContext || window.webkitAudioContext)(); const osc = a.createOscillator(); const gain = a.createGain(); gain.gain.value = 0.15; osc.frequency.value = freq; osc.connect(gain); gain.connect(a.destination); osc.start(); setTimeout(() => { osc.stop(); a.close(); }, ms); } catch {} }
    return { hangUp };
  }
  Suma.call = { start, canListen: !!SR };
})();
