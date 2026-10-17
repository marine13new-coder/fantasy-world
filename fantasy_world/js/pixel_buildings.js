// ============================================================================
// pixel_buildings.js - 고화질 마스터 픽셀아트 건축 및 마을 프랍 렌더링 엔진
// 중세 하프팀버 복층 가옥(슬레이트 지붕, 굴뚝 연기, 격자 창문, 목조 X트러스),
// 스트라이프 시장 가판대(천막, 과일/어물 상자), 왕궁 대성채, 성벽 & 배틀먼트 망루,
// 대장간(모루, 화로), 회전 풍차, 대성당, 마을 우물, 가로등, 나무통/상자, 몬스터 막사
// ============================================================================

(function(window) {
  'use strict';

  const B_PALETTE = {
    // 슬레이트 지붕 (블루 그레이)
    roof_slate_dark: '#1e293b',
    roof_slate_mid: '#334155',
    roof_slate_main: '#475569',
    roof_slate_light: '#64748b',
    roof_slate_highlight: '#94a3b8',

    // 테라코타 붉은 지붕
    roof_red_dark: '#7c2d12',
    roof_red_main: '#9a3412',
    roof_red_light: '#c2410c',

    // 모스 그린 지붕
    roof_green_dark: '#14532d',
    roof_green_main: '#166534',
    roof_green_light: '#15803d',

    // 팀버 목재 프레임 (외벽 기둥 및 보)
    timber_dark: '#451a03',
    timber_main: '#78350f',
    timber_light: '#92400e',
    wood_board: '#b45309',
    wood_highlight: '#d97706',

    // 회반죽 석고 벽 (Plaster Walls)
    plaster_dark: '#a8987b',
    plaster_shadow: '#cfc0a3',
    plaster_main: '#ede0c8',
    plaster_bright: '#f5eee1',

    // 석조 기초 및 성벽 (Stone Masonry)
    stone_deep: '#0f172a',
    stone_dark: '#1e293b',
    stone_mid: '#334155',
    stone_light: '#64748b',
    stone_bright: '#94a3b8',
    stone_highlight: '#cbd5e1',

    // 창문 및 조명
    window_frame: '#291305',
    window_day: '#bae6fd',
    window_day_shine: '#e0f2fe',
    window_night: '#fef08a',
    window_night_glow: '#facc15',

    // 시장 천막 스트라이프 (Awnings)
    awning_red: '#dc2626',
    awning_blue: '#2563eb',
    awning_green: '#16a34a',
    awning_yellow: '#facc15',
    awning_white: '#f8fafc',
    awning_shadow: '#cbd5e1',

    // 소품 디테일
    iron_dark: '#1e293b',
    iron_metal: '#475569',
    iron_shine: '#94a3b8',
    gold_trim: '#facc15',
    fire_orange: '#f97316',
    fire_yellow: '#fef08a',
    smoke_cloud: 'rgba(203, 213, 225, 0.45)'
  };

  const PixelBuildings = {
    isReady: true,

    // =========================================================================
    // 1. 하프팀버 중세 가옥 (Half-Timbered Medieval House)
    // =========================================================================
    drawHalfTimberedHouse(ctx, px, py, bw, bh, style = 0, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 발밑 픽셀 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 2, 6);

      // A. 석조 기초 및 아치문 (Stone Foundation Basement)
      const baseH = Math.max(10, Math.round(bh * 0.35));
      const baseY = py + halfH - baseH;
      ctx.fillStyle = B_PALETTE.stone_dark;
      ctx.fillRect(px - halfW, baseY, bw, baseH);
      ctx.fillStyle = B_PALETTE.stone_mid;
      ctx.fillRect(px - halfW + 2, baseY + 2, bw - 4, baseH - 3);

      // 석조 벽돌 줄눈 디테일 (Mortar joints)
      ctx.fillStyle = B_PALETTE.stone_deep;
      for (let ly = baseY + 4; ly < py + halfH; ly += 5) {
        ctx.fillRect(px - halfW + 2, ly, bw - 4, 1);
        for (let lx = px - halfW + 6 + (ly % 2 ? 4 : 0); lx < px + halfW - 4; lx += 9) {
          ctx.fillRect(lx, ly - 4, 1, 4);
        }
      }

      // 아치형 나무 문 (Arched Wooden Door)
      const doorW = 8;
      const doorH = baseH - 2;
      const doorX = px - Math.round(doorW / 2) + (style % 2 === 0 ? -4 : 4);
      const doorY = py + halfH - doorH;
      ctx.fillStyle = B_PALETTE.stone_deep;
      ctx.fillRect(doorX - 1, doorY - 1, doorW + 2, doorH + 1);
      ctx.fillStyle = B_PALETTE.timber_dark;
      ctx.fillRect(doorX, doorY, doorW, doorH);
      ctx.fillStyle = B_PALETTE.wood_board;
      ctx.fillRect(doorX + 1, doorY + 1, doorW - 2, doorH - 1);
      ctx.fillStyle = B_PALETTE.gold_trim;
      ctx.fillRect(doorX + 2, doorY + Math.round(doorH / 2), 2, 2); // 황동 손잡이

      // B. 1층/2층 회반죽 석고 벽 (Plaster Upper Storey)
      const wallH = bh - baseH - 14;
      const wallY = baseY - wallH;
      ctx.fillStyle = B_PALETTE.plaster_shadow;
      ctx.fillRect(px - halfW + 1, wallY, bw - 2, wallH);
      ctx.fillStyle = B_PALETTE.plaster_main;
      ctx.fillRect(px - halfW + 2, wallY + 1, bw - 4, wallH - 2);

      // 팀버 목재 프레임 (Timber Posts & X-Bracing)
      ctx.fillStyle = B_PALETTE.timber_dark;
      // 좌우 모서리 기둥 & 상하 보
      ctx.fillRect(px - halfW + 1, wallY, 3, wallH);
      ctx.fillRect(px + halfW - 4, wallY, 3, wallH);
      ctx.fillRect(px - halfW + 1, wallY, bw - 2, 3);
      ctx.fillRect(px - halfW + 1, baseY - 2, bw - 2, 3);
      // 중앙 수직 기둥
      ctx.fillRect(px - 1, wallY, 3, wallH);

      // 대각선 X자 가새 (Diagonal Braces)
      ctx.fillStyle = B_PALETTE.timber_main;
      for (let d = 0; d < 6; d++) {
        ctx.fillRect(px - halfW + 4 + d * 2, wallY + 3 + d * 2, 2, 2);
        ctx.fillRect(px - halfW + 14 - d * 2, wallY + 3 + d * 2, 2, 2);
        if (bw > 28) {
          ctx.fillRect(px + 3 + d * 2, wallY + 3 + d * 2, 2, 2);
          ctx.fillRect(px + 13 - d * 2, wallY + 3 + d * 2, 2, 2);
        }
      }

      // 격자 창문 (Multi-pane Windows)
      const winW = 6;
      const winH = 7;
      const winY = wallY + 4;
      const drawWindow = (wx) => {
        ctx.fillStyle = B_PALETTE.window_frame;
        ctx.fillRect(wx - 1, winY - 1, winW + 2, winH + 2);
        ctx.fillStyle = isNight ? B_PALETTE.window_night : B_PALETTE.window_day;
        ctx.fillRect(wx, winY, winW, winH);
        // 창틀 십자가
        ctx.fillStyle = B_PALETTE.window_frame;
        ctx.fillRect(wx + Math.round(winW / 2) - 1, winY, 1, winH);
        ctx.fillRect(wx, winY + Math.round(winH / 2) - 1, winW, 1);
        // 야간 창문 은은한 온기 빛 번짐
        if (isNight) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
          ctx.fillRect(wx - 3, winY - 3, winW + 6, winH + 6);
        }
      };
      drawWindow(px - halfW + 7);
      if (bw > 24) drawWindow(px + halfW - 13);

      // C. 슬레이트 기와 박공 지붕 (Gabled Slate Roof)
      const roofPeakY = wallY - 18;
      const roofCol = style === 1 ? B_PALETTE.roof_red_main : (style === 2 ? B_PALETTE.roof_green_main : B_PALETTE.roof_slate_main);
      const roofDark = style === 1 ? B_PALETTE.roof_red_dark : (style === 2 ? B_PALETTE.roof_green_dark : B_PALETTE.roof_slate_dark);
      const roofLight = style === 1 ? B_PALETTE.roof_red_light : (style === 2 ? B_PALETTE.roof_green_light : B_PALETTE.roof_slate_light);

      ctx.fillStyle = roofDark;
      ctx.beginPath();
      ctx.moveTo(px - halfW - 4, wallY + 2);
      ctx.lineTo(px, roofPeakY);
      ctx.lineTo(px + halfW + 4, wallY + 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = roofCol;
      ctx.beginPath();
      ctx.moveTo(px - halfW - 2, wallY);
      ctx.lineTo(px, roofPeakY + 2);
      ctx.lineTo(px + halfW + 2, wallY);
      ctx.closePath();
      ctx.fill();

      // 기와 결 라인 (Shingle row highlights)
      ctx.fillStyle = roofLight;
      for (let sY = wallY - 3; sY > roofPeakY + 4; sY -= 4) {
        const span = Math.round((sY - roofPeakY) / (wallY - roofPeakY) * halfW);
        ctx.fillRect(px - span + 2, sY, span * 2 - 4, 1);
      }

      // 지붕 박공 처마널 (Fascia eaves trim)
      ctx.fillStyle = B_PALETTE.timber_dark;
      ctx.fillRect(px - halfW - 4, wallY + 1, bw + 8, 3);
      ctx.fillStyle = B_PALETTE.timber_main;
      ctx.fillRect(px - halfW - 3, wallY + 2, bw + 6, 1);

      // D. 벽돌 굴뚝 및 모락모락 피어오르는 연기 (Smoking Brick Chimney)
      const chimX = px + halfW - 8;
      const chimY = roofPeakY + 4;
      ctx.fillStyle = B_PALETTE.stone_dark;
      ctx.fillRect(chimX - 1, chimY - 8, 6, 10);
      ctx.fillStyle = B_PALETTE.stone_mid;
      ctx.fillRect(chimX, chimY - 7, 4, 8);
      ctx.fillStyle = B_PALETTE.stone_bright;
      ctx.fillRect(chimX - 1, chimY - 9, 6, 2); // 굴뚝 갓

      // 연기 애니메이션
      for (let p = 0; p < 4; p++) {
        const prog = (timeSec * 1.5 + p * 0.25) % 1.0;
        const driftX = chimX + 2 + Math.sin(timeSec * 3 + p) * (prog * 6);
        const driftY = chimY - 10 - prog * 18;
        const sz = 2 + Math.round(prog * 4);
        ctx.fillStyle = B_PALETTE.smoke_cloud;
        ctx.beginPath();
        ctx.arc(driftX, driftY, sz, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    // =========================================================================
    // 2. 스트라이프 시장 가판대 (Striped Market Stall)
    // =========================================================================
    drawMarketStall(ctx, px, py, bw, bh, stallType = 0, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.40)';
      ctx.fillRect(px - halfW + 1, py + halfH - 2, bw - 2, 5);

      // 나무 카운터 탁자
      const tableY = py + 2;
      ctx.fillStyle = B_PALETTE.timber_dark;
      ctx.fillRect(px - halfW + 2, tableY, bw - 4, 9);
      ctx.fillStyle = B_PALETTE.wood_board;
      ctx.fillRect(px - halfW + 3, tableY + 1, bw - 6, 7);

      // 4개 나무 기둥 (Poles)
      ctx.fillStyle = B_PALETTE.timber_dark;
      ctx.fillRect(px - halfW + 2, py - halfH, 2, halfH + 4);
      ctx.fillRect(px + halfW - 4, py - halfH, 2, halfH + 4);

      // 전시 물품 (진열 상자, 물고기/과일/빵)
      if (stallType === 0) { // 과일/야채 상자 (레드/옐로)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px - halfW + 5, tableY - 2, 4, 3);
        ctx.fillStyle = '#84cc16';
        ctx.fillRect(px - halfW + 10, tableY - 2, 4, 3);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(px - halfW + 15, tableY - 2, 4, 3);
      } else if (stallType === 1) { // 생선 바구니 (블루/실버)
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px - halfW + 5, tableY - 2, 5, 3);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(px - halfW + 11, tableY - 2, 5, 3);
      } else { // 무기/방어구 가판
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px - halfW + 5, tableY - 3, 2, 5); // 단검
        ctx.fillRect(px - halfW + 9, tableY - 3, 5, 4); // 투구
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(px - halfW + 16, tableY - 2, 4, 3); // 금화 주머니
      }

      // 스트라이프 천막 캐노피 (Striped Awning Canopy)
      const primaryColor = stallType === 0 ? B_PALETTE.awning_red : (stallType === 1 ? B_PALETTE.awning_blue : B_PALETTE.awning_green);
      const secondaryColor = stallType === 2 ? B_PALETTE.awning_yellow : B_PALETTE.awning_white;

      const canopyY = py - halfH - 4;
      const canopyH = 12;

      // 처마 각도
      ctx.fillStyle = primaryColor;
      ctx.fillRect(px - halfW - 2, canopyY, bw + 4, canopyH);

      // 교차 스트라이프 띠
      ctx.fillStyle = secondaryColor;
      const stripeW = 4;
      for (let st = px - halfW - 2; st < px + halfW + 2; st += stripeW * 2) {
        ctx.fillRect(st, canopyY, stripeW, canopyH);
      }

      // 캐노피 끝 물결 무늬 (Scalloped Valence Fringe)
      for (let sc = px - halfW - 2; sc <= px + halfW; sc += 4) {
        ctx.fillStyle = ((sc / 4) % 2 === 0) ? primaryColor : secondaryColor;
        ctx.fillRect(sc, canopyY + canopyH, 4, 2);
      }
    },

    // =========================================================================
    // 3. 황궁 및 대성채 (Palace & Castle Citadel Keep)
    // =========================================================================
    drawCastleKeep(ctx, px, py, bw, bh, faction = 'kingdom', isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 거대 발밑 암영
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.fillRect(px - halfW - 2, py + halfH - 2, bw + 4, 8);

      // 1. 하단 견고한 석조 성곽 (Lower Rampart Citadel)
      ctx.fillStyle = B_PALETTE.stone_dark;
      ctx.fillRect(px - halfW, py - halfH + 8, bw, bh - 6);
      ctx.fillStyle = B_PALETTE.stone_mid;
      ctx.fillRect(px - halfW + 3, py - halfH + 10, bw - 6, bh - 10);

      // 돌 블록 디테일 격자
      ctx.fillStyle = B_PALETTE.stone_deep;
      for (let y = py - halfH + 14; y < py + halfH - 4; y += 6) {
        ctx.fillRect(px - halfW + 3, y, bw - 6, 1);
        for (let x = px - halfW + 7 + ((y % 12) ? 6 : 0); x < px + halfW - 4; x += 12) {
          ctx.fillRect(x, y - 5, 1, 5);
        }
      }

      // 2. 성벽 배틀먼트 요철 흉벽 (Crenellations & Merlons)
      const merlonW = 6;
      const merlonH = 5;
      ctx.fillStyle = B_PALETTE.stone_dark;
      for (let mx = px - halfW + 2; mx <= px + halfW - merlonW - 2; mx += merlonW + 4) {
        ctx.fillRect(mx - 1, py - halfH + 3, merlonW + 2, merlonH + 1);
        ctx.fillStyle = B_PALETTE.stone_bright;
        ctx.fillRect(mx, py - halfH + 4, merlonW, merlonH - 1);
        ctx.fillStyle = B_PALETTE.stone_dark;
      }

      // 3. 좌우 원형 코너 망루 (Corner Turrets)
      const turretW = 10;
      const turretH = bh + 4;
      const drawTurret = (tx) => {
        ctx.fillStyle = B_PALETTE.stone_dark;
        ctx.fillRect(tx - 1, py - halfH - 2, turretW + 2, turretH);
        ctx.fillStyle = B_PALETTE.stone_mid;
        ctx.fillRect(tx, py - halfH - 1, turretW, turretH - 2);
        ctx.fillStyle = B_PALETTE.stone_light;
        ctx.fillRect(tx + 2, py - halfH, turretW - 4, 1);

        // 화살구멍 (Arrow Slits)
        ctx.fillStyle = B_PALETTE.stone_deep;
        ctx.fillRect(tx + Math.round(turretW / 2) - 1, py - 4, 2, 7);
        ctx.fillRect(tx + Math.round(turretW / 2) - 1, py + 8, 2, 7);

        // 원뿔형 블루/골드 첨탑 지붕 (Conical Turret Roof)
        ctx.fillStyle = faction === 'monster' ? '#7f1d1d' : B_PALETTE.roof_slate_dark;
        ctx.beginPath();
        ctx.moveTo(tx - 2, py - halfH - 2);
        ctx.lineTo(tx + Math.round(turretW / 2), py - halfH - 18);
        ctx.lineTo(tx + turretW + 2, py - halfH - 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = faction === 'monster' ? '#b91c1c' : B_PALETTE.roof_slate_light;
        ctx.beginPath();
        ctx.moveTo(tx, py - halfH - 3);
        ctx.lineTo(tx + Math.round(turretW / 2), py - halfH - 16);
        ctx.lineTo(tx + turretW, py - halfH - 3);
        ctx.closePath();
        ctx.fill();

        // 황금 첨탑 핀 (Golden Finial)
        ctx.fillStyle = B_PALETTE.gold_trim;
        ctx.fillRect(tx + Math.round(turretW / 2) - 1, py - halfH - 21, 2, 4);
      };
      drawTurret(px - halfW - 2);
      drawTurret(px + halfW - turretW + 2);

      // 4. 중앙 아치 성문 & 철창문 (Portcullis Gatehouse)
      const gateW = 14;
      const gateH = 16;
      const gateX = px - Math.round(gateW / 2);
      const gateY = py + halfH - gateH;
      ctx.fillStyle = B_PALETTE.stone_deep;
      ctx.fillRect(gateX - 2, gateY - 2, gateW + 4, gateH + 2);
      // 아치석
      ctx.fillStyle = B_PALETTE.stone_bright;
      ctx.fillRect(gateX - 1, gateY - 1, gateW + 2, 2);

      // 철창문 격자 (Portcullis Iron Grate)
      ctx.fillStyle = B_PALETTE.iron_dark;
      ctx.fillRect(gateX, gateY, gateW, gateH);
      ctx.fillStyle = B_PALETTE.iron_shine;
      for (let gx = gateX + 2; gx < gateX + gateW; gx += 3) {
        ctx.fillRect(gx, gateY, 1, gateH);
      }
      for (let gy = gateY + 3; gy < gateY + gateH; gy += 4) {
        ctx.fillRect(gateX, gy, gateW, 1);
      }

      // 5. 황실 사자 깃발 (Imperial Lion Banner)
      const flagWav = Math.round(Math.sin(timeSec * 4 + px) * 2);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(px - 1, py - halfH - 12, 10 + flagWav, 7);
      ctx.fillStyle = B_PALETTE.gold_trim;
      ctx.fillRect(px + 2, py - halfH - 10, 3, 3); // 사자 문장
      ctx.fillStyle = B_PALETTE.iron_metal;
      ctx.fillRect(px - 2, py - halfH - 15, 2, 18); // 깃대
    },

    // =========================================================================
    // 4. 성벽 섹션 (Perimeter Stone Rampart Wall)
    // =========================================================================
    drawStoneWallSection(ctx, px, py, bw, bh) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      ctx.fillStyle = B_PALETTE.stone_dark;
      ctx.fillRect(px - halfW, py - halfH, bw, bh);
      ctx.fillStyle = B_PALETTE.stone_mid;
      ctx.fillRect(px - halfW + 1, py - halfH + 1, bw - 2, bh - 2);

      // 치성 배틀먼트 (Crenellations)
      ctx.fillStyle = B_PALETTE.stone_bright;
      for (let bx = px - halfW; bx < px + halfW; bx += 6) {
        ctx.fillRect(bx, py - halfH - 2, 3, 2);
      }
      // 블록 라인
      ctx.fillStyle = B_PALETTE.stone_deep;
      ctx.fillRect(px - halfW, py, bw, 1);
    },

    // =========================================================================
    // 5. 룬 대장간 (Runic Blacksmith Forge)
    // =========================================================================
    drawBlacksmithForge(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      this.drawHalfTimberedHouse(ctx, px, py, bw, bh, 0, isNight, timeSec);

      // 야외 모루 & 화로 (Outdoor Anvil & Open Forge Hearth)
      const halfW = Math.round(bw / 2);
      const forgeX = px + halfW + 6;
      const forgeY = py + 2;

      // 모루 (Anvil on log)
      ctx.fillStyle = B_PALETTE.timber_dark;
      ctx.fillRect(forgeX - 2, forgeY, 5, 6);
      ctx.fillStyle = B_PALETTE.iron_dark;
      ctx.fillRect(forgeX - 4, forgeY - 3, 9, 3);
      ctx.fillStyle = B_PALETTE.iron_shine;
      ctx.fillRect(forgeX - 3, forgeY - 3, 7, 1);

      // 활활 타오르는 화로 불꽃 (Roaring Hearth Fire)
      const pulse = Math.sin(timeSec * 10) * 2;
      ctx.fillStyle = B_PALETTE.stone_dark;
      ctx.fillRect(forgeX + 7, forgeY - 2, 8, 8);
      ctx.fillStyle = B_PALETTE.fire_orange;
      ctx.fillRect(forgeX + 8, forgeY - 3 + pulse, 6, 6);
      ctx.fillStyle = B_PALETTE.fire_yellow;
      ctx.fillRect(forgeX + 9, forgeY - 2 + pulse, 4, 4);

      // 튀는 불꽃 파티클 (Sparks)
      for (let s = 0; s < 3; s++) {
        const spProg = (timeSec * 3 + s * 0.3) % 1.0;
        ctx.fillStyle = B_PALETTE.gold_trim;
        ctx.fillRect(forgeX + 10 + (s - 1) * 3, forgeY - 5 - spProg * 8, 1, 1);
      }
    },

    // =========================================================================
    // 6. 회전하는 풍차 (Rotating Windmill)
    // =========================================================================
    drawWindmill(ctx, px, py, bw, bh, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 둥근 테이퍼 석조 타워 (Round Stone Mill Tower)
      ctx.fillStyle = B_PALETTE.stone_dark;
      ctx.beginPath();
      ctx.moveTo(px - halfW + 3, py + halfH);
      ctx.lineTo(px - halfW + 7, py - halfH + 6);
      ctx.lineTo(px + halfW - 7, py - halfH + 6);
      ctx.lineTo(px + halfW - 3, py + halfH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = B_PALETTE.stone_light;
      ctx.beginPath();
      ctx.moveTo(px - halfW + 5, py + halfH - 2);
      ctx.lineTo(px - halfW + 8, py - halfH + 8);
      ctx.lineTo(px + halfW - 8, py - halfH + 8);
      ctx.lineTo(px + halfW - 5, py + halfH - 2);
      ctx.closePath();
      ctx.fill();

      // 지붕 캡 (Dome Roof)
      ctx.fillStyle = B_PALETTE.roof_slate_main;
      ctx.beginPath();
      ctx.arc(px, py - halfH + 7, halfW - 5, Math.PI, 0);
      ctx.fill();

      // 중앙 회전축 (Center Hub)
      const hubX = px;
      const hubY = py - halfH + 7;
      ctx.fillStyle = B_PALETTE.timber_dark;
      ctx.fillRect(hubX - 3, hubY - 3, 6, 6);

      // 4개 회전하는 돛 날개 (4 Rotating Lattice Blades)
      const angle = timeSec * 1.6;
      ctx.save();
      ctx.translate(hubX, hubY);
      ctx.rotate(angle);

      const bladeLen = Math.round(bw * 0.85);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        // 목재 뼈대
        ctx.fillStyle = B_PALETTE.timber_dark;
        ctx.fillRect(-1, 0, 2, bladeLen);
        // 흰색 천 캔버스
        ctx.fillStyle = B_PALETTE.awning_white;
        ctx.fillRect(1, 4, 5, bladeLen - 6);
        ctx.fillStyle = B_PALETTE.awning_shadow;
        ctx.fillRect(1, bladeLen - 4, 5, 2);
      }
      ctx.restore();
    },

    // =========================================================================
    // 7. 대성당 및 신전 (Gothic Cathedral)
    // =========================================================================
    drawCathedral(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 석조 본당 (Cathedral Nave)
      ctx.fillStyle = B_PALETTE.stone_dark;
      ctx.fillRect(px - halfW, py - halfH + 6, bw, bh - 6);
      ctx.fillStyle = B_PALETTE.stone_mid;
      ctx.fillRect(px - halfW + 2, py - halfH + 8, bw - 4, bh - 8);

      // 좌우 쌍둥이 첨탑 (Twin Bell Towers)
      const towerW = 8;
      const drawTower = (tx) => {
        ctx.fillStyle = B_PALETTE.stone_dark;
        ctx.fillRect(tx - 1, py - halfH - 12, towerW + 2, bh + 12);
        ctx.fillStyle = B_PALETTE.stone_light;
        ctx.fillRect(tx, py - halfH - 10, towerW, bh + 10);
        // 뾰족 삼각 지붕
        ctx.fillStyle = B_PALETTE.roof_slate_main;
        ctx.beginPath();
        ctx.moveTo(tx - 2, py - halfH - 12);
        ctx.lineTo(tx + Math.round(towerW / 2), py - halfH - 26);
        ctx.lineTo(tx + towerW + 2, py - halfH - 12);
        ctx.closePath();
        ctx.fill();
        // 십자가 핀
        ctx.fillStyle = B_PALETTE.gold_trim;
        ctx.fillRect(tx + Math.round(towerW / 2) - 1, py - halfH - 30, 2, 5);
        ctx.fillRect(tx + Math.round(towerW / 2) - 2, py - halfH - 28, 4, 1);
      };
      drawTower(px - halfW - 2);
      drawTower(px + halfW - towerW + 2);

      // 스테인드글라스 대형 장미창 (Stained Glass Rose Window)
      const roseY = py - halfH + 16;
      ctx.fillStyle = B_PALETTE.stone_deep;
      ctx.beginPath();
      ctx.arc(px, roseY, 8, 0, Math.PI * 2);
      ctx.fill();

      // 보석빛 스테인드글라스 컬러 (Ruby, Sapphire, Emerald, Gold)
      const rosePulse = Math.sin(timeSec * 3) * 0.15;
      ctx.fillStyle = isNight ? '#38bdf8' : '#e0f2fe';
      ctx.beginPath();
      ctx.arc(px, roseY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px - 2, roseY - 2, 4, 4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 1, roseY - 1, 2, 2);

      // 중앙 고딕 아치 문
      ctx.fillStyle = B_PALETTE.stone_deep;
      ctx.fillRect(px - 5, py + halfH - 14, 10, 14);
      ctx.fillStyle = B_PALETTE.timber_dark;
      ctx.fillRect(px - 4, py + halfH - 13, 8, 13);
    },

    // =========================================================================
    // 8. 몬스터 부족 막사 및 주술 토템 (Monster Tribal Tent & Bone Totem)
    // =========================================================================
    drawMonsterLair(ctx, px, py, bw, bh, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 흙바닥 & 가죽 천막 (Mammoth Tusk & Hide Pavilion)
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(px - halfW, py + halfH);
      ctx.lineTo(px, py - halfH);
      ctx.lineTo(px + halfW, py + halfH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.moveTo(px - halfW + 2, py + halfH - 2);
      ctx.lineTo(px, py - halfH + 3);
      ctx.lineTo(px + halfW - 2, py + halfH - 2);
      ctx.closePath();
      ctx.fill();

      // 거대 상아 뼈대 (Mammoth Tusks)
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(px - halfW - 2, py + 2, 3, halfH);
      ctx.fillRect(px + halfW - 1, py + 2, 3, halfH);

      // 천막 입구 구멍
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(px - 4, py + halfH - 10, 8, 10);

      // 부족 깃발 & 해골 장식
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(px - 1, py - halfH - 8, 8, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 2, py - halfH - 6, 2, 2);
    },

    // =========================================================================
    // 9. 마을 디테일 소품 (Props: Well, Lamp, Barrels, Crates, Wheelbarrow)
    // =========================================================================
    drawProp(ctx, px, py, propType = 'well', isNight = false, timeSec = 0) {
      if (propType === 'well') {
        // [식수 우물] 원형 석조 원통 + 블루 슬레이트 박공 지붕 + 도르래
        ctx.fillStyle = 'rgba(15, 23, 42, 0.40)';
        ctx.fillRect(px - 6, py + 4, 12, 4);

        // 석조 원통
        ctx.fillStyle = B_PALETTE.stone_dark;
        ctx.fillRect(px - 6, py - 2, 12, 8);
        ctx.fillStyle = B_PALETTE.stone_mid;
        ctx.fillRect(px - 5, py - 1, 10, 6);
        // 물
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(px - 3, py - 1, 6, 2);

        // 지붕 기둥 & 슬레이트 지붕
        ctx.fillStyle = B_PALETTE.timber_dark;
        ctx.fillRect(px - 5, py - 10, 2, 9);
        ctx.fillRect(px + 3, py - 10, 2, 9);

        ctx.fillStyle = B_PALETTE.roof_slate_main;
        ctx.beginPath();
        ctx.moveTo(px - 7, py - 10);
        ctx.lineTo(px, py - 15);
        ctx.lineTo(px + 7, py - 10);
        ctx.closePath();
        ctx.fill();
      } else if (propType === 'barrel') {
        // [와인/물 오크통]
        ctx.fillStyle = B_PALETTE.timber_dark;
        ctx.fillRect(px - 3, py - 4, 6, 8);
        ctx.fillStyle = B_PALETTE.wood_board;
        ctx.fillRect(px - 2, py - 3, 4, 6);
        // 철제 밴드 (Metal hoops)
        ctx.fillStyle = B_PALETTE.iron_metal;
        ctx.fillRect(px - 3, py - 2, 6, 1);
        ctx.fillRect(px - 3, py + 1, 6, 1);
      } else if (propType === 'crate') {
        // [나무 화물 상자]
        ctx.fillStyle = B_PALETTE.timber_dark;
        ctx.fillRect(px - 4, py - 4, 8, 8);
        ctx.fillStyle = B_PALETTE.wood_board;
        ctx.fillRect(px - 3, py - 3, 6, 6);
        // X자 버팀목
        ctx.fillStyle = B_PALETTE.timber_main;
        ctx.fillRect(px - 2, py - 2, 4, 1);
        ctx.fillRect(px - 2, py + 1, 4, 1);
      } else if (propType === 'lamp') {
        // [가로등] 나무 기둥 + 블루 유리 등불 + 야간 온화한 조명
        ctx.fillStyle = B_PALETTE.timber_dark;
        ctx.fillRect(px - 1, py - 10, 2, 12);
        // 등불 하우징
        ctx.fillStyle = B_PALETTE.iron_metal;
        ctx.fillRect(px - 3, py - 12, 6, 3);
        ctx.fillStyle = isNight ? B_PALETTE.window_night : '#38bdf8';
        ctx.fillRect(px - 2, py - 11, 4, 2);
        if (isNight) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
          ctx.beginPath();
          ctx.arc(px, py - 10, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (propType === 'wheelbarrow') {
        // [수레/손수레] 바퀴와 짐칸
        ctx.fillStyle = B_PALETTE.timber_dark;
        ctx.fillRect(px - 5, py - 2, 9, 4);
        ctx.fillStyle = B_PALETTE.wood_board;
        ctx.fillRect(px - 4, py - 1, 7, 2);
        // 손잡이 & 바퀴
        ctx.fillStyle = B_PALETTE.timber_dark;
        ctx.fillRect(px + 4, py - 2, 3, 1);
        ctx.fillStyle = B_PALETTE.iron_dark;
        ctx.fillRect(px - 6, py, 3, 3);
      } else if (propType === 'campfire') {
        // [모닥불]
        ctx.fillStyle = B_PALETTE.stone_dark;
        ctx.fillRect(px - 4, py - 2, 8, 4);
        const fPulse = Math.sin(timeSec * 8) * 1.5;
        ctx.fillStyle = B_PALETTE.fire_orange;
        ctx.fillRect(px - 2, py - 4 + fPulse, 4, 4);
        ctx.fillStyle = B_PALETTE.fire_yellow;
        ctx.fillRect(px - 1, py - 3 + fPulse, 2, 2);
      }
    }
  };

  window.PixelBuildings = PixelBuildings;
})(typeof window !== 'undefined' ? window : global);
