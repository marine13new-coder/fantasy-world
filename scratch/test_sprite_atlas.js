// Test pixel sprite matrix compiler
const fs = require('fs');

const PALETTE = {
  '.': null,
  '#': '#0f172a', // 1px dark contour outline
  'k': '#1e293b', // deepest shadow
  's': '#475569', // dark steel / dark cloth
  'm': '#94a3b8', // mid steel
  'h': '#e2e8f0', // highlight steel
  'w': '#ffffff', // pure white shine / eye sclera
  'f': '#fed7aa', // flesh
  'F': '#ea580c', // flesh shadow
  'd': '#9a3412', // deep shadow flesh / wood shadow
  'r': '#dc2626', // ruby / red plume
  'R': '#ef4444', // bright red
  'g': '#ca8a04', // gold shadow
  'G': '#facc15', // gold bright
  'y': '#fef08a', // pale yellow highlight
  'b': '#1d4ed8', // blue cloth
  'B': '#3b82f6', // bright blue
  'c': '#0284c7', // cyan / magic
  'C': '#38bdf8', // light cyan
  'p': '#7e22ce', // purple
  'P': '#c084fc', // light purple
  'e': '#15803d', // emerald green / goblin skin
  'E': '#22c55e', // bright green
  'L': '#86efac', // lime highlight
  'o': '#78350f', // leather brown
  'O': '#b45309', // light brown
  'x': '#451a03'  // wood dark
};

const SPRITES = {
  // 1. Knight (Full plate, visor, red plume, sword, shield)
  knight: [
    "......####......",
    ".....#RRrr#.....",
    "....#Rkddrr#....",
    "...#hhmhhhh#....",
    "..#h#m#h#m##....",
    "..#hhsmhhhsh#...",
    "...#ssssss#.....",
    "..#bbGssGbb#....",
    ".#bb#GssG#bb#...",
    ".#f#ssssss#f#h..",
    "..#hssssssh#wh#.",
    "..#hh#ss#hh#wh#.",
    "...##ssss##.wh#.",
    "...#kk##kk#.wh#.",
    "..#hh#..#hh#G##.",
    "..####..####.##."
  ],

  // 2. Wizard (Pointy hat, beard, robes, staff)
  wizard: [
    "......##........",
    ".....#bb#.......",
    "....#bbbb#......",
    "...#bGGbbb#.....",
    "..#bbbbbbbb#....",
    ".############...",
    "...#FffffF#..y..",
    "...#f#ff#f#.yCy.",
    "...#wwwwww#..y..",
    "...#wwwwww#..x..",
    "..#bbbbbbbb#GxG.",
    ".#b#bbbbbb#b#x..",
    ".#b#bbbbbb#b#x..",
    "..#bbbbbbbb#x...",
    "...#kk##kk#.x...",
    "..####..####x..."
  ],

  // 3. Priestess (Nun wimple with gold cross, blue robe, healer staff)
  priestess: [
    "....######......",
    "...#wwwwww#.....",
    "..#wwwGGwww#....",
    "..#wwGGGGww#....",
    "..#wwwGGwww#....",
    "..#w#FffF#w#....",
    "..#w#f##f#w#....",
    "..#w#ffff#w#....",
    "...#wwwwww#..O..",
    "..#bbwwwwbb#.OxO",
    ".#bb#wwww#bb#.x.",
    ".#f#bbwwbb#f#.x.",
    "..#bbbbbbbb#..x.",
    "..#bbbbbbbb#..x.",
    "...#kk##kk#...x.",
    "..####..####..x."
  ],

  // 4. Goblin (Green skin, pointed ears, red eyes, loincloth, axe)
  goblin: [
    "................",
    "..##........##..",
    ".#EE#..##..#EE#.",
    "#EEEE##ee##EEEE#",
    "#EEEEeeeeeeEEEE#",
    ".#eERRReeRRRe#..",
    "..#ee##ee##e#...",
    "...#eeeeee#.....",
    "....#eeee#...hh.",
    "...#oooooo#.#mh#",
    "..#e#oooo#e#xm##",
    "..#e#oooo#e#xx..",
    "...#ee##ee#.xx..",
    "...#ee##ee#.xx..",
    "..#ee#..#ee#xx..",
    "..####..####....",
  ],

  // 5. Skeleton (White skull, black eyes, ribs, sword, shield)
  skeleton: [
    ".....####.......",
    "....#wwww#......",
    "...#w#ww#w#.....",
    "...#k#ww#k#.....",
    "...#wwwwww#.....",
    "....#w#w#w#.....",
    ".....####.......",
    "..#h#wwww#h#....",
    ".#hh#w##w#hh#...",
    ".#hh#wwww#hh#h..",
    "..#h#w##w#h#wh#.",
    "...#wwwwww#.wh#.",
    "....#w##w#..wh#.",
    "....#w##w#..G##.",
    "...#ww##ww#..##.",
    "...###..###....."
  ],

  // 6. Slime (Translucent green bouncy blob with highlight and eyes)
  slime: [
    "................",
    "................",
    "......####......",
    "....##LLLE##....",
    "...#LLLEEEEE#...",
    "..#LLEEEEEEEE#..",
    ".#LEEE##EE##EE#.",
    "#LEEEE##EE##EEE#",
    "#LEEEEEEEEEEEEE#",
    "#LEEEEEEEEEEEEE#",
    "#EEEEEEEEEEEEEE#",
    "#EEEEEEEEEEEEEE#",
    ".#eeeeeeeeeeee#.",
    "..#eeeeeeeeee#..",
    "...##########...",
    "................"
  ]
};

console.log('Validating sprites...');
for (const [name, rows] of Object.entries(SPRITES)) {
  if (rows.length !== 16) throw new Error(`${name} has ${rows.length} rows (expected 16)`);
  for (let r = 0; r < rows.length; r++) {
    if (rows[r].length !== 16) throw new Error(`${name} row ${r} has ${rows[r].length} cols (expected 16)`);
    for (let c = 0; c < rows[r].length; c++) {
      const char = rows[r][c];
      if (PALETTE[char] === undefined) throw new Error(`${name} unknown char: '${char}' at (${r},${c})`);
    }
  }
  console.log(`- ${name}: 16x16 OK`);
}
console.log('All prototype sprites verified 100% valid!');
