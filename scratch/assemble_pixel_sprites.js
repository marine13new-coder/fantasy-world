// scratch/assemble_pixel_sprites.js
const fs = require('fs');

const baseContent = fs.readFileSync('fantasy_world/js/pixel_sprites.js', 'utf8');

// Load NEW_SPRITES from scratch/test_sprite_variety.js
const testVariety = fs.readFileSync('scratch/test_sprite_variety.js', 'utf8');
const newSpritesMatch = testVariety.match(/const NEW_SPRITES = \{([\s\S]*?)\n\};\n\nlet errors/);
if (!newSpritesMatch) {
  console.error('Could not extract NEW_SPRITES');
  process.exit(1);
}

const harpySprites = `
  harpy_down_0: [
    "..#p#......#p#..",
    ".#pp#......#pp#.",
    "#ppp#..##..#ppp#",
    "#pppp##pp##pppp#",
    ".#pppf#ff#fppp#.",
    "..#ppffffffpp#..",
    "...#ffffffff#...",
    "....#ff##ff#....",
    "...#PffffffP#...",
    "..#PP######PP#..",
    ".#PP#......#PP#.",
    ".#P#........#P#.",
    "..#yy#....#yy#..",
    "..####....####.."
  ],
  harpy_down_1: [
    "................",
    ".......##.......",
    ".....##pp##.....",
    "...##pppppp##...",
    ".##ppppffpppp##.",
    "#ppppffffffpppp#",
    ".##ffffffffff##.",
    "...#ffffffff#...",
    "....#ff##ff#....",
    "...#PffffffP#...",
    "..#PP######PP#..",
    "..#yy#....#yy#..",
    "..####....####..",
    "................"
  ],
  harpy_attack: [
    "..#p#......#p#..",
    ".#pp#..##..#pp#.",
    "#ppp#.#ff#.#ppp#",
    ".#ppffffffffpp#.",
    "..#ffffffffff#..",
    "...#ffffffff#...",
    "...#PffffffP#...",
    "..#PP######PP#..",
    ".#PP#......#PP#.",
    ".#P#........#P#.",
    ".#yyy#....#yyy#.",
    ".#####....#####.",
    "................",
    "................"
  ],
  skeleton_archer_down_0: [
    ".....######.....",
    "....#xxxxxx#....",
    "...#xxkkkkxx#...",
    "...#x#ee##ex#...",
    "...#xkkkkkkx#...",
    "....#xkhhkx#....",
    ".....#xxxx#...#.",
    "....##ssss##..#l",
    "...#x#ssss#x#.ll",
    "..#xx#smmms#xxll",
    "..#xx#smmms#xx#l",
    "...##ssssss##..#",
    "....#x#..#x#....",
    "...#xx#..#xx#...",
    "...#xx#..#xx#...",
    "...###....###..."
  ],
  skeleton_archer_down_1: [
    ".....######.....",
    "....#xxxxxx#....",
    "...#xxkkkkxx#...",
    "...#x#ee##ex#...",
    "...#xkkkkkkx#...",
    "....#xkhhkx#....",
    ".....#xxxx#...#.",
    "....##ssss##..#l",
    "...#x#ssss#x#.ll",
    "..#xx#smmms#xxll",
    "..#xx#smmms#xx#l",
    "...##ssssss##..#",
    "...#x#....#x#...",
    "..#xx#....#xx#..",
    "..#xx#....#xx#..",
    "..###......###.."
  ],
  skeleton_archer_attack: [
    ".....######.....",
    "....#xxxxxx#....",
    "...#xxkkkkxx#...",
    "...#x#ee##ex#...",
    "....#xkhhkx#....",
    "....##ssss##..#.",
    "...#x#ssss#x#lll",
    "..#xx#smmms#xhLL",
    "...##ssssss##lll",
    "....#x####x#..#.",
    "...#xx#..#xx#...",
    "...###....###..."
  ],
`;

const combinedNewSprites = newSpritesMatch[1] + ',\n' + harpySprites;

// Replace the RAW_SPRITES insertion point
// Find the end of RAW_SPRITES: right before `  };` and `class PixelSpriteAtlas {`
const endOfRawSpritesIndex = baseContent.indexOf('  };\n\n  class PixelSpriteAtlas {');
if (endOfRawSpritesIndex === -1) {
  console.error('Could not find end of RAW_SPRITES in pixel_sprites.js');
  process.exit(1);
}

