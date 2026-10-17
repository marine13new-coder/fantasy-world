const fs = require('fs');

console.log('Patching pixel_sprites.js with Loreon Kingdom characters and 4-directional Croc...');

let code = fs.readFileSync('fantasy_world/js/pixel_sprites.js', 'utf8');

// The new sprite definitions to insert into RAW_SPRITES
const newSprites = `
    // =========================================================================
    // LOREON KINGDOM SPRITES (Reference Images 2 & 3 Matching)
    // =========================================================================
    // 1. ⚔️ 로레온 나이트 커맨더 (Knight Commander - Crimson Plume & Gold Trim)
    commander_down_0: [
      "......##RRRR##......",
      ".....#RRRRRRRR#.....",
      ".....#R#mmmm#R#.....",
      ".....##mh##hm##.....",
      "....#shhmmmmhhs#....",
      "....#s#ffffff#s#....",
      "....#s#ff##ff#s#....",
      "...#Gg#ffffff#gG#...",
      "..#GyG#ssssss#GyG#..",
      "..#Gyy#bBBBBb#yyG#..",
      "..#yyy#bBBBBb#yyy#h.",
      "..#Gyy#bYYYYb#yyG#wh",
      "..#GyG#bBBBBb#GyG#wh",
      "...#Gg#bbBBbb#gG#Gwh",
      "....##bBBBBBBb##.Gwh",
      "...#sssm####msss#.G#",
      "...#shhm#..#mhhs#...",
      "...#shhm#..#mhhs#...",
      "...#mmmm#..#mmmm#...",
      "....####....####...."
    ],
    commander_down_1: [
      "......##RRRR##......",
      ".....#RRRRRRRR#.....",
      ".....#R#mmmm#R#.....",
      ".....##mh##hm##.....",
      "....#shhmmmmhhs#....",
      "....#s#ffffff#s#....",
      "....#s#ff##ff#s#....",
      "...#Gg#ffffff#gG#...",
      "..#GyG#ssssss#GyG#..",
      "..#Gyy#bBBBBb#yyG#..",
      "..#yyy#bBBBBb#yyy#h.",
      "..#Gyy#bYYYYb#yyG#wh",
      "..#GyG#bBBBBb#GyG#wh",
      "...#Gg#bbBBbb#gG#Gwh",
      "..#sssm#bBBb#msssGwh",
      "..#shhm#....#mhhsG#.",
      "..#shhm#.....#mhhs#.",
      "..#mmmm#.....#mmmm#.",
      "...####.......####.."
    ],
    commander_down_attack: [
      "......##RRRR##......",
      ".....#RRRRRRRR#.....",
      ".....#R#mmmm#R#.....",
      ".....##mh##hm##.....",
      "....#shhmmmmhhs#..wh",
      "....#s#ffffff#s#.wwh",
      "....#s#ff##ff#s#whhh",
      "...#Gg#ffffff#gGwhhh",
      "..#GyG#ssssss#Gywhhh",
      "..#Gyy#bBBBBb#yywhhh",
      "..#yyy#bBBBBb#yywhhh",
      "..#Gyy#bYYYYb#yywhhh",
      "..#GyG#bBBBBb#GyGwhh",
      "...#Gg#bbBBbb#gG#Gwh",
      "....##bBBBBBBb##..G#",
      "...#sssm####msss#...",
      "...#shhm#..#mhhs#...",
      "...#shhm#..#mhhs#...",
      "...#mmmm#..#mmmm#...",
      "....####....####...."
    ],
    commander_side_0: [
      "....##RRRR##........",
      "...#RRRRRRRR#.......",
      "...#RR#mmmm##.......",
      "...#R#mh##hm#.......",
      "....#shmmmmhs#......",
      "....#sffffff#.......",
      "....#sff##ff#.......",
      "...#Ggffffff#.......",
      "..#GyGssssss#.......",
      "..#GyybBBBBb#.......",
      "..#yyybBBBBb#h......",
      "..#GyybYYYYb#wh.....",
      "..#GyGbBBBBb#wh.....",
      "...#GgbbBBbb#Gwh....",
      "....##bBBBBb##Gwh...",
      "...#sssm##msss#.G#..",
      "...#shhm##mhhs#.....",
      "...#shhm##mhhs#.....",
      "...#mmmm##mmmm#.....",
      "....####..####......"
    ],
    commander_side_1: [
      "....##RRRR##........",
      "...#RRRRRRRR#.......",
      "...#RR#mmmm##.......",
      "...#R#mh##hm#.......",
      "....#shmmmmhs#......",
      "....#sffffff#.......",
      "....#sff##ff#.......",
      "...#Ggffffff#.......",
      "..#GyGssssss#.......",
      "..#GyybBBBBb#.......",
      "..#yyybBBBBb#h......",
      "..#GyybYYYYb#wh.....",
      "..#GyGbBBBBb#wh.....",
      "...#GgbbBBbb#Gwh....",
      "..#sssm#bBb#msss#Gwh",
      "..#shhm#...#mhhs#.G#",
      "..#shhm#....#mhhs#..",
      "..#mmmm#....#mmmm#..",
      "...####......####..."
    ],
    commander_side_attack: [
      "....##RRRR##........",
      "...#RRRRRRRR#.......",
      "...#RR#mmmm##.......",
      "...#R#mh##hm#.....wh",
      "....#shmmmmhs#...wwh",
      "....#sffffff#...whhh",
      "....#sff##ff#..whhhh",
      "...#Ggffffff#.whhhhh",
      "..#GyGssssss#whhhhhh",
      "..#GyybBBBBb#whhhhhh",
      "..#yyybBBBBb#Gwhhhhh",
      "..#GyybYYYYb#..Gwhhh",
      "..#GyGbBBBBb#...Gwhh",
      "...#GgbbBBbb#....Gwh",
      "....##bBBBBb##....G#",
      "...#sssm##msss#.....",
      "...#shhm##mhhs#.....",
      "...#shhm##mhhs#.....",
      "...#mmmm##mmmm#.....",
      "....####..####......"
    ],

    // 2. 👑 로레온 여공작 (Duchess - White Silver Armor & Rapier)
    duchess_down_0: [
      "......######........",
      ".....#yyyyyy#.......",
      "....#yyyyyyyy#......",
      "....#y#ffff#y#......",
      "....#y#f##f#y#......",
      "....#fffffffff#.....",
      "....#f##ff##f#......",
      "...#GgffffffgG#.....",
      "..#Gww#hhhh#wwG#....",
      "..#Gww#hBBh#wwG#....",
      "..#yww#hBBh#wwy#....",
      "..#yww#hYYh#wwy#h...",
      "..#Gww#bBBb#wwG#mh..",
      "...#Gg#bBBb#gG#..mh.",
      "....##bBBBBb##...mhh",
      "...#wwww##wwww#..mhh",
      "...#whhw##whhw#...m#",
      "...#whhw##whhw#.....",
      "...#wwww##wwww#.....",
      "....####..####......"
    ],
    duchess_down_1: [
      "......######........",
      ".....#yyyyyy#.......",
      "....#yyyyyyyy#......",
      "....#y#ffff#y#......",
      "....#y#f##f#y#......",
      "....#fffffffff#.....",
      "....#f##ff##f#......",
      "...#GgffffffgG#.....",
      "..#Gww#hhhh#wwG#....",
      "..#Gww#hBBh#wwG#....",
      "..#yww#hBBh#wwy#....",
      "..#yww#hYYh#wwy#h...",
      "..#Gww#bBBb#wwG#mh..",
      "...#Gg#bBBb#gG#..mh.",
      "..#wwww#bBb#wwww#mhh",
      "..#whhw#...#whhw#mhh",
      "..#whhw#....#whhw#m#",
      "..#wwww#....#wwww#..",
      "...####......####..."
    ],
    duchess_down_attack: [
      "......######........",
      ".....#yyyyyy#.......",
      "....#yyyyyyyy#......",
      "....#y#ffff#y#......",
      "....#y#f##f#y#......",
      "....#fffffffff#..mhh",
      "....#f##ff##f#..mhhh",
      "...#GgffffffgG#mhhhh",
      "..#Gww#hhhh#wwGmhhhh",
      "..#Gww#hBBh#wwGmhhhh",
      "..#yww#hBBh#wwy#mhhh",
      "..#yww#hYYh#wwy##mhh",
      "..#Gww#bBBb#wwG#..m#",
      "...#Gg#bBBb#gG#.....",
      "....##bBBBBb##......",
      "...#wwww##wwww#.....",
      "...#whhw##whhw#.....",
      "...#whhw##whhw#.....",
      "...#wwww##wwww#.....",
      "....####..####......"
    ],

    // 3. 🏹 로레온 왕립 레인저 (Royal Ranger / Archer - Cowl & Quiver)
    archer_down_0: [
      "......######........",
      ".....#DDDDDD#.......",
      "....#DEDDDED#.......",
      "....#DE#ffff#D#.....",
      "....#D#ff##ff#D#....",
      "....#Dffffffff#D#...",
      "....#D#ffffff#D#....",
      "...#OO#ffffff#OO#...",
      "..#OlO#OllO#OlO#o...",
      "..#OlO#OOOO#OlO#ol..",
      "..#OOO#OllO#OOO#olw.",
      "..#OlO#OOOO#OlO#olww",
      "..#OOO#OllO#OOO#olw.",
      "...#OO#OOOO#OO#..ol.",
      "....##OOOOOO##...o..",
      "...#OOOO##OOOO#.....",
      "...#OllO##OllO#.....",
      "...#OllO##OllO#.....",
      "...#oooo##oooo#.....",
      "....####..####......"
    ],
    archer_down_1: [
      "......######........",
      ".....#DDDDDD#.......",
      "....#DEDDDED#.......",
      "....#DE#ffff#D#.....",
      "....#D#ff##ff#D#....",
      "....#Dffffffff#D#...",
      "....#D#ffffff#D#....",
      "...#OO#ffffff#OO#...",
      "..#OlO#OllO#OlO#o...",
      "..#OlO#OOOO#OlO#ol..",
      "..#OOO#OllO#OOO#olw.",
      "..#OlO#OOOO#OlO#olww",
      "..#OOO#OllO#OOO#olw.",
      "...#OO#OOOO#OO#..ol.",
      "..#OOOO#OO#OOOO#.o..",
      "..#OllO#..#OllO#....",
      "..#OllO#...#OllO#...",
      "..#oooo#...#oooo#...",
      "...####.....####...."
    ],
    archer_down_attack: [
      "......######........",
      ".....#DDDDDD#.......",
      "....#DEDDDED#.......",
      "....#DE#ffff#D#.....",
      "....#D#ff##ff#D#....",
      "....#Dffffffff#D#...",
      "....#D#ffffff#D#..o.",
      "...#OO#ffffff#OO#ool",
      "..#OlO#OllO#OlO#oolw",
      "..#OlO#OOOO#OlO#oolw",
      "..#OOO#OllO#OOO#oolw",
      "..#OlO#OOOO#OlO#oolw",
      "..#OOO#OllO#OOO#oolw",
      "...#OO#OOOO#OO#..oow",
      "....##OOOOOO##....o.",
      "...#OOOO##OOOO#.....",
      "...#OllO##OllO#.....",
      "...#OllO##OllO#.....",
      "...#oooo##oooo#.....",
      "....####..####......"
    ],

    // 4. 🔮 로레온 왕립 비전 마도사 (Royal Mage - Blue Robe & Arcane Orb Staff)
    mage_down_0: [
      "......######........",
      ".....#bbbbbb#.......",
      "....#bBBbbBBb#......",
      "....#bB#ffff#b#..cC.",
      "....#b#ff##ff#b#.CcC",
      "....#bffffffff#b#cC.",
      "....#b#ffffff#b#..o.",
      "...#yY#ffffff#Yy#.o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bYYYYb#BBb#o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bYYYYb#BBb#o.",
      "...#bB#bBBBBb#Bb#.o.",
      "....##bBBBBBBb##..o.",
      "...#bBBb####bBBb#.o.",
      "...#bbbb#..#bbbb#...",
      "...#bbbb#..#bbbb#...",
      "...#oooo#..#oooo#...",
      "....####....####...."
    ],
    mage_down_1: [
      "......######........",
      ".....#bbbbbb#.......",
      "....#bBBbbBBb#......",
      "....#bB#ffff#b#..cC.",
      "....#b#ff##ff#b#.CcC",
      "....#bffffffff#b#cC.",
      "....#b#ffffff#b#..o.",
      "...#yY#ffffff#Yy#.o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bYYYYb#BBb#o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bYYYYb#BBb#o.",
      "...#bB#bBBBBb#Bb#.o.",
      "..#bBBb#bBB#bBBb#.o.",
      "..#bbbb#...#bbbb#...",
      "..#bbbb#....#bbbb#..",
      "..#oooo#....#oooo#..",
      "...####......####..."
    ],
    mage_down_attack: [
      "......######.....CCC",
      ".....#bbbbbb#...CCCCC",
      "....#bBBbbBBb#..CCCCC",
      "....#bB#ffff#b#..CCC",
      "....#b#ff##ff#b#..o.",
      "....#bffffffff#b#.o.",
      "....#b#ffffff#b#..o.",
      "...#yY#ffffff#Yy#.o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bYYYYb#BBb#o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bBBBBb#BBb#o.",
      "..#bBB#bYYYYb#BBb#o.",
      "...#bB#bBBBBb#Bb#.o.",
      "....##bBBBBBBb##..o.",
      "...#bBBb####bBBb#.o.",
      "...#bbbb#..#bbbb#...",
      "...#bbbb#..#bbbb#...",
      "...#oooo#..#oooo#...",
      "....####....####...."
    ],

    // 5. 🐺 다이어울프 라이더 (Wolf Rider - Mounted Scout)
    wolfrider_down_0: [
      "......######........",
      ".....#DDDDDD#.......",
      "....#DEffffED#......",
      "....#DffffffD#......",
      "....#D#ffff#D#......",
      "...#qq#ssss#qq#.....",
      "..#qqqq#ss#qqqq#....",
      ".#qq#qqqqqqqq#qq#...",
      ".#q#qqq####qqq#q#...",
      ".##qqqq#ee#qqqq##...",
      "...#qqq#ww#qqq#.....",
      "...#qqq####qqq#.....",
      "..#qqqqqqqqqqqq#....",
      "..#qqqqssssqqqq#....",
      "..#qqqqssssqqqq#....",
      "...#qqq#..#qqq#.....",
      "...#qqq#..#qqq#.....",
      "...#qqq#..#qqq#.....",
      "...#ooo#..#ooo#.....",
      "....###....###......"
    ],
    wolfrider_down_1: [
      "......######........",
      ".....#DDDDDD#.......",
      "....#DEffffED#......",
      "....#DffffffD#......",
      "....#D#ffff#D#......",
      "...#qq#ssss#qq#.....",
      "..#qqqq#ss#qqqq#....",
      ".#qq#qqqqqqqq#qq#...",
      ".#q#qqq####qqq#q#...",
      ".##qqqq#ee#qqqq##...",
      "...#qqq#ww#qqq#.....",
      "...#qqq####qqq#.....",
      "..#qqqqqqqqqqqq#....",
      "..#qqqqssssqqqq#....",
      "..#qqqqssssqqqq#....",
      "..#qqq#....#qqq#....",
      "..#qqq#.....#qqq#...",
      "..#qqq#.....#qqq#...",
      "..#ooo#.....#ooo#...",
      "...###.......###...."
    ],
    wolfrider_attack: [
      "......######........",
      ".....#DDDDDD#.....wh",
      "....#DEffffED#...wwh",
      "....#DffffffD#..whhh",
      "....#D#ffff#D#.whhhh",
      "...#qq#ssss#qqwhhhhh",
      "..#qqqq#ss#qqqqwhhhh",
      ".#qq#qqqqqqqq#qq#Gwh",
      ".#q#qqq####qqq#q#.G#",
      ".##qqqq#ee#qqqq##...",
      "...#qqq#ww#qqq#.....",
      "...#qqq####qqq#.....",
      "..#qqqqqqqqqqqq#....",
      "..#qqqqssssqqqq#....",
      "..#qqqqssssqqqq#....",
      "...#qqq#..#qqq#.....",
      "...#qqq#..#qqq#.....",
      "...#qqq#..#qqq#.....",
      "...#ooo#..#ooo#.....",
      "....###....###......"
    ],

    // =========================================================================
    // 6. 🐊 진짜 악어 (Crocodile - Realistic Low Reptile Body & Razor Snout)
    // =========================================================================
    croc_side_0: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "...........#DED#....",
      "..........#DEDLD#...",
      ".....#o##DDEDDDED#..",
      "...#oDDDDDDDDDDEDy#.",
      "..#DDDDDDDDDDDDDDww#",
      ".#oDDDDDDDDDDDDDDww#",
      ".#DDDDD#DDDDDDDDww#.",
      "..#DDDD##DDDD####...",
      "...#o#o#..#o#o#.....",
      "....###....###......"
    ],
    croc_side_1: [
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "....................",
      "...........#DED#....",
      "..........#DEDLD#...",
      ".....#o##DDEDDDED#..",
      "..#oDDDDDDDDDDDEDy#.",
      ".#DDDDDDDDDDDDDDDww#",
      "..#oDDDDDDDDDDDDDww#",
      "...#DDDD#DDDDDDDww#.",
      "....#DDDD##DDD####..",
      "....#o#o#..#o#o#....",
      ".....###....###....."
    ],
    croc_up_0: [
      ".....####..####.....",
      "....#o#DD##DD#o#....",
      "...#oD#DDDDDD#Do#...",
      "....##DDEDDEDD##....",
      ".....#DDEDDEDD#.....",
      ".....#DDLEDDLD#.....",
      ".....#DDEDDEDD#.....",
      "....#o#DDDDDD#o#....",
      "...#oD#DDDDDD#Do#...",
      "....##DDDDDDDD##....",
      ".....#DDEDDEDD#.....",
      ".....#DDEDDEDD#.....",
      "......#DEDDED#......",
      ".......#DEDD#.......",
      "........#DD#........",
      ".........##........."
    ],
    croc_up_1: [
      ".....####..####.....",
      "...#o#DD#..#DD#o#...",
      "...#oD#DD##DD#Do#...",
      "....##DDDDDDDD##....",
      ".....#DDEDDEDD#.....",
      ".....#DDLEDDLD#.....",
      ".....#DDEDDEDD#.....",
      "....#o#DDDDDD#o#....",
      ".....#oDDDDDD#Do#...",
      "....##DDDDDDDD##....",
      ".....#DDEDDEDD#.....",
      ".....#DDEDDEDD#.....",
      "......#DEDDED#......",
      ".......#DEDD#.......",
      "........#DD#........",
      ".........##........."
    ],
`;

