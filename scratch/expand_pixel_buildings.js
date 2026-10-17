const fs = require('fs');

console.log('Writing enhanced pixel_buildings.js with complete building archetypes & render dispatcher...');

let code = fs.readFileSync('fantasy_world/js/pixel_buildings.js', 'utf8');

// The new methods to insert before the closing brace of PixelBuildings
const additionalMethods = `
    // =========================================================================
    // 10. 자치 시청 & 시계탑 (Town Hall & Clock Tower)
    // =========================================================================
    drawTownHall(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 건물 바닥 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 2, 7);

      // 석조 본관 1층/2층 (Stone Main Hall)
      ctx.fillStyle = B_PALETTE.stone_dark;
      ctx.fillRect(px - halfW, py - halfH + 8, bw, bh - 8);
      ctx.fillStyle = B_PALETTE.stone_mid;
      ctx.fillRect(px - halfW + 2, py - halfH + 10, bw - 4, bh - 11);

      // 벽돌 줄눈 디테일
      ctx.fillStyle = B_PALETTE.stone_deep;
      for (let ly = py - halfH + 14; ly < py + halfH - 6; ly += 6) {
        ctx.fillRect(px - halfW + 2, ly, bw - 4, 1);
      }

      // 중앙 뾰족 시계탑 (Central Clocktower & Bell Gable)
      const towerW = 12;
      const towerH = 22;
      const towerX = px - Math.round(towerW / 2);
      const towerY = py - halfH - towerH + 8;

      ctx.fillStyle = B_PALETTE.stone_dark;
      ctx.fillRect(towerX - 1, towerY, towerW + 2, towerH);
      ctx.fillStyle = B_PALETTE.stone_light;
      ctx.fillRect(towerX, towerY + 1, towerW, towerH - 1);

      // 원형 황금 시계 (Golden Clock Face)
      ctx.fillStyle = B_PALETTE.stone_deep;
      ctx.beginPath();
      ctx.arc(px, towerY + 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isNight ? B_PALETTE.gold_trim : '#fef08a';
      ctx.beginPath();
      ctx.arc(px, towerY + 8, 4, 0, Math.PI * 2);
      ctx.fill();
      // 시계 바늘
      ctx.fillStyle = B_PALETTE.stone_deep;
      ctx.fillRect(px, towerY + 5, 1, 4);
      ctx.fillRect(px - 1, towerY + 8, 3, 1);

      // 시계탑 원뿔 슬레이트 지붕 (Conical Turret Roof)
      ctx.fillStyle = B_PALETTE.roof_slate_main;
      ctx.beginPath();
      ctx.moveTo(towerX - 3, towerY);
      ctx.lineTo(px, towerY - 14);
      ctx.lineTo(towerX + towerW + 3, towerY);
      ctx.closePath();
      ctx.fill();
      // 황금 피니얼
      ctx.fillStyle = B_PALETTE.gold_trim;
      ctx.fillRect(px - 1, towerY - 18, 2, 5);

      // 본당 지붕 박공 처마
      ctx.fillStyle = B_PALETTE.roof_slate_dark;
      ctx.fillRect(px - halfW - 2, py - halfH + 6, bw + 4, 4);

      // 본당 아치형 창문들 (Arched Hall Windows)
      const winW = 6, winH = 8;
      const drawWin = (wx, wy) => {
        ctx.fillStyle = B_PALETTE.stone_deep;
        ctx.fillRect(wx - 1, wy - 1, winW + 2, winH + 2);
        ctx.fillStyle = isNight ? B_PALETTE.window_night : B_PALETTE.window_day;
        ctx.fillRect(wx, wy, winW, winH);
        ctx.fillStyle = B_PALETTE.window_frame;
        ctx.fillRect(wx + 2, wy, 1, winH);
        ctx.fillRect(wx, wy + 4, winW, 1);
        if (isNight) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
          ctx.fillRect(wx - 2, wy - 2, winW + 4, winH + 4);
        }
      };
      drawWin(px - halfW + 6, py - halfH + 16);
      drawWin(px + halfW - 12, py - halfH + 16);

      // 정면 대리석 계단 및 아치형 현관문 (Grand Portico & Stairs)
      const doorW = 10, doorH = 12;
      const doorX = px - Math.round(doorW / 2);
      const doorY = py + halfH - doorH;

      ctx.fillStyle = B_PALETTE.stone_deep;
      ctx.fillRect(doorX - 2, doorY - 2, doorW + 4, doorH + 2);
      ctx.fillStyle = B_PALETTE.timber_dark;
      ctx.fillRect(doorX, doorY, doorW, doorH);
      ctx.fillStyle = B_PALETTE.wood_board;
      ctx.fillRect(doorX + 1, doorY + 1, doorW - 2, doorH - 1);
      ctx.fillStyle = B_PALETTE.gold_trim;
      ctx.fillRect(doorX + 2, doorY + 5, 2, 2);
      ctx.fillRect(doorX + doorW - 4, doorY + 5, 2, 2);

      // 계단 단차 (Stone Steps)
      ctx.fillStyle = B_PALETTE.stone_bright;
      ctx.fillRect(doorX - 4, py + halfH - 2, doorW + 8, 2);
      ctx.fillRect(doorX - 6, py + halfH, doorW + 12, 2);

      // 현관 양옆 벽걸이 등불
      this.drawProp(ctx, doorX - 4, doorY + 4, 'lamp', isNight, timeSec);
      this.drawProp(ctx, doorX + doorW + 4, doorY + 4, 'lamp', isNight, timeSec);
    },

    // =========================================================================
    // 11. 비전 마법학탑 (Arcane Spire & Levitating Crystal Apex)
    // =========================================================================
    drawArcaneSpire(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 바닥 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 2, 6);

      // 흑요석 석조 기단 및 룬 기둥 (Obsidian Runic Tower Base)
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(px - halfW + 3, py - halfH + 8, bw - 6, bh - 8);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(px - halfW + 5, py - halfH + 10, bw - 10, bh - 11);

      // 벽면 발광 룬 문자 (Glowing Cyan/Purple Runic Inscriptions)
      const runePulse = (Math.sin(timeSec * 3) + 1) / 2;
      ctx.fillStyle = isNight ? '#a855f7' : '#c084fc';
      ctx.fillRect(px - halfW + 7, py - halfH + 14, 3, 2);
      ctx.fillRect(px - halfW + 7, py - halfH + 20, 2, 3);
      ctx.fillRect(px + halfW - 10, py - halfH + 14, 3, 2);
      ctx.fillRect(px + halfW - 9, py - halfH + 20, 2, 3);

      // 회전하는 비전 차원문 (Swirling Arcane Portal Vortex)
      const pY = py + halfH - 9;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(px, pY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(px, pY, 5, 0, Math.PI * 2);
      ctx.fill();
      // 포털 내부 소용돌이 입자
      for (let r = 0; r < 4; r++) {
        const rAng = timeSec * 4 + (r * Math.PI / 2);
        const rx = px + Math.cos(rAng) * 3.5;
        const ry = pY + Math.sin(rAng) * 2.5;
        ctx.fillStyle = (r % 2 === 0) ? '#38bdf8' : '#e0e7ff';
        ctx.fillRect(rx - 1, ry - 1, 2, 2);
      }

      // 공중 부유 아케인 수정 첨탑 (Levitating Multifaceted Arcane Apex)
      const floatY = py - halfH - 12 + Math.round(Math.sin(timeSec * 2.5) * 3);
      const cryW = 8, cryH = 18;

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(px, floatY - Math.round(cryH / 2));
      ctx.lineTo(px + Math.round(cryW / 2), floatY);
      ctx.lineTo(px, floatY + Math.round(cryH / 2));
      ctx.lineTo(px - Math.round(cryW / 2), floatY);
      ctx.closePath();
      ctx.fill();

      // 수정 면 하이라이트 (Crystalline Specular Shine)
      ctx.fillStyle = '#f3e8ff';
      ctx.beginPath();
      ctx.moveTo(px, floatY - Math.round(cryH / 2) + 2);
      ctx.lineTo(px + 2, floatY);
      ctx.lineTo(px, floatY + Math.round(cryH / 2) - 2);
      ctx.closePath();
      ctx.fill();

      // 궤도 공전 마나 파편 (Orbiting Mana Shards)
      for (let o = 0; o < 3; o++) {
        const oAng = timeSec * 3 + (o * Math.PI * 2 / 3);
        const ox = px + Math.cos(oAng) * 12;
        const oy = floatY + Math.sin(oAng) * 5;
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(ox - 1, oy - 1, 3, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox, oy, 1, 1);
      }
    },

    // =========================================================================
    // 12. 항구 선원 주점 & 여관 (Seafarer Tavern & Inn)
    // =========================================================================
    drawTavern(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      this.drawHalfTimberedHouse(ctx, px, py, bw, bh, 1, isNight, timeSec);

      // 주점 앞 매달린 거품 맥주 간판 (Hanging Foaming Ale Stein Sign)
      const halfW = Math.round(bw / 2);
      const signX = px - halfW - 4;
      const signY = py - 4;

      ctx.fillStyle = B_PALETTE.iron_metal;
      ctx.fillRect(signX, signY, 5, 2);
      ctx.fillStyle = B_PALETTE.timber_dark;
      ctx.fillRect(signX - 4, signY + 2, 7, 6);
      ctx.fillStyle = B_PALETTE.gold_trim;
      ctx.fillRect(signX - 3, signY + 4, 4, 3); // 맥주 머그잔
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(signX - 3, signY + 3, 4, 1); // 맥주 거품

      // 건물 옆 와인/에일 오크통 2개 (Stacked Ale Barrels)
      this.drawProp(ctx, px + halfW + 3, py + 4, 'barrel', isNight, timeSec);
      this.drawProp(ctx, px + halfW + 7, py + 4, 'barrel', isNight, timeSec);
    },

    // =========================================================================
    // 13. 대양 등대 (Ocean Beacon Lighthouse)
    // =========================================================================
    drawLighthouse(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 바닥 석조 기단
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW, py + halfH - 2, bw, 6);

      // 원통형 테이퍼 석조 타워 (Tapered Beacon Tower)
      ctx.fillStyle = B_PALETTE.stone_dark;
      ctx.beginPath();
      ctx.moveTo(px - halfW + 2, py + halfH);
      ctx.lineTo(px - 5, py - halfH + 8);
      ctx.lineTo(px + 5, py - halfH + 8);
      ctx.lineTo(px + halfW - 2, py + halfH);
      ctx.closePath();
      ctx.fill();

      // 나선형 붉은색 & 백색 해양 경고 밴드 (Red & White Maritime Stripes)
      const towerH = bh - 8;
      for (let b = 0; b < 4; b++) {
        const sy = py - halfH + 10 + b * 6;
        ctx.fillStyle = (b % 2 === 0) ? '#dc2626' : '#f8fafc';
        const span = Math.round(6 + (b / 4) * (halfW - 6));
        ctx.fillRect(px - span, sy, span * 2, 5);
      }

      // 상부 전망대 난간 및 유리 램프실 (Observation Balcony & Lantern Room)
      ctx.fillStyle = B_PALETTE.iron_metal;
      ctx.fillRect(px - 8, py - halfH + 6, 16, 3); // 철제 난간 데크
      ctx.fillStyle = isNight ? B_PALETTE.window_night : '#bae6fd';
      ctx.fillRect(px - 5, py - halfH - 4, 10, 10);
      ctx.fillStyle = B_PALETTE.roof_slate_dark;
      ctx.beginPath();
      ctx.arc(px, py - halfH - 4, 6, Math.PI, 0);
      ctx.fill();

      // 야간 회전 서치라이트 빔 (Night Sweeping Searchlight Beam)
      if (isNight) {
        const sweepAng = timeSec * 2.2;
        ctx.save();
        ctx.translate(px, py - halfH);
        ctx.rotate(sweepAng);

        const beamGrad = ctx.createLinearGradient(0, 0, 75, 0);
        beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
        beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(75, -16);
        ctx.lineTo(75, 16);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    },

    // =========================================================================
    // 14. 하역 창고 (Harbor Cargo Warehouse)
    // =========================================================================
    drawWarehouse(ctx, px, py, bw, bh) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.40)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 2, 6);

      // 목조 판자 벽체 (Weathered Wood Siding)
      ctx.fillStyle = B_PALETTE.timber_dark;
      ctx.fillRect(px - halfW, py - halfH + 6, bw, bh - 6);
      ctx.fillStyle = B_PALETTE.wood_board;
      ctx.fillRect(px - halfW + 2, py - halfH + 8, bw - 4, bh - 8);

      // 가로 널빤지 결 (Horizontal Plank Lines)
      ctx.fillStyle = B_PALETTE.timber_main;
      for (let ly = py - halfH + 12; ly < py + halfH; ly += 4) {
        ctx.fillRect(px - halfW + 2, ly, bw - 4, 1);
      }

      // 대형 화물 미닫이 문 (Heavy Cargo Sliding Door)
      const dW = Math.round(bw * 0.45);
      const dH = bh - 10;
      ctx.fillStyle = B_PALETTE.timber_dark;
      ctx.fillRect(px - Math.round(dW / 2), py + halfH - dH, dW, dH);
      ctx.fillStyle = B_PALETTE.timber_main;
      ctx.fillRect(px - Math.round(dW / 2) + 1, py + halfH - dH + 1, dW - 2, dH - 1);
      // X자 철제 보강대
      ctx.fillStyle = B_PALETTE.iron_metal;
      ctx.fillRect(px - Math.round(dW / 2) + 2, py + halfH - Math.round(dH / 2), dW - 4, 1);

      // 슬레이트 경사 지붕 (Slanted Slate Roof)
      ctx.fillStyle = B_PALETTE.roof_slate_main;
      ctx.beginPath();
      ctx.moveTo(px - halfW - 3, py - halfH + 7);
      ctx.lineTo(px, py - halfH - 8);
      ctx.lineTo(px + halfW + 3, py - halfH + 7);
      ctx.closePath();
      ctx.fill();

      // 주변 하역 화물 상자 & 통
      this.drawProp(ctx, px + halfW + 4, py + 4, 'crate');
      this.drawProp(ctx, px - halfW - 4, py + 4, 'barrel');
    },

    // =========================================================================
    // 15. 통합 렌더러 디스패처 (Master Building Render Dispatcher)
    // =========================================================================
    render(ctx, b, px, py, bw, bh, timeSec, isNight) {
      const type = b.type || 'house';

      if (type === 'palace' || type === 'capital_keep') {
        this.drawCastleKeep(ctx, px, py, bw, bh, 0, isNight, timeSec);
        return true;
      }
      if (type === 'castle' || type === 'fortress') {
        this.drawCastleKeep(ctx, px, py, bw, bh, 1, isNight, timeSec);
        return true;
      }
      if (type === 'barracks') {
        this.drawCastleKeep(ctx, px, py, bw, bh, 2, isNight, timeSec);
        return true;
      }
      if (type === 'town_hall') {
        this.drawTownHall(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'house' || type === 'residence') {
        const style = b.id ? (b.id.charCodeAt(b.id.length - 1) % 3) : 0;
        this.drawHalfTimberedHouse(ctx, px, py, bw, bh, style, isNight, timeSec);
        return true;
      }
      if (type === 'market' || type === 'bazaar') {
        const style = b.id ? (b.id.charCodeAt(b.id.length - 1) % 3) : 0;
        this.drawMarketStall(ctx, px, py, bw, bh, style);
        return true;
      }
      if (type === 'blacksmith' || type === 'forge') {
        this.drawBlacksmithForge(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'windmill') {
        this.drawWindmill(ctx, px, py, bw, bh, timeSec);
        return true;
      }
      if (type === 'temple' || type === 'cathedral') {
        this.drawCathedral(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'magic_spire' || type === 'guild') {
        this.drawArcaneSpire(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'tavern' || type === 'inn') {
        this.drawTavern(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'lighthouse') {
        this.drawLighthouse(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'warehouse' || type === 'shipyard') {
        this.drawWarehouse(ctx, px, py, bw, bh);
        return true;
      }
      if (type === 'chief_tent') {
        this.drawMonsterLair(ctx, px, py, bw, bh, timeSec);
        return true;
      }
      if (type === 'bone_totem') {
        this.drawProp(ctx, px, py, 'bone_totem', isNight, timeSec);
        return true;
      }
      if (type === 'campfire') {
        this.drawProp(ctx, px, py, 'campfire', isNight, timeSec);
        return true;
      }
      if (type === 'cage') {
        this.drawProp(ctx, px, py, 'cage', isNight, timeSec);
        return true;
      }
      if (type === 'well') {
        this.drawProp(ctx, px, py, 'well', isNight, timeSec);
        return true;
      }

      // Default fallback: half-timbered house
      this.drawHalfTimberedHouse(ctx, px, py, bw, bh, 0, isNight, timeSec);
      return true;
    }
`;

// Insert additionalMethods before the closing "};"
const closeTarget = '  };\n\n  window.PixelBuildings = PixelBuildings;';
const closeIdx = code.indexOf(closeTarget);

if (closeIdx === -1) {
  console.error('Closing target not found in pixel_buildings.js!');
  process.exit(1);
}

code = code.slice(0, closeIdx) + additionalMethods + code.slice(closeIdx);

fs.writeFileSync('fantasy_world/js/pixel_buildings.js', code);
console.log('Successfully updated pixel_buildings.js with all building archetypes and master render dispatcher!');
