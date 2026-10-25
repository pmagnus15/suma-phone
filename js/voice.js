// Teammates' voices: each one has their own voice and way of talking (speed, pitch, little
// pauses). Uses the computer's (or phone's) built-in voices, preferring the natural-sounding
// ones (Microsoft Edge has many for free). Speaks sentence by sentence so long replies flow and
// never cut off, and skips markdown, emoji and hidden notes.
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
  };
  const FEMALE = ['september', 'sam', 'lyra', 'quinn', 'iris'];
  const DEFAULT = { prefer: ['Andrew', 'Ava', 'Guy', 'Jenny'], rate: 1.0, pitch: 1.0 };
  const isNatural = (v) => /natural|online|neural/i.test(v.name);

  function voices() { return ok ? speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)) : []; }
  // Each teammate gets their own voice: their favorites first, and never the same one as a
  // teammate they work next to if it can be helped.
  const chosen = {};
  function pick(id) {
    if (chosen[id]) return chosen[id];
    const all = voices();
    if (!all.length) return null;
    const p = PEOPLE[id] || DEFAULT;
    for (const name of p.prefer) {
      const v = all.find((x) => x.name.includes(name) && isNatural(x)) || all.find((x) => x.name.includes(name));
      if (v) return (chosen[id] = v);
    }
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
    const parts = plain(text).match(/[^.!?…]+[.!?…]+["')\]]*|[^.!?…]+$/g) || [];
    // Very short bits ride along with the next sentence so it doesn't sound choppy.
    const out = [];
    for (const s of parts.map((x) => x.trim()).filter(Boolean)) {
      if (out.length && out[out.length - 1].length < 25) out[out.length - 1] += ' ' + s; else out.push(s);
    }
    return out;
  }

  let token = 0, volume = 1;
  // Says something in a teammate's voice. Resolves when they're done (or were interrupted).
  function speak(id, text, opts = {}) {
    return new Promise((resolve) => {
      if (!ok) return resolve(false);
      stop();
      const my = ++token;
      const list = sentences(text);
      if (!list.length) return resolve(true);
      const p = PEOPLE[id] || DEFAULT;
      const v = pick(id);
      let i = 0;
      const next = () => {
        if (my !== token) return resolve(false);
        if (i >= list.length) return resolve(true);
        const u = new SpeechSynthesisUtterance(list[i++]);
        if (v) u.voice = v;
        // A touch of life: questions lift a little, exclamations come a bit quicker.
        const s = u.text.trim();
        u.rate = p.rate * (s.endsWith('!') ? 1.04 : 1) * (opts.rate || 1);
        u.pitch = p.pitch * (s.endsWith('?') ? 1.04 : 1);
        u.volume = volume;
        u.onend = () => setTimeout(next, s.endsWith('?') ? 260 : 140);
        u.onerror = () => resolve(false);
        if (opts.onSentence) opts.onSentence(s);
        speechSynthesis.speak(u);
      };
      next();
    });
  }
  function stop() { token++; if (ok) speechSynthesis.cancel(); }
  const speaking = () => ok && speechSynthesis.speaking;
  Suma.voice = { ok, speak, stop, speaking, plain, sentences, setVolume: (v) => { volume = v; }, voiceName: (id) => (pick(id) || {}).name || '' };
})();
