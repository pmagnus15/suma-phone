// The office: map layout, who sits where, and how the room is drawn.
window.Suma = window.Suma || {};

(function () {
  const T = 16, W = 20, H = 15;
  const { shade, makeCanvas } = Suma.sprites;

  // ------------------------------------------------------------ the team
  const NPCS = {
    phil: {
      name: 'Phil', role: 'Lead Designer', color: '#e07a2f',
      x: 10, y: 4, dir: 'down', computer: { x: 9, y: 5 },
      look: { skin: '#f2c8a0', hair: '#7a4a2a', hairStyle: 'spiky', shirt: '#e0663a', pants: '#4a5272', extras: ['labcoat', 'smile', 'pen', 'blush'] },
      greeting: (n) => `Hey hey, ${n}! Phil here — Lead Designer. My favorite thing in the world is hearing about the game in somebody's head. So... tell me about yours! Even if it's just a feeling or a game it reminds you of.`,
      starters: ['I have an idea for a game!', "I'm not sure yet — help me brainstorm", 'Ask me questions about my game'],
    },
    wang: {
      name: 'Mr. Wang', role: 'Producer & Planner', color: '#b03a48',
      x: 7, y: 2, dir: 'down', computer: { x: 8, y: 3 }, laptop: true,
      look: { skin: '#eac39a', hair: '#b8b8c0', hairStyle: 'receding', shirt: '#f0ece0', pants: '#3a3a4a', accent: '#8a2f3a', extras: ['glasses', 'mustache', 'vest', 'watch'] },
      greeting: (n) => `Ah, ${n}! Welcome, welcome. I am Mr. Wang — I make the plan, I watch the time, I watch the money. Phil dream big, I make dream fit in schedule. Chalkboard next to me, that is our plan. What you need?`,
      starters: ['Make a plan from my ideas', "What's next on the board?", 'Install the game engine', 'How do we get on Steam?'],
    },
    september: {
      name: 'September', role: 'Code Reviewer & Bug Fixer', color: '#7d5bc4',
      x: 2, y: 7, dir: 'down', computer: { x: 3, y: 8 },
      look: { skin: '#f6d2b8', hair: '#a8402e', hairStyle: 'long', shirt: '#6a4fb0', pants: '#33344a', band: '#f0c040', extras: ['clip', 'glasses', 'earrings'] },
      greeting: (n) => `Hi ${n}, I'm September. If anything in the game feels broken, weird, or just *off* — I'm your detective. Tell me what happened like you'd tell a friend. Screenshots help too: you can paste or drag them right into this box.`,
      starters: ['Something in my game is broken', 'Can you check the code for bugs?', 'Something looks weird (screenshot)'],
    },
    ralph: {
      name: 'Ralph', role: 'Game Tester', color: '#2fa39a',
      x: 15, y: 12, dir: 'down', computer: { x: 15, y: 11 }, tv: true,
      look: { skin: '#d9a070', hair: '#e8c45a', hairStyle: 'shaggy', shirt: '#f08a30', pants: '#2a8a96', accent: '#ffe066', band: '#e04848', sleepy: true, extras: ['hawaiian', 'headband', 'stubble'] },
      greeting: (n) => `Duuude, ${n}! Ralph. I test the games, bro. Like, I've played basically everything on Steam, so I know what makes players go "whoa" and what makes 'em hit refund. Wanna know what the gamers out there are gonna think?`,
      starters: ['Playtest the game!', 'What would Steam players think?', 'What games are like mine?'],
    },
    duncan: {
      name: 'Duncan', role: 'Developer', color: '#d64545',
      x: 13, y: 7, dir: 'down', computer: { x: 14, y: 8 },
      look: { skin: '#c98e62', hair: '#1e1c26', hairStyle: 'spiky', shirt: '#c83a3a', pants: '#2e3a52', accent: '#f0c040', extras: ['headphones', 'smile', 'hoodie', 'wristband'] },
      greeting: (n) => `Yo ${n}! Duncan — I build stuff. Fast. Edward over there makes sure it doesn't explode. Tell me what to make, or hit the chalkboard and we'll grab the next task!`,
      starters: ['Work on the next task', 'Build something for me', 'What did you build last?'],
    },
    edward: {
      name: 'Edward', role: 'Developer', color: '#3a6ec8',
      x: 17, y: 7, dir: 'down', computer: { x: 16, y: 8 },
      look: { skin: '#f0cfae', hair: '#5a3a22', hairStyle: 'neat', shirt: '#9cc4f0', pants: '#3a3f55', accent: '#28407a', extras: ['tie', 'glasses', 'collar', 'pen'] },
      greeting: (n) => `Hello, ${n}. Edward. I build things properly, and I check Duncan's work so the game keeps working tomorrow too. What would you like built?`,
      starters: ['Work on the next task', 'Is the game in good shape?', 'Build something for me'],
    },
    alex: {
      name: 'Alex', role: 'Developer · Gameplay & AI', color: '#3a9a5a',
      x: 3, y: 11, dir: 'down', computer: { x: 4, y: 12 },
      look: { skin: '#8d5a3b', hair: '#1a1a22', hairStyle: 'short', shirt: '#e8e4d8', pants: '#2a2a34', accent: '#3a8a52', extras: ['glasses', 'smile', 'jacket'] },
      greeting: (n) => `Hey ${n}! Alex here. I build the gameplay: weapons, enemies, bots, the rules that make it fun. What should I make?`,
      starters: ['What are you working on?', 'Build something for me', 'How do the bots work?'],
    },
    sam: {
      name: 'Sam', role: 'Developer · UI & Audio', color: '#c0a020',
      x: 14, y: 4, dir: 'down', computer: { x: 15, y: 5 },
      look: { skin: '#f6d2b8', hair: '#9a5ad8', hairStyle: 'long', shirt: '#f0c040', pants: '#3a3f55', band: '#ff6ab0', extras: ['clip', 'smile', 'earrings', 'freckles'] },
      greeting: (n) => `Hi ${n}! I'm Sam. Menus, the HUD, settings, sounds and music: everything you see on screen and hear. What should it feel like?`,
      starters: ['What are you working on?', 'Make the menus look awesome', 'Add sounds and music'],
    },
    riley: {
      name: 'Riley', role: 'Developer · World & Tech Art', color: '#2aa0a8',
      x: 4, y: 5, dir: 'down', computer: { x: 5, y: 6 },
      look: { skin: '#e8b890', hair: '#d0602a', hairStyle: 'neat', shirt: '#2aa0a8', pants: '#2a2a34', accent: '#2a5a8a', extras: ['headphones', 'beanie'] },
      greeting: (n) => `Yo ${n}, Riley. I build the world: maps, levels, lighting, effects, and keeping it all running smooth. Where are we dropping in?`,
      starters: ['What are you working on?', 'Build the map', 'Make it look more realistic'],
    },
    lyra: {
      name: 'Lyra', role: 'Story Director', color: '#a04a9a',
      x: 3, y: 3, dir: 'down', computer: { x: 4, y: 4 },
      look: { skin: '#b07850', hair: '#2a1830', hairStyle: 'long', shirt: '#8a3a7a', pants: '#2e2a40', band: '#40c0a0', extras: ['glasses', 'smile', 'scarf', 'earrings', 'book'] },
      greeting: (n) => `Oh, ${n}, hi! I'm Lyra, the Story Director. Every great game has a reason to fight: a hero, a villain, a moment that gives you chills. I keep our story straight, even the twisty ones with lots of routes. What's the story in your head?`,
      starters: ["Let's build the story", 'Plan a campaign with choices', 'Show me the Story Map', 'Who is the villain?'],
    },
    marco: {
      name: 'Marco', role: 'Market Researcher', color: '#2f8f7a',
      x: 17, y: 10, dir: 'down', computer: { x: 18, y: 11 },
      look: { skin: '#c08a5a', hair: '#2a2018', hairStyle: 'short', shirt: '#2f8f7a', pants: '#2a2f45', accent: '#2a3a6a', extras: ['jacket', 'smile', 'stubble', 'pen'] },
      greeting: (n) => `${n}! Marco, Market Research. I keep an eye on what's blowing up on Steam, Fortnite and Roblox right now. Want some ideas that could actually hit, and how long they'd take us to build?`,
      starters: ["What's popular right now?", 'Give me game ideas that could hit', 'How long would my game take?', 'Is my idea a good bet?'],
    },
    quinn: {
      name: 'Quinn', role: 'QA Engineer', color: '#d0603a',
      x: 6, y: 12, dir: 'down', computer: { x: 7, y: 13 },
      look: { skin: '#e8b890', hair: '#c8502a', hairStyle: 'long', shirt: '#f0f0f0', pants: '#3a3f55', accent: '#3ad06a', extras: ['glasses', 'smile', 'labcoat', 'pen', 'freckles'] },
      greeting: (n) => `Hi ${n}! Quinn, QA Engineer. I break the game on purpose, so you don't have to find the bugs yourself. Every time the team finishes something, the office checks it, and my tests make that check smart. Want to know how solid the game is right now?`,
      starters: ['Is the game working right now?', 'Test everything!', 'What could break?', 'Found a bug'],
    },
    nico: {
      name: 'Nico', role: 'Network Engineer', color: '#4a7ae0',
      x: 11, y: 12, dir: 'down', computer: { x: 12, y: 13 },
      look: { skin: '#d8a878', hair: '#2a2440', hairStyle: 'shaggy', shirt: '#3a4a7a', pants: '#24283a', accent: '#5ad0ff', extras: ['headphones', 'hoodie', 'glasses', 'wristband'] },
      greeting: (n) => `Ping check, ${n}! Nico, Network Engineer. I make the game multiplayer: squads, lobbies, servers, and making sure every shot feels fair. I also make it so you and your boss can play the game together while we build it. What kind of matches are you dreaming of?`,
      starters: ['Make my game multiplayer', 'How many players per match?', 'Can we play it together?', 'Why does it lag?'],
    },
  };

  const PLAYER_LOOK = { skin: '#f0c8a0', hair: '#2a1e18', hairStyle: 'short', shirt: '#3a7ad8', pants: '#34405e', band: '#d83a3a', extras: ['cap'] };

  // ------------------------------------------------------------ map
  // ------------------------------------------------------------ the layout (rearranged by the player)
  // Every desk (with its teammate and computer) and every movable prop can be moved. The layout
  // stores how far each one moved from its usual spot: { desks: { id: {dx, dy} }, props: { id: {dx, dy} | null } }
  // (null = in the storage closet). Each game has its own.
  const DESK_OF = {
    phil: [9, 5, 3], wang: [7, 3, 2], september: [2, 8, 2], duncan: [13, 8, 2], edward: [16, 8, 2],
    alex: [3, 12, 2], sam: [14, 5, 2], riley: [4, 6, 2], lyra: [3, 4, 2], marco: [17, 11, 2],
    nico: [11, 13, 2], quinn: [6, 13, 2],
    me: [12, 3, 2], // the player's own desk: reports tray + desk phone
  };
  const BASE = Object.fromEntries(Object.entries(NPCS).map(([id, n]) => [id, { x: n.x, y: n.y, cx: n.computer.x, cy: n.computer.y }]));
  // Props that can move: tiles = where they stand by default; solid = you walk around them;
  // placed = in the office from the start (newer prizes start in the storage closet).
  const PROPS = {
    plant1: { name: 'Potted plant', icon: '🪴', tiles: [[1, 2]], solid: true, placed: true },
    plant2: { name: 'Potted plant', icon: '🪴', tiles: [[1, 13]], solid: true, placed: true },
    plant3: { name: 'Potted plant', icon: '🪴', tiles: [[18, 13]], solid: true, placed: true },
    plant4: { name: 'Potted plant', icon: '🪴', tiles: [[12, 2]], solid: true, placed: true },
    beanbags: { name: 'Beanbags', icon: '🛋️', tiles: [[13, 13], [14, 13]], solid: false, placed: true },
    fridge: { name: 'Mini fridge', icon: '🧊', tiles: [[17, 5]], solid: true, placed: true },
    vending: { name: 'Vending machine', icon: '🥤', tiles: [[1, 10]], solid: true, placed: true },
    popcorn: { name: 'Popcorn machine', icon: '🍿', tiles: [[13, 12]], solid: true, placed: true },
    pinball: { name: 'Pinball machine', icon: '🕹️', tiles: [[16, 4]], solid: true, placed: true },
    aquarium: { name: 'Aquarium', icon: '🐠', tiles: [[5, 9]], solid: true, placed: true },
    statue: { name: 'Golden statue', icon: '🗿', tiles: [[12, 12]], solid: true, placed: true },
    throne: { name: 'Royal throne', icon: '👑', tiles: [[11, 3]], solid: true, placed: true },
  };
  let LAYOUT = { desks: {}, props: {} };
  const listeners = [];
  const deskOffset = (id) => { const o = LAYOUT.desks[id]; return o ? [o.dx || 0, o.dy || 0] : [0, 0]; };
  // Where a prop is moved to ([dx, dy]), or null when it's in the storage closet.
  function propOffset(id) {
    const v = LAYOUT.props[id];
    if (v === null) return null;
    if (v === undefined) return PROPS[id] && PROPS[id].placed ? [0, 0] : null;
    return [v.dx || 0, v.dy || 0];
  }
  // The tiles something covers right now (or would cover with offset [dx, dy]).
  function deskTiles(id, off = deskOffset(id)) {
    const [x, y, w] = DESK_OF[id];
    const t = []; for (let i = 0; i < w; i++) t.push([x + i + off[0], y + off[1]]);
    if (BASE[id]) t.push([BASE[id].x + off[0], BASE[id].y + off[1]]); // where the teammate stands
    return t;
  }
  function propTiles(id, off = propOffset(id)) { return off && PROPS[id] ? PROPS[id].tiles.map(([x, y]) => [x + off[0], y + off[1]]) : []; }

  // Solid tiles: walls, furniture, NPCs. Interactables keyed by "x,y".
  const solid = new Set();
  const things = {}; // "x,y" -> { kind, ... }
  const key = (x, y) => x + ',' + y;
  const block = (x, y, thing) => { solid.add(key(x, y)); if (thing) things[key(x, y)] = thing; };
  function buildMap() {
    solid.clear();
    for (const k of Object.keys(things)) delete things[k];
    for (let x = 0; x < W; x++) { block(x, 0); block(x, 1); block(x, H - 1); }
    for (let y = 0; y < H; y++) { block(0, y); block(W - 1, y); }

    for (let x = 1; x <= 5; x++) things[key(x, 1)] = { kind: 'board' };
    for (let x = 10; x <= 14; x++) things[key(x, 1)] = { kind: 'shelf' };
    things[key(8, 1)] = { kind: 'window' }; things[key(16, 1)] = { kind: 'window' };
    things[key(9, 14)] = { kind: 'door' }; things[key(10, 14)] = { kind: 'door' };

    for (const id of Object.keys(DESK_OF)) {
      const [x, y, w] = DESK_OF[id], [dx, dy] = deskOffset(id);
      for (let i = 0; i < w; i++) block(x + i + dx, y + dy, { kind: 'desk', desk: id });
    }
    // Teammates move with their desks.
    for (const [id, b] of Object.entries(BASE)) {
      const n = NPCS[id], [dx, dy] = DESK_OF[id] ? deskOffset(id) : [0, 0];
      n.x = b.x + dx; n.y = b.y + dy; n.computer = { x: b.cx + dx, y: b.cy + dy };
    }

    block(18, 2, { kind: 'arcade' }); block(18, 3, { kind: 'arcade' });
    block(18, 6, { kind: 'rack' }); block(18, 7, { kind: 'rack' });
    block(15, 11, { kind: 'tv' }); block(16, 11, { kind: 'tv' });
    block(17, 12, { kind: 'snacks' });
    block(15, 2, { kind: 'cooler' });
    block(1, 8, { kind: 'cabinet' });
    block(1, 5, { kind: 'closet' }); // the storage closet: earned props, and "arrange the office"
    block(2, 3, { kind: 'story' }); // Lyra's story board: opens the Story Map
    const [mx, my] = deskOffset('me');
    block(12 + mx, 3 + my, { kind: 'reports', desk: 'me' }); // the player's desk: the reports tray...
    block(13 + mx, 3 + my, { kind: 'phone', desk: 'me' }); // ...and the desk phone
    ['plant1', 'plant2', 'plant3', 'plant4'].forEach((id) => propTiles(id).forEach(([x, y]) => block(x, y, { kind: 'plant', prop: id })));

    for (const [id, n] of Object.entries(NPCS)) block(n.x, n.y, { kind: 'npc', id });
  }
  // Uses a new layout (from the save, or while arranging) and tells the office to redraw.
  function applyLayout(layout) {
    LAYOUT = { desks: { ...((layout && layout.desks) || {}) }, props: { ...((layout && layout.props) || {}) } };
    buildMap();
    listeners.forEach((f) => { try { f(LAYOUT); } catch (e) { console.error(e); } });
  }
  const registerProps = (defs) => Object.assign(PROPS, defs);
  buildMap();

  const isSolid = (x, y) => solid.has(key(x, y));
  const thingAt = (x, y) => things[key(x, y)] || null;

  // ------------------------------------------------------------ background (static)
  function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  function drawBackground() {
    const c = makeCanvas(W * T, H * T);
    const g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const rand = rng(42);

    // wooden floor
    for (let ty = 2; ty < H - 1; ty++) for (let tx = 1; tx < W - 1; tx++) {
      const x = tx * T, y = ty * T;
      R(x, y, T, T, '#e2bf8a');
      for (let r = 0; r < 4; r++) {
        R(x, y + r * 4 + 3, T, 1, '#c9a06a');
        R(x, y + r * 4, T, 1, '#ebcd9c');
        const seam = ((tx * 7 + ty * 3 + r * 5) % 16);
        R(x + seam, y + r * 4, 1, 3, '#cfa874');
      }
      if (rand() < 0.15) R(x + Math.floor(rand() * 14), y + Math.floor(rand() * 4) * 4 + 1, 2, 1, '#d6b07b');
    }

    // rug
    const rx = 6 * T + 8, ry = 8 * T + 4, rw = 6 * T, rh = 4 * T - 8;
    R(rx, ry, rw, rh, '#a83a44'); R(rx + 3, ry + 3, rw - 6, rh - 6, '#f0c860'); R(rx + 5, ry + 5, rw - 10, rh - 10, '#b84450');
    for (let i = 0; i < rw - 14; i += 8) { R(rx + 7 + i, ry + 8, 4, 4, '#d86a5a'); R(rx + 7 + i, ry + rh - 12, 4, 4, '#d86a5a'); }
    R(rx + rw / 2 - 10, ry + rh / 2 - 6, 20, 12, '#f0c860'); R(rx + rw / 2 - 7, ry + rh / 2 - 3, 14, 6, '#b84450');

    // top wall
    R(0, 0, W * T, 2 * T, '#f3e7cb');
    for (let x = 0; x < W * T; x += 6) R(x, 4, 1, 22, '#ece0c0');
    R(0, 0, W * T, 4, '#8a6244'); R(0, 4, W * T, 1, '#6e4c34');
    R(0, 2 * T - 6, W * T, 6, '#b48658'); R(0, 2 * T - 6, W * T, 1, '#d0a274'); R(0, 2 * T - 1, W * T, 1, '#6e4c34');

    // side walls
    for (const sx of [0, (W - 1) * T]) {
      R(sx, 0, T, H * T, '#b48658');
      for (let y = 0; y < H * T; y += 8) R(sx, y, T, 1, '#9c7048');
      R(sx + (sx ? 0 : T - 2), 0, 2, H * T, '#7a5636');
    }
    // bottom wall
    R(0, (H - 1) * T, W * T, T, '#8a6244'); R(0, (H - 1) * T, W * T, 2, '#6e4c34');
    // door + mat
    R(9 * T, (H - 1) * T, 2 * T, T, '#3a2a22'); R(9 * T + 2, (H - 1) * T + 2, 2 * T - 4, T - 2, '#4e3a2e');
    R(9 * T + 2, (H - 2) * T + 6, 2 * T - 4, 10, '#c84a3a');
    for (let i = 0; i < 2 * T - 8; i += 4) R(9 * T + 4 + i, (H - 2) * T + 8, 2, 6, '#e8a050');

    // windows
    for (const wx of [8, 16]) {
      const x = wx * T + 1, y = 6;
      R(x, y, 14, 18, '#ffffff'); R(x + 1, y + 1, 12, 16, '#8fd0f0');
      R(x + 1, y + 11, 12, 6, '#a8e0a0'); R(x + 1, y + 13, 12, 4, '#78c070');
      R(x + 7, y + 1, 1, 16, '#ffffff'); R(x + 1, y + 8, 12, 1, '#ffffff');
      R(x + 2, y + 2, 2, 1, '#ffffff'); R(x + 3, y + 3, 1, 1, '#ffffff');
      R(x - 1, y + 18, 16, 2, '#d0a274');
    }

    // bookshelves
    const bx = 10 * T, bw = 5 * T;
    R(bx, 2, bw, 2 * T - 2, '#7a4c2c'); R(bx + 2, 4, bw - 4, 2 * T - 6, '#5a3820');
    const bookCols = ['#d84a4a', '#4a7ad8', '#e8c04a', '#4ab07a', '#9a5ad8', '#e88a3a', '#3ab0c0', '#f0f0e0'];
    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = 5 + shelf * 9;
      let x = bx + 3;
      while (x < bx + bw - 4) {
        const bwid = 2 + Math.floor(rand() * 2), bh = 5 + Math.floor(rand() * 3);
        const col = bookCols[Math.floor(rand() * bookCols.length)];
        R(x, sy + 8 - bh, bwid, bh, col); R(x, sy + 8 - bh, 1, bh, shade(col, 1.2));
        x += bwid + (rand() < 0.15 ? 2 : 0);
      }
      R(bx + 2, sy + 8, bw - 4, 1, '#9a6a40');
    }

    // chalkboard frame (contents drawn live)
    R(T - 2 + 4, 4, 5 * T - 4, 2 * T - 8, '#8b5a2b');
    R(T + 4, 6, 5 * T - 8, 2 * T - 13, '#2f5d46');
    R(T + 2, 2 * T - 6, 5 * T - 4, 3, '#a8703a');
    R(T + 12, 2 * T - 7, 4, 1, '#ffffff'); R(T + 20, 2 * T - 7, 3, 1, '#f0d060');

    // desks (wherever they've been moved)
    Object.keys(DESK_OF).forEach((id) => {
      const [bx0, by0, w] = DESK_OF[id], [ox, oy] = deskOffset(id), dx = bx0 + ox, dy = by0 + oy;
      const x = dx * T, y = dy * T, ww = w * T;
      R(x, y + 2, ww, 12, '#8a5a33');
      R(x, y + 2, ww, 5, '#c48d5c'); R(x, y + 2, ww, 1, '#dcaa78'); R(x, y + 7, ww, 1, '#6a4224');
      for (let i = 0; i < w; i++) { R(x + i * T + 4, y + 9, 8, 1, '#6a4224'); R(x + i * T + 7, y + 10, 2, 1, '#e0c080'); }
      R(x + 1, y + 14, 2, 2, '#5a3a20'); R(x + ww - 3, y + 14, 2, 2, '#5a3a20');
    });
    // papers & mug on Phil's desk, sketches
    { const [ox, oy] = deskOffset('phil'), a = ox * T, b = oy * T;
      R(11 * T + 2 + a, 5 * T + 3 + b, 8, 3, '#ffffff'); R(11 * T + 4 + a, 5 * T + 2 + b, 7, 3, '#f8f0d8'); R(11 * T + 5 + a, 5 * T + 3 + b, 4, 1, '#88a0d0');
      R(10 * T + 4 + a, 5 * T + 3 + b, 3, 3, '#e05050'); R(10 * T + 7 + a, 5 * T + 4 + b, 1, 1, '#e05050'); }
    // bug jar on September's desk
    { const [ox, oy] = deskOffset('september'), a = ox * T, b = oy * T;
      R(2 * T + 4 + a, 8 * T + 2 + b, 4, 4, '#b0e0f0'); R(2 * T + 5 + a, 8 * T + 4 + b, 2, 1, '#3a8a3a'); }

    // the storage closet (tall, against the left wall)
    { const x = T, y = 5 * T;
      R(x + 1, y - 12, 14, 28, '#7a4c2c'); R(x + 2, y - 11, 12, 26, '#a8703a'); R(x + 7, y - 11, 1, 26, '#7a4c2c');
      R(x + 5, y + 1, 1, 3, '#ffd84a'); R(x + 9, y + 1, 1, 3, '#ffd84a'); R(x + 3, y - 9, 3, 2, '#c8905a'); R(x + 10, y - 9, 3, 2, '#c8905a');
      R(x + 4, y - 15, 8, 3, '#e8433a'); R(x + 5, y - 16, 6, 1, '#ffd84a'); } // a gift box on top

    // filing cabinet
    R(T + 1, 8 * T - 4, 14, 19, '#8c94a8'); R(T + 1, 8 * T - 4, 14, 1, '#b0b8c8');
    for (let i = 0; i < 3; i++) { R(T + 2, 8 * T + i * 6 - 2, 12, 5, '#7a8296'); R(T + 6, 8 * T + i * 6, 4, 1, '#d0d4e0'); }

    // water cooler
    const cx = 15 * T;
    R(cx + 4, 2 * T + 6, 8, 10, '#e0e4ec'); R(cx + 5, 2 * T - 4, 6, 10, '#7ac0f0'); R(cx + 6, 2 * T - 3, 2, 6, '#b0e0ff');
    R(cx + 7, 2 * T + 9, 2, 2, '#4a6aa0');

    // Lyra's story board: a cork board on an easel, index cards joined by red string
    { const x = 2 * T, y = 3 * T;
      R(x + 3, y + 8, 2, 8, '#6a4224'); R(x + 11, y + 8, 2, 8, '#6a4224'); R(x + 7, y + 10, 2, 6, '#5a361c');
      R(x, y - 10, 16, 20, '#6a4224'); R(x + 1, y - 9, 14, 18, '#c8955a');
      for (let i = 0; i < 10; i++) R(x + 2 + ((i * 5) % 12), y - 8 + ((i * 7) % 16), 1, 1, '#a87440');
      [[2, -7, '#fff6c8'], [9, -8, '#ffd0e0'], [5, -1, '#c8f0ff'], [10, 2, '#fff6c8'], [2, 3, '#d8ffd0']].forEach(([a, b, c]) => { R(x + a, y + b, 4, 3, c); R(x + a + 1, y + b, 1, 1, '#d83a3a'); });
      g.fillStyle = '#d83a3a';
      [[4, -5, 10, -6], [10, -5, 7, 0], [7, 1, 11, 3], [7, 1, 4, 4]].forEach(([x1, y1, x2, y2]) => { const n = 6; for (let k = 0; k <= n; k++) g.fillRect(Math.round(x + x1 + (x2 - x1) * k / n), Math.round(y + y1 + (y2 - y1) * k / n), 1, 1); });
    }

    // plants
    ['plant1', 'plant2', 'plant3', 'plant4'].map((id) => propTiles(id)[0]).filter(Boolean).forEach(([px, py]) => {
      const x = px * T, y = py * T;
      R(x + 4, y + 9, 8, 7, '#c0603a'); R(x + 4, y + 9, 8, 2, '#d8784a');
      g.fillStyle = '#3a9a4a';
      [[3, 2, 4, 7], [8, 0, 4, 9], [5, -3, 3, 8], [1, 5, 4, 4], [11, 4, 4, 5]].forEach(([a, b, w, h]) => g.fillRect(x + a, y + b, w, h));
      g.fillStyle = '#58c068';
      [[4, 3, 2, 3], [9, 1, 2, 4], [6, -2, 1, 4], [12, 5, 2, 2]].forEach(([a, b, w, h]) => g.fillRect(x + a, y + b, w, h));
    });

    // TV stand + beanbag + snacks (Ralph's corner)
    R(15 * T, 11 * T + 6, 2 * T, 10, '#5a3a2a'); R(15 * T, 11 * T + 6, 2 * T, 2, '#7a523a');
    R(15 * T + 4, 11 * T + 10, 8, 4, '#3a2a20'); R(16 * T + 4, 11 * T + 10, 8, 4, '#3a2a20');
    R(15 * T + 1, 12 * T + 6, 14, 10, '#4a8ad0'); R(15 * T + 2, 12 * T + 5, 12, 3, '#6aa8e8'); R(15 * T, 12 * T + 10, 16, 6, '#3a70b0');
    R(17 * T + 2, 12 * T + 6, 12, 8, '#8a5a33'); R(17 * T + 2, 12 * T + 6, 12, 2, '#c48d5c');
    R(17 * T + 4, 12 * T + 1, 6, 7, '#e8c040'); R(17 * T + 5, 12 * T + 3, 4, 2, '#d04040'); R(17 * T + 11, 12 * T + 4, 2, 3, '#d0d0d0');

    return c;
  }

  // ------------------------------------------------------------ animated bits
  const CODE_COLS = ['#7ef0a0', '#7ad0ff', '#ff9ad0', '#ffe07a', '#c0a0ff'];

  function drawGlow(g, x, y, r, col, a) {
    const grad = g.createRadialGradient(x, y, 1, x, y, r);
    grad.addColorStop(0, col.replace('A', String(a)));
    grad.addColorStop(1, col.replace('A', '0'));
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
    g.globalCompositeOperation = 'source-over';
  }

  function drawMonitor(g, tx, ty, on, t, laptop) {
    const x = tx * T, y = ty * T;
    const R = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(x + a, y + b, w, h); };
    if (laptop) {
      R(2, 0, 12, 7, '#4a4a58'); R(3, 1, 10, 5, on ? '#13202c' : '#28324a');
      R(1, 7, 14, 2, '#70707e');
    } else {
      R(2, -6, 12, 10, '#3e3e4e'); R(3, -5, 10, 7, on ? '#13202c' : '#28324a');
      R(7, 4, 2, 2, '#3e3e4e'); R(5, 5, 6, 1, '#55556a');
      R(3, 7, 9, 2, '#e8e8f0'); R(4, 7, 7, 1, '#c8c8d4'); // keyboard
    }
    const sx = 3, sy = laptop ? 1 : -5, sw = 10, sh = laptop ? 5 : 7;
    if (!on) { R(sx + 1, sy + 1, 2, 1, '#3a4664'); return; }
    // scrolling "code"
    const scroll = Math.floor(t / 180);
    for (let row = 0; row < sh; row++) {
      const n = (row + scroll) * 7919 % 97;
      const indent = n % 3, len = 2 + (n % 6);
      R(sx + indent, sy + row, Math.min(len, sw - indent), 1, CODE_COLS[n % CODE_COLS.length]);
    }
    if (Math.floor(t / 400) % 2) R(sx + (scroll % 6) + 2, sy + sh - 1, 1, 1, '#ffffff');
    drawGlow(g, x + 8, y + sy + 3, 22, 'rgba(120,220,255,A)', 0.28 + 0.06 * Math.sin(t / 150));
  }

  // The player's desk: a tray of report papers (a red dot with the number of new ones) and a
  // desk phone whose light blinks and handset jiggles while a teammate is calling.
  function drawMyDesk(g, t, unread, calls) {
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const [ox, oy] = deskOffset('me'), tx = (12 + ox) * T, ty = (3 + oy) * T;
    // nameplate
    R(tx + 11, ty + 11, 10, 3, '#c8a040'); R(tx + 12, ty + 12, 8, 1, '#ffe08a');
    // tray with papers
    R(tx + 2, ty + 3, 11, 7, '#7a5a3a'); R(tx + 3, ty + 2, 9, 6, '#fffaf0'); R(tx + 4, ty + 1, 8, 6, '#f4ecd8');
    R(tx + 5, ty + 3, 5, 1, '#9a90aa'); R(tx + 5, ty + 5, 4, 1, '#9a90aa');
    if (unread) { R(tx + 10, ty - 2, 5, 5, '#e04848'); R(tx + 12, ty - 1, 1, 3, '#fff'); }
    // the phone
    const px = tx + T + 2, py = ty + 1;
    const ring = calls > 0 && Math.floor(t / 180) % 6 < 3;
    const jig = ring ? (Math.floor(t / 60) % 2 ? -1 : 1) : 0;
    R(px, py + 4, 12, 7, '#2e2a3a'); R(px + 1, py + 5, 10, 5, '#3e3a4e');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) R(px + 2 + i * 3, py + 6 + j * 2, 2, 1, '#b8b0c8');
    R(px - 1 + jig, py + 1 - (ring ? 1 : 0), 14, 3, '#2e2a3a'); R(px + jig, py + 1 - (ring ? 1 : 0), 3, 4, '#2e2a3a'); R(px + 9 + jig, py + 1 - (ring ? 1 : 0), 3, 4, '#2e2a3a');
    R(px + 10, py + 8, 2, 2, calls > 0 ? (Math.floor(t / 400) % 2 ? '#ff5050' : '#701818') : '#3a5a3a');
    if (ring) {
      drawGlow(g, px + 6, py + 4, 18, 'rgba(255,90,90,A)', 0.35);
      R(px - 4, py - 2, 2, 1, '#ffd84a'); R(px + 15, py - 2, 2, 1, '#ffd84a'); R(px - 3, py - 4, 1, 1, '#ffd84a'); R(px + 15, py - 4, 1, 1, '#ffd84a');
    }
  }

  function drawTV(g, on, t) {
    const x = 15 * T + 4, y = 10 * T + 6;
    const R = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(x + a, y + b, w, h); };
    R(0, 0, 24, 17, '#2e2e3a'); R(1, 1, 22, 15, '#44445a');
    R(2, 2, 20, 12, on ? '#5ab8f0' : '#26304a');
    if (on) {
      R(2, 10, 20, 4, '#4ab060');
      const px = 3 + Math.floor((t / 120) % 16);
      const jump = Math.abs(Math.sin(t / 220)) * 4;
      R(px, 9 - jump, 2, 2, '#f04848');
      R(14 - ((t / 80) % 14), 8, 3, 2, '#ffffff');
      R(4, 3, 3, 1, '#ffffff'); R(16, 4, 4, 1, '#ffffff');
      drawGlow(g, x + 12, y + 8, 26, 'rgba(120,200,255,A)', 0.3);
    } else R(4, 3, 3, 1, '#3a4664');
    R(18, 15, 3, 1, on ? '#70ff70' : '#606070');
  }

  function drawArcade(g, t, hasGame) {
    const x = 18 * T + 1, y = 2 * T - 10;
    const R = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(x + a, y + b, w, h); };
    R(0, 0, 14, 42, '#5a2a8a'); R(1, 0, 12, 42, '#6e38a8');
    R(1, 1, 12, 5, '#ffcc33'); R(2, 2, 10, 3, '#ff6a3a');
    R(3, 3, 1, 1, '#fff'); R(5, 3, 1, 1, '#fff'); R(7, 3, 1, 1, '#fff'); R(9, 3, 1, 1, '#fff');
    R(2, 8, 10, 10, '#101020');
    // attract mode
    const f = Math.floor(t / 300);
    for (let i = 0; i < 4; i++) R(3 + ((f + i * 3) % 8), 9 + i * 2, 2, 1, hasGame ? CODE_COLS[(f + i) % 5] : '#404060');
    if (hasGame && f % 2) R(5, 15, 4, 1, '#ffffff');
    R(1, 19, 12, 5, '#4a2470'); R(3, 20, 2, 2, '#f04848'); R(8, 21, 2, 1, '#48c0f0'); R(10, 20, 2, 1, '#f0e048');
    R(2, 26, 10, 14, '#58289a'); R(5, 30, 4, 2, '#ffcc33');
    drawGlow(g, x + 7, y + 13, 18, 'rgba(200,120,255,A)', 0.25 + 0.05 * Math.sin(t / 200));
  }

  function drawRack(g, t, busy) {
    const x = 18 * T + 1, y = 6 * T - 6;
    const R = (a, b, w, h, col) => { g.fillStyle = col; g.fillRect(x + a, y + b, w, h); };
    R(0, 0, 14, 36, '#2e3240'); R(1, 1, 12, 34, '#3a4050');
    for (let i = 0; i < 6; i++) {
      R(2, 3 + i * 5, 10, 3, '#262a36');
      const blink = busy ? (Math.floor(t / 90) + i * 3) % 4 === 0 : (Math.floor(t / 900) + i) % 5 === 0;
      R(3, 4 + i * 5, 1, 1, blink ? '#70ff90' : '#2a6a3a');
      R(5, 4 + i * 5, 1, 1, busy && (Math.floor(t / 130) + i) % 3 === 0 ? '#ffb040' : '#5a4a2a');
    }
  }

  function drawChalk(g, t, agenda, busy) {
    const x = T + 6, y = 8;
    const tasks = (agenda && agenda.tasks) || [];
    g.fillStyle = 'rgba(240,240,230,0.85)';
    if (!tasks.length) {
      // doodle: "TODO?"
      [[0, 0, 5, 1], [2, 0, 1, 5], [7, 0, 3, 1], [7, 4, 3, 1], [7, 0, 1, 5], [9, 0, 1, 5], [12, 0, 1, 5], [12, 0, 2, 1], [12, 4, 2, 1], [14, 1, 1, 3]].forEach(([a, b, w, h]) => g.fillRect(x + 4 + a, y + 4 + b, w, h));
    }
    tasks.slice(0, 5).forEach((task, i) => {
      const done = task.status === 'done';
      const ly = y + 2 + i * 4;
      if (ly > y + 18) return;
      g.fillStyle = done ? '#90e090' : (task.status === 'doing' || task.status === 'review') ? '#f0d060' : 'rgba(240,240,230,0.85)';
      g.fillRect(x, ly, 2, 2);
      const len = 14 + ((task.title || '').length * 3) % 40;
      g.fillStyle = 'rgba(240,240,230,0.7)';
      g.fillRect(x + 4, ly + 1, Math.min(len, 60), 1);
      if (done) { g.fillStyle = 'rgba(240,240,230,0.9)'; g.fillRect(x + 3, ly + 1, Math.min(len, 60) + 2, 1); }
    });
    if (busy) {
      for (let i = 0; i < 4; i++) {
        const px = x + 10 + ((t / 40 + i * 17) % 50), py = y + 18 - ((t / 60 + i * 5) % 14);
        g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(px, py, 1, 1);
      }
    }
  }

  Suma.world = { T, W, H, NPCS, PLAYER_LOOK, isSolid, thingAt, drawBackground, drawMonitor, drawTV, drawArcade, drawRack, drawChalk, drawMyDesk,
    DESK_OF, PROPS, applyLayout, layout: () => LAYOUT, onLayout: (f) => listeners.push(f), deskOffset, propOffset, deskTiles, propTiles, registerProps };
})();