let updated = baseContent.slice(0, endOfRawSpritesIndex) + ',\n' + combinedNewSprites + baseContent.slice(endOfRawSpritesIndex);

// Now update getBaseKeyForEntity
const oldGetBaseKey = baseContent.match(/    \/\/ 엔티티 베이스 스프라이트 식별\n    getBaseKeyForEntity\(e\) \{[\s\S]*?\n    \}/);
if (!oldGetBaseKey) {
  console.error('Could not find getBaseKeyForEntity');
  process.exit(1);
}

const newGetBaseKey = `    // 엔티티 베이스 스프라이트 정밀 분류 (Every creature is distinct!)
    getBaseKeyForEntity(e) {
      if (e.role === 'player') return 'hero';
      if (e.role === 'king') return 'king';
      if (e.role === 'priest' || e.role === 'cleric' || (e.subClass && e.subClass.includes('사제'))) return 'priest';
      if (e.role === 'merchant') return 'merchant';
      if (e.race === 'dragonkin' || e.role === 'dragonkin') return 'dragonkin';
      if (e.role === 'royal_guard' || e.role === 'guard') return 'guard';
      if (e.role === 'crusader') return 'crusader';
      if (e.role === 'soldier') {
        if (e.homeId && (e.homeId.includes('necropolis') || e.homeId.includes('obsidian'))) return 'skeleton';
        return (e.id % 3 === 0) ? 'crusader' : ((e.id % 2 === 0) ? 'guard' : 'knight');
      }

      // 전문 직업군
      if (e.role === 'farmer') return 'farmer';
      if (e.role === 'miner') return 'miner';
      if (e.role === 'blacksmith') return 'blacksmith';
      if (e.role === 'fisherman') return 'fisherman';
      if (e.role === 'bard') return 'bard';

      if (e.role === 'adventurer' || e.role === 'mercenary') {
        if (e.race === 'dwarf') return 'dwarf';
        if (e.race === 'elf') return 'elf';
        if (e.race === 'undead') return 'skeleton';
        return (e.id % 2 === 0) ? 'paladin' : 'crusader';
      }

      // 몬스터 정밀 세부 분류 (Individual Visual Identity)
      if (e.role === 'monster') {
        const name = e.name || '';
        const sub = e.subClass || '';
        const mtype = e.monsterType || '';

        // 1. 해골 / 리치 / 사신 언데드 군단
        if (mtype === 'lich' || name.includes('리치') || sub.includes('리치')) return 'lich';
        if (mtype === 'reaper' || name.includes('사신') || name.includes('리퍼') || name.includes('망령 흑기사')) return 'reaper';
        if (mtype === 'skeleton_archer' || name.includes('해골 궁수') || (sub.includes('언데드') && name.includes('궁수'))) return 'skeleton_archer_down';
        if (mtype === 'skeleton' || name.includes('스켈레톤') || name.includes('해골') || sub.includes('언데드') || e.homeId === 'obsidian_necropolis') return 'skeleton';

        // 2. 미라 & 사막 괴수
        if (mtype === 'mummy' || name.includes('미라') || name.includes('머미')) return 'mummy';
        if (mtype === 'scorpion' || name.includes('전갈') || name.includes('스콜피온')) return 'scorpion';

        // 3. 골렘 (화염 / 얼음)
        if (mtype === 'lava_golem' || mtype === 'fire_golem' || name.includes('화염골렘') || name.includes('용암골렘') || name.includes('화염 골렘')) return 'fire_golem';
        if (mtype === 'ice_golem' || name.includes('얼음골렘') || name.includes('빙결골렘') || name.includes('얼음 골렘')) return 'ice_golem';

        // 4. 설원 / 한대 괴수
        if (mtype === 'yeti' || name.includes('예티') || name.includes('설인')) return 'yeti';
        if (mtype === 'wolf_frost' || name.includes('서리 늑대') || name.includes('빙결 늑대')) return 'wolf_frost';

        // 5. 원시림 / 자연 정령 & 비행 마수
        if (mtype === 'treant' || name.includes('트렌트') || name.includes('나무 정령') || name.includes('세계수')) return 'treant';
        if (mtype === 'harpy' || name.includes('하피') || name.includes('가고일') || mtype === 'gargoyle') return 'harpy';

        // 6. 마수 & 지옥견
        if (mtype === 'hellhound' || name.includes('지옥') || name.includes('헬하운드') || name.includes('케르베로스')) return 'hellhound';

        // 7. 오크 부족 (전사 / 샤먼)
        if (mtype === 'orc_shaman' || name.includes('샤먼') || name.includes('주술사')) return 'orc_shaman';
        if (mtype === 'orc' || mtype === 'orc_berserker' || sub.includes('오크') || name.includes('오크') || e.homeId === 'orc_stronghold') return 'orc';

        // 8. 고블린 부족 (도적 / 덫사냥꾼)
        if (mtype === 'goblin_archer' || name.includes('사냥꾼') || name.includes('궁수')) return 'goblin_archer';
        if (mtype === 'goblin' || name.includes('고블린') || e.homeId === 'goblin_camp') return 'goblin';

        // 9. 대해적 선단
        if (mtype === 'pirate_captain' || name.includes('해적선장') || name.includes('블랙비어드')) return 'pirate_captain';
        if (mtype === 'pirate_raider' || mtype === 'pirate_sailor' || name.includes('해적') || e.homeId === 'pirate_cove') return 'pirate_captain';

        // 10. 용족
        if (e.race === 'dragonkin' || name.includes('용족') || name.includes('드래고니안')) return 'dragonkin';

        // 11. 기타
        if (name.includes('슬라임')) return 'slime';
        if (name.includes('박쥐')) return 'bat';
        if (name.includes('늑대')) return 'wolf';

        return (e.id % 4 === 0) ? 'orc' : ((e.id % 3 === 0) ? 'skeleton' : ((e.id % 2 === 0) ? 'goblin_archer' : 'goblin'));
      }

      // 동물
      if (e.role === 'animal') {
        const at = e.animalType;
        if (at === 'horse') return 'horse';
        if (at === 'bear') return 'bear';
        if (at === 'wolf') return (e.name && (e.name.includes('서리') || e.name.includes('빙결'))) ? 'wolf_frost' : 'wolf';
        if (at === 'deer') return 'deer';
        if (at === 'turtle') return 'turtle';
        if (at === 'camel') return 'camel';
        return 'deer';
      }

      return 'knight';
    }`;