// Insert newSprites into RAW_SPRITES right after "const RAW_SPRITES = {"
const targetHeader = '  const RAW_SPRITES = {';
const headerIdx = code.indexOf(targetHeader);
if (headerIdx === -1) {
  console.error('Target header for RAW_SPRITES not found!');
  process.exit(1);
}

code = code.slice(0, headerIdx + targetHeader.length) + newSprites + code.slice(headerIdx + targetHeader.length);

// Now update getBaseKeyForEntity to map the new Loreon Kingdom roles & classes
const entityKeyTarget = '    getBaseKeyForEntity(e) {';
const entityKeyIdx = code.indexOf(entityKeyTarget);
if (entityKeyIdx === -1) {
  console.error('getBaseKeyForEntity target not found!');
  process.exit(1);
}

const keyMappingUpdates = `
      // Loreon Kingdom 고유 비주얼 맵핑 (Knight Commander, Duchess, Ranger, Mage, Wolf Rider)
      const eName = e.name || '';
      const eSub = e.subClass || '';

      if (e.role === 'commander' || eName.includes('커맨더') || eName.includes('사령관') || eSub.includes('사령관')) {
        return 'commander';
      }
      if (e.role === 'duchess' || eName.includes('여공작') || eName.includes('공작부인') || eSub.includes('공작')) {
        return 'duchess';
      }
      if (e.role === 'ranger' || e.role === 'archer' || eName.includes('궁수') || eName.includes('레인저') || eSub.includes('순찰대')) {
        return 'archer';
      }
      if (e.role === 'mage' || e.role === 'wizard' || eName.includes('마법사') || eName.includes('마도사') || eSub.includes('마도사')) {
        return 'mage';
      }
      if (e.role === 'wolfrider' || eName.includes('늑대기수') || eName.includes('울프라이더') || eSub.includes('늑대기사')) {
        return 'wolfrider';
      }
`;

code = code.slice(0, entityKeyIdx + entityKeyTarget.length) + keyMappingUpdates + code.slice(entityKeyIdx + entityKeyTarget.length);

fs.writeFileSync('fantasy_world/js/pixel_sprites.js', code);
console.log('Successfully patched pixel_sprites.js with Loreon Kingdom characters and 4-way crocodile!');
