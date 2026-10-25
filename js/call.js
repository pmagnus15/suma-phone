// A phone call with a teammate (the desk phone in the office, and the Suma app on the iPhone).
// Looks like an iPhone call: their sprite, a timer, and Mute / Keypad / Speaker / End.
// The teammate says hi, repeats their question, and listens: you answer out loud (or type on
// the keypad). They answer back in their own voice, keep asking if they need more, and hang up
// to get to work once they have what they need.
window.Suma = window.Suma || {};

(function () {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const css = `
  #suma-call { position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; color: #fff; font-family: -apple-system, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
    background: radial-gradient(120% 80% at 50% 0%, #4a3a7a 0%, #241a3e 45%, #0e0a18 100%); padding: calc(36px + env(safe-area-inset-top)) 20px calc(34px + env(safe-area-inset-bottom)); }
  #suma-call .c-name { font-size: 34px; font-weight: 400; letter-spacing: .3px; margin-top: 18px; text-align: center; }
  #suma-call .c-sub { font-size: 17px; color: rgba(255,255,255,.72); margin-top: 6px; text-align: center; }
  #suma-call .c-face { margin-top: 26px; width: 150px; height: 150px; border-radius: 50%; background: radial-gradient(#fffaf0, #e8dcc0); display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 0 0 6px rgba(255,255,255,.08); transition: box-shadow .2s; }
  #suma-call .c-face.talking { box-shadow: 0 0 0 6px rgba(120,220,140,.55), 0 0 40px rgba(120,220,140,.35); }
  #suma-call .c-face.listening { box-shadow: 0 0 0 6px rgba(120,180,255,.55), 0 0 40px rgba(120,180,255,.35); }
  #suma-call .c-face canvas { image-rendering: pixelated; width: 96px; height: 120px; margin-top: 18px; }
  #suma-call .c-caption { margin-top: 22px; max-width: 560px; width: 100%; min-height: 96px; max-height: 30vh; overflow-y: auto; text-align: center; font-size: 18px; line-height: 1.4; color: rgba(255,255,255,.92); }
  #suma-call .c-caption .you { color: #9fd0ff; }
  #suma-call .c-keypad { display: none; width: 100%; max-width: 560px; gap: 8px; margin-top: 10px; }
  #suma-call .c-keypad.on { display: flex; }
  #suma-call .c-keypad input { flex: 1; font-size: 17px; border-radius: 22px; border: none; padding: 11px 16px; color: #1a1a24; }
  #suma-call .c-keypad button { border: none; border-radius: 22px; padding: 0 18px; font-size: 16px; background: #34c759; color: #fff; }
  #suma-call .c-grid { margin-top: auto; display: grid; grid-template-columns: repeat(3, 78px); gap: 22px 34px; justify-content: center; }
  #suma-call .c-btn { display: flex; flex-direction: column; align-items: center; gap: 7px; background: none; border: none; color: #fff; font-size: 13px; cursor: pointer; }
  #suma-call .c-btn span { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; font-size: 28px; backdrop-filter: blur(10px); }
  #suma-call .c-btn.on span { background: #fff; color: #1a1a24; }
  #suma-call .c-end { margin-top: 28px; width: 76px; height: 76px; border-radius: 50%; border: none; background: #ff3b30; color: #fff; font-size: 32px; cursor: pointer; box-shadow: 0 6px 18px rgba(255,59,48,.4); }
  #suma-call .c-end span { display: inline-block; transform: rotate(135deg); }`;
  let styled = false;

  function start(o) {
    if (document.getElementById('suma-call')) return;
    if (!styled) { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); styled = true; }
    const el = document.createElement('div');
    el.id = 'suma-call';
    el.innerHTML = '<div class="c-name"></div><div class="c-sub">calling…</div><div class="c-face"></div><div class="c-caption"></div>' +
      '<div class="c-keypad"><input placeholder="Type your answer…" enterkeyhint="send"><button>Send</button></div>' +
      '<div class="c-grid"><button class="c-btn" data-b="mute"><span>🎙️</span>mute</button><button class="c-btn" data-b="keypad"><span>⌨️</span>keypad</button><button class="c-btn on" data-b="speaker"><span>🔊</span>speaker</button></div>' +
      '<button class="c-end" title="End call"><span>📞</span></button>';
    document.body.appendChild(el);
    const $ = (s) => el.querySelector(s);
    $('.c-name').textContent = o.name;
    if (o.face) $('.c-face').appendChild(o.face);
    const S = { live: true, muted: false, speaker: true, phase: 'ringing', started: Date.now(), rec: null, heard: '', silence: null, waiter: null };
    const caption = (html) => { $('.c-caption').innerHTML = html; $('.c-caption').scrollTop = 1e6; };
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const clock = setInterval(() => {
      const s = Math.floor((Date.now() - S.started) / 1000);
      const t = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      $('.c-sub').textContent = S.phase === 'ringing' ? 'calling…' : t + (S.phase === 'thinking' ? ' · thinking…' : S.phase === 'listening' ? (S.muted ? ' · you\'re muted' : ' · listening') : '');
    }, 250);
    const face = (cls) => { $('.c-face').className = 'c-face' + (cls ? ' ' + cls : ''); };

    async function say(text) {
      S.phase = 'talking'; face('talking');
      const words = Suma.voice.plain(text);
      caption(esc(words));
      if (!S.speaker) Suma.voice.setVolume(0.45); else Suma.voice.setVolume(1);
      await Suma.voice.speak(o.npc, text);
      face('');
    }
    // Listens until they've stopped talking for a moment (or they type on the keypad).
    function listen() {
      return new Promise((resolve) => {
        // They already said something while the teammate was talking.
        if (S.pending) { const p = S.pending; S.pending = null; return resolve(p); }
        S.phase = 'listening'; face('listening'); S.heard = '';
        S.waiter = resolve;
        if (!SR) { $('.c-keypad').classList.add('on'); setKey('keypad', true); return; }
        if (!S.muted) startRec();
      });
    }
    function startRec() {
      if (!SR || S.rec || S.srBroken || !S.live || S.phase !== 'listening') return;
      const rec = new SR(); S.rec = rec;
      rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true;
      let finals = '';
      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finals += e.results[i][0].transcript + ' '; else interim += e.results[i][0].transcript;
        }
        S.heard = (finals + interim).trim();
        caption('<span class="you">' + esc(S.heard) + '</span>');
        clearTimeout(S.silence);
        if (S.heard) S.silence = setTimeout(() => finish(S.heard), finals.trim() && !interim ? 1300 : 2200);
      };
      rec.onend = () => { S.rec = null; if (S.live && S.phase === 'listening' && !S.muted) setTimeout(startRec, 200); };
      rec.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        // Listening doesn't work here (no microphone, or no speech service): type on the keypad instead.
        S.srBroken = true;
        caption(e.error === 'not-allowed' ? 'Your microphone is blocked. Use the keypad to type your answer (or allow the microphone).' : "I can't hear you on this device. Use the keypad to type your answer.");
        $('.c-keypad').classList.add('on'); setKey('keypad', true);
      };
      try { rec.start(); } catch { S.rec = null; }
    }
    function stopRec() { clearTimeout(S.silence); if (S.rec) { const r = S.rec; S.rec = null; try { r.abort(); } catch {} } }
    function finish(text) {
      const t = String(text || '').trim();
      if (!t) return;
      // Typed while the teammate was still talking: they stop and listen, like on a real call.
      if (!S.waiter) { if (S.phase === 'talking') { S.pending = t; caption('<span class="you">' + esc(t) + '</span>'); Suma.voice.stop(); } return; }
      stopRec();
      const w = S.waiter; S.waiter = null;
      w(t);
    }
    const setKey = (b, on) => el.querySelector('[data-b="' + b + '"]').classList.toggle('on', on);
    el.querySelector('[data-b="mute"]').onclick = () => {
      S.muted = !S.muted; setKey('mute', S.muted);
      if (S.muted) stopRec(); else startRec();
    };
    el.querySelector('[data-b="keypad"]').onclick = () => { const on = !$('.c-keypad').classList.contains('on'); $('.c-keypad').classList.toggle('on', on); setKey('keypad', on); if (on) $('.c-keypad input').focus(); };
    el.querySelector('[data-b="speaker"]').onclick = () => { S.speaker = !S.speaker; setKey('speaker', S.speaker); Suma.voice.setVolume(S.speaker ? 1 : 0.45); };
    const typed = () => { const v = $('.c-keypad input').value.trim(); if (!v) return; $('.c-keypad input').value = ''; finish(v); };
    $('.c-keypad button').onclick = typed;
    $('.c-keypad input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); typed(); } });
    const hangUp = () => {
      if (!S.live) return;
      S.live = false; stopRec(); Suma.voice.stop(); clearInterval(clock);
      if (S.waiter) { const w = S.waiter; S.waiter = null; w(null); }
      $('.c-sub').textContent = 'call ended';
      setTimeout(() => el.remove(), 700);
      if (o.onEnd) o.onEnd();
    };
    $('.c-end').onclick = hangUp;
    const asks = (t) => /\?/.test(Suma.voice.plain(t)) || /\[\[\s*(ask|choices)\s*:/i.test(t);
    const bye = (t) => /^(bye|goodbye|that'?s all|talk (to you )?later|gotta go|hang up)\b/i.test(t.trim());

    (async () => {
      await new Promise((r) => setTimeout(r, 1200)); // ringing
      if (!S.live) return;
      S.phase = 'talking'; S.started = Date.now();
      await say(o.opening);
      if (o.voicemail) {
        beep();
        const msg = await listen();
        if (!S.live) return;
        if (msg) { await o.send(msg); await say('Got it, thanks! It goes to the team as soon as the office opens.'); }
        return hangUp();
      }
      while (S.live) {
        const heard = await listen();
        if (!S.live || heard === null) return;
        caption('<span class="you">' + esc(heard) + '</span>');
        if (bye(heard)) { await say('Talk soon!'); return hangUp(); }
        S.phase = 'thinking'; face('');
        let reply = null;
        try { reply = await o.send(heard); } catch {}
        if (!S.live) return;
        if (!reply) { await say("Sorry, I lost you there for a second. Can you say that again?"); continue; }
        await say(reply);
        if (!S.live) return;
        // No more questions: they've got what they need, and get to work.
        if (!asks(reply) && !S.pending) { await new Promise((r) => setTimeout(r, 900)); if (!S.pending) return hangUp(); }
      }
    })();
    function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(); const osc = a.createOscillator(); osc.frequency.value = 880; osc.connect(a.destination); osc.start(); setTimeout(() => { osc.stop(); a.close(); }, 450); } catch {} }
    return { hangUp };
  }
  Suma.call = { start, canListen: !!SR };
})();
