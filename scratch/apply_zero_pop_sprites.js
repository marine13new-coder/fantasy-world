// scratch/apply_zero_pop_sprites.js
const fs = require('fs');

const content = fs.readFileSync('fantasy_world/js/pixel_sprites.js', 'utf8');
const spritesMatch = content.match(/const RAW_SPRITES = \{([\s\S]*?)\n  \};/);
const RAW_SPRITES = eval('({' + spritesMatch[1] + '})');

// Target dimensions for each base
const targetDims = {};
for (const [k, rows] of Object.entries(RAW_SPRITES)) {
  const base = k.replace(/(_down|_up|_side|_walk|_fly|_action|_attack|_0|_1).*$/, '');
  const w = rows[0].length;
  const h = rows.length;
  if (!targetDims[base]) targetDims[base] = { w, h, maxH: h };
  if (h > targetDims[base].maxH) {
    targetDims[base].maxH = h;
    targetDims[base].h = h;
  }
}

// Special case: Make sure hero attack frames have legs/boots matching hero_down_0
// Hero is 20x20
// Let's create dedicated, anatomically flawless 20x20 attack frames for hero!
RAW_SPRITES.hero_down_attack = [
  "......########......",
  ".....#yYYYYYYy#.....",
  "....#yYyYYYYyYy#....",
  "....#yYyYYYYyYy#....",
  "....#F#ffffff#F#....",
  "....#f#ff##ff#f#....",
  "....#ffffffffff#....",
  "....#f##ffff##f#....",
  "....#RR######RR#..wh",
  "...#RRbBBBBBBbRR#wwh",
  "..#RR#bBBBBBBb#RRwhh",
  "..#RR#bYyYYyYb#RRwhh",
  "..#R#bbBBBBBBbb#Rwhh",
  "..#RR#bbBBBBbb#RRwhh",
  "...##bbBBBBBBbb##Gwh",
  "...#ssss####ssss#Gwh",
  "...#ssss#..#ssss#.G#",
  "...#hhhh#..#hhhh#...",
  "...#hhhh#..#hhhh#...",
  "....####....####...."
];

RAW_SPRITES.hero_up_attack = [
  "......########...wh.",
  ".....#yYYYYYYy#.wwh.",
  "....#yYYYYYYYYy#whh.",
  "....#yYYYYYYYYy#whh.",
  "....#yYYYYYYYYy#whh.",
  "....#yyyYYYYyyy#whh.",
  "....#RRRRRRRRRR#Gwh.",
  "...#RRRRRRRRRRRR#G#.",
  "..#RRRRRRRRRRRRRR#..",
  "..#RRRRRRRRRRRRRR#..",
  "..#RRRRRRRRRRRRRR#..",
  "..#RRRRRRYYRRRRRR#..",
  "..#RRRRRRRRRRRRRR#..",
  "..#RRRRRRRRRRRRRR#..",
  "...##RRRRRRRRRR##...",
  "...#ssss####ssss#...",
  "...#ssss#..#ssss#...",
  "...#hhhh#..#hhhh#...",
  "...#hhhh#..#hhhh#...",
  "....####....####...."
];

RAW_SPRITES.hero_side_attack = [
  "......#######.......",
  ".....#yYYYYYY#......",
  "....#yYYYYYYy#......",
  "....#yYyYYYYy#......",
  "....#ffffff##.......",
  "....#ffff##f#.......",
  "....#ffffffff#......",
  "....#ffffff##.......",
  "...#RRbBBBBb########",
  "..#RR#bBBBBb#wwwhhhh",
  "..#R#bbBBBBb#wwwhhhh",
  "..#RR#bbBBBb#wwwhhhh",
  "...##bbBBBBb#GGGG###",
  "...#ssss####........",
  "...#ssss#...........",
  "...#ssss#...........",
  "...#hhhh#...........",
  "...#hhhh#...........",
  "....####............",
  "...................."
];

// Normalize all other sprites where curH < target.maxH
for (const [k, rows] of Object.entries(RAW_SPRITES)) {
  const base = k.replace(/(_down|_up|_side|_walk|_fly|_action|_attack|_0|_1).*$/, '');
  const target = targetDims[base];
  const curH = rows.length;
  const curW = rows[0].length;

  if (curH < target.maxH) {
    const diff = target.maxH - curH;
    const idleKey = `${base}_down_0`;
    const idleRows = RAW_SPRITES[idleKey] || RAW_SPRITES[Object.keys(RAW_SPRITES).find(name => name.startsWith(base))];

    const newRows = [...rows];
    if (idleRows && idleRows.length === target.maxH) {
      for (let i = target.maxH - diff; i < target.maxH; i++) {
        newRows.push(idleRows[i]);
      }
    } else {
      for (let i = 0; i < diff; i++) {
        newRows.push('.'.repeat(curW));
      }
    }
    RAW_SPRITES[k] = newRows;
  }
}

