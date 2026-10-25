// A phone call with a teammate (the desk phone in the office, and the Suma app on the iPhone).
// Looks like an iPhone call: their sprite, a timer, and Mute / Keypad / Speaker / End.
// The teammate says hi, repeats their question, and listens: you answer out loud (or type on
// the keypad). They answer back in their own voice, keep asking if they need more, and hang up
// to get to work once they have what they need. Then the next teammate with a question for you
// comes on the line, until nobody is waiting.
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
  // Little things people say while they think, so the line is never dead quiet.
  const THINK = ['Mm-hm, okay.', 'Got it. One sec.', 'Oh, nice. Let me think.', 'Okay, okay.', 'Love it. Give me a second.', 'Hmm, good one.', 'Right, right.'];
  const STILL = ['Still here, just checking something.', 'Bear with me, almost there.', 'One more second.'];
  const any = (a) => a[Math.floor(Math.random() * a.length)];
  // Words that mean they're not done talking yet.
  const TRAILING = /\b(and|but|so|or|like|um+|uh+|because|cause|then|with|the|a|an|to|maybe|if|that|which|also)\s*$/i;

  // o: { npc, name, face, opening, send(text) -> reply, voicemail, next() -> next caller or null, onEnd }
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
    // Who's on the line right now (the line can pass to the next teammate with a question).
    let cur = { npc: o.npc, name: o.name, face: o.face, send: o.send };
    const showCaller = () => { $('.c-name').textContent = cur.name; $('.c-face').innerHTML = ''; if (cur.face) $('.c-face').appendChild(cur.face); };
    showCaller();
    // A few "mm-hm"s for this call, made ahead of time (after the opening) so they play instantly.
    const fillers = THINK.slice().sort(() => Math.random() - 0.5).slice(0, 3), still = any(STILL);
    const warm = (npc) => { if (Suma.voice.prewarm) Suma.voice.prewarm(npc, fillers.concat([still])); };
    const S = { live: true, muted: false, speaker: true, phase: 'ringing', started: Date.now(), rec: null, heard: '', silence: null, waiter: null, srBroken: false, pending: null };
    const caption = (html) => { $('.c-caption').innerHTML = html; $('.c-caption').scrollTop = 1e6; };
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const clock = setInterval(() => {
      const s = Math.floor((Date.now() - S.started) / 1000);
      const t = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
      $('.c-sub').textContent = S.phase === 'ringing' ? 'calling…' : S.phase === 'transfer' ? 'connecting…' : t + (S.phase === 'thinking' ? ' · thinking…' : S.phase === 'listening' ? (S.muted ? ' · you\'re muted' : ' · listening') : '');
    }, 250);
    const face = (cls) => { $('.c-face').className = 'c-face' + (cls ? ' ' + cls : ''); };

    async function say(text) {
      S.phase = 'talking'; face('talking');
      caption(esc(Suma.voice.plain(text)));
      Suma.voice.setVolume(S.speaker ? 1 : 0.45);
      await Suma.voice.speak(cur.npc, text);
      face('');
    }
    // Listens until they've really finished (a longer pause if they trail off on "and..." or "um"),
    // or they type on the keypad.
    function listen() {
      return new Promise((resolve) => {
        // They already said something while the teammate was talking.
        if (S.pending) { const p = S.pending; S.pending = null; return resolve(p); }
        S.phase = 'listening'; face('listening'); S.heard = '';
        S.waiter = resolve;
        if (!SR || S.srBroken) { $('.c-keypad').classList.add('on'); setKey('keypad', true); return; }
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
        if (!S.heard) return;
        const wait = TRAILING.test(S.heard) ? 3600 : finals.trim() && !interim ? 1800 : 2600;
        S.silence = setTimeout(() => finish(S.heard), wait);
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
      if (!S.waiter) {
        if (S.phase === 'talking' || S.phase === 'thinking') { S.pending = t; caption('<span class="you">' + esc(t) + '</span>'); if (S.phase === 'talking') Suma.voice.stop(); }
        return;
      }
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
    const bye = (t) => /^(bye|goodbye|that'?s all|talk (to you )?later|gotta go|hang up|i'?m done)\b/i.test(t.trim());
    const pause = (ms) => new Promise((r) => setTimeout(r, ms));

    // Their answer, with a quick "mm-hm" right away and a "still here" if it takes a while,
    // so the line never goes dead quiet while they think.
    async function ask(text) {
      S.phase = 'thinking'; face('');
      let done = false, reply = null;
      const p = Promise.resolve().then(() => cur.send(text)).then((r) => { reply = r; }, () => {}).finally(() => { done = true; });
      await pause(350);
      if (!done && S.live) { await Suma.voice.speak(cur.npc, any(fillers)); S.phase = 'thinking'; face(''); }
      const still = setTimeout(() => { if (!done && S.live && S.phase === 'thinking') Suma.voice.speak(cur.npc, still); }, 9000);
      await p;
      clearTimeout(still);
      return reply;
    }
    // The next teammate who has a question for them comes on the line.
    async function nextCaller() {
      const n = o.next && await o.next(cur.npc);
      if (!n || !S.live) return false;
      S.phase = 'transfer'; face('');
      caption('📞 ' + esc(n.name) + ' is on the other line…');
      beep(660, 160); await pause(260); beep(880, 160);
      await pause(700);
      cur = { npc: n.npc, name: n.name, face: n.face, send: n.send };
      showCaller();
      await say(n.opening);
      warm(n.npc);
      return true;
    }

    (async () => {
      await pause(1200); // ringing
      if (!S.live) return;
      S.phase = 'talking'; S.started = Date.now();
      await say(o.opening);
      if (!o.voicemail) warm(cur.npc);
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
        caption('<span class="you">' + esc(heard) + '</span>');
        if (bye(heard)) { await say('Talk soon!'); return hangUp(); }
        const reply = await ask(heard);
        if (!S.live) return;
        if (!reply) { await say("Sorry, I lost you there for a second. Can you say that again?"); continue; }
        await say(reply);
        if (!S.live) return;
        // No more questions: they've got what they need and get to work. Anyone else waiting?
        if (!asks(reply) && !S.pending) {
          await pause(500);
          if (S.pending) continue;
          if (await nextCaller()) continue;
          if (!S.live) return;
          await pause(400);
          return hangUp();
        }
      }
    })();
    function beep(freq = 880, ms = 450) { try { const a = new (window.AudioContext || window.webkitAudioContext)(); const osc = a.createOscillator(); const gain = a.createGain(); gain.gain.value = 0.15; osc.frequency.value = freq; osc.connect(gain); gain.connect(a.destination); osc.start(); setTimeout(() => { osc.stop(); a.close(); }, ms); } catch {} }
    return { hangUp };
  }
  Suma.call = { start, canListen: !!SR };
})();
