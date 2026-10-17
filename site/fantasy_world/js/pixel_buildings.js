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
    // 11.10. 신기루 제국 황금 술탄 궁전 (Mirage Empire Golden Sultan Palace)
    // =========================================================================
    drawSultanPalace(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 지면 앰비언트 오클루전 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 4, 6);

      // B. 사암 기단 및 청금석 모자이크 외벽 (Sandstone Foundation & Lapis Mosaic)
      const baseH = Math.round(bh * 0.52);
      const baseY = py + halfH - baseH;
      ctx.fillStyle = '#b45309'; // 따뜻한 사암 섀도우
      ctx.fillRect(px - halfW, baseY, bw, baseH);
      ctx.fillStyle = '#d97706'; // 사암 메인 블록
      ctx.fillRect(px - halfW + 2, baseY + 2, bw - 4, baseH - 3);

      // 청금석 & 터키석 모자이크 띠 (Lapis Lazuli & Turquoise Geometric Inlays)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(px - halfW + 2, baseY + 6, bw - 4, 3);
      ctx.fillStyle = '#38bdf8';
      for (let ix = px - halfW + 4; ix < px + halfW - 4; ix += 6) {
        ctx.fillRect(ix, baseY + 7, 2, 1);
      }

      // C. 좌우 대칭 첨탑 미나렛 (Twin Slender Minaret Towers)
      const minW = Math.max(5, Math.round(bw * 0.14));
      const minH = Math.round(bh * 0.78);
      const minLeftX = px - halfW + 2;
      const minRightX = px + halfW - minW - 2;
      const minY = py + halfH - minH;

      const drawMinaret = (mx) => {
        // 미나렛 기둥
        ctx.fillStyle = '#92400e';
        ctx.fillRect(mx, minY, minW, minH);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(mx + 1, minY + 1, minW - 2, minH - 1);
        // 중간 발코니
        ctx.fillStyle = '#78350f';
        ctx.fillRect(mx - 2, minY + 16, minW + 4, 3);
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(mx - 1, minY + 17, minW + 2, 1);
        // 미나렛 황금 미니 양파 돔 (Mini Onion Dome)
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(mx + minW / 2, minY - 2, minW * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(mx + minW / 2, minY - 2, minW * 0.55, 0, Math.PI * 2);
        ctx.fill();
        // 초승달 상륜부 (Hilal Spire)
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(mx + minW / 2 - 0.5, minY - minW * 0.7 - 5, 1, 5);
        ctx.fillRect(mx + minW / 2 - 1.5, minY - minW * 0.7 - 6, 3, 1);
      };
      drawMinaret(minLeftX);
      drawMinaret(minRightX);

      // D. 중앙 마제형(말발굽) 아치 대문 (Horseshoe Keyhole Archway)
      const gateW = Math.round(bw * 0.32);
      const gateH = Math.round(baseH * 0.65);
      const gateX = px - Math.round(gateW / 2);
      const gateY = py + halfH - gateH;

      ctx.fillStyle = '#0f172a'; // 어두운 궁전 내부
      ctx.fillRect(gateX, gateY, gateW, gateH);
      ctx.beginPath();
      ctx.arc(px, gateY, gateW / 2, Math.PI, 0);
      ctx.fill();

      // 황금 아치 테두리 장식
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(gateX, gateY, gateW, gateH);
      ctx.beginPath();
      ctx.arc(px, gateY, gateW / 2, Math.PI, 0);
      ctx.stroke();

      // 보랏빛 왕실 비단 캐노피 (Royal Purple Silk Canopy)
      ctx.fillStyle = '#7e22ce';
      ctx.fillRect(gateX - 2, gateY - 3, gateW + 4, 3);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(gateX - 1, gateY - 2, gateW + 2, 1);

      // E. 중앙 거대 황금 양파 돔 (Grand Gilded Onion Dome)
      const domeR = Math.round(bw * 0.28);
      const domeY = baseY - Math.round(domeR * 0.55);

      // 돔 베이스 원통형 드럼
      ctx.fillStyle = '#b45309';
      ctx.fillRect(px - domeR + 2, baseY - 6, (domeR - 2) * 2, 7);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - domeR + 3, baseY - 5, (domeR - 3) * 2, 5);

      // 구형 양파 돔 몸통
      ctx.fillStyle = '#b45309'; // 섀도우
      ctx.beginPath();
      ctx.arc(px, domeY, domeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b'; // 황금 메인 바디
      ctx.beginPath();
      ctx.arc(px, domeY, domeR - 2, 0, Math.PI * 2);
      ctx.fill();

      // 왼쪽 하이라이트 & 스페큘러 글로우
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(px - domeR * 0.25, domeY - domeR * 0.25, domeR * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - domeR * 0.35, domeY - domeR * 0.35, 3, 3);

      // 뾰족한 양파 돔 첨두부 (Onion Dome Spire Tip)
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(px - 5, domeY - domeR + 2);
      ctx.lineTo(px, domeY - domeR - 10);
      ctx.lineTo(px + 5, domeY - domeR + 2);
      ctx.closePath();
      ctx.fill();

      // 황금 초승달 힐랄 핀나클 (Golden Hilal Crescent Moon Finial)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 0.5, domeY - domeR - 14, 1, 5);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(px, domeY - domeR - 16, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isNight ? '#0f172a' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(px + 1.2, domeY - domeR - 17, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // F. 야간 지니 영천 램프 및 화로 연기 (Night Djinn Lanterns & Mystic Vapors)
      if (isNight) {
        // 좌우 청동 화로 등불
        const lampY = py + halfH - 12;
        const drawLamp = (lx) => {
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(lx, lampY, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#cffafe';
          ctx.fillRect(lx - 1, lampY - 1, 2, 2);
        };
        drawLamp(gateX - 4);
        drawLamp(gateX + gateW + 4);

        // 지니의 터키석 마법 안개 연무
        const wispY = lampY - 6 - (timeSec * 8) % 10;
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.fillRect(gateX - 4 + Math.sin(timeSec * 3) * 2, wispY, 2, 2);
        ctx.fillRect(gateX + gateW + 4 - Math.sin(timeSec * 3) * 2, wispY, 2, 2);
      }
    },

    // =========================================================================
    // 11.11. 고대 파라오 계단식 사암 피라미드 (Ancient Sandstone Stepped Pyramid)
    // =========================================================================
    drawSandstonePyramid(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 모래사장 지면 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 4, 6);

      // B. 5단 계단식 사암 테라스 (5-Tiered Sandstone Stepped Terraces)
      const tiers = 5;
      const tierH = Math.round((bh - 14) / tiers);
      for (let t = 0; t < tiers; t++) {
        const stepFrac = t / tiers;
        const curW = Math.round(bw * (1 - stepFrac * 0.72));
        const curHW = Math.round(curW / 2);
        const curY = py + halfH - 3 - (t + 1) * tierH;

        // 사암 계단 음영
        ctx.fillStyle = '#78350f'; // 섀도우 우측
        ctx.fillRect(px - curHW, curY, curW, tierH);
        ctx.fillStyle = '#b45309'; // 메인 베이스
        ctx.fillRect(px - curHW + 1, curY + 1, curW - 2, tierH - 1);
        ctx.fillStyle = '#d97706'; // 상단 햇빛 받는 면
        ctx.fillRect(px - curHW + 2, curY + 1, curW - 4, 2);

        // 상형문자 음각 각인 디테일 (Hieroglyphic Cartouche Etchings)
        if (t < 3) {
          ctx.fillStyle = '#451a03';
          for (let gx = px - curHW + 6; gx < px + curHW - 6; gx += 8) {
            ctx.fillRect(gx, curY + 4, 3, 2);
            ctx.fillRect(gx + 1, curY + 3, 1, 4);
          }
        }
      }

      // C. 중앙 깊은 성소 묘실 입구 (Deep Pharaoh Tomb Portal)
      const gateW = Math.max(6, Math.round(bw * 0.22));
      const gateH = Math.round(tierH * 1.8);
      const gateX = px - Math.round(gateW / 2);
      const gateY = py + halfH - gateH - 3;

      ctx.fillStyle = '#020617'; // 암흑의 무덤 내부
      ctx.fillRect(gateX, gateY, gateW, gateH);
      // 포탈 상인방 (Stone Lintel)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(gateX - 2, gateY - 2, gateW + 4, 3);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(gateX - 1, gateY - 1, gateW + 2, 1);

      // 좌우 미니어처 오벨리스크 (Twin Ceremonial Obelisks)
      const obLeftX = px - halfW + 6;
      const obRightX = px + halfW - 8;
      const obH = Math.round(bh * 0.38);
      const obY = py + halfH - obH - 2;

      const drawObelisk = (ox) => {
        ctx.fillStyle = '#92400e';
        ctx.fillRect(ox, obY + 3, 4, obH - 3);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(ox + 1, obY + 3, 2, obH - 3);
        // 황금 피라미디온 상단
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(ox, obY + 3);
        ctx.lineTo(ox + 2, obY);
        ctx.lineTo(ox + 4, obY + 3);
        ctx.closePath();
        ctx.fill();
      };
      drawObelisk(obLeftX);
      drawObelisk(obRightX);

      // D. 정상에 부유하는 초자연적 황금 피라미디온 (Floating Golden Pyramidion Capstone)
      const floatY = Math.sin(timeSec * 3.2) * 2;
      const capW = Math.round(bw * 0.24);
      const capHW = Math.round(capW / 2);
      const capTopY = py - halfH + 4 + floatY;

      // 발광 오라 광선 (Mystic Sun Beam)
      ctx.save();
      const beamGrad = ctx.createLinearGradient(px, capTopY, px, gateY);
      beamGrad.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
      beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0.0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(px - capHW, capTopY + 8);
      ctx.lineTo(px + capHW, capTopY + 8);
      ctx.lineTo(px + gateW / 2 + 2, gateY);
      ctx.lineTo(px - gateW / 2 - 2, gateY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 황금 피라미디온 본체
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(px - capHW, capTopY + 8);
      ctx.lineTo(px, capTopY);
      ctx.lineTo(px + capHW, capTopY + 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(px - capHW + 1, capTopY + 7);
      ctx.lineTo(px, capTopY + 1);
      ctx.lineTo(px + capHW - 1, capTopY + 7);
      ctx.closePath();
      ctx.fill();

      // 피라미디온 호루스의 눈 / 라의 태양 심볼
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, capTopY + 5, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0284c7'; // 청금석 동공
      ctx.fillRect(px - 0.5, capTopY + 4.5, 1, 1);
    },

    // =========================================================================
    // 11.12. 천둥의 올림포스 백옥 대리석 판테온 (Olympus Marble Pantheon)
    // =========================================================================
    drawOlympusPantheon(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 지면 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 4, 6);

      // B. 3단 그리스식 크레피도마 대리석 기단 (3-Tiered Marble Crepidoma Steps)
      for (let s = 0; s < 3; s++) {
        const stepW = bw - (2 - s) * 4;
        const stepHW = Math.round(stepW / 2);
        const stepY = py + halfH - (s + 1) * 3;
        ctx.fillStyle = '#64748b'; // 기단 그림자
        ctx.fillRect(px - stepHW, stepY, stepW, 3);
        ctx.fillStyle = '#e2e8f0'; // 백옥 대리석 면
        ctx.fillRect(px - stepHW + 1, stepY, stepW - 2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - stepHW + 2, stepY, stepW - 4, 1);
      }

      // C. 중앙 신성한 셀라(내실) 암흑 & 제우스 황금상 실루엣 (Inner Sanctuary Cella)
      const baseTopY = py + halfH - 9;
      const cellaW = Math.round(bw * 0.68);
      const cellaHW = Math.round(cellaW / 2);
      const colH = Math.round(bh * 0.46);
      const entablatureY = baseTopY - colH;

      ctx.fillStyle = '#090d16'; // 신비로운 어둠
      ctx.fillRect(px - cellaHW, entablatureY, cellaW, colH);

      // 제우스 황금 뇌전 실루엣
      ctx.fillStyle = isNight ? '#fef08a' : '#f59e0b';
      ctx.fillRect(px - 3, baseTopY - Math.round(colH * 0.65), 6, Math.round(colH * 0.65));
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 1.5, baseTopY - Math.round(colH * 0.82), 3, 4);

      // D. 전면 코린트식 백옥 대리석 열주 (Corinthian Fluted Marble Columns)
      const colCount = 6;
      const colSpacing = (bw - 10) / (colCount - 1);
      for (let c = 0; c < colCount; c++) {
        const cx = Math.round(px - halfW + 5 + c * colSpacing);
        // 기둥 베이스
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx - 3, baseTopY - 2, 6, 2);
        // 기둥 몸통 (Fluted Shaft)
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(cx - 2, entablatureY + 3, 4, colH - 5);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cx - 1, entablatureY + 3, 2, colH - 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx, entablatureY + 3, 1, colH - 5);
        // 주두 (Capital)
        ctx.fillStyle = '#facc15'; // 황금 코린트 주두 장식
        ctx.fillRect(cx - 3, entablatureY, 6, 3);
      }

      // E. 엔타블러처 (보 및 프리즈 황금 월계관 부조)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px - halfW, entablatureY - 5, bw, 6);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(px - halfW + 1, entablatureY - 4, bw - 2, 4);
      // 황금 월계관 부조 프리즈
      ctx.fillStyle = '#facc15';
      for (let fx = px - halfW + 8; fx < px + halfW - 8; fx += 10) {
        ctx.fillRect(fx, entablatureY - 3, 4, 2);
      }

      // F. 삼각 페디먼트 박공 지붕 (Triangular Pediment & Tympanum)
      const pedH = Math.round(bh * 0.32);
      const pedTopY = entablatureY - 5 - pedH;

      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(px - halfW - 2, entablatureY - 5);
      ctx.lineTo(px, pedTopY);
      ctx.lineTo(px + halfW + 2, entablatureY - 5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(px - halfW, entablatureY - 5);
      ctx.lineTo(px, pedTopY + 2);
      ctx.lineTo(px + halfW, entablatureY - 5);
      ctx.closePath();
      ctx.fill();

      // 박공 중앙 황금 제우스 뇌전 심볼 (Zeus Lightning Bolt Tympanum Emblem)
      ctx.fillStyle = '#facc15';
      const tymY = entablatureY - 5 - Math.round(pedH * 0.45);
      ctx.beginPath();
      ctx.moveTo(px + 2, tymY - 5);
      ctx.lineTo(px - 3, tymY);
      ctx.lineTo(px + 1, tymY);
      ctx.lineTo(px - 2, tymY + 6);
      ctx.lineTo(px + 4, tymY);
      ctx.lineTo(px, tymY);
      ctx.closePath();
      ctx.fill();

      // G. 지붕 정상의 황금 제우스 뇌전 아크로테리온 (Golden Lightning Finial)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1, pedTopY - 12, 2, 13);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(px - 2.5, pedTopY - 8, 5, 2);
      ctx.fillRect(px - 1.5, pedTopY - 14, 3, 3);

      // 번개 스파크 효과 (Lightning Crackle Sparkles)
      if (Math.sin(timeSec * 22) > 0.35) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + (Math.sin(timeSec * 40) > 0 ? 4 : -4), pedTopY - 10, 2, 2);
      }

      // H. 야간 올림포스 성화 및 뇌전 오라 (Night Divine Blue Flame)
      if (isNight) {
        const flameY = baseTopY - 6;
        const drawFlame = (fx) => {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(fx, flameY, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(fx - 1, flameY - 1, 2, 2);
        };
        drawFlame(px - halfW + 8);
        drawFlame(px + halfW - 8);
      }
    },

    // =========================================================================
    // 11.13. 티탄 천공 원형 검투장 (Titan Celestial Colosseum Arena)
    // =========================================================================
    drawTitanColosseum(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 지면 거대 타원형 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
      ctx.beginPath();
      ctx.ellipse(px, py + halfH - 2, halfW + 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // B. 3층 로마식 곡면 아케이드 석조 외벽 (3-Tiered Roman Arcade Façade)
      const tiers = 3;
      const tierH = Math.round((bh - 8) / tiers);
      for (let t = 0; t < tiers; t++) {
        const curY = py + halfH - 4 - (t + 1) * tierH;
        const curW = bw - t * 4;
        const curHW = Math.round(curW / 2);

        // 석조 층 외벽
        ctx.fillStyle = '#334155';
        ctx.fillRect(px - curHW, curY, curW, tierH);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px - curHW + 1, curY + 1, curW - 2, tierH - 1);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px - curHW + 2, curY + 1, curW - 4, 2);

        // 아치 창문 열주 (Curved Arcades)
        const arcCount = 5 - t;
        const arcSpacing = (curW - 12) / (arcCount - 1);
        for (let a = 0; a < arcCount; a++) {
          const ax = Math.round(px - curHW + 6 + a * arcSpacing);
          const archW = 6;
          const archH = tierH - 5;
          ctx.fillStyle = '#090d16'; // 개방형 아치 내부
          ctx.fillRect(ax - Math.round(archW / 2), curY + 4, archW, archH);
          ctx.beginPath();
          ctx.arc(ax, curY + 4, archW / 2, Math.PI, 0);
          ctx.fill();

          // 아치 황금 테두리 키스톤 (Keystone & Sconces)
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(ax - 1, curY + 1, 2, 2);
        }
      }

      // C. 중앙 원형 투기장 모래 경기장 & 개선문 (Central Gladiator Arena Sand Pit & Royal Gate)
      const gateW = Math.round(bw * 0.28);
      const gateHW = Math.round(gateW / 2);
      const gateH = Math.round(tierH * 1.5);
      const gateY = py + halfH - 4 - gateH;

      ctx.fillStyle = '#d97706'; // 황금빛 모래 투기장 링
      ctx.beginPath();
      ctx.ellipse(px, py + halfH - 6, gateHW + 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(px, py + halfH - 6, gateHW, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // D. 거대한 황금 영웅 챔피언 석상 (Twin Gilded Gladiator Statues)
      const statLeftX = px - halfW + 8;
      const statRightX = px + halfW - 10;
      const statY = py + halfH - tierH - 8;

      const drawStatue = (sx) => {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(sx, statY, 4, 8);
        ctx.fillStyle = '#facc15'; // 황금 조각상
        ctx.fillRect(sx + 1, statY, 2, 7);
        // 황금 삼지창 / 검
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(sx + 3, statY - 4, 1, 10);
      };
      drawStatue(statLeftX);
      drawStatue(statRightX);

      // E. 상단 난간 펄럭이는 진홍빛 제국 배너 (Imperial Crimson Banners)
      const topY = py - halfH + 4;
      for (let b = 0; b < 4; b++) {
        const bx = px - halfW + 10 + b * Math.round((bw - 20) / 3);
        const wave = Math.sin(timeSec * 4 + b) * 2;
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(bx, topY);
        ctx.lineTo(bx + 4 + wave, topY + 2);
        ctx.lineTo(bx + 3 + wave, topY + 8);
        ctx.lineTo(bx, topY + 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.fillRect(bx - 0.5, topY - 3, 1, 8);
      }
    },

    // =========================================================================
    // 11.14. 태고 드워프 증기 요새 대성채 (Steamforge Dwarven Citadel)
    // =========================================================================
    drawSteamforgeCitadel(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 지면 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 4, 6);

      // B. 중후한 현무암 & 주철 성채 몸체 (Heavy Basalt & Cast-Iron Bastion)
      const baseH = Math.round(bh * 0.62);
      const baseY = py + halfH - baseH;

      ctx.fillStyle = '#0f172a'; // 현무암 섀도우
      ctx.fillRect(px - halfW, baseY, bw, baseH);
      ctx.fillStyle = '#1e293b'; // 주철 메인 블록
      ctx.fillRect(px - halfW + 2, baseY + 2, bw - 4, baseH - 3);

      // 리벳 결합 놋쇠 띠 (Riveted Brass Reinforcement Bands)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(px - halfW + 2, baseY + 6, bw - 4, 3);
      ctx.fillRect(px - halfW + 2, baseY + baseH - 10, bw - 4, 3);
      ctx.fillStyle = '#f59e0b';
      for (let rx = px - halfW + 5; rx < px + halfW - 5; rx += 7) {
        ctx.fillRect(rx, baseY + 7, 2, 1);
        ctx.fillRect(rx, baseY + baseH - 9, 2, 1);
      }

      // C. 좌우 거대 산업 굴뚝 & 증기 배출 (Twin Smelting Smokestacks & Steam Vents)
      const stackW = Math.max(5, Math.round(bw * 0.14));
      const stackH = Math.round(bh * 0.55);
      const stackY = baseY - stackH + 6;

      const drawSmokestack = (sx) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(sx, stackY, stackW, stackH);
        ctx.fillStyle = '#334155';
        ctx.fillRect(sx + 1, stackY, stackW - 2, stackH);
        ctx.fillStyle = '#b45309'; // 놋쇠 립
        ctx.fillRect(sx - 1, stackY - 2, stackW + 2, 3);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(sx, stackY - 1, stackW, 1);

        // 배출되는 풍성한 백색 증기 구름 (Puffing Steam Clouds)
        for (let p = 0; p < 3; p++) {
          const steamAge = (timeSec * 3.5 + p * 1.3) % 4.0;
          const puffY = stackY - 4 - steamAge * 7;
          const puffWobble = Math.sin(timeSec * 4 + p) * 3;
          const puffRad = 3 + steamAge * 1.5;
          const steamAlpha = Math.max(0, 0.45 - steamAge * 0.11);
          ctx.fillStyle = `rgba(241, 245, 249, ${steamAlpha})`;
          ctx.beginPath();
          ctx.arc(sx + stackW / 2 + puffWobble, puffY, puffRad, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      drawSmokestack(px - halfW + 3);
      drawSmokestack(px + halfW - stackW - 3);

      // D. 전면 거대 회전 놋쇠 기어 톱니바퀴 (Rotating Brass Clockwork Gear)
      const gearR = Math.round(bw * 0.22);
      const gearX = px;
      const gearY = baseY + Math.round(baseH * 0.38);
      const gearAng = timeSec * 1.8;

      ctx.save();
      ctx.translate(gearX, gearY);
      ctx.rotate(gearAng);
      // 기어 외륜 및 톱니 (Cogs)
      ctx.fillStyle = '#b45309';
      for (let t = 0; t < 8; t++) {
        const ang = (Math.PI / 4) * t;
        ctx.fillRect(Math.cos(ang) * (gearR - 1) - 2, Math.sin(ang) * (gearR - 1) - 2, 4, 4);
      }
      ctx.beginPath();
      ctx.arc(0, 0, gearR - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, gearR - 4, 0, Math.PI * 2);
      ctx.fill();
      // 기어 중심 림 & 리벳
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(0, 0, gearR * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(-1.5, -1.5, 3, 3);
      ctx.restore();

      // E. 하단 룬 철문 포트컬리스 & 마그마 도랑 (Iron Portcullis & Molten Magma Trench)
      const gateW = Math.round(bw * 0.30);
      const gateH = Math.round(baseH * 0.38);
      const gateX = px - Math.round(gateW / 2);
      const gateY = py + halfH - gateH;

      // 마그마 홈 (Magma Gutter)
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(px - halfW + 2, py + halfH - 4, bw - 4, 4);
      ctx.fillStyle = '#fef08a';
      for (let mx = px - halfW + 4; mx < px + halfW - 4; mx += 8) {
        ctx.fillRect(mx + (timeSec * 6) % 8, py + halfH - 3, 3, 2);
      }

      // 철문 및 드워프 황금 룬 (Iron Gate & Glowing Inscription)
      ctx.fillStyle = '#020617';
      ctx.fillRect(gateX, gateY, gateW, gateH - 4);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(gateX + 2, gateY + 2, gateW - 4, 1);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(gateX + Math.round(gateW / 2) - 1, gateY + 4, 2, gateH - 10);
    },

    // =========================================================================
    // 11.15. 티탄 마그마 거대 제련소 & 흑요석 모루 (Titan Magma Smelting Foundry)
    // =========================================================================
    drawMagmaFoundry(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 지면 뜨거운 마그마 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 4, 6);

      // B. 흑요석 용광로 벽체 (Obsidian Furnace Structure)
      const fH = Math.round(bh * 0.65);
      const fY = py + halfH - fH;

      ctx.fillStyle = '#090d16'; // 흑요석
      ctx.fillRect(px - halfW, fY, bw, fH);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(px - halfW + 2, fY + 2, bw - 4, fH - 3);

      // 복잡한 구리 증기 파이프라인 (Intertwined Copper Steam Pipes)
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(px - halfW + 4, fY + 6, bw - 8, 3);
      ctx.fillRect(px + halfW - 8, fY + 6, 4, fH - 12);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(px - halfW + 5, fY + 7, bw - 10, 1);
      ctx.fillRect(px + halfW - 7, fY + 7, 2, fH - 14);

      // 원형 증기 압력 게이지 (Circular Steam Pressure Gauge)
      const gaugeX = px + halfW - 14;
      const gaugeY = fY + 14;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(gaugeX, gaugeY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444'; // 바늘
      ctx.fillRect(gaugeX - 0.5, gaugeY - 2.5, 1, 3);

      // C. 상단 기울어진 마그마 도가니 (Tilting Molten Magma Crucible)
      const vatW = Math.round(bw * 0.36);
      const vatHW = Math.round(vatW / 2);
      const vatH = Math.round(fH * 0.45);
      const vatY = fY - 3;

      ctx.fillStyle = '#475569';
      ctx.fillRect(px - vatHW, vatY, vatW, vatH);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px - vatHW + 1, vatY + 1, vatW - 2, vatH - 2);

      // 흘러내리는 액체 황금 마그마 폭포 (Pouring Molten Gold & Magma Stream)
      const pourX = px - 2;
      const pourH = fH - 4;
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(pourX - 1, vatY + vatH - 2, 6, pourH);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(pourX, vatY + vatH - 2, 4, pourH);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pourX + 1, vatY + vatH - 2, 2, pourH);

      // D. 거대한 흑요석 모루와 티탄 망치 (Colossal Obsidian Anvil & Hammer)
      const anvilX = px - halfW + 12;
      const anvilY = py + halfH - 12;

      // 모루 대좌
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(anvilX - 6, anvilY + 4, 12, 6);
      ctx.fillStyle = '#334155';
      ctx.fillRect(anvilX - 7, anvilY, 14, 4);
      // 모루 뿔 (Horn)
      ctx.beginPath();
      ctx.moveTo(anvilX - 7, anvilY);
      ctx.lineTo(anvilX - 10, anvilY + 1);
      ctx.lineTo(anvilX - 7, anvilY + 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(anvilX - 5, anvilY + 1, 9, 2);

      // 용광로 불꽃 스파크 방출 (Molten Smelter Sparks)
      const sparkCycle = (timeSec * 8) % 6;
      ctx.fillStyle = '#fde047';
      ctx.fillRect(pourX - 3 + Math.sin(timeSec * 15) * 4, py + halfH - 8 - sparkCycle * 2, 2, 2);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(pourX + 4 - Math.sin(timeSec * 15) * 4, py + halfH - 6 - sparkCycle * 2, 2, 2);
    },

    // =========================================================================
    // 11.16. 핏빛 장미의 고딕 대성당 (Gothic Blood Rose Cathedral)
    // =========================================================================
    drawGothicCathedral(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 어두운 지면 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.fillRect(px - halfW + 1, py + halfH - 2, bw - 2, 6);

      // B. 흑요석 슬레이트 본당 (Dark Slate Obsidian Nave)
      const naveW = Math.round(bw * 0.62);
      const naveHW = Math.round(naveW / 2);
      const naveH = Math.round(bh * 0.75);
      const naveY = py + halfH - naveH;

      ctx.fillStyle = '#0f172a'; // 흑요석 심층
      ctx.fillRect(px - naveHW, naveY, naveW, naveH);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - naveHW + 2, naveY + 2, naveW - 4, naveH - 3);

      // 플라잉 버트레스 (Flying Buttresses - 좌우 2단 버트레스 아치)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - naveHW, naveY + 8);
      ctx.lineTo(px - halfW + 2, py + halfH - 6);
      ctx.moveTo(px + naveHW, naveY + 8);
      ctx.lineTo(px + halfW - 2, py + halfH - 6);
      ctx.stroke();

      // 양쪽 버트레스 기둥 피너클 첨탑 (Buttress Pinnacles)
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - halfW + 1, py + halfH - 14, 4, 12);
      ctx.fillRect(px + halfW - 5, py + halfH - 14, 4, 12);
      ctx.fillStyle = '#f43f5e'; // 진홍빛 장식 핀
      ctx.fillRect(px - halfW + 2, py + halfH - 17, 2, 3);
      ctx.fillRect(px + halfW - 4, py + halfH - 17, 2, 3);

      // C. 좌우 솟구치는 고딕 쌍둥이 첨탑 (Twin Soaring Gothic Lancet Spires)
      const towerW = Math.round(bw * 0.22);
      const towerH = Math.round(bh * 0.95);
      const towerY = py + halfH - towerH;

      const drawSpire = (tx, isLeft) => {
        // 탑 기단
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(tx, towerY, towerW, towerH);
        ctx.fillStyle = '#1e1b4b'; // 미스티 다크 바이올렛
        ctx.fillRect(tx + 1, towerY + 1, towerW - 2, towerH - 2);

        // 탑 층계 배틀먼트 & 가고일 (Tower Gargoyles)
        ctx.fillStyle = '#475569';
        ctx.fillRect(tx - 1, towerY + 14, towerW + 2, 3);
        const gX = isLeft ? tx - 3 : tx + towerW + 1;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(gX, towerY + 13, 3, 3);
        ctx.fillStyle = '#ef4444'; // 가고일 붉은 안광
        ctx.fillRect(isLeft ? gX : gX + 1, towerY + 14, 1, 1);

        // 뾰족한 고딕 원추 지붕 (Sharp Lancet Spire Roof)
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.moveTo(tx - 1, towerY);
        ctx.lineTo(tx + Math.round(towerW / 2), towerY - 18);
        ctx.lineTo(tx + towerW + 1, towerY);
        ctx.closePath();
        ctx.fill();

        // 첨탑 루비 크로스 & 핀 (Ruby Finial)
        const finX = tx + Math.round(towerW / 2);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(finX - 1, towerY - 24, 2, 6);
        ctx.fillRect(finX - 3, towerY - 22, 6, 2);

        // 슬릿 란셋 창문 (Lancet Window)
        ctx.fillStyle = isNight ? '#fda4af' : '#881337';
        ctx.fillRect(tx + Math.round(towerW / 2) - 1, towerY + 20, 2, 8);
      };

      drawSpire(px - halfW + 1, true);
      drawSpire(px + halfW - towerW - 1, false);

      // D. 중앙 거대 스테인드글라스 핏빛 장미창 (The Great Crimson Rose Stained Glass)
      const roseY = naveY + Math.round(naveH * 0.32);
      const roseR = Math.min(10, Math.round(naveW * 0.28));

      // 외곽 흑요석 프레임
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(px, roseY, roseR + 2, 0, Math.PI * 2);
      ctx.fill();

      // 진홍빛 장미창 발광 효과 (Rose Window Divine/Vampiric Glow)
      const roseGlow = Math.sin(timeSec * 3) * 0.2 + 0.8;
      ctx.save();
      const roseGrad = ctx.createRadialGradient(px, roseY, 1, px, roseY, roseR + 4);
      roseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      roseGrad.addColorStop(0.3, 'rgba(244, 63, 94, 0.85)');
      roseGrad.addColorStop(0.7, 'rgba(159, 18, 57, 0.7)');
      roseGrad.addColorStop(1, 'rgba(76, 5, 25, 0.4)');
      ctx.fillStyle = roseGrad;
      ctx.beginPath();
      ctx.arc(px, roseY, roseR, 0, Math.PI * 2);
      ctx.fill();

      // 장미창 방사형 8방향 살 (Tracery Spokes)
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(px, roseY);
        ctx.lineTo(px + Math.cos(ang) * roseR, roseY + Math.sin(ang) * roseR);
        ctx.stroke();
      }

      // 야간 장미창 하향 투사 빔 (Downward Stained Glass Light Rays)
      if (isNight) {
        ctx.fillStyle = `rgba(244, 63, 94, ${0.12 * roseGlow})`;
        ctx.beginPath();
        ctx.moveTo(px - roseR, roseY);
        ctx.lineTo(px + roseR, roseY);
        ctx.lineTo(px + naveHW, py + halfH);
        ctx.lineTo(px - naveHW, py + halfH);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // E. 중앙 고딕 뾰족 아치 성문 & 장미 덩굴 철제 문 (Pointed Portal & Wrought Iron Gate)
      const gateW = 10;
      const gateH = 14;
      const gateX = px - 5;
      const gateY = py + halfH - gateH;

      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(gateX, py + halfH);
      ctx.lineTo(gateX, gateY + 4);
      ctx.lineTo(px, gateY);
      ctx.lineTo(gateX + gateW, gateY + 4);
      ctx.lineTo(gateX + gateW, py + halfH);
      ctx.closePath();
      ctx.fill();

      // 핏빛 룬 도어 빗장
      ctx.fillStyle = '#881337';
      ctx.fillRect(gateX + 2, gateY + 4, gateW - 4, gateH - 4);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(px - 1, gateY + 5, 2, gateH - 6);

      // F. 야간 밤하늘을 선회하는 박쥐 3마리 (Nocturnal Circling Bats)
      if (isNight) {
        ctx.fillStyle = '#0f172a';
        for (let b = 0; b < 3; b++) {
          const batAng = timeSec * 2.5 + (b * Math.PI * 2) / 3;
          const batR = 18 + b * 4;
          const batX = px + Math.cos(batAng) * batR;
          const batY = (towerY - 10) + Math.sin(batAng) * 6;
          const flap = Math.sin(timeSec * 16 + b) > 0 ? 2 : -2;

          ctx.beginPath();
          ctx.moveTo(batX, batY);
          ctx.lineTo(batX - 3, batY + flap);
          ctx.lineTo(batX, batY + 1);
          ctx.lineTo(batX + 3, batY + flap);
          ctx.closePath();
          ctx.fill();
        }
      }
    },

    // =========================================================================
    // 11.17. 월하의 야상곡 캐슬바니아 성채 (Vampire Moonlit Castlevania Keep)
    // =========================================================================
    drawVampireCastlevaniaKeep(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 거대한 진홍빛 붉은 달 후광 백드롭 (Blood Moon Backdrop & Halo)
      const moonR = Math.min(22, Math.round(bw * 0.42));
      const moonX = px + Math.round(bw * 0.18);
      const moonY = py - halfH + 8;

      ctx.save();
      const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.4, moonX, moonY, moonR * 1.5);
      moonGlow.addColorStop(0, 'rgba(255, 228, 230, 0.9)');
      moonGlow.addColorStop(0.4, 'rgba(225, 29, 72, 0.7)');
      moonGlow.addColorStop(0.8, 'rgba(159, 18, 57, 0.3)');
      moonGlow.addColorStop(1, 'rgba(88, 28, 135, 0)');

      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 달 본체
      ctx.fillStyle = '#ffe4e6';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      // 달 표면 크레이터 실루엣
      ctx.fillStyle = 'rgba(225, 29, 72, 0.35)';
      ctx.beginPath();
      ctx.arc(moonX - 4, moonY - 3, 5, 0, Math.PI * 2);
      ctx.arc(moonX + 6, moonY + 4, 7, 0, Math.PI * 2);
      ctx.arc(moonX - 2, moonY + 7, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // B. 흑암 성채 기단 (Dark Obsidian Bastion Foundation)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(px - halfW, py + halfH - 2, bw, 6);

      ctx.fillStyle = '#020617';
      ctx.fillRect(px - halfW + 2, py + halfH - 12, bw - 4, 12);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(px - halfW + 4, py + halfH - 10, bw - 8, 8);

      // C. 비대칭 고딕 주탑 & 종탑 (Asymmetrical Castlevania Main Spire & Belfry)
      // 왼쪽 보조 첨탑
      const lW = Math.round(bw * 0.28);
      const lH = Math.round(bh * 0.65);
      const lX = px - halfW + 3;
      const lY = py + halfH - lH;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(lX, lY, lW, lH);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(lX + 2, lY + 2, lW - 4, lH - 4);

      // 왼쪽 첨탑 뾰족 지붕
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(lX - 1, lY);
      ctx.lineTo(lX + Math.round(lW / 2), lY - 14);
      ctx.lineTo(lX + lW + 1, lY);
      ctx.closePath();
      ctx.fill();

      // 중앙 메인 캐슬바니아 로얄 타워 (Monumental Center Tower)
      const cW = Math.round(bw * 0.42);
      const cH = Math.round(bh * 0.95);
      const cX = px - Math.round(cW / 2) + 2;
      const cY = py + halfH - cH;

      ctx.fillStyle = '#020617';
      ctx.fillRect(cX, cY, cW, cH);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(cX + 2, cY + 2, cW - 4, cH - 4);

      // 중앙 종탑 아치 개구부 & 황동 종 (Suspended Belfry Bell)
      const belfryY = cY + 12;
      ctx.fillStyle = '#020617';
      ctx.fillRect(px - 4, belfryY, 8, 12);
      // 황동 종
      const bellSway = Math.sin(timeSec * 3) * 1.5;
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(px + bellSway, belfryY + 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.fillRect(px - 1 + bellSway, belfryY + 7, 2, 4);

      // 초승달 모양 캐슬바니아 주탑 돔 & 피너클 (Castlevania Spire Finial)
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(cX - 2, cY);
      ctx.lineTo(px + 2, cY - 22);
      ctx.lineTo(cX + cW + 2, cY);
      ctx.closePath();
      ctx.fill();

      // 꼭대기 핏빛 루비 십자가 (Blood Ruby Cross)
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(px + 1, cY - 28, 2, 7);
      ctx.fillRect(px - 1, cY - 25, 6, 2);

      // D. 고딕 공중 연결 회랑 (Flying Stone Rampart Bridge)
      ctx.fillStyle = '#334155';
      ctx.fillRect(lX + lW - 1, lY + 8, cX - (lX + lW) + 2, 4);
      ctx.fillStyle = '#020617';
      ctx.fillRect(lX + lW, lY + 6, cX - (lX + lW), 2);

      // E. 성벽 위 보랏빛 마녀불 브레이저 (Violet Witchfire Braziers)
      const drawBrazier = (bx, by) => {
        ctx.fillStyle = '#475569';
        ctx.fillRect(bx - 2, by, 4, 3);
        // 타오르는 보랏빛/청색 마녀불꽃
        const flamePulse = Math.sin(timeSec * 8 + bx) * 2;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(bx, by - 2 + flamePulse * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(bx - 1, by - 4, 2, 3);
        ctx.fillStyle = '#fdf4ff';
        ctx.fillRect(bx, by - 3, 1, 1);
      };

      drawBrazier(cX - 1, cY + 4);
      drawBrazier(cX + cW + 1, cY + 4);
      drawBrazier(lX - 1, lY + 4);

      // F. 성문 - 뱀파이어 송곳니 문양 철제 낙하문 (Vampiric Fang Portcullis)
      const gateW = 12;
      const gateH = 14;
      const gateX = px - 6;
      const gateY = py + halfH - gateH;

      ctx.fillStyle = '#020617';
      ctx.fillRect(gateX, gateY, gateW, gateH);

      // 철창 창살
      ctx.fillStyle = '#64748b';
      for (let bar = gateX + 2; bar < gateX + gateW; bar += 2) {
        ctx.fillRect(bar, gateY + 2, 1, gateH - 2);
      }

      // 문 상단 송곳니 문양
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.moveTo(gateX + 3, gateY + 2);
      ctx.lineTo(gateX + 5, gateY + 6);
      ctx.lineTo(gateX + 4, gateY + 2);
      ctx.moveTo(gateX + 9, gateY + 2);
      ctx.lineTo(gateX + 7, gateY + 6);
      ctx.lineTo(gateX + 8, gateY + 2);
      ctx.fill();

      // G. 핏빛 영혼 미스트 & 장미 꽃잎 (Floating Crimson Soul Mist)
      const mistCount = 4;
      for (let m = 0; m < mistCount; m++) {
        const mistY = py + halfH - 4 - ((timeSec * 8 + m * 7) % 24);
        const mistX = px + Math.sin(timeSec * 2 + m) * (halfW - 6);
        const mistAlpha = Math.max(0, 0.4 - ((py + halfH - mistY) / 24) * 0.4);
        ctx.fillStyle = `rgba(244, 63, 94, ${mistAlpha})`;
        ctx.beginPath();
        ctx.arc(mistX, mistY, 2 + (m % 2), 0, Math.PI * 2);
        ctx.fill();
      }
    },

    // =========================================================================
    // 11.18. 영롱한 프리즘 수정 황제 궁전 (Crystal Prism Zenith Palace)
    // =========================================================================
    drawCrystalPrismPalace(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 영롱한 프리즘 굴절 바닥 그림자
      ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
      ctx.fillRect(px - halfW - 2, py + halfH - 3, bw + 4, 7);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 4, 5);

      // B. 육각 수정 기단 테라스 (Hexagonal Crystal Podium)
      const podW = Math.round(bw * 0.88);
      const podHW = Math.round(podW / 2);
      const podH = Math.round(bh * 0.24);
      const podY = py + halfH - podH;

      ctx.fillStyle = '#0369a1';
      ctx.fillRect(px - podHW, podY, podW, podH);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(px - podHW + 2, podY + 2, podW - 4, podH - 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px - podHW + 4, podY + 3, podW - 8, 2);

      // C. 좌우 다이아몬드 수정 첨탑 (Twin Diamond Crystal Obelisks)
      const obW = Math.round(bw * 0.20);
      const obH = Math.round(bh * 0.85);
      const obY = py + halfH - obH;

      const drawObelisk = (ox, isLeft) => {
        // 수정 바디
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(ox, obY + 8, obW, obH - 8);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(ox + 1, obY + 9, obW - 2, obH - 10);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(isLeft ? ox + 1 : ox + obW - 3, obY + 9, 2, obH - 10);

        // 뾰족한 다이아몬드 팁 (Diamond Pointed Tip)
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.moveTo(ox, obY + 8);
        ctx.lineTo(ox + Math.round(obW / 2), obY - 14);
        ctx.lineTo(ox + obW, obY + 8);
        ctx.closePath();
        ctx.fill();

        // 굴절 무지개 하이라이트 빔 (Prismatic Rainbow Refraction)
        const gleam = Math.sin(timeSec * 4 + (isLeft ? 0 : 2)) * 0.5 + 0.5;
        ctx.fillStyle = isLeft ? `rgba(244, 114, 182, ${gleam * 0.7})` : `rgba(250, 204, 21, ${gleam * 0.7})`;
        ctx.fillRect(ox + Math.round(obW / 2) - 1, obY - 12, 2, obH);
      };

      drawObelisk(px - halfW + 1, true);
      drawObelisk(px + halfW - obW - 1, false);

      // D. 중앙 거대 부유 다이아몬드 수정 코어 (Levitating Master Diamond Heart)
      const heartW = Math.round(bw * 0.38);
      const heartHW = Math.round(heartW / 2);
      const floatBob = Math.sin(timeSec * 3) * 3;
      const heartY = py - Math.round(bh * 0.15) + floatBob;

      // 후광 방사 오라 (Iridescent Halo Aura)
      ctx.save();
      const auraGrad = ctx.createRadialGradient(px, heartY, 2, px, heartY, heartW);
      auraGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      auraGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.75)');
      auraGrad.addColorStop(0.6, 'rgba(232, 121, 249, 0.45)');
      auraGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(px, heartY, heartW, 0, Math.PI * 2);
      ctx.fill();

      // 마스터 다이아몬드 능면 (Faceted Diamond Gem Polygons)
      // 상부 삼각형
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(px - heartHW, heartY);
      ctx.lineTo(px, heartY - heartHW * 1.2);
      ctx.lineTo(px + heartHW, heartY);
      ctx.closePath();
      ctx.fill();

      // 하부 역삼각형
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(px - heartHW, heartY);
      ctx.lineTo(px, heartY + heartHW * 1.5);
      ctx.lineTo(px + heartHW, heartY);
      ctx.closePath();
      ctx.fill();

      // 중앙 깎인 다이아몬드 테이블 면 (Gem Table Facet)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(px - Math.round(heartHW * 0.5), heartY - Math.round(heartHW * 0.3));
      ctx.lineTo(px, heartY - Math.round(heartHW * 0.8));
      ctx.lineTo(px + Math.round(heartHW * 0.5), heartY - Math.round(heartHW * 0.3));
      ctx.lineTo(px, heartY + Math.round(heartHW * 0.7));
      ctx.closePath();
      ctx.fill();

      // 궤도 회전하는 작은 수정 파편 3개 (Orbiting Crystal Shards)
      for (let s = 0; s < 3; s++) {
        const sAng = timeSec * 2.8 + (s * Math.PI * 2) / 3;
        const sR = heartHW + 8;
        const sX = px + Math.cos(sAng) * sR;
        const sY = heartY + Math.sin(sAng) * (sR * 0.5);

        ctx.fillStyle = (s === 0) ? '#f472b6' : ((s === 1) ? '#facc15' : '#38bdf8');
        ctx.beginPath();
        ctx.moveTo(sX, sY - 3);
        ctx.lineTo(sX + 2, sY);
        ctx.lineTo(sX, sY + 3);
        ctx.lineTo(sX - 2, sY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // E. 지면 마나 분수대 및 투명 크리스탈 포탈 (Mana Cascade Portal)
      const portW = 10;
      const portH = 12;
      const portX = px - 5;
      const portY = py + halfH - portH - 2;

      ctx.fillStyle = '#0369a1';
      ctx.fillRect(portX, portY, portW, portH);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(portX + 1, portY + 1, portW - 2, portH - 2);

      // 폭포수 마나 기둥 (Cascading Mana Light)
      const flowPulse = (timeSec * 8) % portH;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 2, portY + flowPulse, 4, 3);

      // F. 야간 천공 방사 프리즘 오로라 빔 (Night Prismatic Zenith Sky Beam)
      if (isNight) {
        ctx.save();
        const beamW = 12;
        const skyGrad = ctx.createLinearGradient(0, py - halfH, 0, py - halfH - 45);
        skyGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        skyGrad.addColorStop(0.5, 'rgba(232, 121, 249, 0.35)');
        skyGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(px - Math.round(beamW / 2), py - halfH - 45, beamW, 45);
        ctx.restore();
      }
    },

    // =========================================================================
    // 11.19. 별빛 마나 첨탑 에테르 천문대 (Starlight Mana Spire Observatory)
    // =========================================================================
    drawStarlightManaObservatory(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 별빛 오로라 지면 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.50)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 4, 6);

      // B. 원형 천문대 석조 돔 기단 (Circular Astrolabe Base)
      const baseW = Math.round(bw * 0.75);
      const baseHW = Math.round(baseW / 2);
      const baseH = Math.round(bh * 0.48);
      const baseY = py + halfH - baseH;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - baseHW, baseY, baseW, baseH);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - baseHW + 2, baseY + 2, baseW - 4, baseH - 3);

      // 황도 12궁 황동 링 디테일 (Brass Zodiac Inlay)
      ctx.fillStyle = '#d97706';
      ctx.fillRect(px - baseHW + 3, baseY + 6, baseW - 6, 2);
      ctx.fillStyle = '#fde047';
      for (let zx = px - baseHW + 6; zx < px + baseHW - 6; zx += 6) {
        ctx.fillRect(zx, baseY + 6, 2, 2);
      }

      // C. 회전하는 혼천의 아밀러리 링 (Rotating Armillary Crystal Rings)
      ctx.save();
      const ringR = Math.min(18, Math.round(bw * 0.36));
      const ringY = baseY - 2;

      // 외부 링
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(px, ringY, ringR, ringR * 0.45, timeSec * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      // 내부 링 (반대 회전)
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(px, ringY, ringR * 0.75, ringR * 0.35, -timeSec * 1.1, 0, Math.PI * 2);
      ctx.stroke();

      // D. 중심 초신성 마나 코어 (Pulsing Supernova Core)
      const corePulse = Math.sin(timeSec * 5) * 1.5;
      const coreGrad = ctx.createRadialGradient(px, ringY, 1, px, ringY, 8 + corePulse);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, '#38bdf8');
      coreGrad.addColorStop(0.8, '#a855f7');
      coreGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(px, ringY, 8 + corePulse, 0, Math.PI * 2);
      ctx.fill();

      // 코어 중심 발광 십자별 (Starlight Cross Twinkle)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 6, ringY - 0.5, 12, 1);
      ctx.fillRect(px - 0.5, ringY - 6, 1, 12);
      ctx.restore();

      // E. 좌우 지지 수정 오벨리스크 (Channeling Crystal Pylons)
      const pW = 5;
      const pH = Math.round(bh * 0.65);
      const pY = py + halfH - pH;

      const drawPylon = (pX) => {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(pX, pY, pW, pH);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(pX + 1, pY + 1, pW - 2, pH - 2);
        // 꼭대기 보석
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(pX - 1, pY - 4, pW + 2, 4);
      };

      drawPylon(px - baseHW - 2);
      drawPylon(px + baseHW - 3);

      // F. 출입문 및 성도 관측대 (Dome Portal & Astrological Ramp)
      const dW = 8;
      const dH = 10;
      ctx.fillStyle = '#020617';
      ctx.fillRect(px - 4, py + halfH - dH, dW, dH);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px - 3, py + halfH - dH + 1, dW - 2, dH - 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1, py + halfH - dH + 3, 2, 2); // 별빛 룬
    },

    // =========================================================================
    // 11.20. 검은 깃발 해적 연합 드레드노트 기함 성채 (Corsair Black Flagship Citadel)
    // =========================================================================
    drawCorsairFlagshipCitadel(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 바닷물 파도 & 포말 그림자
      ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
      ctx.fillRect(px - halfW - 2, py + halfH - 2, bw + 4, 6);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.fillRect(px - halfW - 4, py + halfH - 1, bw + 8, 4);

      // B. 거대 흑단 목조 갤리온 선체 (Black Ebony Galleon Hull)
      const hullW = Math.round(bw * 0.92);
      const hullHW = Math.round(hullW / 2);
      const hullH = Math.round(bh * 0.52);
      const hullY = py + halfH - hullH;

      ctx.fillStyle = '#0f172a'; // 흑단 오크 외벽
      ctx.beginPath();
      ctx.moveTo(px - hullHW, hullY + 6);
      ctx.lineTo(px - hullHW + 12, py + halfH);
      ctx.lineTo(px + hullHW - 8, py + halfH);
      ctx.lineTo(px + hullHW, hullY);
      ctx.lineTo(px + hullHW - 12, hullY);
      ctx.lineTo(px - hullHW, hullY + 6);
      ctx.closePath();
      ctx.fill();

      // 선체 목재 판자 결 & 황금 장식 라인 (Golden Hull Plating)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - hullHW + 8, hullY + 8, hullW - 16, 2);
      ctx.fillRect(px - hullHW + 12, hullY + 16, hullW - 22, 2);
      ctx.fillStyle = '#d97706'; // 황금 트림
      ctx.fillRect(px - hullHW + 6, hullY + 12, hullW - 12, 2);

      // 함수(Prow) 황금 드래곤 선수상 (Golden Dragon Figurehead)
      const prowX = px + hullHW - 2;
      const prowY = hullY - 4;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(prowX, prowY + 8);
      ctx.lineTo(prowX + 7, prowY + 2);
      ctx.lineTo(prowX + 9, prowY);
      ctx.lineTo(prowX + 5, prowY + 5);
      ctx.closePath();
      ctx.fill();

      // 함포 포문 4문 & 포신 (Bronze Broadside Cannons)
      for (let c = 0; c < 4; c++) {
        const canX = px - hullHW + 16 + c * 14;
        const canY = hullY + 9;
        ctx.fillStyle = '#020617';
        ctx.fillRect(canX, canY, 5, 5);
        ctx.fillStyle = '#d97706'; // 청동 포신
        ctx.fillRect(canX - 2, canY + 1, 3, 3);

        // 주기적 함포 발사 연기 퍼프 (Occasional Cannon Smoke Puff)
        const fireCycle = (timeSec * 3 + c * 1.5) % 8;
        if (fireCycle < 0.6) {
          ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
          ctx.fillRect(canX - 5, canY, 3, 3);
          ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
          ctx.beginPath();
          ctx.arc(canX - 7, canY - 2, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // C. 선미 루프탑 캐빈 & 스테인드글라스 창 (Aft Captain Quarters)
      const sternW = Math.round(bw * 0.35);
      const sternH = Math.round(bh * 0.42);
      const sternX = px - hullHW + 4;
      const sternY = hullY - sternH + 6;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(sternX, sternY, sternW, sternH);
      ctx.fillStyle = '#334155';
      ctx.fillRect(sternX + 2, sternY + 2, sternW - 4, sternH - 4);

      // 선미 격자 황금 창문 (Lantern-Lit Bay Windows)
      ctx.fillStyle = isNight ? '#fef08a' : '#bae6fd';
      ctx.fillRect(sternX + 4, sternY + 6, sternW - 8, 8);
      ctx.fillStyle = '#78350f';
      for (let wx = sternX + 7; wx < sternX + sternW - 6; wx += 4) {
        ctx.fillRect(wx, sternY + 6, 1, 8);
      }

      // 선미 난간 발코니
      ctx.fillStyle = '#facc15';
      ctx.fillRect(sternX - 2, sternY - 2, sternW + 4, 3);

      // D. 거대한 삼각 3단 돛대 & 해골 깃발 (Masts, Rigging & Jolly Roger Sails)
      const mastX = px + Math.round(bw * 0.08);
      const mastH = Math.round(bh * 0.88);
      const mastY = py + halfH - mastH;

      // 주 돛대 (Main Mast)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(mastX - 2, mastY, 4, mastH - 10);

      // 가로 활대 (Yardarms)
      ctx.fillStyle = '#451a03';
      ctx.fillRect(mastX - 16, mastY + 12, 32, 2);
      ctx.fillRect(mastX - 22, mastY + 28, 44, 2);

      // 펄럭이는 검은 해골 돛 (Fluttering Black Sails)
      const windBillow = Math.sin(timeSec * 2.5) * 2.5;

      ctx.fillStyle = '#020617';
      // 상단 돛
      ctx.beginPath();
      ctx.moveTo(mastX - 15, mastY + 14);
      ctx.quadraticCurveTo(mastX + windBillow, mastY + 20, mastX + 15, mastY + 14);
      ctx.lineTo(mastX + 13, mastY + 26);
      ctx.quadraticCurveTo(mastX + windBillow, mastY + 28, mastX - 13, mastY + 26);
      ctx.closePath();
      ctx.fill();

      // 해골 마크 (Skull and Crossbones Emblem)
      ctx.fillStyle = '#f8fafc';
      const skullY = mastY + 18;
      ctx.fillRect(mastX - 2 + windBillow * 0.4, skullY, 4, 3);
      ctx.fillRect(mastX - 3 + windBillow * 0.4, skullY + 3, 6, 1);
      // 교차된 뼈
      ctx.fillRect(mastX - 4 + windBillow * 0.4, skullY + 5, 8, 1);

      // 돛대 꼭대기 까마귀 둥지 망루 (Crow's Nest)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(mastX - 4, mastY + 4, 8, 4);
      ctx.fillStyle = '#f43f5e'; // 붉은 해적 삼각 깃발
      ctx.beginPath();
      ctx.moveTo(mastX, mastY);
      ctx.lineTo(mastX - 9, mastY - 3);
      ctx.lineTo(mastX, mastY - 6);
      ctx.closePath();
      ctx.fill();

      // E. 갑판 위 보물상자 & 럼주통 (Deck Treasures & Rum)
      this.drawProp(ctx, px + 8, hullY - 4, 'crate', isNight, timeSec);
      this.drawProp(ctx, px + 18, hullY - 3, 'barrel', isNight, timeSec);
      // 황금 보물상자
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px - 6, hullY - 4, 7, 5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 5, hullY - 5, 5, 2);
      ctx.fillRect(px - 3, hullY - 3, 2, 2);
    },

    // =========================================================================
    // 11.21. 크라켄 거수 해골 요새 성채 (Kraken Abyssal Skull Citadel)
    // =========================================================================
    drawKrakenSkullFortress(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 심해 바다 소용돌이 & 산호 그림자
      ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
      ctx.fillRect(px - halfW, py + halfH - 2, bw, 6);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.beginPath();
      ctx.ellipse(px, py + halfH, bw * 0.55, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // B. 화산 현무암 암초 기단 (Basalt Sea Crag Foundation)
      const baseH = Math.round(bh * 0.45);
      const baseY = py + halfH - baseH;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - halfW + 2, baseY, bw - 4, baseH);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - halfW + 4, baseY + 2, bw - 8, baseH - 3);

      // C. 거대 크라켄 레비아탄 해골 (Gigantic Carved Kraken Skull)
      const skullW = Math.round(bw * 0.65);
      const skullHW = Math.round(skullW / 2);
      const skullH = Math.round(bh * 0.72);
      const skullY = py + halfH - skullH;

      // 두개골 돔
      ctx.fillStyle = '#e2e8f0'; // 석회화된 고대 뼈
      ctx.beginPath();
      ctx.moveTo(px - skullHW, skullY + skullH * 0.4);
      ctx.quadraticCurveTo(px, skullY - 12, px + skullHW, skullY + skullH * 0.4);
      ctx.lineTo(px + skullHW - 6, skullY + skullH);
      ctx.lineTo(px - skullHW + 6, skullY + skullH);
      ctx.closePath();
      ctx.fill();

      // 뼈 음영 및 균열
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px - 1, skullY + 4, 2, skullH * 0.4);
      ctx.fillRect(px - skullHW + 6, skullY + 14, 4, skullH * 0.5);

      // 깊고 거대한 안구 구멍 (Giant Glowing Abyssal Eye Sockets)
      const eyeR = 6;
      const eyeY = skullY + Math.round(skullH * 0.42);
      const drawEye = (ex) => {
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fill();

        // 심해 생체 발광 청록빛 안광 (Bioluminescent Cyan Eye Fire)
        const eyePulse = Math.sin(timeSec * 4 + ex) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(6, 182, 212, ${eyePulse})`;
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ex - 1, eyeY - 1, 2, 2);
      };

      drawEye(px - 10);
      drawEye(px + 10);

      // D. 꿈틀거리는 4개의 거대 크라켄 촉수 (Writhing Kraken Tentacles)
      const tentacleColors = ['#0891b2', '#06b6d4', '#0891b2', '#06b6d4'];
      for (let t = 0; t < 4; t++) {
        const tSign = (t < 2) ? -1 : 1;
        const tBaseX = px + (tSign * (halfW - 8 + (t % 2) * 6));
        const tBaseY = py + halfH - 2;
        const tSway = Math.sin(timeSec * 2.8 + t * 1.5) * 6;
        const tH = Math.round(bh * (0.65 + (t % 2) * 0.25));

        ctx.strokeStyle = tentacleColors[t];
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tBaseX, tBaseY);
        ctx.quadraticCurveTo(tBaseX + tSway * 1.5, tBaseY - tH * 0.6, tBaseX + tSign * 8 + tSway, tBaseY - tH);
        ctx.stroke();

        // 촉수 흡반 (Suction Cups)
        ctx.fillStyle = '#a5f3fc';
        for (let s = 1; s <= 3; s++) {
          const sy = tBaseY - (tH * s) / 4;
          ctx.fillRect(tBaseX + tSway * (s / 4) + tSign * 2, sy, 2, 2);
        }
      }

      // E. 바다 닻 & 철제 사슬 (Giant Anchors & Heavy Chains)
      const ancX = px - skullHW - 4;
      const ancY = py + halfH - 12;
      ctx.fillStyle = '#334155';
      ctx.fillRect(ancX, ancY, 3, 10); // 닻대
      ctx.fillRect(ancX - 3, ancY + 2, 9, 2);
      ctx.beginPath();
      ctx.arc(ancX + 1.5, ancY + 10, 4, 0, Math.PI);
      ctx.stroke();

      // F. 성문 - 악어/상어 이빨 형태의 턱뼈 입구 (Serrated Jawbone Portal)
      const jawW = 14;
      const jawH = 14;
      const jawX = px - 7;
      const jawY = py + halfH - jawH;

      ctx.fillStyle = '#020617';
      ctx.fillRect(jawX, jawY, jawW, jawH);

      // 날카로운 상하 이빨
      ctx.fillStyle = '#f8fafc';
      for (let tx = jawX + 1; tx < jawX + jawW - 2; tx += 3) {
        // 상부 이빨
        ctx.beginPath();
        ctx.moveTo(tx, jawY);
        ctx.lineTo(tx + 1.5, jawY + 4);
        ctx.lineTo(tx + 3, jawY);
        ctx.closePath();
        ctx.fill();
        // 하부 이빨
        ctx.beginPath();
        ctx.moveTo(tx, jawY + jawH);
        ctx.lineTo(tx + 1.5, jawY + jawH - 4);
        ctx.lineTo(tx + 3, jawY + jawH);
        ctx.closePath();
        ctx.fill();
      }
    },

    // =========================================================================
    // 11.22. 달빛 은룡 천공 신사 수도 (Moonlit Silver Dragon Palace)
    // =========================================================================
    drawMoonlitSilverDragonPalace(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 은은한 달빛 연못 바닥 그림자
      ctx.fillStyle = 'rgba(2, 6, 23, 0.50)';
      ctx.fillRect(px - halfW, py + halfH - 2, bw, 6);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.ellipse(px, py + halfH + 1, bw * 0.52, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // B. 3단 주홍빛 칠기 기단 & 연꽃 연못 (Vermilion Podium & Lotus Pond)
      const podW = Math.round(bw * 0.88);
      const podHW = Math.round(podW / 2);
      const podH = Math.round(bh * 0.22);
      const podY = py + halfH - podH;

      ctx.fillStyle = '#991b1b'; // 심홍색 칠기
      ctx.fillRect(px - podHW, podY, podW, podH);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px - podHW + 2, podY + 2, podW - 4, podH - 3);

      // 둥근 홍예교 아치 다리 난간 (Vermilion Moon Bridge)
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, podY + 3, 14, Math.PI, 0);
      ctx.stroke();

      // C. 3단 곡선 지붕 옥좌 전당 (Tiered Pagoda Shrine with Upturned Curved Eaves)
      const tierCount = 3;
      for (let t = 0; t < tierCount; t++) {
        const tw = Math.round(bw * (0.82 - t * 0.22));
        const thw = Math.round(tw / 2);
        const ty = podY - 8 - t * 15;
        const eaveH = 5;

        // 벽체 & 기둥
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(px - thw + 4, ty, tw - 8, 12);
        ctx.fillStyle = '#fef3c7'; // 창호지 문
        ctx.fillRect(px - thw + 6, ty + 2, tw - 12, 8);

        // 은빛 기와 처마 (Silver Tiled Eaves with Upturned Tips)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(px - thw - 5, ty + 2);
        ctx.quadraticCurveTo(px - thw, ty - eaveH, px, ty - eaveH - 2);
        ctx.quadraticCurveTo(px + thw, ty - eaveH, px + thw + 5, ty + 2);
        ctx.lineTo(px + thw + 2, ty + 4);
        ctx.quadraticCurveTo(px, ty - eaveH + 2, px - thw - 2, ty + 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#e2e8f0'; // 은빛 기와 하이라이트
        ctx.beginPath();
        ctx.moveTo(px - thw - 4, ty + 1);
        ctx.quadraticCurveTo(px, ty - eaveH - 1, px + thw + 4, ty + 1);
        ctx.lineTo(px + thw + 2, ty + 3);
        ctx.quadraticCurveTo(px, ty - eaveH + 1, px - thw - 2, ty + 3);
        ctx.closePath();
        ctx.fill();

        // 처마 끝 황금 풍경 방울 (Wind Chime Bells)
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px - thw - 4, ty + 3, 2, 2);
        ctx.fillRect(px + thw + 2, ty + 3, 2, 2);
      }

      // D. 전당을 휘감아 승천하는 천공의 은룡 (Ascending Celestial Silver Dragon)
      ctx.save();
      const dragonSway = Math.sin(timeSec * 2.2) * 3;
      const topSpireY = podY - 8 - 3 * 15;

      // 은룡 몸체 곡선 (Silver Dragon Body)
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(px - 14, podY + 4);
      ctx.quadraticCurveTo(px + 12 + dragonSway, podY - 18, px - 8, podY - 34);
      ctx.quadraticCurveTo(px + 14 - dragonSway, podY - 44, px + 2, topSpireY - 8);
      ctx.stroke();

      // 은룡 비늘 음영 & 등지느러미 (Dragon Scales & Dorsal Fin)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // 용의 머리 (Dragon Head) & 여의주 (Glowing Dragon Pearl)
      const headX = px + 2;
      const headY = topSpireY - 10;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(headX - 5, headY - 4);
      ctx.lineTo(headX, headY - 8);
      ctx.lineTo(headX + 6, headY - 5);
      ctx.closePath();
      ctx.fill();

      // 뿔 (Golden Dragon Horns)
      ctx.fillStyle = '#facc15';
      ctx.fillRect(headX - 3, headY - 11, 2, 4);
      ctx.fillRect(headX + 2, headY - 10, 2, 3);

      // 입에 문 신비의 발광 여의주 (Glowing Tide Pearl)
      const pearlPulse = Math.sin(timeSec * 5) * 1.5;
      const pearlGrad = ctx.createRadialGradient(headX + 8, headY - 6, 1, headX + 8, headY - 6, 6);
      pearlGrad.addColorStop(0, '#ffffff');
      pearlGrad.addColorStop(0.5, '#38bdf8');
      pearlGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = pearlGrad;
      ctx.beginPath();
      ctx.arc(headX + 8, headY - 6, 6 + pearlPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // E. 밤하늘로 떠오르는 황금 연등 3개 (Ascending Sky Lanterns)
      for (let l = 0; l < 3; l++) {
        const lantY = (podY + halfH) - ((timeSec * 10 + l * 18) % (bh + 20));
        const lantX = px - halfW + 8 + l * (halfW * 0.9) + Math.sin(timeSec * 1.8 + l) * 4;
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(lantX - 2, lantY - 2, 4, 5);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(lantX - 1, lantY - 1, 2, 3);
      }
    },

    // =========================================================================
    // 11.23. 구미호 영혼 불꽃 신성 성채 (Kitsune Nine-Tails Sacred Citadel)
    // =========================================================================
    drawKitsuneNineTailsShrine(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 신사 바닥 지면 그림자
      ctx.fillStyle = 'rgba(2, 6, 23, 0.52)';
      ctx.fillRect(px - halfW + 2, py + halfH - 2, bw - 4, 6);

      // B. 석조 제단 & 붉은 토리이 관문 (Stone Podium & Red Torii Portal)
      const toriiW = Math.round(bw * 0.72);
      const toriiHW = Math.round(toriiW / 2);
      const toriiH = Math.round(bh * 0.65);
      const toriiY = py + halfH - toriiH;

      // 좌우 주홍빛 기둥
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(px - toriiHW, toriiY + 6, 4, toriiH - 6);
      ctx.fillRect(px + toriiHW - 4, toriiY + 6, 4, toriiH - 6);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px - toriiHW + 1, toriiY + 6, 2, toriiH - 6);
      ctx.fillRect(px + toriiHW - 3, toriiY + 6, 2, toriiH - 6);

      // 토리이 상단 2단 가로 가사기 (Curved Torii Crossbeam)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - toriiHW - 6, toriiY + 2, toriiW + 12, 4);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(px - toriiHW - 4, toriiY - 2, toriiW + 8, 4);

      // 신성한 볏짚 금줄 (Shimenawa Sacred Rope & White Shide Streamers)
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(px - toriiHW + 4, toriiY + 6, toriiW - 8, 2);
      ctx.fillStyle = '#ffffff';
      for (let s = px - toriiHW + 10; s < px + toriiHW - 8; s += 8) {
        ctx.fillRect(s, toriiY + 8, 2, 4);
      }

      // C. 본전 신사 정면 & 편액 (Shrine Hall Sanctuary)
      const shrineW = Math.round(bw * 0.46);
      const shrineHW = Math.round(shrineW / 2);
      const shrineH = Math.round(bh * 0.48);
      const shrineY = py + halfH - shrineH;

      ctx.fillStyle = '#78350f';
      ctx.fillRect(px - shrineHW, shrineY, shrineW, shrineH);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(px - shrineHW + 2, shrineY + 4, shrineW - 4, shrineH - 6);

      // 금박 편액
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 4, shrineY + 2, 8, 4);

      // D. 좌우 백호/백여우 석상 수호신 (Twin Sacred White Fox Statues)
      const drawFoxStatue = (fx, isLeft) => {
        // 석조 좌대
        ctx.fillStyle = '#334155';
        ctx.fillRect(fx - 4, py + halfH - 12, 8, 12);
        // 백여우 몸체
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(fx - 3, py + halfH - 18, 6, 7);
        // 붉은 턱받이 스카프 (Red Bib)
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(fx - 3, py + halfH - 16, 6, 2);
        // 뾰족한 여우 귀
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(isLeft ? fx - 3 : fx - 2, py + halfH - 20, 2, 3);
        ctx.fillRect(isLeft ? fx + 1 : fx + 1, py + halfH - 20, 2, 3);
      };

      drawFoxStatue(px - toriiHW - 5, true);
      drawFoxStatue(px + toriiHW + 5, false);

      // E. 신사 뒤편을 호형으로 둘러싸며 일렁이는 9개의 구미호 영혼 불꽃 (Kitsunebi Nine-Tails Fire Arc)
      const flameCount = 9;
      for (let f = 0; f < flameCount; f++) {
        const ang = Math.PI * 0.85 + (f / (flameCount - 1)) * Math.PI * 1.3;
        const dist = toriiHW + 6;
        const flameSway = Math.sin(timeSec * 3.5 + f * 0.8) * 3;
        const fx = px + Math.cos(ang) * dist;
        const fy = toriiY + 2 + Math.sin(ang) * (dist * 0.5) + flameSway;

        // 청록빛/보랏빛 영혼 여우불 (Foxfire Flame)
        const isCyan = (f % 2 === 0);
        ctx.fillStyle = isCyan ? 'rgba(6, 182, 212, 0.85)' : 'rgba(168, 85, 247, 0.85)';
        ctx.beginPath();
        ctx.arc(fx, fy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(fx, fy - 1, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    // =========================================================================
    // 11.24. 태고 요정 숲 에메랄드 거목 성소 (Elder Fairy World Tree Sanctuary)
    // =========================================================================
    drawElderFairyWorldTree(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 거목 밑둥 지면 그림자 & 이끼 덮인 둔덕
      ctx.fillStyle = 'rgba(2, 44, 34, 0.58)';
      ctx.beginPath();
      ctx.ellipse(px, py + halfH - 2, halfW + 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // B. 뻗어나가는 태고의 뿌리 지지대 (Primeval Gnarled Buttress Roots)
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.moveTo(px - halfW - 8, py + halfH + 2);
      ctx.quadraticCurveTo(px - halfW + 4, py + halfH - 14, px - 18, py + halfH - 26);
      ctx.lineTo(px + 18, py + halfH - 26);
      ctx.quadraticCurveTo(px + halfW - 4, py + halfH - 14, px + halfW + 8, py + halfH + 2);
      ctx.closePath();
      ctx.fill();

      // 밝은 나무 껍질 하이라이트 & 이끼 텍스처
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px - 14, py + halfH - 24, 28, 22);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(px - halfW - 4, py + halfH - 3, 8, 4);
      ctx.fillRect(px + halfW - 4, py + halfH - 3, 8, 4);
      ctx.fillRect(px - 10, py + halfH - 18, 5, 8);
      ctx.fillRect(px + 6, py + halfH - 14, 6, 6);

      // C. 수액 수로 - 맥동하는 에메랄드 마나 도관 (Luminescent Emerald Sap Veins)
      const sapPulse = Math.sin(timeSec * 3) * 0.25 + 0.75;
      ctx.fillStyle = `rgba(52, 211, 153, ${sapPulse})`;
      ctx.fillRect(px - 8, py + halfH - 22, 2, 16);
      ctx.fillRect(px + 7, py + halfH - 20, 2, 14);
      ctx.fillRect(px - 1, py + halfH - 25, 2, 18);

      // D. 거목 중앙 아치형 요정 차원문 (Arched Fairy Portal Gateway)
      const doorW = 12;
      const doorH = 16;
      const doorX = px - 6;
      const doorY = py + halfH - doorH;

      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.arc(px, doorY + 6, doorW / 2, Math.PI, 0);
      ctx.lineTo(px + doorW / 2, doorY + doorH);
      ctx.lineTo(px - doorW / 2, doorY + doorH);
      ctx.closePath();
      ctx.fill();

      // 내부 에메랄드 비전 광채
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(doorX + 2, doorY + 7, doorW - 4, doorH - 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(doorX + 4, doorY + 9, 4, 4);

      // E. 나선형 나무 줄기 계단 & 요정 수관 구름다리 (Spiral Canopy Boardwalk)
      ctx.fillStyle = '#92400e';
      const steps = [
        { x: px - 18, y: py + halfH - 14, w: 10, h: 3 },
        { x: px - 14, y: py + halfH - 22, w: 12, h: 3 },
        { x: px + 8,  y: py + halfH - 28, w: 14, h: 3 },
        { x: px + 12, y: py + halfH - 36, w: 12, h: 3 }
      ];
      for (const st of steps) {
        ctx.fillRect(st.x, st.y, st.w, st.h);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(st.x + 2, st.y - 1, 2, 2); // 반딧불 조명
        ctx.fillStyle = '#92400e';
      }

      // F. 3단으로 뻗어나가는 거대 에메랄드 수관림 (Massive Tiered Emerald Canopy)
      // 하단 수관 로브 (Lower Canopy Lobes)
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.arc(px - halfW + 2, py - 4, Math.round(bw * 0.32), 0, Math.PI * 2);
      ctx.arc(px + halfW - 2, py - 4, Math.round(bw * 0.32), 0, Math.PI * 2);
      ctx.fill();

      // 중단 주 수관 돔 (Main Middle Foliage Dome)
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.arc(px, py - 16, Math.round(bw * 0.46), 0, Math.PI * 2);
      ctx.fill();

      // 상단 첨탑 수관 돔 & 에메랄드 하이라이트 (Upper Emerald Crown)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(px, py - halfH + 8, Math.round(bw * 0.34), 0, Math.PI * 2);
      ctx.fill();

      // 신선한 새싹 민트빛 픽셀 림 라이트 (Mint Leaf Highlights)
      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.arc(px - 6, py - halfH + 2, Math.round(bw * 0.22), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#a7f3d0';
      ctx.fillRect(px - 10, py - halfH + 2, 6, 4);
      ctx.fillRect(px + 4, py - 22, 8, 4);
      ctx.fillRect(px - halfW + 6, py - 8, 6, 3);
      ctx.fillRect(px + halfW - 12, py - 8, 6, 3);

      // G. 가지 끝에 매달려 흔들리는 발광 요정 꽃망울 (Hanging Glowing Bell Blossoms)
      const flowers = [
        { x: px - halfW + 2, y: py + 8, color: '#f472b6' },
        { x: px - 18, y: py + 12, color: '#ec4899' },
        { x: px + 18, y: py + 12, color: '#f472b6' },
        { x: px + halfW - 2, y: py + 8, color: '#fde047' }
      ];

      for (let i = 0; i < flowers.length; i++) {
        const fl = flowers[i];
        const sway = Math.sin(timeSec * 2.8 + i * 1.5) * 3;
        const fx = fl.x + sway;
        const fy = fl.y;

        // 매달린 덩굴 줄기
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(fl.x, fl.y - 10);
        ctx.lineTo(fx, fy);
        ctx.stroke();

        // 발광 꽃망울
        ctx.fillStyle = fl.color;
        ctx.beginPath();
        ctx.arc(fx, fy + 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx - 1, fy + 1, 2, 2);
      }

      // H. 거목 주위를 춤추듯 날아오르는 픽시 요정 가루 & 반딧불 (Orbiting Pixie Dust Particles)
      const pixieCount = 6;
      for (let p = 0; p < pixieCount; p++) {
        const pAng = (timeSec * 1.8 + (p * Math.PI * 2) / pixieCount);
        const pRadX = halfW * 0.78 + Math.sin(timeSec * 3 + p) * 6;
        const pRadY = halfH * 0.65;
        const pxPos = px + Math.cos(pAng) * pRadX;
        const pyPos = (py - 12) + Math.sin(pAng) * pRadY;

        ctx.fillStyle = (p % 2 === 0) ? '#fde047' : '#67e8f9';
        ctx.beginPath();
        ctx.arc(pxPos, pyPos, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pxPos - 0.8, pyPos - 0.8, 1.6, 1.6);
      }
    },

    // =========================================================================
    // 11.25. 발광 포자 거대 버섯 성채 (Luminescent Spore Mushroom Citadel)
    // =========================================================================
    drawLuminescentSporeCitadel(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 균사체 대지 지면 그림자 & 발광 균사망
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.beginPath();
      ctx.ellipse(px, py + halfH - 2, halfW + 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // 바닥 발광 덩굴 & 균사체 라인
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px - halfW, py + halfH);
      ctx.lineTo(px - 10, py + halfH - 2);
      ctx.lineTo(px + 12, py + halfH - 1);
      ctx.lineTo(px + halfW, py + halfH);
      ctx.stroke();

      // B. 좌우 보조 버섯 첨탑 (Flanking Secondary Mushroom Spores)
      const flankMushrooms = [
        { x: px - Math.round(halfW * 0.68), y: py + 4, capW: Math.round(bw * 0.38), capH: 18, color: '#06b6d4' },
        { x: px + Math.round(halfW * 0.68), y: py + 6, capW: Math.round(bw * 0.36), capH: 16, color: '#f43f5e' }
      ];

      for (const m of flankMushrooms) {
        // 자루 (Stipe)
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(m.x - 3, m.y, 6, py + halfH - m.y);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(m.x - 3, m.y, 2, py + halfH - m.y);

        // 버섯 갓 (Cap)
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.ellipse(m.x, m.y, m.capW / 2, m.capH, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();

        // 갓의 발광 점박이 무늬 (Glowing Spots)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(m.x - 4, m.y - 8, 3, 3);
        ctx.fillRect(m.x + 3, m.y - 6, 2, 2);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(m.x - 2, m.y - 12, 3, 2);
      }

      // 좌우 보조 버섯을 잇는 덩굴 구름다리
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(flankMushrooms[0].x, flankMushrooms[0].y + 4);
      ctx.quadraticCurveTo(px, py + 12, flankMushrooms[1].x, flankMushrooms[1].y + 4);
      ctx.stroke();

      // C. 중앙 거대 버섯 자루 (Central Tower Stipe)
      const stemW = Math.round(bw * 0.28);
      const stemHW = Math.round(stemW / 2);
      const stemY = py - 4;
      const stemH = py + halfH - stemY;

      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(px - stemHW, stemY, stemW, stemH);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(px - stemHW, stemY, 4, stemH);

      // 자루 중간 턱 (Annulus Ring)
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(px - stemHW - 3, stemY + 12, stemW + 6, 3);

      // 버섯 기둥에 뚫린 요정의 창문들 (Illuminated Stipe Windows)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 3, stemY + 18, 6, 8);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(px - 2, stemY + 19, 4, 6);

      // D. 거대 주 버섯 갓 밑면 주름 (Bioluminescent Underside Gills)
      const mainCapW = Math.round(bw * 0.88);
      const mainCapHW = Math.round(mainCapW / 2);
      const mainCapY = py - 8;
      const gillPulse = Math.sin(timeSec * 3.5) * 0.25 + 0.75;

      ctx.fillStyle = `rgba(6, 182, 212, ${gillPulse})`;
      ctx.beginPath();
      ctx.ellipse(px, mainCapY + 2, mainCapHW, 10, 0, 0, Math.PI);
      ctx.closePath();
      ctx.fill();

      // 방사형 주름선
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 1;
      for (let gx = px - mainCapHW + 4; gx <= px + mainCapHW - 4; gx += 6) {
        ctx.beginPath();
        ctx.moveTo(gx, mainCapY + 2);
        ctx.lineTo(px, mainCapY + 6);
        ctx.stroke();
      }

      // E. 거대 주 버섯 갓 돔 (Massive Royal Violet & Fuchsia Cap Dome)
      const capDomeH = Math.round(bh * 0.52);
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.ellipse(px, mainCapY, mainCapHW, capDomeH, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // 상부 바이올렛/마젠타 그라데이션 하이라이트
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.ellipse(px, mainCapY - 4, mainCapHW - 4, capDomeH - 6, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.ellipse(px - 4, mainCapY - 8, mainCapHW - 10, capDomeH - 12, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // F. 발광 포자 반점 (Luminescent Spore Circles & Dots)
      const spots = [
        { x: px - 18, y: mainCapY - 14, r: 4.5, c: '#22d3ee' },
        { x: px + 16, y: mainCapY - 16, r: 5.0, c: '#22d3ee' },
        { x: px - 2,  y: mainCapY - 24, r: 4.0, c: '#f472b6' },
        { x: px - 28, y: mainCapY - 6,  r: 3.5, c: '#f472b6' },
        { x: px + 28, y: mainCapY - 8,  r: 3.5, c: '#f472b6' },
        { x: px + 6,  y: mainCapY - 12, r: 3.0, c: '#fde047' }
      ];

      for (const sp of spots) {
        ctx.fillStyle = sp.c;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sp.x - 1, sp.y - 1, sp.r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }

      // G. 공중으로 솟구치는 발광 포자 안개 및 미세 포자 입자 (Rising Spore Mist Flurry)
      const sporeCount = 5;
      for (let s = 0; s < sporeCount; s++) {
        const sTime = (timeSec * 2.2 + s * 1.8) % 4.0;
        const progress = sTime / 4.0; // 0 to 1
        const sX = px + Math.sin(timeSec * 3 + s * 2) * (halfW * 0.7);
        const sY = mainCapY - (progress * bh * 0.85);
        const sAlpha = (1 - progress) * 0.85;

        ctx.fillStyle = (s % 2 === 0) ? `rgba(34, 211, 238, ${sAlpha})` : `rgba(244, 114, 182, ${sAlpha})`;
        ctx.beginPath();
        ctx.arc(sX, sY, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 255, 255, ${sAlpha})`;
        ctx.fillRect(sX - 0.7, sY - 0.7, 1.4, 1.4);
      }
    },

    // =========================================================================
    // 11.26. 엘도라도 태양신 황금 피라미드 (El Dorado Golden Sun Pyramid)
    // =========================================================================
    drawElDoradoSunPyramid(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 바닥 지면 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.58)';
      ctx.beginPath();
      ctx.ellipse(px, py + halfH - 2, halfW + 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // B. 4단 계단식 황금 피라미드 테라스 (4-Tier Mesoamerican Stepped Ziggurat)
      const tiers = [
        { w: bw, h: 10, y: py + halfH - 10, c: '#b45309', light: '#d97706' },
        { w: Math.round(bw * 0.80), h: 9, y: py + halfH - 19, c: '#d97706', light: '#f59e0b' },
        { w: Math.round(bw * 0.62), h: 9, y: py + halfH - 28, c: '#f59e0b', light: '#fbbf24' },
        { w: Math.round(bw * 0.44), h: 8, y: py + halfH - 36, c: '#facc15', light: '#fef08a' }
      ];

      for (const t of tiers) {
        const twHalf = Math.round(t.w / 2);
        // 베이스 단
        ctx.fillStyle = t.c;
        ctx.fillRect(px - twHalf, t.y, t.w, t.h);
        // 상단 황금 광채 하이라이트 림
        ctx.fillStyle = t.light;
        ctx.fillRect(px - twHalf, t.y, t.w, 2);
        // 좌우 경사 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(px + twHalf - 4, t.y, 4, t.h);
      }

      // C. 중앙 황금 대계단 (Central Ceremonial Golden Staircase)
      const stairW = Math.round(bw * 0.18);
      const stairHW = Math.round(stairW / 2);
      const stairTopY = py + halfH - 36;
      const stairBottomY = py + halfH;

      ctx.fillStyle = '#78350f';
      ctx.fillRect(px - stairHW - 2, stairTopY, stairW + 4, stairBottomY - stairTopY);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - stairHW, stairTopY, stairW, stairBottomY - stairTopY);

      // 계단 층층 디테일
      ctx.fillStyle = '#fef08a';
      for (let sy = stairTopY; sy < stairBottomY; sy += 3) {
        ctx.fillRect(px - stairHW, sy, stairW, 1);
      }

      // 좌우 터키석 난간 (Turquoise Balustrades)
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(px - stairHW - 2, stairTopY, 2, stairBottomY - stairTopY);
      ctx.fillRect(px + stairHW, stairTopY, 2, stairBottomY - stairTopY);

      // D. 피라미드 정상 태양의 사당 (Summit Sun Temple Shrine)
      const shrineW = Math.round(bw * 0.28);
      const shrineHW = Math.round(shrineW / 2);
      const shrineH = 12;
      const shrineY = stairTopY - shrineH;

      ctx.fillStyle = '#92400e';
      ctx.fillRect(px - shrineHW, shrineY, shrineW, shrineH);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - shrineHW + 1, shrineY + 1, shrineW - 2, shrineH - 2);

      // 사당 정면 아치 관문
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 4, shrineY + 3, 8, shrineH - 3);
      ctx.fillStyle = '#ef4444'; // 내부 성스러운 불길
      ctx.fillRect(px - 2, shrineY + 5, 4, shrineH - 5);

      // E. 최상단 순금 거대 태양 원반 (Solid Gold Sun Disc Monolith)
      const discR = 8;
      const discY = shrineY - discR - 2;
      const solarPulse = Math.sin(timeSec * 3) * 0.2 + 0.8;

      // 후광 광선 8방향 방사
      ctx.strokeStyle = `rgba(250, 204, 21, ${solarPulse})`;
      ctx.lineWidth = 1.5;
      for (let r = 0; r < 8; r++) {
        const rAng = (r * Math.PI) / 4 + timeSec * 0.6;
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(rAng) * (discR + 1), discY + Math.sin(rAng) * (discR + 1));
        ctx.lineTo(px + Math.cos(rAng) * (discR + 6), discY + Math.sin(rAng) * (discR + 6));
        ctx.stroke();
      }

      // 태양 원반 본체
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, discY, discR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(px, discY, discR - 2, 0, Math.PI * 2);
      ctx.fill();

      // 중심 붉은 루비 보석
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px - 2, discY - 2, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1, discY - 2, 2, 1);

      // F. 계단 하단 좌우 흑요석 화로 (Twin Obsidian Flame Cauldrons)
      const cauldrons = [px - stairHW - 8, px + stairHW + 8];
      for (const cx of cauldrons) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 3, py + halfH - 6, 6, 6);
        // 타오르는 황금 성화
        const fH = 5 + Math.sin(timeSec * 8 + cx) * 2;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(cx - 3, py + halfH - 6);
        ctx.lineTo(cx, py + halfH - 6 - fH);
        ctx.lineTo(cx + 3, py + halfH - 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(cx - 1, py + halfH - 6 - Math.round(fH * 0.6), 2, 3);
      }

      // G. 공중으로 솟구치는 황금 가루 & 태양 스파크 파티클 (Ascending Golden Sparks)
      for (let g = 0; g < 5; g++) {
        const gTime = (timeSec * 2.5 + g * 1.5) % 3.5;
        const gProg = gTime / 3.5;
        const gx = px + Math.sin(timeSec * 2.8 + g * 2) * (halfW * 0.7);
        const gy = (py + halfH) - gProg * (bh * 0.95);
        const gAlpha = (1 - gProg) * 0.9;

        ctx.fillStyle = (g % 2 === 0) ? `rgba(254, 240, 138, ${gAlpha})` : `rgba(245, 158, 11, ${gAlpha})`;
        ctx.beginPath();
        ctx.arc(gx, gy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    },

    // =========================================================================
    // 11.27. 케찰코아틀 깃털 뱀신 성채 (Quetzalcoatl Feathered Serpent Citadel)
    // =========================================================================
    drawQuetzalcoatlSerpentCitadel(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 지면 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.beginPath();
      ctx.ellipse(px, py + halfH - 2, halfW + 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // B. 비취 석조 성채 본당 (Jade Cyclopean Fortress Bastion)
      const fortW = Math.round(bw * 0.78);
      const fortHW = Math.round(fortW / 2);
      const fortH = Math.round(bh * 0.65);
      const fortY = py + halfH - fortH;

      ctx.fillStyle = '#064e3b';
      ctx.fillRect(px - fortHW, fortY, fortW, fortH);
      ctx.fillStyle = '#047857';
      ctx.fillRect(px - fortHW + 2, fortY + 2, fortW - 4, fortH - 4);

      // 황금 총안 (Golden Crenellations)
      ctx.fillStyle = '#f59e0b';
      for (let c = px - fortHW; c < px + fortHW - 4; c += 8) {
        ctx.fillRect(c, fortY - 3, 5, 3);
      }

      // C. 성채를 감아 오르는 거대 깃털 뱀신 케찰코아틀 (Coiling Feathered Serpent Body)
      const sway = Math.sin(timeSec * 2.2) * 4;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px - fortHW - 4, py + halfH - 4);
      ctx.quadraticCurveTo(px - fortHW + 12 + sway, fortY + fortH * 0.5, px, fortY + 12);
      ctx.quadraticCurveTo(px + fortHW - 12 - sway, fortY + fortH * 0.5, px + fortHW + 4, py + halfH - 4);
      ctx.stroke();

      // 뱀 비늘 터키석 & 황금 장식 하이라이트 (Turquoise & Gold Plumes)
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // D. 거대한 깃털 뱀 머리 조각 (Feathered Serpent Head at Apex)
      const headX = px;
      const headY = fortY + 4;

      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(headX, headY, 7, 0, Math.PI * 2);
      ctx.fill();

      // 뱀 깃털 볏 (Feathered Crest)
      ctx.fillStyle = '#facc15';
      ctx.fillRect(headX - 6, headY - 8, 3, 5);
      ctx.fillRect(headX - 1, headY - 10, 3, 6);
      ctx.fillRect(headX + 4, headY - 8, 3, 5);

      // 루비 눈동자
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(headX - 4, headY - 2, 2, 2);
      ctx.fillRect(headX + 2, headY - 2, 2, 2);

      // E. 하단 뱀의 턱뼈 입구 관문 (Serpent Maw Portal)
      const gateW = 14;
      const gateHW = 7;
      const gateH = 14;
      const gateY = py + halfH - gateH;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - gateHW, gateY, gateW, gateH);

      // 날카로운 상아 이빨
      ctx.fillStyle = '#ffffff';
      for (let tx = px - gateHW + 1; tx < px + gateHW - 2; tx += 3) {
        ctx.fillRect(tx, gateY, 2, 3);
        ctx.fillRect(tx, gateY + gateH - 3, 2, 3);
      }

      // F. 흩날리는 신성한 케찰 새의 초록/청록 깃털 (Floating Quetzal Feathers)
      for (let f = 0; f < 4; f++) {
        const fTime = (timeSec * 2.0 + f * 1.6);
        const fx = px + Math.sin(fTime) * (halfW * 0.75);
        const fy = fortY + Math.cos(fTime * 0.8) * 12 + 6;

        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(Math.sin(fTime * 1.5) * 0.6);
        ctx.fillStyle = (f % 2 === 0) ? '#34d399' : '#38bdf8';
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 1.8, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-0.5, -2, 1, 4);
        ctx.restore();
      }
    },

    // =========================================================================
    // 26. 서리고룡왕의 만년빙하 대성채 (Frost Wyrm Glacial Citadel)
    // =========================================================================
    drawFrostWyrmGlacialCitadel(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 지면 극한의 냉기 그림자 (Sub-Zero Cast Shadow)
      ctx.fillStyle = 'rgba(2, 6, 23, 0.62)';
      ctx.beginPath();
      ctx.ellipse(px, py + halfH - 2, halfW + 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // 바닥 영구동토 얼음 균열 서리광 (Permafrost Frost Cracks)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(px - halfW - 6, py + halfH);
      ctx.lineTo(px - halfW / 2, py + halfH - 3);
      ctx.lineTo(px, py + halfH + 2);
      ctx.lineTo(px + halfW / 2, py + halfH - 2);
      ctx.lineTo(px + halfW + 6, py + halfH);
      ctx.stroke();

      // B. 3단 흑요석 & 영구빙하 흑암 성채 본체 (Obsidian Permafrost Bastion)
      const bastW = Math.round(bw * 0.82);
      const bastHW = Math.round(bastW / 2);
      const bastH = Math.round(bh * 0.72);
      const bastY = py + halfH - bastH;

      // 흑암 기단
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - bastHW, bastY, bastW, bastH);
      // 청람색 빙하 지층
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(px - bastHW + 2, bastY + 2, bastW - 4, bastH - 4);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(px - bastHW + 4, bastY + 6, bastW - 8, bastH - 10);

      // C. 좌우 솟구치는 서리고룡 빙하 첨탑 (Twin Jagged Ice Spire Sentinels)
      const spireW = Math.max(6, Math.round(bw * 0.14));
      const spireH = Math.round(bh * 0.85);

      // 좌측 첨탑
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(px - bastHW - 4, py + halfH);
      ctx.lineTo(px - bastHW, py + halfH - spireH);
      ctx.lineTo(px - bastHW + spireW, py + halfH);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(px - bastHW - 1, py + halfH - spireH + 6, 2, spireH - 12);

      // 우측 첨탑
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(px + bastHW + 4, py + halfH);
      ctx.lineTo(px + bastHW, py + halfH - spireH);
      ctx.lineTo(px + bastHW - spireW, py + halfH);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(px + bastHW - 1, py + halfH - spireH + 6, 2, spireH - 12);

      // D. 성채 상단에 웅크린 거대 서리고룡 해골 & 갈비뼈 날개 (Colossal Frost Wyrm Skeleton Perch)
      const wyrmY = bastY - 10;
      const breathe = Math.sin(timeSec * 2.5);

      // 고룡의 거대한 흉곽 & 늑골 (Ribcage)
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 2.2;
      for (let r = -2; r <= 2; r++) {
        ctx.beginPath();
        ctx.ellipse(px + r * 6, wyrmY + 6, 5, 8, 0, 0, Math.PI);
        ctx.stroke();
      }

      // 고룡의 얼음 뼈대 날개 (Ribbed Frost Wyrm Wings)
      const wingFlap = Math.sin(timeSec * 3.0) * 4;
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2.5;
      // 좌측 날개
      ctx.beginPath();
      ctx.moveTo(px - 6, wyrmY + 2);
      ctx.lineTo(px - halfW - 14, wyrmY - 14 + wingFlap);
      ctx.lineTo(px - halfW - 2, wyrmY + 4);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fill();

      // 우측 날개
      ctx.beginPath();
      ctx.moveTo(px + 6, wyrmY + 2);
      ctx.lineTo(px + halfW + 14, wyrmY - 14 + wingFlap);
      ctx.lineTo(px + halfW + 2, wyrmY + 4);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fill();

      // 고룡 두개골 (Draconic Skull)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(px - 5, wyrmY - 6 + breathe, 10, 8);
      // 고룡 뿔 (Horns)
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 4, wyrmY - 5 + breathe);
      ctx.lineTo(px - 9, wyrmY - 15 + breathe);
      ctx.moveTo(px + 4, wyrmY - 5 + breathe);
      ctx.lineTo(px + 9, wyrmY - 15 + breathe);
      ctx.stroke();

      // 푸른 서리 안광 (Cyan Frost Eyes)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px - 3, wyrmY - 3 + breathe, 2, 2);
      ctx.fillRect(px + 1, wyrmY - 3 + breathe, 2, 2);

      // E. 입에서 뿜어지는 주기적 극저온 한기/냉기 숨결 (Cryogenic Breath Particles)
      const frostPulse = (timeSec * 4) % 1;
      const breathY = wyrmY + 4 + frostPulse * 18;
      ctx.fillStyle = 'rgba(186, 230, 253, 0.75)';
      ctx.beginPath();
      ctx.arc(px + (Math.sin(timeSec * 8) * 4), breathY, 3 + frostPulse * 4, 0, Math.PI * 2);
      ctx.fill();

      // F. 성문 포탈: 얼어붙은 푸른 영혼불길 (Frozen Soulfire Gateway)
      const gateW = Math.round(bw * 0.22);
      const gateH = Math.round(bh * 0.32);
      ctx.fillStyle = '#020617';
      ctx.fillRect(px - gateW / 2, py + halfH - gateH, gateW, gateH);
      ctx.fillStyle = isNight ? '#38bdf8' : '#0284c7';
      ctx.fillRect(px - gateW / 2 + 2, py + halfH - gateH + 2, gateW - 4, gateH - 2);

      // 좌우 영혼불 화로 (Twin Soulfire Cauldrons)
      const c1x = px - bastHW + 5;
      const c2x = px + bastHW - 5;
      const cy = py + halfH - 6;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(c1x - 3, cy, 6, 6);
      ctx.fillRect(c2x - 3, cy, 6, 6);

      const fGlow = 3 + Math.sin(timeSec * 6) * 1.5;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(c1x, cy - 2, fGlow, 0, Math.PI * 2);
      ctx.arc(c2x, cy - 2, fGlow, 0, Math.PI * 2);
      ctx.fill();
    },

    // =========================================================================
    // 27. 영구동토 리치 킹의 얼어붙은 옥좌 (Lich King Frozen Throne Sanctum)
    // =========================================================================
    drawLichKingFrozenThrone(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 바닥 심연 얼음 그림자
      ctx.fillStyle = 'rgba(2, 6, 23, 0.60)';
      ctx.beginPath();
      ctx.ellipse(px, py + halfH - 2, halfW + 8, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // B. 3단 룬 석조 계단 (Runic Stepped Dais)
      const steps = [
        { w: bw, h: 7, y: py + halfH - 7, c: '#0f172a' },
        { w: Math.round(bw * 0.78), h: 7, y: py + halfH - 14, c: '#1e293b' },
        { w: Math.round(bw * 0.58), h: 7, y: py + halfH - 21, c: '#0369a1' }
      ];
      for (const st of steps) {
        const swHalf = Math.round(st.w / 2);
        ctx.fillStyle = st.c;
        ctx.fillRect(px - swHalf, st.y, st.w, st.h);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px - swHalf, st.y, st.w, 1.5);
      }

      // C. 거대 얼어붙은 옥좌 본체 (The Monolithic Frozen Throne Spire)
      const throneW = Math.round(bw * 0.40);
      const throneHW = Math.round(throneW / 2);
      const throneH = Math.round(bh * 0.68);
      const throneY = py + halfH - 21 - throneH;

      // 옥좌 뒷받침 영구빙하 쐐기 (Jagged Permafrost Throne Backrest)
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(px - throneHW, throneY + throneH);
      ctx.lineTo(px - throneHW + 3, throneY);
      ctx.lineTo(px, throneY - 8);
      ctx.lineTo(px + throneHW - 3, throneY);
      ctx.lineTo(px + throneHW, throneY + throneH);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(px - throneHW + 4, throneY + 4, throneW - 8, throneH - 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1, throneY - 6, 2, throneH - 4);

      // D. 공중에 부유하는 3개의 서리 영혼 결정체 (Levitating Cryo Runestones)
      for (let cr = 0; cr < 3; cr++) {
        const crAngle = (timeSec * 2.0) + (cr * (Math.PI * 2 / 3));
        const crX = px + Math.cos(crAngle) * (throneHW + 8);
        const crY = throneY + throneH * 0.4 + Math.sin(crAngle) * 5;

        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.moveTo(crX, crY - 5);
        ctx.lineTo(crX + 3, crY);
        ctx.lineTo(crX, crY + 5);
        ctx.lineTo(crX - 3, crY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(crX - 1, crY - 1, 2, 2);
      }

      // E. 바닥에 드리우는 서리 안개 (Ground Cryo Mist)
      const mistOffset = Math.sin(timeSec * 3) * 6;
      ctx.fillStyle = 'rgba(186, 230, 253, 0.28)';
      ctx.beginPath();
      ctx.ellipse(px + mistOffset, py + halfH - 4, halfW * 0.7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    },

    // =========================================================================
    // 28. 성좌의 천체 티탄 스타포지 수도 (Starforge Titan Celestial Foundry)
    // =========================================================================
    drawStarforgeTitanFoundry(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 지면 성운 그림자 (Cosmic Nebula Cast Shadow)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.beginPath();
      ctx.ellipse(px, py + halfH - 2, halfW + 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // 바닥 황도 12궁 성좌 룬 서클 (Zodiac Runic Circle on Ground)
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(px, py + halfH - 2, halfW + 6, 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      // B. 3단 티탄 흑요석 및 인디고 메탈 성채 본체 (Obsidian Celestial Bastion)
      const bastW = Math.round(bw * 0.84);
      const bastHW = Math.round(bastW / 2);
      const bastH = Math.round(bh * 0.70);
      const bastY = py + halfH - bastH;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - bastHW, bastY, bastW, bastH);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(px - bastHW + 2, bastY + 2, bastW - 4, bastH - 4);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(px - bastHW + 4, bastY + 6, bastW - 8, bastH - 12);

      // 황금 티탄 톱니 버트리스 (Golden Filigree Buttresses)
      ctx.fillStyle = '#f59e0b';
      for (let bx = px - bastHW; bx < px + bastHW - 4; bx += 10) {
        ctx.fillRect(bx, bastY - 3, 6, 3);
      }

      // C. 중앙 초신성 항성 코어 (Levitating Supernova Stellar Core)
      const coreY = bastY - 12;
      const corePulse = 7 + Math.sin(timeSec * 4.0) * 1.8;

      // 외곽 성운 오라 (Nebula Glow Aura)
      const grad = ctx.createRadialGradient(px, coreY, 2, px, coreY, corePulse + 10);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
      grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.80)');
      grad.addColorStop(0.70, 'rgba(236, 72, 153, 0.45)');
      grad.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, coreY, corePulse + 10, 0, Math.PI * 2);
      ctx.fill();

      // 중심 플라즈마 구체 (Central Plasma Sphere)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, coreY, corePulse * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // D. 3D 회전하는 3개의 황금 혼천의 궤도 링 (3 Concentric Rotating Armillary Rings)
      ctx.lineWidth = 1.8;
      // 링 1: 수평 회전
      const r1Angle = timeSec * 1.8;
      ctx.strokeStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(px, coreY, corePulse + 6, Math.abs(Math.sin(r1Angle)) * (corePulse + 6), 0.2, 0, Math.PI * 2);
      ctx.stroke();

      // 링 2: 수직 대각 회전
      const r2Angle = timeSec * -2.2;
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(px, coreY, Math.abs(Math.cos(r2Angle)) * (corePulse + 8), corePulse + 8, -0.4, 0, Math.PI * 2);
      ctx.stroke();

      // 링 3: 45도 극도 회전
      const r3Angle = timeSec * 2.6;
      ctx.strokeStyle = '#c084fc';
      ctx.beginPath();
      ctx.ellipse(px, coreY, corePulse + 10, Math.abs(Math.sin(r3Angle)) * (corePulse + 10), 0.8, 0, Math.PI * 2);
      ctx.stroke();

      // E. 공중에 흩날리는 6개의 성간 별빛 스파크 (Cosmic Sparks & Motes)
      for (let st = 0; st < 6; st++) {
        const sAng = (timeSec * 2.5) + (st * (Math.PI * 2 / 6));
        const sDist = (corePulse + 12 + Math.sin(timeSec * 6 + st) * 4);
        const sx = px + Math.cos(sAng) * sDist;
        const sy = coreY + Math.sin(sAng) * sDist * 0.6;
        ctx.fillStyle = st % 2 === 0 ? '#fef08a' : '#38bdf8';
        ctx.fillRect(sx - 1, sy - 1, 2.5, 2.5);
      }

      // F. 성문: 차원 넥서스 게이트 (Aether Dimensional Gate)
      const gateW = Math.round(bw * 0.22);
      const gateH = Math.round(bh * 0.32);
      ctx.fillStyle = '#020617';
      ctx.fillRect(px - gateW / 2, py + halfH - gateH, gateW, gateH);
      ctx.fillStyle = isNight ? '#818cf8' : '#4f46e5';
      ctx.fillRect(px - gateW / 2 + 2, py + halfH - gateH + 2, gateW - 4, gateH - 2);
    },

    // =========================================================================
    // 29. 황도 12궁 거대 혼천의 천문대 (Zodiac Armillary Astrolabe Observatory)
    // =========================================================================
    drawZodiacAstrolabeObservatory(ctx, px, py, bw, bh, isNight = false, timeSec = 0) {
      const halfW = Math.round(bw / 2);
      const halfH = Math.round(bh / 2);

      // A. 지면 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.58)';
      ctx.beginPath();
      ctx.ellipse(px, py + halfH - 2, halfW + 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // B. 8각 석조 천문대 돔 기단 (Octagonal Observatory Spire)
      const baseW = Math.round(bw * 0.72);
      const baseHW = Math.round(baseW / 2);
      const baseH = Math.round(bh * 0.65);
      const baseY = py + halfH - baseH;

      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(px - baseHW, baseY, baseW, baseH);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(px - baseHW + 2, baseY + 2, baseW - 4, baseH - 4);

      // 천문대 돔 천장 (Brass Observatory Dome)
      const domeR = baseHW + 2;
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(px, baseY + 2, domeR, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - 2, baseY - domeR, 4, domeR);

      // C. 거대 굴절 망원경 & 천공을 꿰뚫는 성광 빔 (Starlight Telescope Beam)
      const beamY = baseY - domeR - 4;
      const teleAngle = -Math.PI / 4 + Math.sin(timeSec * 0.8) * 0.08;

      ctx.save();
      ctx.translate(px, baseY - 4);
      ctx.rotate(teleAngle);

      // 망원경 경통
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-4, -18, 8, 22);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-5, -22, 10, 4);

      // 천공으로 쏘아 올리는 성광 빔 (Piercing Starlight Beam)
      const bPulse = 2 + Math.sin(timeSec * 8) * 1;
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.75)';
      ctx.lineWidth = bPulse * 2;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(0, -60);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = bPulse * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(0, -60);
      ctx.stroke();

      ctx.restore();

      // D. 공중에 공전하는 2개의 비전 프리즘 결정 (Arcane Prisms)
      for (let p = 0; p < 2; p++) {
        const pAng = (timeSec * 2.2) + p * Math.PI;
        const pX = px + Math.cos(pAng) * (baseHW + 8);
        const pY = baseY + 12 + Math.sin(pAng) * 4;

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(pX, pY - 4);
        ctx.lineTo(pX + 3, pY);
        ctx.lineTo(pX, pY + 4);
        ctx.lineTo(pX - 3, pY);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pX - 0.5, pY - 0.5, 1, 1);
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

      // 🏛️ 건축물 지면 밀착 앰비언트 오클루전 & 대각선 다이렉셔널 섀도우 (Ambient Occlusion & Cast Shadow)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.46)';
      ctx.beginPath();
      ctx.ellipse(px + 3, py + bh / 2 + 3, bw * 0.54, 6, 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.28)';
      ctx.beginPath();
      ctx.ellipse(px + 6, py + bh / 2 + 4, bw * 0.42, 4, 0.08, 0, Math.PI * 2);
      ctx.fill();

      // ☀️ 태양신의 황금 제국 엘도라도 & 깃털 뱀신 성채 (El Dorado Sun Pyramid & Quetzalcoatl Citadel)
      if (type === 'sun_pyramid' || (type === 'capital' && b && b.continent === 'el_dorado') || (type === 'palace' && b && b.continent === 'el_dorado')) {
        this.drawElDoradoSunPyramid(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'serpent_citadel' || (type === 'castle' && b && b.continent === 'el_dorado') || (type === 'fortress' && b && b.continent === 'el_dorado') || (type === 'temple' && b && b.continent === 'el_dorado') || (type === 'lair' && b && b.continent === 'el_dorado')) {
        this.drawQuetzalcoatlSerpentCitadel(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // ❄️ 혹한의 서리고룡 빙하 요새 & 리치 킹의 얼어붙은 옥좌 (Frost Wyrm Glacial Citadel & Frozen Throne)
      if (type === 'frost_wyrm_citadel' || (type === 'capital' && b && b.continent === 'frost_necropolis') || (type === 'palace' && b && b.continent === 'frost_necropolis')) {
        this.drawFrostWyrmGlacialCitadel(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'frozen_throne' || (type === 'castle' && b && b.continent === 'frost_necropolis') || (type === 'fortress' && b && b.continent === 'frost_necropolis') || (type === 'temple' && b && b.continent === 'frost_necropolis') || (type === 'lair' && b && b.continent === 'frost_necropolis')) {
        this.drawLichKingFrozenThrone(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // 🌌 성좌의 천체 티탄 스타포지 & 황도 12궁 혼천의 (Starforge Titan Foundry & Zodiac Astrolabe)
      if (type === 'starforge_foundry' || (type === 'capital' && b && b.continent === 'starforge') || (type === 'palace' && b && b.continent === 'starforge')) {
        this.drawStarforgeTitanFoundry(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'zodiac_astrolabe' || (type === 'castle' && b && b.continent === 'starforge') || (type === 'fortress' && b && b.continent === 'starforge') || (type === 'temple' && b && b.continent === 'starforge') || (type === 'lair' && b && b.continent === 'starforge')) {
        this.drawZodiacAstrolabeObservatory(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // 🌿 태고 요정 숲 에메랄드 거목 성소 & 발광 포자 거대 버섯 성채 (Elder Fairy World Tree & Spore Citadel)
      if (type === 'fairy_tree' || (type === 'capital' && b && b.continent === 'fairy_grove') || (type === 'palace' && b && b.continent === 'fairy_grove')) {
        this.drawElderFairyWorldTree(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'spore_citadel' || (type === 'castle' && b && b.continent === 'fairy_grove') || (type === 'fortress' && b && b.continent === 'fairy_grove') || (type === 'temple' && b && b.continent === 'fairy_grove') || (type === 'lair' && b && b.continent === 'fairy_grove')) {
        this.drawLuminescentSporeCitadel(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // 🦊 달빛 은룡 천공 신사 & 구미호 영혼 제국 (Celestial Moonlit Silver Dragon & Kitsune Spirit Realm)
      if (type === 'moonlit_dragon_palace' || (type === 'capital' && b && b.continent === 'spirit_shrine') || (type === 'palace' && b && b.continent === 'spirit_shrine')) {
        this.drawMoonlitSilverDragonPalace(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'kitsune_shrine' || (type === 'castle' && b && b.continent === 'spirit_shrine') || (type === 'fortress' && b && b.continent === 'spirit_shrine') || (type === 'temple' && b && b.continent === 'spirit_shrine')) {
        this.drawKitsuneNineTailsShrine(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // 🏴‍☠️ 검은 깃발 대해적 연합 & 크라켄 해골 요새 (Black Pearl Corsair Empire)
      if (type === 'corsair_flagship' || (type === 'capital' && b && b.continent === 'corsair') || (type === 'palace' && b && b.continent === 'corsair')) {
        this.drawCorsairFlagshipCitadel(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'kraken_fortress' || (type === 'castle' && b && b.continent === 'corsair') || (type === 'fortress' && b && b.continent === 'corsair') || (type === 'temple' && b && b.continent === 'corsair')) {
        this.drawKrakenSkullFortress(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // 💎 영롱한 프리즘 수정 제국 & 별빛 마나 성채 (Crystal Prism Zenith Empire)
      if (type === 'crystal_prism_palace' || (type === 'capital' && b && b.continent === 'crystal_zenith') || (type === 'palace' && b && b.continent === 'crystal_zenith')) {
        this.drawCrystalPrismPalace(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'starlight_observatory' || (type === 'castle' && b && b.continent === 'crystal_zenith') || (type === 'temple' && b && b.continent === 'crystal_zenith') || (type === 'fortress' && b && b.continent === 'crystal_zenith')) {
        this.drawStarlightManaObservatory(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // 🦇 핏빛 장미의 고딕 뱀파이어 제국 (Gothic Blood Rose Empire)
      if (type === 'gothic_cathedral' || (type === 'palace' && b && b.continent === 'gothic') || (type === 'temple' && b && b.continent === 'gothic')) {
        this.drawGothicCathedral(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'castlevania_keep' || (type === 'castle' && b && b.continent === 'gothic') || (type === 'fortress' && b && b.continent === 'gothic')) {
        this.drawVampireCastlevaniaKeep(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // ⚙️ 태고 드워프 증기 요새 & 마그마 제국 (Steamforge Dwarven Empire)
      if (type === 'steamforge_citadel' || (type === 'capital' && b && b.continent === 'steamforge') || (type === 'palace' && b && b.continent === 'steamforge')) {
        this.drawSteamforgeCitadel(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'magma_foundry' || (type === 'castle' && b && b.continent === 'steamforge') || (type === 'temple' && b && b.continent === 'steamforge')) {
        this.drawMagmaFoundry(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // ⚡ 올림포스 판테온 & 신들의 티탄 검투장 (Olympus Thunder Peak & Titan Colosseum)
      if (type === 'olympus_pantheon' || (type === 'capital' && b && b.continent === 'olympus') || (type === 'palace' && b && b.continent === 'olympus')) {
        this.drawOlympusPantheon(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'titan_colosseum' || (type === 'castle' && b && b.continent === 'olympus') || (type === 'temple' && b && b.continent === 'olympus')) {
        this.drawTitanColosseum(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // 🕌 환영의 모래바다 신기루 제국 (Mirage Sandsea Empire)
      if (type === 'sultan_palace' || (type === 'capital' && b && b.continent === 'mirage') || (type === 'palace' && b && b.continent === 'mirage')) {
        this.drawSultanPalace(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'sandstone_pyramid' || (type === 'castle' && b && b.continent === 'mirage') || (type === 'temple' && b && b.continent === 'mirage')) {
        this.drawSandstonePyramid(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // ⛩️ 동방 벚꽃 옥룡 제국 (Sakura Empire)
      if (type === 'pagoda_tower' || (type === 'castle' && b && b.continent === 'sakura') || (type === 'capital' && b && b.continent === 'sakura')) {
        this.drawPagodaTower(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'torii_shrine' || (type === 'temple' && b && b.continent === 'sakura')) {
        this.drawToriiShrine(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // ❄️ 발키리 오로라 성역 (Valkyrie Aurora)
      if (type === 'glacial_citadel' || (type === 'castle' && b && b.continent === 'valkyrie')) {
        this.drawGlacialCitadel(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'aurora_monolith' || (type === 'temple' && b && b.continent === 'valkyrie')) {
        this.drawAuroraMonolith(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // ⏳ 크로노스 시공간 시계탑 (Chrono Clocktower)
      if (type === 'clockwork_tower' || type === 'chrono_tower' || (type === 'castle' && b && b.continent === 'chrono')) {
        this.drawClockworkTower(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'star_observatory' || type === 'observatory' || (type === 'temple' && b && b.continent === 'chrono')) {
        this.drawStarObservatory(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // 🔱 해저 아틀란티스 (Atlantis)
      if (type === 'sunken_temple' || type === 'atlantis_temple' || (type === 'temple' && b && b.continent === 'atlantis')) {
        this.drawSunkenTemple(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }
      if (type === 'coral_spire' || type === 'abyssal_spire' || (type === 'magic_spire' && b && b.continent === 'atlantis')) {
        this.drawCoralSpire(ctx, px, py, bw, bh, isNight, timeSec);
        return true;
      }

      // 범용 성채 / 요새 / 병영 (Generic Castles & Fortresses)
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
