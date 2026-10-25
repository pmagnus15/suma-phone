// Pixel art, drawn in code (no image files needed).
// Characters are 16x20 sprites with an automatic dark outline.
window.Suma = window.Suma || {};

(function () {
  const OUTLINE = '#2a2236';

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f < 1) { r *= f; g *= f; b *= f; } else { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); }
    return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  // Adds a 1px outline around every filled pixel.
  function outline(c) {
    const ctx = c.getContext('2d');
    const { width: w, height: h } = c;
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
    const marks = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!filled(x, y) && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) marks.push([x, y]);
    }
    ctx.fillStyle = OUTLINE;
    for (const [x, y] of marks) ctx.fillRect(x, y, 1, 1);
    return c;
  }

  // ------------------------------------------------------------ characters
  // look: { skin, hair, hairStyle, shirt, pants, shoes, eyes, extras: [] , accent }
  // blink: draw the eyes closed (the office blinks everyone now and then).
  // Signature extras: pen, watch, earrings, freckles, stubble, wristband, hoodie, jacket, beanie, scarf, book, blush.
  function drawChar(look, dir, frame, blink) {
    const c = makeCanvas(16, 20);
    const ctx = c.getContext('2d');
    const P = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); };
    const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
    const clear = (x, y) => ctx.clearRect(x, y, 1, 1);
    const ex = look.extras || [];
    const has = (e) => ex.includes(e);
    const skin = look.skin, skinD = shade(skin, 0.82);
    const hair = look.hair, hairD = shade(hair, 0.75), hairL = shade(hair, 1.25);
    const shirt = look.shirt, shirtD = shade(shirt, 0.78);
    const pants = look.pants, pantsD = shade(pants, 0.75);
    const shoes = look.shoes || '#3b3040';
    const eye = look.eyes || '#1e1a2a';
    const side = dir === 'left' || dir === 'right';
    const bob = frame === 0 ? 0 : 0; // reserved

    // ---- legs & feet
    if (!side) {
      const lUp = frame === 1, rUp = frame === 2;
      R(5, 15, 6, 1, pants);
      R(5, 16, 3, lUp ? 1 : 2, pants); R(8, 16, 3, rUp ? 1 : 2, pants);
      P(7, 16, pantsD); P(8, 16, pantsD);
      R(5, lUp ? 17 : 18, 3, 1, shoes); R(8, rUp ? 17 : 18, 3, 1, shoes);
      P(dir === 'down' ? 6 : 5, lUp ? 17 : 18, shade(shoes, 1.7)); P(dir === 'down' ? 9 : 10, rUp ? 17 : 18, shade(shoes, 1.7)); // shoe shine
    } else {
      if (frame === 0) { R(6, 15, 4, 3, pants); P(8, 16, pantsD); P(8, 17, pantsD); R(5, 18, 5, 1, shoes); P(5, 18, shade(shoes, 1.7)); }
      else { R(5, 15, 2, 3, pants); R(9, 15, 2, 3, pantsD); R(4, 18, 3, 1, shoes); R(9, 18, 3, 1, shade(shoes, 0.8)); }
    }

    // ---- body
    if (!side) {
      R(4, 10, 8, 5, shirt);
      R(4, 10, 1, 5, shirtD); R(11, 10, 1, 5, shirtD);
      R(3, 10, 1, 4, shirtD); R(12, 10, 1, 4, shirtD); // arms
      P(3, 14, skin); P(12, 14, skin); // hands
      R(5, 11, 1, 2, shade(shirt, 1.18)); // light falling on the shirt
      R(4, 14, 8, 1, shade(pants, 0.6)); if (dir === 'down') P(7, 14, '#e0c050'); // belt and buckle
      if (has('hoodie') && dir === 'down') { R(6, 10, 4, 1, shirtD); P(6, 11, '#f4f0e8'); P(6, 12, '#f4f0e8'); P(9, 11, '#f4f0e8'); P(9, 12, '#f4f0e8'); R(5, 13, 6, 1, shirtD); }
      if (has('jacket')) { R(4, 10, 2, 5, look.accent); R(10, 10, 2, 5, look.accent); R(3, 10, 1, 4, shade(look.accent, 0.8)); R(12, 10, 1, 4, shade(look.accent, 0.8)); if (dir === 'down') { P(5, 10, shade(look.accent, 1.3)); P(10, 10, shade(look.accent, 1.3)); } }
      if (has('labcoat')) { R(3, 10, 3, 4, '#f4f4f0'); R(10, 10, 3, 4, '#f4f4f0'); R(4, 14, 2, 1, '#f4f4f0'); R(10, 14, 2, 1, '#f4f4f0'); P(3, 14, skin); P(12, 14, skin); R(4, 10, 1, 5, '#dcdcd4'); R(11, 10, 1, 5, '#dcdcd4'); }
      if (has('vest')) { R(4, 11, 2, 4, look.accent); R(10, 11, 2, 4, look.accent); }
      if (has('tie')) { R(7, 10, 2, 1, look.accent); R(7, 11, 2, 3, look.accent); P(7, 13, shade(look.accent, 0.8)); }
      if (has('hawaiian') && dir === 'down') { P(5, 11, look.accent); P(9, 12, look.accent); P(6, 13, look.accent); P(10, 10, look.accent); P(8, 14, look.accent); }
      if (has('hawaiian') && dir === 'up') { P(6, 11, look.accent); P(9, 13, look.accent); P(5, 14, look.accent); }
      if (has('collar') && dir === 'down') { P(6, 10, '#ffffff'); P(9, 10, '#ffffff'); }
      if (has('headphones') && dir === 'down') { R(4, 10, 8, 1, '#3a3a46'); R(3, 10, 1, 2, look.accent); R(12, 10, 1, 2, look.accent); }
      if (has('headphones') && dir === 'up') { R(4, 10, 8, 1, '#3a3a46'); }
      if (has('pen') && dir === 'down') { R(9, 11, 2, 2, shade(has('labcoat') ? '#f4f4f0' : shirt, 0.88)); P(10, 10, '#3a6ec8'); P(10, 11, '#d8d8e0'); }
      if (has('watch') && dir === 'down') { P(5, 12, '#f0c040'); P(6, 13, '#f0c040'); P(7, 13, '#f0c040'); P(8, 12, '#f0c040'); }
      if (has('wristband')) { P(3, 13, look.accent); P(12, 13, look.accent); }
      if (has('scarf')) { R(4, 10, 8, 1, look.band); R(5, 9, 6, 1, look.band); if (dir === 'down') { R(9, 11, 2, 3, look.band); P(9, 13, shade(look.band, 0.75)); P(10, 13, shade(look.band, 0.75)); } else R(6, 11, 2, 2, look.band); }
      if (has('book') && dir === 'down') { R(11, 11, 3, 4, '#a83a4a'); R(12, 12, 1, 2, '#f4ecd8'); P(13, 11, '#f0c040'); P(12, 14, skin); }
    } else {
      R(5, 10, 6, 5, shirt); R(10, 10, 1, 5, shirtD);
      if (has('labcoat')) { R(5, 10, 6, 5, '#f4f4f0'); R(5, 10, 1, 5, shirt); }
      if (has('vest')) { R(6, 11, 4, 4, look.accent); }
      if (has('tie')) { R(5, 11, 1, 3, look.accent); }
      if (has('hawaiian')) { P(6, 12, look.accent); P(9, 11, look.accent); P(8, 14, look.accent); }
      const armX = frame === 0 ? 7 : (frame === 1 ? 6 : 8);
      R(armX, 10, 2, 4, has('labcoat') ? '#dcdcd4' : shirtD); R(armX, 14, 2, 1, skin);
      if (has('headphones')) { R(5, 10, 6, 1, '#3a3a46'); R(4, 10, 2, 2, look.accent); }
      R(5, 14, 6, 1, shade(pants, 0.6)); // belt
      if (has('jacket')) { R(5, 10, 2, 5, look.accent); }
      if (has('scarf')) { R(5, 9, 6, 2, look.band); R(10, 10, 2, 3, look.band); }
      if (has('wristband')) R(armX, 13, 2, 1, look.accent);
    }

    // ---- head
    const style = look.hairStyle || 'short';
    if (dir === 'down') {
      R(3, 1, 10, 9, hair);
      R(4, 4, 8, 6, skin);
      R(3, 7, 1, 2, skin); R(12, 7, 1, 2, skin);
      clear(3, 9); clear(12, 9); clear(3, 1); clear(12, 1);
      R(4, 9, 8, 1, skinD);
      // hairline / bangs
      if (style === 'short') { R(4, 4, 3, 1, hair); R(9, 4, 3, 1, hair); P(4, 5, hair); P(11, 5, hair); }
      if (style === 'spiky') { R(4, 4, 8, 1, hair); P(5, 5, hair); P(8, 5, hair); P(11, 5, hair); clear(5, 1); clear(8, 1); clear(10, 1); }
      if (style === 'neat') { R(4, 4, 5, 1, hair); P(4, 5, hair); P(5, 5, hair); }
      if (style === 'receding') { R(4, 4, 8, 1, skin); P(4, 4, hair); P(11, 4, hair); R(3, 1, 10, 1, '#00000000'); clear(3, 1); clear(4, 1); clear(11, 1); clear(12, 1); }
      if (style === 'long') { R(4, 4, 8, 1, hair); P(4, 5, hair); P(11, 5, hair); R(2, 5, 2, 8, hair); R(12, 5, 2, 8, hair); P(2, 12, hairD); P(13, 12, hairD); }
      if (style === 'shaggy') { R(4, 4, 8, 2, hair); clear(6, 5); clear(9, 5); P(6, 5, skin); P(9, 5, skin); R(2, 4, 1, 5, hair); R(13, 4, 1, 5, hair); clear(5, 1); clear(9, 1); }
      // eyes
      if (style !== 'receding' && !has('glasses')) R(5, 5, 6, 1, shade(skin, 0.9)); // shadow under the hair
      if (blink) { P(5, 7, eye); P(10, 7, eye); P(4, 7, skinD); P(11, 7, skinD); }
      else if (look.sleepy) { R(5, 6, 1, 1, skinD); R(10, 6, 1, 1, skinD); P(5, 7, eye); P(10, 7, eye); }
      else { R(5, 6, 1, 2, eye); R(10, 6, 1, 2, eye); P(5, 6, shade(eye, 1.6)); P(10, 6, shade(eye, 1.6)); }
      const cheek = has('blush') ? '#f0a0a0' : shade(skin, 0.92);
      P(4, 8, cheek); P(11, 8, cheek);
      P(8, 7, shade(skin, 0.9)); // nose
      if (has('smile')) { P(6, 8, shade(skin, 0.7)); R(7, 9, 2, 1, '#9a4a4a'); P(9, 8, shade(skin, 0.7)); }
      else P(7, 9, shade(skin, 0.68)); // mouth
      if (has('freckles')) { P(5, 8, shade(skin, 0.78)); P(10, 8, shade(skin, 0.78)); P(6, 7, shade(skin, 0.8)); }
      if (has('stubble')) { R(5, 9, 6, 1, shade(look.hair, 0.9)); P(4, 8, shade(skin, 0.75)); P(11, 8, shade(skin, 0.75)); }
      if (has('earrings')) { P(3, 9, '#f0c040'); P(12, 9, '#f0c040'); }
      if (has('glasses')) { R(4, 5, 3, 1, '#2c2c3c'); R(9, 5, 3, 1, '#2c2c3c'); P(4, 6, '#2c2c3c'); P(6, 6, '#2c2c3c'); P(9, 6, '#2c2c3c'); P(11, 6, '#2c2c3c'); P(7, 6, '#2c2c3c'); P(8, 6, '#2c2c3c'); }
      if (has('mustache')) { R(6, 8, 4, 1, hair); }
      if (has('headband')) { R(3, 3, 10, 1, look.band); }
      if (has('clip')) { P(11, 3, look.band); P(12, 3, look.band); }
      if (has('cap')) { R(3, 1, 10, 3, look.band); R(3, 4, 10, 1, shade(look.band, 0.7)); R(5, 1, 6, 1, shade(look.band, 1.25)); clear(3, 1); clear(12, 1); P(7, 2, '#ffffff'); P(8, 2, '#ffffff'); }
      if (has('beanie')) { R(3, 1, 10, 4, look.accent); R(3, 4, 10, 1, shade(look.accent, 0.7)); for (let k = 4; k < 12; k += 2) P(k, 2, shade(look.accent, 0.85)); P(7, 0, '#f4f0e8'); P(8, 0, '#f4f0e8'); clear(3, 1); clear(12, 1); }
      if (has('crown')) { R(4, 1, 8, 2, '#f0c040'); R(4, 1, 8, 1, '#ffe08a'); P(4, 0, '#f0c040'); P(7, 0, '#f0c040'); P(8, 0, '#f0c040'); P(11, 0, '#f0c040'); P(7, 2, '#d04848'); P(5, 2, '#3a7ad8'); P(10, 2, '#3a7ad8'); }
      if (!has('cap') && !has('beanie') && !has('crown')) R(5, 2, 2, 1, hairL); // shine
    } else if (dir === 'up') {
      R(3, 1, 10, 9, hair);
      clear(3, 9); clear(12, 9); clear(3, 1); clear(12, 1);
      R(5, 9, 6, 1, skinD);
      R(4, 8, 8, 1, hairD);
      if (style === 'long') { R(3, 9, 10, 4, hair); R(4, 12, 8, 1, hairD); }
      if (style === 'shaggy') { R(3, 9, 10, 1, hair); clear(5, 1); clear(9, 1); }
      if (style === 'spiky') { clear(5, 1); clear(8, 1); clear(10, 1); }
      if (style === 'receding') { R(5, 1, 6, 2, shade(hair, 0.9)); }
      if (has('headband')) { R(3, 3, 10, 1, look.band); P(7, 4, look.band); P(8, 5, look.band); }
      if (has('cap')) { R(3, 1, 10, 4, look.band); clear(3, 1); clear(12, 1); R(4, 4, 8, 1, shade(look.band, 0.75)); }
      if (has('clip')) { P(4, 3, look.band); P(5, 3, look.band); }
      if (has('beanie')) { R(3, 1, 10, 4, look.accent); R(3, 4, 10, 1, shade(look.accent, 0.7)); P(7, 0, '#f4f0e8'); P(8, 0, '#f4f0e8'); clear(3, 1); clear(12, 1); }
      if (has('crown')) { R(4, 1, 8, 2, '#f0c040'); P(4, 0, '#f0c040'); P(7, 0, '#f0c040'); P(8, 0, '#f0c040'); P(11, 0, '#f0c040'); }
      if (!has('cap') && !has('beanie') && !has('crown')) R(5, 2, 3, 1, hairL);
    } else {
      // side view facing left; flipped later for right
      R(4, 1, 8, 9, hair);
      R(4, 4, 6, 6, skin);
      P(3, 7, skin); // nose
      clear(4, 1); clear(11, 1); clear(11, 9);
      R(4, 9, 6, 1, skinD);
      R(10, 4, 2, 5, hair);
      P(8, 6, skinD); // ear
      if (style === 'short' || style === 'neat' || style === 'spiky') R(4, 4, 4, 1, hair);
      if (style === 'spiky') { clear(6, 1); clear(9, 1); P(3, 3, hair); }
      if (style === 'receding') { R(4, 1, 3, 3, skin); clear(4, 1); clear(5, 1); }
      if (style === 'long') { R(9, 4, 4, 9, hair); R(4, 4, 5, 1, hair); }
      if (style === 'shaggy') { R(4, 4, 5, 2, hair); P(3, 4, hair); R(9, 4, 4, 6, hair); clear(7, 1); }
      if (blink || look.sleepy) { P(5, 6, skinD); P(5, 7, eye); } else { R(5, 6, 1, 2, eye); P(5, 6, shade(eye, 1.6)); }
      P(4, 9, has('smile') ? '#9a4a4a' : shade(skin, 0.68)); // mouth
      if (has('earrings')) P(8, 8, '#f0c040');
      if (has('stubble')) R(4, 9, 4, 1, shade(look.hair, 0.9));
      if (has('beanie')) { R(4, 1, 8, 4, look.accent); R(4, 4, 8, 1, shade(look.accent, 0.7)); P(7, 0, '#f4f0e8'); clear(4, 1); clear(11, 1); }
      if (has('glasses')) { R(4, 5, 3, 1, '#2c2c3c'); P(4, 6, '#2c2c3c'); P(6, 6, '#2c2c3c'); P(7, 5, '#2c2c3c'); }
      if (has('mustache')) { R(3, 8, 3, 1, hair); }
      if (has('headband')) { R(4, 3, 8, 1, look.band); }
      if (has('cap')) { R(4, 1, 8, 3, look.band); R(1, 4, 7, 1, shade(look.band, 0.7)); clear(4, 1); clear(11, 1); }
      if (has('clip')) { P(9, 3, look.band); }
      if (has('crown')) { R(5, 1, 6, 2, '#f0c040'); P(5, 0, '#f0c040'); P(8, 0, '#f0c040'); P(10, 0, '#f0c040'); P(7, 2, '#d04848'); }
      if (!has('cap') && !has('beanie') && !has('crown')) R(6, 2, 2, 1, hairL);
    }
    void bob;

    outline(c);
    if (dir === 'right') {
      const f = makeCanvas(16, 20);
      const fx = f.getContext('2d');
      fx.translate(16, 0); fx.scale(-1, 1); fx.drawImage(c, 0, 0);
      return f;
    }
    return c;
  }

  // Cached per look object, so a new outfit (a new look object) redraws by itself.
  const charCache = new Map();
  const lookStamp = new WeakMap();
  let stamps = 0;
  function charSprite(id, look, dir, frame, blink) {
    if (!lookStamp.has(look)) lookStamp.set(look, ++stamps);
    const key = id + '|' + lookStamp.get(look) + dir + frame + (blink ? 'b' : '');
    if (!charCache.has(key)) charCache.set(key, drawChar(look, dir, frame, blink));
    return charCache.get(key);
  }

  // Big portrait for the dialogue box
  function portrait(id, look, scale = 4) {
    const s = charSprite(id, look, 'down', 0);
    const c = makeCanvas(16 * scale, 20 * scale);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(s, 0, 0, 16 * scale, 20 * scale);
    return c;
  }

  Suma.sprites = { shade, makeCanvas, outline, charSprite, portrait, OUTLINE };
})();
