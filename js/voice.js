// Teammates' voices: each one has their own voice and way of talking. Uses the computer's (or
// phone's) built-in voices, strongly preferring the natural-sounding neural ones (Microsoft Edge has
// dozens for free; iPhones have "Enhanced" and "Premium" ones). Natural voices are never pitch-shifted
// (that's what makes them sound robotic), and replies are spoken in whole phrases of a few sentences
// so they flow like someone talking. Skips markdown, emoji and hidden notes.
window.Suma = window.Suma || {};

(function () {
  const ok = 'speechSynthesis' in window;
  // prefer: natural voices by name (first found wins); rate/pitch: their way of talking.
  const PEOPLE = {
    phil: { prefer: ['AndrewMultilingual', 'Andrew', 'Guy', 'Christopher'], rate: 1.06, pitch: 1.04 },
    wang: { prefer: ['Roger', 'Brian', 'Davis', 'Eric'], rate: 0.93, pitch: 0.88 },
    september: { prefer: ['AvaMultilingual', 'Ava', 'Aria', 'Jenny'], rate: 1.0, pitch: 1.02 },
    ralph: { prefer: ['William', 'Steffan', 'Christopher'], rate: 0.9, pitch: 0.96 },
    duncan: { prefer: ['Guy', 'Eric', 'Andrew'], rate: 1.13, pitch: 1.06 },
    edward: { prefer: ['Ryan', 'Thomas', 'Brian'], rate: 0.97, pitch: 0.96 },
    alex: { prefer: ['Christopher', 'Steffan', 'Guy'], rate: 1.04, pitch: 1.0 },
    sam: { prefer: ['EmmaMultilingual', 'Emma', 'Michelle', 'Jenny'], rate: 1.07, pitch: 1.06 },
    riley: { prefer: ['Steffan', 'Liam', 'Eric'], rate: 1.02, pitch: 1.0 },
    lyra: { prefer: ['Sonia', 'Libby', 'Natasha', 'Ava'], rate: 0.96, pitch: 1.02 },
    marco: { prefer: ['Eric', 'Guy', 'Andrew'], rate: 1.1, pitch: 1.02 },
    nico: { prefer: ['BrianMultilingual', 'Brian', 'Connor', 'Christopher'], rate: 1.0, pitch: 0.97 },
    quinn: { prefer: ['Jenny', 'Michelle', 'Clara', 'Emma'], rate: 1.08, pitch: 1.08 },
    iris: { prefer: ['Michelle', 'Libby', 'Aria', 'Emma'], rate: 1.04, pitch: 1.05 },
    vince: { prefer: ['Connor', 'Liam', 'Thomas', 'Roger'], rate: 1.0, pitch: 0.94 },
    zoe: { prefer: ['Aria', 'Molly', 'Emily', 'Jenny'], rate: 1.08, pitch: 1.06 },
    leo: { prefer: ['Mitchell', 'Liam', 'Steffan', 'Eric'], rate: 1.02, pitch: 1.0 },
  };
  const FEMALE = ['september', 'sam', 'lyra', 'quinn', 'iris', 'zoe'];
  const DEFAULT = { prefer: ['Andrew', 'Ava', 'Guy', 'Jenny'], rate: 1.0, pitch: 1.0 };
  const isNatural = (v) => /natural|online|neural|enhanced|premium/i.test(v.name);

  function voices() { return ok ? speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)) : []; }
  // Each teammate gets their own voice: their natural-sounding favorites first, and not one a
  // teammate already uses if it can be helped.
  const chosen = {};
  function pick(id) {
    if (chosen[id]) return chosen[id];
    const all = voices();
    if (!all.length) return null;
    const p = PEOPLE[id] || DEFAULT;
    const used = new Set(Object.entries(chosen).filter(([k]) => k !== id).map(([, v]) => v && v.name));
    for (const free of [true, false]) {
      for (const name of p.prefer) {
        const v = all.find((x) => x.name.includes(name) && isNatural(x) && (!free || !used.has(x.name)));
        if (v) return (chosen[id] = v);
      }
    }
    for (const name of p.prefer) { const v = all.find((x) => x.name.includes(name)); if (v) return (chosen[id] = v); }
    // No favorite here (e.g. only the basic Windows voices): one of the same kind (lower or higher voice).
    const FEM = /zira|hazel|susan|linda|heather|eva|catherine|ava|aria|jenny|emma|michelle|sonia|libby|natasha|clara|emily|ana\b|maisie|molly|leah|luna|neerja|samantha|karen|moira|tessa|fiona|victoria|serena|female/i;
    const fem = FEMALE.includes(id);
    const kind = all.filter((v) => FEM.test(v.name) === fem);
    const nat = (kind.length ? kind : all).filter(isNatural);
    const pool = nat.length ? nat : kind.length ? kind : all;
    let h = 7; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 997;
    return (chosen[id] = pool[h % pool.length]);
  }
  if (ok) speechSynthesis.onvoiceschanged = () => { for (const k of Object.keys(chosen)) delete chosen[k]; };

  // What gets said: plain words, no markers, links, code or emoji; lists become sentences.
  function plain(text) {
    return String(text || '')
      .replace(/\[\[note\]\][\s\S]*?(\[\[\/note\]\]|$)/gi, ' ')
      .replace(/\[\[\s*ask\s*:\s*([^\]]*)\]\]/gi, ' $1 ')
      .replace(/\[\[[\s\S]*?\]\]/g, ' ')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/^\s*[-*•]\s+(.*)$/gm, '$1.')
      .replace(/^\s*\d+[.)]\s+(.*)$/gm, '$1.')
      .replace(/[*_#>|]/g, '')
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
      .replace(/\s*—\s*/g, ', ').replace(/\.{3,}/g, '… ')
      .replace(/([.!?])\.+/g, '$1')
      .replace(/\s+/g, ' ').replace(/\s+([.,!?;:])/g, '$1').trim();
  }
  function sentences(text) {
    return (plain(text).match(/[^.!?…]+[.!?…]+["')\]]*|[^.!?…]+$/g) || []).map((x) => x.trim()).filter(Boolean);
  }
  // Whole phrases of a few sentences: the voice keeps its rhythm inside a phrase, so it sounds like
  // someone talking instead of a list being read out. A question always ends its phrase.
  function phrases(text, max) {
    const out = [];
    for (const s of sentences(text)) {
      const last = out[out.length - 1];
      if (last && last.length + s.length < max && !/\?["')\]]*$/.test(last)) out[out.length - 1] = last + ' ' + s; else out.push(s);
    }
    return out;
  }

  let token = 0, volume = 1, audio = null;

  // Lifelike voices (Kokoro) made by the office on this computer, when it has them running.
  // Anywhere else (or while it's still getting ready) the computer's own voices are used.
  let lifelike = false;
  async function checkLifelike() {
    try { const r = await fetch('/api/tts/status', { cache: 'no-store' }); lifelike = r.ok && !!(await r.json()).ready; } catch { lifelike = false; }
    if (!lifelike) setTimeout(checkLifelike, 20000);
  }
  if (/^https?:$/.test(location.protocol) && !/github\.io$/.test(location.hostname)) checkLifelike();
  // One phrase as audio, or null (then the computer's voice says it).
  function fetchPhrase(id, text) {
    return fetch('/api/tts?npc=' + encodeURIComponent(id) + '&t=' + encodeURIComponent(text))
      .then((r) => (r.status === 200 ? r.blob() : null)).catch(() => null);
  }
  function playBlob(blob, my) {
    return new Promise((resolve) => {
      if (my !== token) return resolve(false);
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      audio = a; a.volume = volume;
      const done = (v) => { URL.revokeObjectURL(url); if (audio === a) audio = null; resolve(v); };
      a.onended = () => done(true); a.onerror = () => done(false); a.onpause = () => { if (my !== token) done(false); };
      a.play().catch(() => done(false));
    });
  }
  // Lifelike: the first sentence goes on its own so they start talking right away; while one
  // phrase plays, the next one is already being made.
  async function speakLifelike(id, text, opts, my) {
    const s = sentences(text);
    if (!s.length) return true;
    const list = [s[0]].concat(phrases(s.slice(1).join(' '), 200));
    const jobs = [];
    const get = (i) => (jobs[i] = jobs[i] || (i < list.length ? fetchPhrase(id, list[i]) : null));
    get(0); get(1);
    for (let i = 0; i < list.length; i++) {
      const blob = await get(i);
      get(i + 1);
      if (my !== token) return false;
      if (opts.onSentence) opts.onSentence(list[i]);
      // Not available after all: the computer's voice says the rest.
      if (!blob) { lifelike = false; setTimeout(checkLifelike, 20000); return speakDevice(id, list.slice(i).join(' '), opts, my); }
      if (!(await playBlob(blob, my))) return false;
    }
    return true;
  }
  // Says something in a teammate's voice. Resolves when they're done (or were interrupted).
  function speak(id, text, opts = {}) {
    stop();
    const my = ++token;
    if (lifelike && !opts.device) return speakLifelike(id, text, opts, my);
    return speakDevice(id, text, opts, my);
  }
  function speakDevice(id, text, opts, my) {
    return new Promise((resolve) => {
      if (!ok) return resolve(false);
      const p = PEOPLE[id] || DEFAULT;
      const v = pick(id);
      const natural = !!(v && isNatural(v));
      const list = phrases(text, natural ? 240 : 140);
      if (!list.length) return resolve(true);
      let i = 0;
      const next = () => {
        if (my !== token) return resolve(false);
        if (i >= list.length) return resolve(true);
        const u = new SpeechSynthesisUtterance(list[i++]);
        if (v) u.voice = v;
        // Natural voices already sound like people: keep their own pitch, and only nudge the pace
        // (a little quicker than the default, like people chatting). The basic voices get a little
        // personality from pitch and speed.
        const s = u.text.trim();
        u.rate = (natural ? 1.1 * (1 + (p.rate - 1) * 0.6) : 1.06 * p.rate * (s.endsWith('!') ? 1.04 : 1)) * (opts.rate || 1);
        u.pitch = natural ? 1 : p.pitch;
        u.volume = volume;
        u.onend = () => setTimeout(next, s.endsWith('?') ? 120 : 40);
        u.onerror = () => resolve(false);
        if (opts.onSentence) opts.onSentence(s);
        speechSynthesis.speak(u);
      };
      next();
    });
  }
  function stop() { token++; if (ok) speechSynthesis.cancel(); if (audio) { try { audio.pause(); } catch {} audio = null; } }
  const speaking = () => !!audio || (ok && speechSynthesis.speaking);
  // Is this teammate using a natural-sounding voice on this device?
  const natural = (id) => { if (lifelike) return true; const v = pick(id); return !!(v && isNatural(v)); };
  // Gets short lines ready ahead of time (the "mm-hm"s on a call), so they play instantly.
  const prewarm = (id, lines) => { if (lifelike) lines.forEach((t) => fetchPhrase(id, plain(t))); };
  Suma.voice = { ok: ok || /^https?:$/.test(location.protocol), prewarm, speak, stop, speaking, plain, sentences, phrases, natural, lifelike: () => lifelike, setVolume: (v) => { volume = v; if (audio) audio.volume = v; }, voiceName: (id) => (lifelike ? 'Lifelike voice' : (pick(id) || {}).name || '') };
})();