updated = updated.replace(oldGetBaseKey[0], newGetBaseKey);

// Update drawEquippedGear
const oldDrawGear = updated.match(/    drawEquippedGear\(ctx, e, px, py, bounce, dir, isAttacking, timeSec, sc\) \{[\s\S]*?\n    \}/);
if (!oldDrawGear) {
  console.error('Could not find drawEquippedGear');
  process.exit(1);
}

const newDrawGear = `    drawEquippedGear(ctx, e, px, py, bounce, dir, isAttacking, timeSec, sc) {
      if (!window.PixelItems) return;

      // 무기 결정
      let weaponId = null;
      let shieldId = null;

      if (e.role === 'player') {
        const rpg = (window.game && window.game.rpg) ? window.game.rpg : null;
        weaponId = (rpg && rpg.equipment && rpg.equipment.weapon) ? rpg.equipment.weapon.id : 'sword_excalibur';
        shieldId = (rpg && rpg.equipment && rpg.equipment.shield) ? rpg.equipment.shield.id : 'shield_dragon';
      } else if (e.role === 'soldier' || e.role === 'guard') {
        weaponId = 'sword_steel';
        shieldId = 'shield_iron';
      } else if (e.role === 'crusader') {
        weaponId = 'sword_steel';
        shieldId = 'shield_iron';
      } else if (e.role === 'priest' || e.role === 'cleric') {
        weaponId = 'lance_holy';
      } else if (e.role === 'adventurer' || e.role === 'mercenary') {
        weaponId = (e.race === 'dwarf') ? 'axe_battle' : ((e.race === 'elf') ? 'bow_frost' : 'sword_steel');
      } else if (e.role === 'monster') {
        const name = e.name || '';
        const mtype = e.monsterType || '';
        if (mtype === 'orc_shaman' || name.includes('샤먼')) weaponId = 'staff_arcane';
        else if (mtype === 'orc' || mtype === 'orc_berserker' || name.includes('오크')) weaponId = 'axe_battle';
        else if (mtype === 'skeleton_archer' || name.includes('궁수')) weaponId = 'bow_frost';
        else if (mtype === 'skeleton' || name.includes('스켈레톤')) weaponId = 'sword_steel';
        else if (mtype === 'goblin_archer') weaponId = 'bow_elven';
        else if (mtype === 'goblin' || name.includes('고블린')) weaponId = 'dagger_poison';
        else if (mtype === 'reaper' || name.includes('사신') || name.includes('리퍼')) weaponId = 'scythe_shadow';
        else if (mtype === 'lich' || name.includes('리치')) weaponId = 'staff_arcane';
        else if (mtype === 'pirate_captain' || name.includes('해적')) weaponId = 'saber_pirate';
        else if (e.race === 'dragonkin' || name.includes('용족')) weaponId = 'sword_flame';
        else if (mtype === 'treant' || name.includes('트렌트')) weaponId = 'staff_nature';
      }

      if (!weaponId) return;

      const wCvs = window.PixelItems.getCanvas(weaponId);
      if (!wCvs) return;

      ctx.save();
      const isLeft = (dir === 'left');
      const sideSign = isLeft ? -1 : 1;

      // 손의 위치 기준점 (Hand anchor)
      const handX = px + sideSign * 8 * sc;
      const handY = py - 10 * sc - bounce;

      if (isAttacking) {
        // 공격 모션: 검기 호(Slash Arc) 및 무기 휘두르기 회전
        const swingProgress = (Math.sin(timeSec * 16 + (e.id || 0)) + 1) / 2;
        const swingAngle = (isLeft ? -1 : 1) * (0.8 - swingProgress * 1.8);

        ctx.translate(handX, handY);
        ctx.rotate(swingAngle);
        ctx.drawImage(wCvs, -6 * sc, -18 * sc, 18 * sc, 18 * sc);
        ctx.restore();

        // 화려한 픽셀 참격 궤적 (Slash Arc Particle Trail)
        ctx.save();
        let slashColor = '#f8fafc';
        if (weaponId.includes('flame') || weaponId.includes('magma')) slashColor = '#f97316';
        else if (weaponId.includes('excalibur') || weaponId.includes('frost')) slashColor = '#38bdf8';
        else if (weaponId.includes('poison') || weaponId.includes('nature')) slashColor = '#4ade80';
        else if (weaponId.includes('shadow') || weaponId.includes('arcane')) slashColor = '#c084fc';
        else if (weaponId.includes('holy') || weaponId.includes('gold')) slashColor = '#facc15';

        ctx.strokeStyle = slashColor;
        ctx.lineWidth = 2 * sc;
        ctx.beginPath();
        const arcCenter = px + sideSign * 4 * sc;
        const startAng = isLeft ? Math.PI * 0.7 : Math.PI * 0.3;
        const endAng = isLeft ? Math.PI * 1.3 : -Math.PI * 0.3;
        ctx.arc(arcCenter, py - 10 * sc - bounce, 16 * sc, startAng, endAng, isLeft);
        ctx.stroke();

        // 반짝이는 참격 스파크 픽셀
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(arcCenter + sideSign * 14 * sc, py - 14 * sc - bounce, 3 * sc, 3 * sc);
        ctx.fillRect(arcCenter + sideSign * 18 * sc, py - 6 * sc - bounce, 2 * sc, 2 * sc);
        ctx.restore();
      } else {
        // 대기 / 이동 모션: 자연스럽게 손에 쥐거나 옆구리에 찬 모습
        ctx.translate(handX, handY);
        if (dir === 'up') {
          ctx.rotate(isLeft ? 0.4 : -0.4);
          ctx.drawImage(wCvs, -4 * sc, -14 * sc, 14 * sc, 14 * sc);
        } else {
          ctx.rotate(isLeft ? -0.35 : 0.35);
          ctx.drawImage(wCvs, -4 * sc, -12 * sc, 15 * sc, 15 * sc);
        }
        ctx.restore();
      }

      // 방패 렌더링 (반대편 손)
      if (shieldId && (dir === 'down' || dir === 'left' || dir === 'right')) {
        const sCvs = window.PixelItems.getCanvas(shieldId);
        if (sCvs) {
          ctx.save();
          const shieldX = px - sideSign * 7 * sc;
          const shieldY = py - 9 * sc - bounce;
          ctx.drawImage(sCvs, shieldX - 6 * sc, shieldY - 7 * sc, 13 * sc, 13 * sc);
          ctx.restore();
        }
      }
    }`;

updated = updated.replace(oldDrawGear[0], newDrawGear);

fs.writeFileSync('fantasy_world/js/pixel_sprites.js', updated, 'utf8');
console.log('Successfully updated fantasy_world/js/pixel_sprites.js with all new sprites and distinct classifications!');