// Convert RAW_SPRITES to formatted JS string
let rawSpritesJs = '  const RAW_SPRITES = {\n';
const spriteKeys = Object.keys(RAW_SPRITES);
for (let i = 0; i < spriteKeys.length; i++) {
  const k = spriteKeys[i];
  const rows = RAW_SPRITES[k];
  rawSpritesJs += `    ${k}: [\n`;
  for (let r = 0; r < rows.length; r++) {
    const comma = (r < rows.length - 1) ? ',' : '';
    rawSpritesJs += `      "${rows[r]}"${comma}\n`;
  }
  const itemComma = (i < spriteKeys.length - 1) ? ',' : '';
  rawSpritesJs += `    ]${itemComma}\n`;
}
rawSpritesJs += '  };';

// Replace in content
const oldRawSpritesMatch = content.match(/  const RAW_SPRITES = \{[\s\S]*?\n  \};/);
if (!oldRawSpritesMatch) {
  console.error('Could not match RAW_SPRITES');
  process.exit(1);
}

let newContent = content.replace(oldRawSpritesMatch[0], rawSpritesJs);

// Refine draw() in PixelSpriteAtlas:
// 1. Smooth lunge & stagger (no seizure vibration)
// 2. Clean slash particle crescent without double weapon drawing
const oldDraw = newContent.match(/    draw\(ctx, e, px, py, bounce, timeSec, isNight = false\) \{[\s\S]*?\n    \}/);
if (!oldDraw) {
  console.error('Could not match draw()');
  process.exit(1);
}

