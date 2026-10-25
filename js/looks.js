// Looks: costumes (unlocked by studio levels and Board scores), the palettes for the
// character creator, and how a costume or outfit is put on top of someone's base look.
window.Suma = window.Suma || {};

(function () {
  // Clothing pieces a costume replaces (faces, hair and glasses stay).
  const CLOTHES = ['labcoat', 'vest', 'tie', 'hawaiian', 'collar', 'jacket', 'hoodie', 'scarf', 'book', 'pen', 'watch', 'wristband'];
  const HATS = ['cap', 'beanie', 'headband', 'clip', 'crown'];

  // unlock: { level } = reach that studio level; { score } = get that Board score (or higher) once.
  const COSTUMES = [
    { id: 'usual', name: 'Their usual look', icon: '🙂' },
    { id: 'casual', name: 'Casual Friday', icon: '👕', look: { shirt: '#e05050', pants: '#3a5a8a' } },
    { id: 'hoodie', name: 'Cozy Hoodie', icon: '🧥', unlock: { level: 2 }, look: { shirt: '#5a5a6a', pants: '#2a2a34' }, add: ['hoodie'] },
    { id: 'tux', name: 'Secret Agent Tux', icon: '🕴️', unlock: { level: 3 }, look: { shirt: '#1c1c26', pants: '#1c1c26', accent: '#d04848' }, add: ['tie', 'collar'] },
    { id: 'beach', name: 'Beach Day', icon: '🏖️', unlock: { level: 4 }, look: { shirt: '#2fa39a', pants: '#e8c890', accent: '#ffe066' }, add: ['hawaiian'] },
    { id: 'scientist', name: 'Mad Scientist', icon: '🧪', unlock: { level: 5 }, look: { shirt: '#7ac0f0', pants: '#3a3a4a' }, add: ['labcoat', 'glasses', 'pen'] },
    { id: 'ninja', name: 'Ninja', icon: '🥷', unlock: { level: 6 }, look: { shirt: '#1a1a22', pants: '#1a1a22', band: '#d04848' }, add: ['headband'] },
    { id: 'party', name: 'Party Animal', icon: '🎉', unlock: { score: 7 }, look: { shirt: '#ff6ab0', pants: '#3a2a6a', band: '#ffd84a' }, add: ['cap'] },
    { id: 'rockstar', name: 'Rock Star', icon: '🎸', unlock: { score: 9 }, look: { shirt: '#d04848', pants: '#1a1a22', accent: '#2a2a30', band: '#1a1a22' }, add: ['jacket', 'headband', 'wristband'] },
    { id: 'gold', name: 'Gold Suit', icon: '🏆', unlock: { score: 10 }, look: { shirt: '#e8b830', pants: '#c89020', accent: '#fff6c8' }, add: ['tie', 'collar', 'watch'] },
    { id: 'royal', name: 'Royal Robes', icon: '👑', unlock: { level: 8 }, look: { shirt: '#6a2a9a', pants: '#3a1a5a', accent: '#f0c040' }, add: ['vest', 'crown'] },
  ];

  const PALETTE = {
    skin: ['#f6d2b8', '#f0c8a0', '#e8b890', '#d9a070', '#c08a5a', '#a06a40', '#8d5a3b', '#5e3a24'],
    hair: ['#1a1a22', '#2a1e18', '#5a3a22', '#7a4a2a', '#a8402e', '#d0602a', '#e8c45a', '#b8b8c0', '#9a5ad8', '#2a7ad8', '#3a9a5a'],
    hairStyle: [['short', 'Short'], ['spiky', 'Spiky'], ['neat', 'Neat'], ['long', 'Long'], ['shaggy', 'Shaggy'], ['receding', 'Classic']],
    shirt: ['#3a7ad8', '#d83a3a', '#3a9a5a', '#f0c040', '#9a5ad8', '#2aa0a8', '#f08a30', '#ff6ab0', '#e8e4d8', '#2a2a34'],
    pants: ['#34405e', '#2a2a34', '#3a5a8a', '#5a4a3a', '#6a6a7a', '#e8c890'],
    hat: [['', 'None'], ['cap', 'Cap'], ['beanie', 'Beanie'], ['headband', 'Headband']],
    hatColor: ['#d83a3a', '#3a7ad8', '#2a2a34', '#f0c040', '#3a9a5a', '#9a5ad8', '#e8e4d8'],
    extras: [['glasses', 'Glasses'], ['smile', 'Smile'], ['stubble', 'Stubble'], ['freckles', 'Freckles'], ['earrings', 'Earrings'], ['headphones', 'Headphones']],
  };

  // Which costumes the studio has earned so far.
  function unlocked(progress) {
    const level = (progress && progress.level) || 1;
    const best = Math.max(0, ...((progress && progress.scores) || []).map((s) => Number(s.score) || 0));
    return COSTUMES.filter((c) => !c.unlock || (c.unlock.level && level >= c.unlock.level) || (c.unlock.score && best >= c.unlock.score)).map((c) => c.id);
  }
  function unlockText(c) {
    if (!c.unlock) return 'Unlocked';
    return c.unlock.level ? 'Reach studio level ' + c.unlock.level : 'Get a Board score of ' + c.unlock.score + '+';
  }
  // Costumes newly earned by reaching `level` or getting `score` (for the celebration screen).
  function earnedBy({ level, score, prevBest = 0 }) {
    return COSTUMES.filter((c) => c.unlock && ((level && c.unlock.level === level) || (score && c.unlock.score && score >= c.unlock.score && prevBest < c.unlock.score)));
  }

  // base look + { costume, shirt, pants } -> the look to draw.
  function apply(base, custom) {
    if (!custom) return base;
    let look = { ...base, extras: [...(base.extras || [])] };
    const c = custom.costume && COSTUMES.find((x) => x.id === custom.costume);
    if (c && c.look) {
      const hatIn = (c.add || []).some((e) => HATS.includes(e));
      look.extras = look.extras.filter((e) => !CLOTHES.includes(e) && !(hatIn && HATS.includes(e)));
      look = { ...look, ...c.look, extras: [...new Set([...look.extras, ...(c.add || [])])] };
    }
    if (custom.shirt) look.shirt = custom.shirt;
    if (custom.pants) look.pants = custom.pants;
    return look;
  }

  Suma.looks = { COSTUMES, PALETTE, unlocked, unlockText, earnedBy, apply };
})();
