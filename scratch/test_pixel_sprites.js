// Test pixel sprite matrix parser and generator
const PALETTES = {
  // Knight
  knight: {
    '.': null, // transparent
    '#': '#111827', // dark outline
    'm': '#475569', // steel shadow
    's': '#94a3b8', // steel mid
    'h': '#e2e8f0', // steel highlight
    'f': '#fed7aa', // skin tone
    'd': '#ea580c', // skin shadow / plume red
    'r': '#dc2626', // plume bright
    'w': '#f8fafc', // shine white
    'g': '#facc15', // gold trim
    'b': '#1d4ed8', // blue cloth
    'k': '#0f172a'  // black shadow
  }
};

// 16x16 Pixel Knight Sprite
const KNIGHT_SPRITE = [
  ".....####.......",
  "....#rrrr#......",
  "...#rddddr#.....",
  "..#hhshhhsh#....",
  "..#h#s#h#s##....",
  "..#hhshhhsh#....",
  "...#ssssss#.....",
  "..#bbgssgbb#....",
  ".#bb#gssg#bb#...",
  ".#f#ssssss#f#...",
  "..#hssssssh#....",
  "..#hh#ss#hh#....",
  "...##ssss##.....",
  "...#mm##mm#.....",
  "..#hh#..#hh#....",
  "..####..####...."
];

console.log('Knight sprite rows:', KNIGHT_SPRITE.length, 'cols:', KNIGHT_SPRITE[0].length);