const newDraw = `    draw(ctx, e, px, py, bounce, timeSec, isNight = false) {
      const baseKey = this.getBaseKeyForEntity(e);

      // 1. 4방향 결정 (Down, Up, Left, Right)
      let dir = e.facing;
      if (!dir) {
        const vx = e.vx || 0;
        const vy = e.vy || 0;
        if (Math.abs(vy) > Math.abs(vx) && Math.abs(vy) > 0.05) {
          dir = vy > 0 ? 'down' : 'up';
        } else if (Math.abs(vx) > 0.05) {
          dir = vx > 0 ? 'right' : 'left';
        } else {
          dir = 'down';
        }
      }

      const isFacingLeft = (dir === 'left');
      const isAttacking = (e.state === 'combat') || ((e.attackCooldown || 0) > 0.3);
      const isMoving = Math.abs(e.vx || 0) > 0.08 || Math.abs(e.vy || 0) > 0.08;

      // 2. 애니메이션 프레임 산출 (보행 시 균형 잡힌 0/1 스텝)
      let animFrame = '0';
      if (isAttacking) {
        animFrame = 'attack';
      } else if (isMoving) {
        const step = Math.floor(((e.animPhase || 0) * 1.5)) % 2;
        animFrame = step === 1 ? '1' : '0';
      } else if (e.role === 'farmer' || e.role === 'miner' || e.role === 'blacksmith' || e.role === 'fisherman' || e.role === 'bard') {
        if (!isNight && Math.sin(timeSec * 2.0 + (e.id || 0)) > 0.3) {
          animFrame = 'action';
        }
      }

      // 3. 캔버스 리졸브
      const cv = this.resolveCanvas(baseKey, dir, animFrame, isFacingLeft);
      if (!cv) return;

      const sc = e.scale || 1.0;
      const sw = cv.width;
      const sh = cv.height;

      // 4. 발밑 정밀 픽셀 타원 그림자 (지면에 견고하게 접지)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.40)';
      ctx.beginPath();
      ctx.ellipse(px, py + 5 * sc, 7 * sc, 3 * sc, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. 공격 시 부드러운 1~2px 전진 런지 & 피격 시 1px 부드러운 스태거 (지터링 제거)
      let offsetX = 0;
      let offsetY = 0;

      if (isAttacking) {
        // 공격 시 부드럽게 앞으로 1.5px 숙이는 안정된 공격 전진
        const lunge = 1.5 * sc;
        if (dir === 'down') offsetY += lunge;
        else if (dir === 'up') offsetY -= lunge;
        else if (dir === 'left') offsetX -= lunge;
        else if (dir === 'right') offsetX += lunge;
      }

      if (e.hitTimer && e.hitTimer > 0) {
        // 피격 시 넉백 방향으로 부드럽게 1~2px 후퇴
        const flinch = (e.hitTimer / 0.25) * 2.0 * sc;
        if (dir === 'down') offsetY -= flinch;
        else if (dir === 'up') offsetY += flinch;
        else if (dir === 'left') offsetX += flinch;
        else if (dir === 'right') offsetX -= flinch;
      }

      // 6. 스프라이트 블릿 (High-Res 1.5x Scaling, Zero-Pop 고정 높이)
      const renderW = Math.round(sw * sc * 1.5);
      const renderH = Math.round(sh * sc * 1.5);
      const renderX = Math.round(px - renderW / 2 + offsetX);
      const renderY = Math.round(py - renderH + 6 * sc - bounce + offsetY);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cv, renderX, renderY, renderW, renderH);

      // 7. 피격 시 선명한 적색 플래시 틴트
      if (e.hitTimer && e.hitTimer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.40)';
        ctx.fillRect(renderX, renderY, renderW, renderH);
        ctx.restore();
      }

      // 8. 공격 시 전방 크리스피 픽셀 참격 궤적 (캐릭터 전면을 가리지 않고 전방에만 선명하게 발도)
      if (isAttacking) {
        ctx.save();
        const sideSign = isFacingLeft ? -1 : 1;
        let slashColor = '#f8fafc';
        if (baseKey === 'dragonkin' || baseKey === 'fire_golem' || baseKey === 'hellhound') slashColor = '#f97316';
        else if (baseKey === 'ice_golem' || baseKey === 'yeti' || baseKey === 'wolf_frost') slashColor = '#38bdf8';
        else if (baseKey === 'lich' || baseKey === 'reaper' || baseKey === 'orc_shaman') slashColor = '#c084fc';
        else if (baseKey === 'goblin' || baseKey === 'goblin_archer' || baseKey === 'treant' || baseKey === 'slime') slashColor = '#4ade80';

        // 참격 호 (Crisp Crescent Slash Arc)
        ctx.strokeStyle = slashColor;
        ctx.lineWidth = 2.0 * sc;
        ctx.beginPath();
        const arcCenterX = px + (dir === 'left' ? -10 : (dir === 'right' ? 10 : 0)) * sc;
        const arcCenterY = py - 8 * sc - bounce + (dir === 'down' ? 6 : (dir === 'up' ? -6 : 0)) * sc;
        const startAng = isFacingLeft ? Math.PI * 0.7 : -Math.PI * 0.3;
        const endAng = isFacingLeft ? Math.PI * 1.3 : Math.PI * 0.3;
        ctx.arc(arcCenterX, arcCenterY, 12 * sc, startAng, endAng, isFacingLeft);
        ctx.stroke();

        // 픽셀 스파크 파편 2개
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(arcCenterX + sideSign * 8 * sc, arcCenterY - 4 * sc, 2 * sc, 2 * sc);
        ctx.fillRect(arcCenterX + sideSign * 11 * sc, arcCenterY + 2 * sc, 1.5 * sc, 1.5 * sc);
        ctx.restore();
      }

      // 9. 방패 장착 캐릭터 (성기사 / 근위병 / 십자군): 반대편 손에 방패 픽셀 블릿
      if ((baseKey === 'crusader' || baseKey === 'guard' || (baseKey === 'hero' && e.hasShield)) && (dir === 'down' || dir === 'left' || dir === 'right')) {
        if (window.PixelItems) {
          const sCvs = window.PixelItems.getCanvas('shield_iron');
          if (sCvs) {
            ctx.save();
            const sideSign = isFacingLeft ? -1 : 1;
            const shieldX = px - sideSign * 8 * sc;
            const shieldY = py - 12 * sc - bounce;
            ctx.drawImage(sCvs, shieldX - 5 * sc, shieldY, 11 * sc, 11 * sc);
            ctx.restore();
          }
        }
      }

      // 10. 생태계 상태 풍선 렌더링 (Ecology Status Balloon Float)
      const bKey = this.getBalloonKeyForEntity(e, isNight);
      if (bKey && this.balloonCache.has(bKey)) {
        const bCvs = this.balloonCache.get(bKey);
        const floatY = Math.round(Math.sin(timeSec * 2.5 + (e.id || 0)) * 2);
        const bx = Math.round(px - bCvs.width / 2);
        const by = Math.round(renderY - bCvs.height - 2 + floatY);
        ctx.drawImage(bCvs, bx, by);
      }
    }`;

newContent = newContent.replace(oldDraw[0], newDraw);

fs.writeFileSync('fantasy_world/js/pixel_sprites.js', newContent, 'utf8');
console.log('Successfully updated fantasy_world/js/pixel_sprites.js with zero-pop normalized sprites and refined draw() engine!');
