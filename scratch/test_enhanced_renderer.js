const fs = require('fs');

console.log('Testing enhanced terrain features in renderer.js...');

let code = fs.readFileSync('fantasy_world/js/renderer.js', 'utf8');

// Enhance drawEnhancedTerrainFeatures with wild flowers, water lilies, wagon ruts, and grass blades
const targetHeader = '        // D. 목조 다리 디테일 (Wooden Bridge with Planks & Posts - Images 2, 3, 5)';
const targetIdx = code.indexOf(targetHeader);

if (targetIdx === -1) {
  console.error('Target header not found in renderer.js!');
  process.exit(1);
}

const additionalTerrainDetails = `
        // E. [젤다 BotW 스타일] 야생 초원 & 꽃밭 & 조약돌 필드 (Lush Grassy Meadows & Wildflowers)
        if (t === TILE.GRASS || t === TILE.MEADOW) {
          // 자연스러운 잔디 풀잎 (Swaying Grass Blades)
          const gOff = Math.sin(timeSec * 2.5 + tx * 0.5) * 1.0;
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(px + (h % 20) + 4 + gOff, py + ((h >> 2) % 20) + 4, 1, 3);
          ctx.fillStyle = '#15803d';
          ctx.fillRect(px + (h % 20) + 4, py + ((h >> 2) % 20) + 7, 1, 1);

          // 다채로운 야생화 군락 (Wildflowers: Daisies, Poppies, Lavender)
          if ((h & 15) === 0) {
            const flowerType = (h >> 4) % 3;
            const fx = px + ((h >> 3) % 22) + 5;
            const fy = py + ((h >> 6) % 22) + 5;
            if (flowerType === 0) {
              // 노란 민들레 & 데이지
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(fx - 1, fy - 1, 3, 3);
              ctx.fillStyle = '#facc15';
              ctx.fillRect(fx, fy, 1, 1);
            } else if (flowerType === 1) {
              // 붉은 양귀비꽃
              ctx.fillStyle = '#dc2626';
              ctx.fillRect(fx - 1, fy - 1, 3, 3);
              ctx.fillStyle = '#f87171';
              ctx.fillRect(fx, fy, 1, 1);
            } else {
              // 보라색 라벤더 꽃
              ctx.fillStyle = '#9333ea';
              ctx.fillRect(fx, fy - 2, 2, 4);
              ctx.fillStyle = '#c084fc';
              ctx.fillRect(fx, fy - 1, 2, 2);
            }
          }
        }

        // F. 맑은 연안 & 호수 잔물결 및 수련잎 (Water Lilies & Animated Ripples)
        if (t === TILE.WATER) {
          const wPhase = (timeSec * 2.0 + tx * 0.4 + ty * 0.6) % (Math.PI * 2);
          const ripX = Math.round(Math.sin(wPhase) * 2);
          ctx.fillStyle = 'rgba(147, 197, 253, 0.45)';
          ctx.fillRect(px + (h % 16) + 6 + ripX, py + ((h >> 3) % 18) + 6, 6, 1);

          // 수련잎 및 분홍 연꽃 (Water Lily Pad)
          if ((h & 31) === 0) {
            const lx = px + ((h >> 4) % 18) + 7;
            const ly = py + ((h >> 7) % 18) + 7;
            ctx.fillStyle = '#166534';
            ctx.beginPath();
            ctx.arc(lx, ly, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f472b6'; // 분홍 연꽃
            ctx.fillRect(lx - 1, ly - 1, 2, 2);
          }
        }

`;

code = code.slice(0, targetIdx) + additionalTerrainDetails + code.slice(targetIdx);

fs.writeFileSync('fantasy_world/js/renderer.js', code);
console.log('Successfully enhanced renderer.js with wildflowers and water lilies!');
