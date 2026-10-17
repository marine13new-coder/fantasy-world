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
    // =========================================================================
    // 9. 마을 디테일 소품 (Cute Fantasy Reference Props)
    // =========================================================================
    drawProp(ctx, px, py, propType = 'well', isNight = false, timeSec = 0) {
      if (propType === 'well' || propType === 'stone_well') {
        // [CUTE FANTASY 식수 우물] 원형 석조 원통 + 목조 기둥 + 박공 지붕 + 도르래 양동이
        ctx.fillStyle = 'rgba(15, 23, 42, 0.40)';
        ctx.fillRect(px - 7, py + 5, 14, 4);

        // 석조 원통
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px - 7, py - 3, 14, 9);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px - 6, py - 2, 12, 7);
        // 물
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px - 4, py - 2, 8, 3);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(px - 3, py - 1, 6, 2);

        // 두 개의 목조 기둥
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px - 6, py - 12, 2, 11);
        ctx.fillRect(px + 4, py - 12, 2, 11);
        // 가로 들보 & 도르래 로프
        ctx.fillRect(px - 6, py - 12, 12, 2);
        ctx.fillStyle = '#fde047'; // 로프
        ctx.fillRect(px - 1, py - 10, 1, 4);
        // 작은 나무 양동이
        ctx.fillStyle = '#92400e';
        ctx.fillRect(px - 2, py - 6, 3, 3);

        // 목조 박공 지붕 (Cute Wooden Gabled Canopy)
        ctx.fillStyle = '#5c3012';
        ctx.beginPath();
        ctx.moveTo(px - 9, py - 11);
        ctx.lineTo(px, py - 18);
        ctx.lineTo(px + 9, py - 11);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(px - 7, py - 12);
        ctx.lineTo(px, py - 17);
        ctx.lineTo(px + 7, py - 12);
        ctx.closePath();
        ctx.fill();
      } else if (propType === 'hay_bale') {
        // [CUTE FANTASY 황금 건초 더미 (붉은 리본 결속)]
        // 피라미드 스택 건초더미 (아래 2개, 위 1개)
        const drawSingleBale = (bx, by) => {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
          ctx.fillRect(bx - 4, by + 4, 9, 3);
          // 황금빛 짚단 본체
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(bx - 4, by - 4, 8, 8);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(bx - 3, by - 3, 6, 6);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(bx - 3, by - 3, 6, 2);
          // 🎀 붉은 결속 리본 십자가 (Red Ribbon Cross)
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(bx - 1, by - 4, 2, 8);
          ctx.fillRect(bx - 4, by - 1, 8, 2);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(bx, by - 4, 1, 8);
          ctx.fillRect(bx - 4, by, 8, 1);
        };
        drawSingleBale(px - 3, py + 2);
        drawSingleBale(px + 4, py + 2);
        drawSingleBale(px, py - 5);
      } else if (propType === 'anvil' || propType === 'iron_anvil') {
        // [CUTE FANTASY 대장간 철제 모루 & 통나무 받침대]
        ctx.fillStyle = 'rgba(15, 23, 42, 0.40)';
        ctx.fillRect(px - 5, py + 3, 10, 3);
        // 원형 통나무 받침대
        ctx.fillStyle = '#5c3012';
        ctx.fillRect(px - 4, py - 1, 8, 5);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(px - 3, py, 6, 3);
        // 주철 모루 (Cast Iron Anvil)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px - 5, py - 6, 10, 5);
        ctx.fillStyle = '#475569';
        ctx.fillRect(px - 4, py - 5, 8, 2);
        // 모루 뿔 (Horn) & 상단 평면 타격대 (Face)
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px - 6, py - 6, 3, 2);
        ctx.fillRect(px - 3, py - 6, 6, 1);
      } else if (propType === 'campfire' || propType === 'campfire_stools') {
        // [CUTE FANTASY 캠프파이어 & 통나무 스툴 4개 서클]
        // 바닥 자갈 원
        ctx.fillStyle = '#475569';
        ctx.fillRect(px - 5, py - 2, 10, 5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(px - 4, py - 1, 8, 3);
        // 십자 장작
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px - 3, py, 6, 1);
        ctx.fillRect(px, py - 3, 1, 6);
        // 애니메이션 불꽃 (Flickering Flame)
        const fPulse = Math.sin(timeSec * 9) * 1.5;
        ctx.fillStyle = '#f97316';
        ctx.fillRect(px - 2, py - 5 + fPulse, 4, 5);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px - 1, py - 4 + fPulse, 2, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px, py - 3 + fPulse, 1, 1);

        // 주변 4개 통나무 스툴 (Round Tree Stump Stools)
        const drawStool = (sx, sy) => {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
          ctx.fillRect(sx - 3, sy + 3, 6, 2);
          ctx.fillStyle = '#5c3012'; // 외피 나무껍질
          ctx.fillRect(sx - 3, sy - 2, 6, 5);
          ctx.fillStyle = '#d59560'; // 절단면 나이테
          ctx.fillRect(sx - 2, sy - 2, 4, 2);
          ctx.fillStyle = '#7c441c';
          ctx.fillRect(sx - 1, sy - 1, 2, 1);
        };
        drawStool(px - 8, py - 1);
        drawStool(px + 8, py - 1);
        drawStool(px, py + 6);
        drawStool(px, py - 7);
      } else if (propType === 'tree_stump') {
        // [CUTE FANTASY 나이테가 선명한 밑동 (Tree Stump with Rings)]
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.fillRect(px - 4, py + 3, 8, 3);
        ctx.fillStyle = '#5c3012'; // 나무 껍질
        ctx.fillRect(px - 4, py - 2, 8, 6);
        ctx.fillStyle = '#d79963'; // 밝은 나이테 코어
        ctx.fillRect(px - 3, py - 2, 6, 3);
        // 동심원 나이테 (Concentric growth rings)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px - 2, py - 2, 4, 1);
        ctx.fillRect(px - 1, py - 1, 2, 1);
      } else if (propType === 'fallen_log') {
        // [CUTE FANTASY 쓰러진 통나무 (Fallen Timber Log with Branch Nub)]
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.fillRect(px - 7, py + 2, 14, 3);
        ctx.fillStyle = '#5c3012'; // 통나무 몸체
        ctx.fillRect(px - 7, py - 2, 14, 5);
        ctx.fillStyle = '#874b20';
        ctx.fillRect(px - 6, py - 1, 12, 3);
        // 단면 나이테
        ctx.fillStyle = '#d79963';
        ctx.fillRect(px - 7, py - 1, 2, 3);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px - 6, py, 1, 1);
        // 옹이 / 잔가지 그루터기
        ctx.fillStyle = '#5c3012';
        ctx.fillRect(px + 2, py - 4, 2, 3);
      } else if (propType === 'wooden_fence') {
        // [CUTE FANTASY 목조 울타리 (Wooden Post & Rail Fence)]
        ctx.fillStyle = 'rgba(15, 23, 42, 0.30)';
        ctx.fillRect(px - 8, py + 4, 16, 2);
        // 가로 레일 2줄 (Top & Bottom Rails)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px - 8, py - 3, 16, 2);
        ctx.fillRect(px - 8, py + 1, 16, 2);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(px - 8, py - 3, 16, 1);
        ctx.fillRect(px - 8, py + 1, 16, 1);
        // 둥근 캡 기둥 2개 (Round-topped Posts)
        const drawPost = (postX) => {
          ctx.fillStyle = '#451a03';
          ctx.fillRect(postX - 2, py - 6, 4, 11);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(postX - 1, py - 5, 2, 9);
          ctx.fillStyle = '#d59560'; // 기둥 둥근 머리 하이라이트
          ctx.fillRect(postX - 1, py - 6, 2, 1);
        };
        drawPost(px - 6);
        drawPost(px + 6);
      } else if (propType === 'chicken_coop') {
        // [CUTE FANTASY 닭장 울타리 / 급수대 / 짚단 둥지]
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.fillRect(px - 8, py + 4, 16, 3);
        // 급수통 (Water Trough)
        ctx.fillStyle = '#475569';
        ctx.fillRect(px - 6, py - 3, 7, 5);
        ctx.fillStyle = '#38bdf8'; // 물
        ctx.fillRect(px - 5, py - 2, 5, 3);
        // 짚단 둥지 (Straw Nest)
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(px + 2, py - 3, 6, 5);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px + 3, py - 2, 4, 3);
        // 흰 알
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 4, py - 1, 2, 2);
      } else if (propType === 'signpost') {
        // [CUTE FANTASY 나무 이정표 푯말]
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.fillRect(px - 2, py + 4, 4, 2);
        ctx.fillStyle = '#5c3012'; // 기둥
        ctx.fillRect(px - 1, py - 8, 2, 12);
        // 화살표 푯말
        ctx.fillStyle = '#92400e';
        ctx.fillRect(px - 5, py - 9, 10, 4);
        ctx.fillRect(px + 5, py - 8, 2, 2); // 화살표 촉
        ctx.fillStyle = '#d59560';
        ctx.fillRect(px - 4, py - 8, 8, 2);
      } else if (propType === 'barrel') {
        // [와인/물 오크통]
        ctx.fillStyle = B_PALETTE.timber_dark;
        ctx.fillRect(px - 3, py - 4, 6, 8);
        ctx.fillStyle = B_PALETTE.wood_board;
        ctx.fillRect(px - 2, py - 3, 4, 6);
        ctx.fillStyle = B_PALETTE.iron_metal;
        ctx.fillRect(px - 3, py - 2, 6, 1);
        ctx.fillRect(px - 3, py + 1, 6, 1);
      } else if (propType === 'crate') {
        // [나무 화물 상자]
        ctx.fillStyle = B_PALETTE.timber_dark;
        ctx.fillRect(px - 4, py - 4, 8, 8);
        ctx.fillStyle = B_PALETTE.wood_board;
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.fillStyle = B_PALETTE.timber_main;
        ctx.fillRect(px - 2, py - 2, 4, 1);
        ctx.fillRect(px - 2, py + 1, 4, 1);
      } else if (propType === 'lamp') {
        // [가로등]
        ctx.fillStyle = B_PALETTE.timber_dark;
        ctx.fillRect(px - 1, py - 10, 2, 12);
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
      }
    },

    // =========================================================================
    // [CUTE FANTASY 스타일] 통나무 오두막 & 농가 (Cute Log Cabin & Farmstead)
    // =========================================================================
    drawCuteLogCabin(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 발밑 픽셀 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 2, 7);

      // 1. 통나무 벽체 (Horizontal Interlocking Logs)
      const wallH = Math.round(bh * 0.6);
      const wallY = py + halfH - wallH;

      ctx.fillStyle = '#6d3b16'; // 통나무 줄눈/외곽선
      ctx.fillRect(px - halfW, wallY, bw, wallH);

      // 가로 통나무 층 (3~4개 가로 통나무 겹침)
      const logH = 5;
      for (let ly = wallY; ly < py + halfH; ly += logH) {
        ctx.fillStyle = '#6d3b16';
        ctx.fillRect(px - halfW, ly, bw, 1);
        ctx.fillStyle = '#b37340'; // 따뜻한 통나무 본체
        ctx.fillRect(px - halfW + 1, ly + 1, bw - 2, logH - 2);
        ctx.fillStyle = '#d59560'; // 상단 하이라이트
        ctx.fillRect(px - halfW + 2, ly + 1, bw - 4, 1);
        // 좌우 돌출된 둥근 통나무 결 (Protruding corner logs)
        ctx.fillStyle = '#7c441c';
        ctx.fillRect(px - halfW - 1, ly + 1, 2, logH - 2);
        ctx.fillRect(px + halfW - 1, ly + 1, 2, logH - 2);
      }

      // 2. 발광 청록 창문 (Glowing Cyan Window - Reference Image Match)
      const winW = 7;
      const winH = 8;
      const winX = px + halfW - 14;
      const winY = wallY + 4;
      ctx.fillStyle = '#451a03'; // 창틀
      ctx.fillRect(winX - 1, winY - 1, winW + 2, winH + 2);
      ctx.fillStyle = isNight ? '#fef08a' : '#38bdf8'; // 청록/황금
      ctx.fillRect(winX, winY, winW, winH);
      // 창문 십자 프레임
      ctx.fillStyle = '#451a03';
      ctx.fillRect(winX + 3, winY, 1, winH);
      ctx.fillRect(winX, winY + 4, winW, 1);
      // 흰색 유리 반사광
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(winX + 1, winY + 1, 2, 2);

      // 3. 나무 아치형 현관문 (Wooden Plank Door)
      const doorW = 8;
      const doorH = wallH - 3;
      const doorX = px - halfW + 6;
      const doorY = py + halfH - doorH;
      ctx.fillStyle = '#3a1908';
      ctx.fillRect(doorX - 1, doorY - 1, doorW + 2, doorH + 1);
      ctx.fillStyle = '#7c441c';
      ctx.fillRect(doorX, doorY, doorW, doorH);
      ctx.fillStyle = '#965528';
      ctx.fillRect(doorX + 1, doorY + 1, doorW - 2, doorH - 1);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(doorX + doorW - 3, doorY + Math.round(doorH / 2), 2, 2); // 손잡이

      // 4. 스텝형 목조 박공 지붕 (Stepped Wooden Plank Gabled Roof)
      const roofPeakY = wallY - 14;
      ctx.fillStyle = '#4a260f'; // 지붕 외곽선
      ctx.beginPath();
      ctx.moveTo(px - halfW - 4, wallY + 2);
      ctx.lineTo(px, roofPeakY - 2);
      ctx.lineTo(px + halfW + 4, wallY + 2);
      ctx.closePath();
      ctx.fill();

      // 지붕 널판지 채우기
      ctx.fillStyle = '#874b20';
      ctx.beginPath();
      ctx.moveTo(px - halfW - 2, wallY);
      ctx.lineTo(px, roofPeakY);
      ctx.lineTo(px + halfW + 2, wallY);
      ctx.closePath();
      ctx.fill();

      // 지붕 결 라인 & 하이라이트
      ctx.fillStyle = '#5c3012';
      ctx.fillRect(px - halfW, wallY - 4, bw, 1);
      ctx.fillRect(px - halfW + 4, wallY - 8, bw - 8, 1);
      ctx.fillStyle = '#a8612f';
      ctx.fillRect(px - halfW + 2, wallY - 3, bw - 4, 1);
      ctx.fillRect(px - halfW + 6, wallY - 7, bw - 12, 1);
    },

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
    // 11.2. 아틀란티스 해저 고대 그리스풍 신전 (Sunken Atlantis Temple of Poseidon)
    // =========================================================================
    drawSunkenTemple(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 바닥 모래/산호 그림자
      ctx.fillStyle = 'rgba(2, 6, 23, 0.50)';
      ctx.fillRect(px - halfW + 1, py + halfH - 2, bw - 2, 6);

      // 고대 대리석 3단 기단 (3-Tier Sunken Marble Crepidoma)
      ctx.fillStyle = '#475569';
      ctx.fillRect(px - halfW, py + halfH - 6, bw, 3);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px - halfW + 2, py + halfH - 9, bw - 4, 3);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px - halfW + 4, py + halfH - 12, bw - 8, 3);

      // 가라앉은 대리석 원주 기둥 (Fluted Submerged Columns with Sea-Moss)
      const colCount = Math.max(4, Math.floor(bw / 9));
      const colW = 4;
      const colH = bh - 24;
      const colY = py + halfH - 12 - colH;
      const spacing = (bw - 12 - colW) / (colCount - 1);

      for (let c = 0; c < colCount; c++) {
        const cx = Math.round(px - halfW + 6 + c * spacing);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx - 1, colY + colH - 2, colW + 2, 2);
        ctx.fillRect(cx - 1, colY, colW + 2, 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx, colY + 2, colW, colH - 4);
        ctx.fillStyle = '#e2e8f0'; // 하이라이트 능선
        ctx.fillRect(cx + 1, colY + 2, 1, colH - 4);

        if (c % 2 === 0) {
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(cx - 1, colY + colH - 6, 2, 4);
        }
      }

      // 엔타블러처 & 박공 삼각 페디먼트 (Entablature & Triangular Pediment)
      const pedY = colY - 10;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px - halfW + 2, colY - 3, bw - 4, 3);

      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(px - halfW + 2, colY - 3);
      ctx.lineTo(px, pedY);
      ctx.lineTo(px + halfW - 2, colY - 3);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 황금 삼지창 부조 (Golden Trident Bas-Relief)
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 1, colY - 8, 2, 6);
      ctx.fillRect(px - 3, colY - 7, 6, 1);
      ctx.fillRect(px - 3, colY - 9, 1, 2);
      ctx.fillRect(px + 2, colY - 9, 1, 2);

      // 🌊 부유하는 신성한 아틀란티스 진주 (Levitating Radiant Pearl)
      const pearlY = pedY - 6 + Math.round(Math.sin(timeSec * 2.8) * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.arc(px, pearlY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(px, pearlY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px - 1, pearlY - 1, 2, 2);
    },

    // =========================================================================
    // 11.3. 심해 발광 산호 첨탑 (Bioluminescent Coral Spire)
    // =========================================================================
    drawCoralSpire(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - halfW + 2, py + halfH - 4, bw - 4, 8);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - halfW + 4, py + halfH - 8, bw - 8, 5);

      ctx.fillStyle = '#be123c';
      ctx.fillRect(px - 4, py - halfH + 8, 8, bh - 16);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(px - 2, py - halfH + 10, 5, bh - 18);

      ctx.fillStyle = '#fb7185';
      ctx.fillRect(px - 12, py - 4, 9, 4);
      ctx.fillRect(px - 12, py - 12, 4, 9);
      ctx.fillRect(px + 4, py + 2, 10, 4);
      ctx.fillRect(px + 10, py - 8, 4, 11);

      ctx.fillStyle = '#fda4af';
      ctx.fillRect(px - 6, py - halfH + 4, 12, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px - 2, py - halfH + 2, 4, 4);

      // 🫧 뿜어져 나오는 심해 수포 버블 파티클 (Rising Deep Sea Bubbles)
      for (let b = 0; b < 4; b++) {
        const bPhase = (timeSec * 2.2 + b * 0.7) % 2.5;
        const bY = (py + halfH - 10) - (bPhase * 18);
        const bX = px + Math.sin(timeSec * 4 + b) * 7;
        ctx.fillStyle = 'rgba(186, 230, 253, 0.75)';
        ctx.beginPath();
        ctx.arc(bX, bY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    // =========================================================================
    // 11.4. 크로노스 회전 기어 대시계탑 (Chrono Grand Clockwork Citadel)
    // =========================================================================
    drawClockworkTower(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 바닥 스팀펑크 암영
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.fillRect(px - halfW + 2, py + halfH - 3, bw - 4, 7);

      // 청동 기계 탑신 기단 (Bronze & Iron Gear Tower Body)
      ctx.fillStyle = '#292524';
      ctx.fillRect(px - halfW + 3, py - halfH + 8, bw - 6, bh - 10);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px - halfW + 5, py - halfH + 10, bw - 10, bh - 14);

      // 회전하는 거대 청동 톱니바퀴 (Interlocking Rotating Bronze Gears)
      const gearY = py + 2;
      const gearRadius = Math.min(13, Math.round(bw / 3));
      const gearAngle = timeSec * 1.5;

      ctx.save();
      ctx.translate(px, gearY);
      ctx.rotate(gearAngle);

      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(0, 0, gearRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(0, 0, gearRadius - 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d97706';
      for (let g = 0; g < 8; g++) {
        const ang = (g * Math.PI / 4);
        ctx.fillRect(Math.cos(ang) * (gearRadius - 2) - 1.5, Math.sin(ang) * (gearRadius - 2) - 1.5, 3, 3);
      }
      ctx.restore();

      // 상단 거대 로마숫자 시계판 (Ornate Clock Face with Moving Hands)
      const clockY = py - halfH + 4;
      const clockRadius = Math.min(12, Math.round(bw / 3.2));
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(px, clockY, clockRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.stroke();

      const hourAngle = timeSec * 0.5;
      const minAngle = timeSec * 3.0;
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(px, clockY);
      ctx.lineTo(px + Math.cos(hourAngle) * (clockRadius * 0.55), clockY + Math.sin(hourAngle) * (clockRadius * 0.55));
      ctx.stroke();

      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(px, clockY);
      ctx.lineTo(px + Math.cos(minAngle) * (clockRadius * 0.8), clockY + Math.sin(minAngle) * (clockRadius * 0.8));
      ctx.stroke();

      // 첨탑 지붕 & 황금 추침 (Apex Spire & Golden Pendulum)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(px, clockY - clockRadius - 10);
      ctx.lineTo(px + 4, clockY - clockRadius);
      ctx.lineTo(px - 4, clockY - clockRadius);
      ctx.closePath();
      ctx.fill();

      // 💨 증기 피스톤 배기 벤트 파티클 (Steam Puff Vents)
      if (Math.sin(timeSec * 4) > 0.6) {
        ctx.fillStyle = 'rgba(241, 245, 249, 0.65)';
        ctx.beginPath();
        ctx.arc(px + halfW - 2, py - halfH + 12 - Math.sin(timeSec * 8) * 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    // =========================================================================
    // 11.5. 유성우 천문대 신성 돔 (Celestial Starfall Observatory)
    // =========================================================================
    drawStarObservatory(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 바닥 석조 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 3, bw - 4, 6);

      // 원형 석조 드럼 기단 (Cylindrical Stone Masonry Drum)
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - halfW + 3, py - 4, bw - 6, halfH + 2);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px - halfW + 5, py - 2, bw - 10, halfH - 2);

      // 청동 돔 지붕 (Verdigris Copper Hemisphere Dome with Slit)
      const domeY = py - 4;
      const domeRadius = Math.round(bw / 2.2);

      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      ctx.arc(px, domeY, domeRadius, Math.PI, 0);
      ctx.fill();

      // 돔 관측 슬릿 (Observation Slit)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 2, domeY - domeRadius, 5, domeRadius);

      // 거대 굴절 천체 망원경 (Giant Brass Refracting Telescope)
      const teleAngle = -Math.PI * 0.35 + Math.sin(timeSec * 0.8) * 0.15;
      const teleLen = domeRadius + 12;

      ctx.save();
      ctx.translate(px, domeY - 2);
      ctx.rotate(teleAngle);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, -2, teleLen, 5);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, -3, 5, 7);
      ctx.fillRect(teleLen - 4, -4, 5, 9);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(teleLen, -2, 2, 5);
      ctx.restore();

      if (isNight) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.beginPath();
        ctx.arc(px, domeY - domeRadius, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    // =========================================================================
    // 11.6. 극지방 서리한 만년설 빙하 요새 (Glacial Frostmourne Citadel)
    // =========================================================================
    drawGlacialCitadel(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 바닥 푸른 빙하 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 4, 6);

      // 서리 크리스탈 요새 외벽 (Translucent Cyan/Azure Ice Ramparts)
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(px - halfW + 3, py - halfH + 8, bw - 6, bh - 9);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px - halfW + 5, py - halfH + 10, bw - 10, bh - 13);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(px - halfW + 5, py - halfH + 10, bw - 10, 3);

      // 뾰족한 얼음 고드름 성채 배틀먼트 (Crystalline Ice Icicles & Pinnacles)
      const pinCount = Math.max(3, Math.floor(bw / 7));
      const spacing = (bw - 10) / pinCount;
      for (let p = 0; p < pinCount; p++) {
        const pinX = px - halfW + 6 + p * spacing;
        const pinH = 8 + (p % 2 ? 4 : 0);
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(pinX, py - halfH + 10);
        ctx.lineTo(pinX + 3, py - halfH + 10 - pinH);
        ctx.lineTo(pinX + 6, py - halfH + 10);
        ctx.closePath();
        ctx.fill();
      }

      // 중앙 서리 룬 크리스탈 핵 (Pulsing Frost Rune Core)
      const coreY = py + 2;
      const pulse = 0.8 + Math.sin(timeSec * 3) * 0.2;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(px, coreY, 6 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1, coreY - 4, 2, 8);
      ctx.fillRect(px - 4, coreY - 1, 8, 2);

      // 공중 부유 서리 파편 (Orbiting Frost Shards)
      for (let s = 0; s < 3; s++) {
        const sAng = timeSec * 2.5 + (s * Math.PI * 2 / 3);
        const sx = px + Math.cos(sAng) * (halfW - 2);
        const sy = py - 6 + Math.sin(sAng) * 5;
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(sx, sy, 2, 3);
      }
    },

    // =========================================================================
    // 11.7. 북극광 오로라 성좌 거석 신전 (Aurora Borealis Monolith Shrine)
    // =========================================================================
    drawAuroraMonolith(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 바닥 설원 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 4, 6);

      // 서리 거석 3주 (Trio of Runed Ice Monoliths)
      const pillars = [-halfW + 6, 0, halfW - 6];
      for (let i = 0; i < pillars.length; i++) {
        const mx = px + pillars[i];
        const mH = bh - 12 - (i === 1 ? 0 : 6);
        const mY = py + halfH - 4 - mH;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(mx - 3, mY, 6, mH);
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(mx - 2, mY + 2, 4, mH - 4);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(mx - 1, mY + 2, 2, mH - 4);

        ctx.fillStyle = (i === 1) ? '#facc15' : '#38bdf8';
        ctx.fillRect(mx - 1, mY + Math.round(mH * 0.4), 2, 2);
      }

      // 🌌 상공으로 솟구치는 오로라 커튼 (Ascending Aurora Borealis Curtain)
      ctx.save();
      const wave = Math.sin(timeSec * 2.0) * 8;
      const grad = ctx.createLinearGradient(px, py - halfH, px + wave, py - halfH - 24);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      grad.addColorStop(0.5, 'rgba(74, 222, 128, 0.35)');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(px - halfW + 4, py - halfH + 4);
      ctx.quadraticCurveTo(px + wave, py - halfH - 12, px + halfW - 4 + wave, py - halfH - 24);
      ctx.lineTo(px - halfW + wave, py - halfH - 24);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },

    // =========================================================================
    // 11.8. 동방 벚꽃 다층 옥룡 파고다 누각 (Multi-Tiered Sakura Pagoda Tower)
    // =========================================================================
    drawPagodaTower(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 바닥 석조 기단 및 모래 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.50)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 4, 6);

      // 1단 기단 (Grey Stone Plinth)
      ctx.fillStyle = '#475569';
      ctx.fillRect(px - halfW + 4, py + halfH - 5, bw - 8, 4);

      // 3층 다층 누각 루프 (3-Tiered Pagoda Roofs with Upturned Eaves)
      const tiers = [
        { y: py + 4, w: bw - 6, roofW: bw + 6 },
        { y: py - 8, w: bw - 12, roofW: bw },
        { y: py - 20, w: bw - 18, roofW: bw - 6 }
      ];

      for (let t = 0; t < tiers.length; t++) {
        const tr = tiers[t];
        const tw = tr.w;
        const thw = Math.round(tw / 2);

        // 주홍빛 붉은 목조 기둥 및 벽 (Vermilion Timber Walls)
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(px - thw, tr.y, tw, 10);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(px - thw + 1, tr.y, 3, 10);
        ctx.fillRect(px + thw - 4, tr.y, 3, 10);
        ctx.fillRect(px - 1, tr.y, 2, 10);

        // 격자 미닫이 창문 (Shoji Screen Windows)
        ctx.fillStyle = isNight ? '#fef08a' : '#f8fafc';
        ctx.fillRect(px - thw + 4, tr.y + 2, Math.max(2, thw - 5), 6);
        ctx.fillRect(px + 1, tr.y + 2, Math.max(2, thw - 5), 6);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px - thw + 4, tr.y + 4, Math.max(2, thw - 5), 1);
        ctx.fillRect(px + 1, tr.y + 4, Math.max(2, thw - 5), 1);

        // 곡선형 치켜올려진 기와 처마 (Curved Slate Tile Eaves)
        const rw = tr.roofW;
        const rhw = Math.round(rw / 2);
        const roofY = tr.y - 3;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - rhw, roofY + 2, rw, 2);

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(px - rhw - 2, roofY - 2);
        ctx.lineTo(px, roofY - 5);
        ctx.lineTo(px + rhw + 2, roofY - 2);
        ctx.lineTo(px + rhw, roofY);
        ctx.lineTo(px - rhw, roofY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px - rhw - 1, roofY, 2, 2);
        ctx.fillRect(px + rhw - 1, roofY, 2, 2);
      }

      // 상단 황금 보주 상륜부 (Golden Pagoda Finial Spire)
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 1, py - 30, 2, 8);
      ctx.beginPath();
      ctx.arc(px, py - 32, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 건물 처마 매달린 붉은 종이 등불 (Hanging Red Paper Lanterns)
      const lanternY = py + 7;
      const drawLantern = (lx) => {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(lx, lanternY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isNight ? '#fef08a' : '#fbbf24';
        ctx.fillRect(lx - 0.5, lanternY - 0.5, 1, 1);
      };
      drawLantern(px - halfW + 1);
      drawLantern(px + halfW - 1);
    },

    // =========================================================================
    // 11.9. 붉은 도리이 문 & 석등 신사 (Vermilion Torii Gate & Spirit Shrine)
    // =========================================================================
    drawToriiShrine(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // 바닥 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 4, 5);

      // 도리이 2대 원주 기둥 (Twin Vermilion Columns)
      const colX1 = px - halfW + 6;
      const colX2 = px + halfW - 8;
      const colH = bh - 10;
      const colY = py + halfH - 2 - colH;

      ctx.fillStyle = '#991b1b';
      ctx.fillRect(colX1 - 1, colY, 5, colH);
      ctx.fillRect(colX2 - 1, colY, 5, colH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(colX1, colY, 3, colH);
      ctx.fillRect(colX2, colY, 3, colH);

      // 기둥 밑 흑색 주춧돌 (Black Stone Bases)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(colX1 - 2, py + halfH - 5, 7, 4);
      ctx.fillRect(colX2 - 2, py + halfH - 5, 7, 4);

      // 하부 가로 인방 보 (Nuki Cross-Beam)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px - halfW + 4, colY + 8, bw - 8, 3);

      // 상부 주보 (Kasagi & Shimaki Top Curved Beams)
      const topY = colY - 3;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(px - halfW + 1, topY - 3);
      ctx.lineTo(px, topY - 5);
      ctx.lineTo(px + halfW - 1, topY - 3);
      ctx.lineTo(px + halfW, topY);
      ctx.lineTo(px - halfW, topY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px - halfW + 3, topY, bw - 6, 4);

      // 금박 현판 (Golden Tablet)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - 3, colY + 1, 6, 8);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 2, colY + 2, 4, 6);

      // 좌우 석등롱 (Twin Stone Lanterns Toro)
      const drawToro = (tx) => {
        ctx.fillStyle = '#475569';
        ctx.fillRect(tx - 2, py + halfH - 8, 5, 7);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(tx - 3, py + halfH - 12, 7, 4);
        ctx.fillStyle = isNight ? '#fef08a' : '#ffffff';
        ctx.fillRect(tx - 1, py + halfH - 10, 3, 2);
      };
      drawToro(colX1 - 8);
      drawToro(colX2 + 8);
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

      // 🏛️ 건축물 지면 밀착 앰비언트 오클루전 & 대각선 다이렉셔널 섀도우 (Ambient Occlusion & Cast Shadow)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.46)';
      ctx.beginPath();
      ctx.ellipse(px + 3, py + bh / 2 + 3, bw * 0.54, 6, 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.28)';
      ctx.beginPath();
      ctx.ellipse(px + 6, py + bh / 2 + 4, bw * 0.42, 4, 0.08, 0, Math.PI * 2);
      ctx.fill();

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
      if (type === 'cabin' || type === 'farmstead' || type === 'cottage' || type === 'log_cabin') {
        this.drawCuteLogCabin(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'house' || type === 'residence') {
        const style = b.id ? (b.id.charCodeAt(b.id.length - 1) % 3) : 0;
        if (style === 2) {
          this.drawCuteLogCabin(ctx, px, py, bw, bh, isNight, timeSec);
        } else {
          this.drawHalfTimberedHouse(ctx, px, py, bw, bh, style, isNight, timeSec);
        }
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
      if (type === 'sunken_temple' || type === 'atlantis_temple' || (type === 'temple' && b && b.continent === 'atlantis')) {
        this.drawSunkenTemple(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'coral_spire' || type === 'abyssal_spire' || (type === 'magic_spire' && b && b.continent === 'atlantis')) {
        this.drawCoralSpire(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'clockwork_tower' || type === 'chrono_tower' || (type === 'castle' && b && b.continent === 'chrono')) {
        this.drawClockworkTower(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'star_observatory' || type === 'observatory' || (type === 'temple' && b && b.continent === 'chrono')) {
        this.drawStarObservatory(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'glacial_citadel' || (type === 'castle' && b && b.continent === 'valkyrie')) {
        this.drawGlacialCitadel(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'aurora_monolith' || (type === 'temple' && b && b.continent === 'valkyrie')) {
        this.drawAuroraMonolith(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'pagoda_tower' || (type === 'castle' && b && b.continent === 'sakura') || (type === 'capital' && b && b.continent === 'sakura')) {
        this.drawPagodaTower(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'torii_shrine' || (type === 'temple' && b && b.continent === 'sakura')) {
        this.drawToriiShrine(ctx, px, py, bw, bh, isNight, timeSec);
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
      if (type === 'campfire' || type === 'campfire_stools') {
        this.drawProp(ctx, px, py, 'campfire_stools', isNight, timeSec);
        return true;
      }
      if (type === 'cage') {
        this.drawProp(ctx, px, py, 'cage', isNight, timeSec);
        return true;
      }
      if (type === 'well' || type === 'stone_well') {
        this.drawProp(ctx, px, py, 'stone_well', isNight, timeSec);
        return true;
      }
      if (type === 'hay_bale') {
        this.drawProp(ctx, px, py, 'hay_bale', isNight, timeSec);
        return true;
      }
      if (type === 'anvil' || type === 'iron_anvil') {
        this.drawProp(ctx, px, py, 'anvil', isNight, timeSec);
        return true;
      }
      if (type === 'tree_stump') {
        this.drawProp(ctx, px, py, 'tree_stump', isNight, timeSec);
        return true;
      }
      if (type === 'fallen_log') {
        this.drawProp(ctx, px, py, 'fallen_log', isNight, timeSec);
        return true;
      }
      if (type === 'wooden_fence') {
        this.drawProp(ctx, px, py, 'wooden_fence', isNight, timeSec);
        return true;
      }
      if (type === 'chicken_coop') {
        this.drawProp(ctx, px, py, 'chicken_coop', isNight, timeSec);
        return true;
      }
      if (type === 'signpost') {
        this.drawProp(ctx, px, py, 'signpost', isNight, timeSec);
        return true;
      }

      // Default fallback: cute log cabin
      this.drawCuteLogCabin(ctx, px, py, bw, bh, isNight, timeSec);
      return true;
    }
  };

  window.PixelBuildings = PixelBuildings;
})(typeof window !== 'undefined' ? window : global);
