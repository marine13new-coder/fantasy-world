// ============================================================================
// renderer.js - 초정밀 레트로 픽셀아트(Pixel-Art) 그래픽 렌더러
// 16/32비트 고전 판타지 RPG 스타일: 타일 도트 디더링, 수제 픽셀아트 영웅·기사·마법사·엘프·드워프·드래곤 스프라이트,
// 정밀 해상 범선 & 물살, 회전 풍차, 굴뚝 연기, 밤의 픽셀 창문 조명, 반딧불이 & 날씨 파티클
// ============================================================================

class WorldRenderer {
  constructor(canvas, minimapCanvas, world, entityMgr) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minimapCanvas = minimapCanvas;
    this.minimapCtx = minimapCanvas.getContext('2d');
    this.world = world;
    this.entityMgr = entityMgr;

    // 픽셀아트 렌더링을 위한 안티에일리어싱 블러 비활성화
    this.ctx.imageSmoothingEnabled = false;
    this.minimapCtx.imageSmoothingEnabled = false;

    this.bakeScale = 1; // 3840 x 2400 1:1 베이킹 (GPU 4096px 텍스처 한계 완전 호환 & 60 FPS 보장)
    this.terrainCanvas = document.createElement('canvas');
    this.terrainCanvas.width = world.width * this.bakeScale;
    this.terrainCanvas.height = world.height * this.bakeScale;

    this.minimapBaseCanvas = document.createElement('canvas');
    this.minimapBaseCanvas.width = Math.round(world.width / 10);
    this.minimapBaseCanvas.height = Math.round(world.height / 10);

    this.bakeStaticTerrain();
  }

  bakeStaticTerrain() {
    const tCtx = this.terrainCanvas.getContext('2d');
    const mCtx = this.minimapBaseCanvas.getContext('2d');
    tCtx.imageSmoothingEnabled = false;
    mCtx.imageSmoothingEnabled = false;

    const { width, height, tiles } = this.world;

    // 타일별 32비트 Little-Endian 색상 (0xAABBGGRR) 사전 계산
    const colorMap32 = new Uint32Array(32);
    const miniColorMap32 = new Uint32Array(32);

    for (let i = 0; i < 32; i++) {
      const info = TILE_INFO[i] || TILE_INFO[TILE.GRASS];
      const hex = (info.color || '#386934').replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      colorMap32[i] = (255 << 24) | (b << 16) | (g << 8) | r;

      const mHex = (info.miniColor || info.color || '#386934').replace('#', '');
      const mr = parseInt(mHex.substring(0, 2), 16) || 0;
      const mg = parseInt(mHex.substring(2, 4), 16) || 0;
      const mb = parseInt(mHex.substring(4, 6), 16) || 0;
      miniColorMap32[i] = (255 << 24) | (mb << 16) | (mg << 8) | mr;
    }

    // 1. 초대형 월드 지형 캔버스 (3840 x 2400) 10ms 초고속 버퍼 베이킹
    const tImgData = tCtx.createImageData(width, height);
    const tData32 = new Uint32Array(tImgData.data.buffer);
    const totalTiles = width * height;
    for (let i = 0; i < totalTiles; i++) {
      tData32[i] = colorMap32[tiles[i]] || colorMap32[TILE.GRASS];
    }
    tCtx.putImageData(tImgData, 0, 0);

    // 2. 미니맵 베이스 캔버스 (384 x 240) 초경량 래스터라이징
    const mw = this.minimapBaseCanvas.width;
    const mh = this.minimapBaseCanvas.height;
    const mImgData = mCtx.createImageData(mw, mh);
    const mData32 = new Uint32Array(mImgData.data.buffer);
    const stepX = width / mw;
    const stepY = height / mh;

    for (let my = 0; my < mh; my++) {
      const ty = Math.floor(my * stepY);
      const mRow = my * mw;
      const tRow = ty * width;
      for (let mx = 0; mx < mw; mx++) {
        const tx = Math.floor(mx * stepX);
        mData32[mRow + mx] = miniColorMap32[tiles[tRow + tx]] || miniColorMap32[TILE.GRASS];
      }
    }
    mCtx.putImageData(mImgData, 0, 0);
  }

  render(camera, worldTime, filterCategory, selectedItem, timeSec) {
    const ctx = this.ctx;
    const { width: cw, height: ch } = this.canvas;
    const ts = TILE_SIZE;

    this.lastWorldTime = worldTime;
    ctx.imageSmoothingEnabled = false; // 픽셀 아트 레더링 유지

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#061320';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    const shakeMag = camera.shake || 0;
    const shakeX = shakeMag > 0 ? (Math.random() - 0.5) * shakeMag * 2 : 0;
    const shakeY = shakeMag > 0 ? (Math.random() - 0.5) * shakeMag * 2 : 0;
    ctx.translate(cw / 2 + shakeX, ch / 2 + shakeY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x * ts, -camera.y * ts);

    // 뷰포트 컬링 바운드
    const halfW = (cw / 2 / camera.zoom) / ts + 4;
    const halfH = (ch / 2 / camera.zoom) / ts + 4;
    const minTx = Math.max(0, Math.floor(camera.x - halfW));
    const maxTx = Math.min(this.world.width, Math.ceil(camera.x + halfW));
    const minTy = Math.max(0, Math.floor(camera.y - halfH));
    const maxTy = Math.min(this.world.height, Math.ceil(camera.y + halfH));

    // 1. 고해상도 픽셀 지형 슬라이싱 렌더링
    const s = this.bakeScale;
    const sx = minTx * s;
    const sy = minTy * s;
    const sw = Math.min(this.terrainCanvas.width - sx, (maxTx - minTx) * s);
    const sh = Math.min(this.terrainCanvas.height - sy, (maxTy - minTy) * s);

    const dx = minTx * ts;
    const dy = minTy * ts;
    const dw = (maxTx - minTx) * ts;
    const dh = (maxTy - minTy) * ts;

    if (sw > 0 && sh > 0) {
      ctx.drawImage(this.terrainCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    // 1.5. 강/호수 3D 절벽 암벽, 흙길 자갈/잔디 오버행, 코블스톤 광장 디테일 렌더링
    if (camera.zoom > 0.28) {
      this.drawEnhancedTerrainFeatures(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec);
    }

    // 2. 동적 해안선 픽셀 파도 거품 애니메이션
    if (camera.zoom > 0.36) {
      this.drawPixelShorelines(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec);
    }

    // 3. 해상 무역 항로 점선
    this.drawSeaRoutes(ctx, ts, timeSec);

    // 4. 농작물 렌더링
    if (camera.zoom > 0.30) {
      for (const plot of this.world.farmPlots) {
        if (plot.x < minTx || plot.x > maxTx || plot.y < minTy || plot.y > maxTy) continue;
        const px = plot.x * ts;
        const py = plot.y * ts;
        const ratio = plot.growth / 100;
        const sway = Math.round(Math.sin(timeSec * 3 + plot.x * 0.7) * 2 * ratio);

        ctx.fillStyle = plot.cropType === '향신료'
          ? '#ea580c'
          : (plot.cropType === '약초' ? '#0d9488' : (ratio > 0.75 ? '#eab308' : '#65a30d'));

        const h = Math.max(4, Math.round(ratio * 16));
        for (let c = 6; c <= 24; c += 8) {
          ctx.fillRect(px + c + sway, py + 24 - h, 3, h);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(px + c + sway, py + 24 - h, 3, 2);
        }
      }
    }

    // 5. 어부 배 & 광산 노드
    for (const sp of this.world.fishingSpots) {
      if (!sp.isBoat) continue;
      if (sp.x < minTx || sp.x > maxTx || sp.y < minTy || sp.y > maxTy) continue;
      const bx = sp.x * ts + ts / 2;
      const by = sp.y * ts + ts / 2 + Math.round(Math.sin(timeSec * 2.5 + sp.x) * 2);

      // 픽셀 나룻배
      ctx.fillStyle = '#451a03';
      ctx.fillRect(bx - 12, by - 4, 24, 8);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(bx - 10, by - 3, 20, 6);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(bx - 2, by - 9, 3, 6); // 낚싯대
    }

    for (const mn of this.world.mineNodes) {
      if (mn.x < minTx || mn.x > maxTx || mn.y < minTy || mn.y > maxTy) continue;
      const mx = mn.x * ts + ts / 2;
      const my = mn.y * ts + ts / 2;
      ctx.fillStyle = mn.oreType === '금광석' ? '#eab308' : (mn.oreType === '마정석' ? '#a855f7' : '#94a3b8');
      ctx.fillRect(mx - 5, my - 5, 10, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - 3, my - 3, 3, 3);
    }

    // 5.5. 16/32비트 고품질 픽셀 자연 식생 & 환경 소품 (대형 참나무, 침엽수, 그루터기, 통나무, 울타리, 꽃밭, 모닥불, 유적, 버섯) + 다이렉셔널 드롭 섀도우
    if (camera.zoom > 0.25) {
      this.drawDetailedPixelProps(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec);
    }

    // 6. 건물 렌더링 (픽셀 기와, 회전 풍차, 굴뚝 연기, 밤 조명)
    for (const b of this.world.buildings) {
      if (b.x + b.w < minTx || b.x - b.w > maxTx || b.y + b.h < minTy || b.y - b.h > maxTy) continue;
      this.drawPixelBuilding(ctx, b, ts, timeSec, camera.zoom, worldTime);
    }

    // 7. 낚싯줄
    if (camera.zoom > 0.35) {
      for (const e of this.entityMgr.entities) {
        if (e.fishingLine && e.x >= minTx && e.x <= maxTx && e.y >= minTy && e.y <= maxTy) {
          const ex = Math.round(e.x * ts);
          const ey = Math.round(e.y * ts - 8);
          const wx = Math.round(e.fishingLine.wx * ts + ts / 2);
          const wy = Math.round(e.fishingLine.wy * ts + ts / 2 + Math.sin(timeSec * 5 + e.id) * 2);

          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(wx, wy);
          ctx.stroke();

          // 찌 렌더링
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(wx - 2, wy - 2, 4, 4);

          // 플레이어 입질 시 붉은 파문 & 경고 표시
          if (e.role === 'player' && this.entityMgr.rpgManager && this.entityMgr.rpgManager.fishing.bite) {
            ctx.save();
            ctx.strokeStyle = '#f43f5e';
            ctx.lineWidth = 2;
            const ripR = (timeSec * 35) % 18;
            ctx.beginPath();
            ctx.arc(wx, wy, ripR, 0, Math.PI * 2);
            ctx.stroke();
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = '#f43f5e';
            ctx.fillText('❗', wx - 6, wy - 12);
            ctx.restore();
          }
        }
      }
    }

    // 8. 광역 마법 이펙트 (회오리검, 서리폭풍, 메테오, 포격, 번개)
    for (const fx of this.entityMgr.specialEffects) {
      const progress = fx.age / fx.duration;
      const curR = Math.round(fx.radius * ts * (0.3 + progress * 0.7));
      const fxPx = Math.round(fx.x * ts);
      const fxPy = Math.round(fx.y * ts);

      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fxPx, fxPy, curR, 0, Math.PI * 2);
      ctx.stroke();

      // 원소별 특수 디테일
      if (fx.color === '#ef4444') {
        // 메테오 충격파 불꽃 핵
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath();
        ctx.arc(fxPx, fxPy, curR * 0.75, 0, Math.PI * 2);
        ctx.fill();
      } else if (fx.color === '#a5f3fc') {
        // 혹한의 서리 다각형 얼음 결정
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5;
        for (let a = 0; a < 6; a++) {
          const ang = (Math.PI / 3) * a + progress;
          ctx.beginPath();
          ctx.moveTo(fxPx, fxPy);
          ctx.lineTo(fxPx + Math.cos(ang) * curR, fxPy + Math.sin(ang) * curR);
          ctx.stroke();
        }
      } else if (fx.color === '#38bdf8') {
        // 질풍의 회오리 블레이드 호
        ctx.lineWidth = 2.5;
        const spin = timeSec * 15;
        ctx.beginPath();
        ctx.arc(fxPx, fxPy, curR, spin, spin + Math.PI * 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(fxPx, fxPy, curR, spin + Math.PI, spin + Math.PI * 1.7);
        ctx.stroke();
      }

      ctx.restore();
    }

    function checkEntityFilter(e, filter) {
      if (filter === 'all' || e.role === 'player') return true;
      if (filter === 'animal') return e.role === 'animal';
      if (filter === 'dragon') return e.role === 'dragon';
      if (filter === 'elf') return e.race === 'elf';
      if (filter === 'dwarf') return e.race === 'dwarf';
      if (filter === 'beastkin') return e.race === 'beastkin';
      return e.category === filter || e.role === filter;
    }

    // 9. 수제 픽셀아트 엔티티 (영웅, 기사, 마법사, 엘프, 드워프, 범선, 드래곤 등)
    const midX = (minTx + maxTx) / 2;
    const midY = (minTy + maxTy) / 2;
    const viewR = Math.hypot(maxTx - minTx, maxTy - minTy) / 2 + 3;
    const renderEntities = (this.entityMgr.spatialGrid && camera.zoom > 0.18)
      ? this.entityMgr.spatialGrid.query(midX, midY, viewR)
      : this.entityMgr.entities;

    for (let i = 0; i < renderEntities.length; i++) {
      const e = renderEntities[i];
      if (e.x < minTx || e.x > maxTx || e.y < minTy || e.y > maxTy) continue;
      const isFilteredOut = !checkEntityFilter(e, filterCategory);
      const isSelected = selectedItem && selectedItem.type === 'entity' && selectedItem.data && selectedItem.data.id === e.id;
      this.drawPixelEntity(ctx, e, ts, timeSec, camera.zoom, isFilteredOut, isSelected);
    }

    // 10. 투사체 (대포알, 화살, 마법탄)
    for (const p of this.entityMgr.projectiles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x * ts - 3), Math.round(p.y * ts - 11), 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(p.x * ts - 1), Math.round(p.y * ts - 9), 2, 2);
    }

    // 10.5. 픽셀 히트 스파크 & 레벨업 스타버스트 파티클
    if (this.entityMgr.sparkParticles && this.entityMgr.sparkParticles.length > 0) {
      for (const sp of this.entityMgr.sparkParticles) {
        if (sp.x < minTx || sp.x > maxTx || sp.y < minTy || sp.y > maxTy) continue;
        const alpha = Math.max(0, 1 - sp.age / sp.duration);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = sp.color;
        const spx = Math.round(sp.x * ts);
        const spy = Math.round(sp.y * ts);
        ctx.fillRect(spx - sp.size / 2, spy - sp.size / 2, sp.size, sp.size);
        ctx.restore();
      }
    }

    // 11. 플로팅 텍스트
    if (camera.zoom > 0.32) {
      ctx.font = 'bold 12px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      for (const ft of this.entityMgr.floatingTexts) {
        if (ft.x < minTx || ft.x > maxTx || ft.y < minTy || ft.y > maxTy) continue;
        const alpha = Math.max(0, 1 - ft.age / ft.duration);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 3;
        const ty = Math.round((ft.y - (ft.age / ft.duration) * 1.8) * ts);
        ctx.strokeText(ft.text, Math.round(ft.x * ts), ty);
        ctx.fillText(ft.text, Math.round(ft.x * ts), ty);
        ctx.restore();
      }
    }

    // 12. 거점 이름표
    this.drawSettlementLabels(ctx, ts, camera.zoom, selectedItem);

    // 12.1. 플레이어 건축 구조물 (방어타워, 선착장, 성채, 대농장) & 보물상자
    if (this.entityMgr.rpgManager) {
      this.drawPlayerStructures(ctx, ts, timeSec, camera.zoom);
      this.drawTreasureChests(ctx, ts, timeSec, camera.zoom);
      this.drawBuildPreview(ctx, ts, camera);
    }

    // 12.2. 채집 및 채광 자원 노드 (Resource Nodes)
    this.drawResourceNodes(ctx, ts, timeSec, camera.zoom);

    // 12.3. 펫 컴패니언 (Pet Companion)
    this.drawPetCompanion(ctx, ts, timeSec, camera.zoom);

    // 12.4. 밤/황혼 동적 2D 조명 (Dynamic Lighting & Lighthouse Beam)
    this.drawDynamicLighting(ctx, ts, timeSec, camera, worldTime);

    // 12.5. 퀘스트 목표 지점 천공 빔 & 비컨
    if (this.entityMgr.questSystem && this.entityMgr.questSystem.activeQuest) {
      this.drawQuestBeacon(ctx, ts, timeSec, this.entityMgr.questSystem.activeQuest);
    }

    ctx.restore();

    // 12.6. 화면 나침반 네비게이션 가이드 화살표
    if (this.entityMgr.player && this.entityMgr.questSystem && this.entityMgr.questSystem.activeQuest) {
      this.drawQuestNavigationCompass(ctx, camera, cw, ch, timeSec, this.entityMgr.player, this.entityMgr.questSystem.activeQuest);
    }

    // 13. 대기 및 날씨 조명 오버레이
    this.drawAtmosphereOverlay(ctx, cw, ch, worldTime, timeSec, camera);

    // 14. 미니맵 렌더링
    this.renderMinimap(camera, cw, ch, filterCategory);
  }

  // 🏔️ [1.5] 강/호수 3D 절벽 암벽, 흙길 자갈/잔디 오버행, 코블스톤 광장 디테일 렌더러 (Images 2, 3, 5)
  drawEnhancedTerrainFeatures(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec) {
    const { width, height, tiles } = this.world;

    function pHash(tx, ty) {
      let h = (tx * 374761393) ^ (ty * 668265263);
      h = (h ^ (h >>> 13)) * 1274126177;
      return (h ^ (h >>> 16)) >>> 0;
    }

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const idx = ty * width + tx;
        const t = tiles[idx];
        const px = tx * ts;
        const py = ty * ts;
        const h = pHash(tx, ty);

        // A. 물과 접하는 육지의 3D 입체 절벽 암벽 지층 (Cliff Rock Strata - Images 2, 3, 5)
        const isWater = (t === TILE.WATER || t === TILE.DEEP_WATER);
        if (!isWater) {
          const tDown = ty < height - 1 ? tiles[(ty + 1) * width + tx] : t;
          const tLeft = tx > 0 ? tiles[ty * width + (tx - 1)] : t;
          const tRight = tx < width - 1 ? tiles[ty * width + (tx + 1)] : t;

          if (tDown === TILE.WATER || tDown === TILE.DEEP_WATER) {
            // 남쪽 절벽 단면 (3D Rock Strata & Water Foam)
            // 1. 잔디 오버행 림 (Overhanging grass rim)
            ctx.fillStyle = (t === TILE.SAND || t === TILE.DESERT) ? '#fde68a' : (t === TILE.SNOW ? '#f1f5f9' : '#4ade80');
            ctx.fillRect(px, py + ts - 2, ts, 2);

            // 2. 수직 바위 절벽 단면 (Vertical Rock Strata)
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px, py + ts, ts, 7);
            ctx.fillStyle = '#475569';
            ctx.fillRect(px, py + ts + 1, ts, 5);

            // 수직 바위 절리 크랙 (Vertical rock cracks & chiseled grooves)
            ctx.fillStyle = '#334155';
            ctx.fillRect(px + 4, py + ts + 1, 2, 5);
            ctx.fillRect(px + 14, py + ts + 2, 2, 4);
            ctx.fillRect(px + 23, py + ts + 1, 2, 5);

            // 암석 하이라이트 에지
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(px + 1, py + ts + 1, 3, 1);
            ctx.fillRect(px + 10, py + ts + 1, 3, 1);
            ctx.fillRect(px + 19, py + ts + 1, 3, 1);

            // 3. 수면 접점부 깊은 물그림자 & 하얀 포말 거품 물결
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px, py + ts + 6, ts, 2);

            const foamWave = Math.floor(Math.sin(timeSec * 3 + tx * 0.8) * 1.5);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.fillRect(px + 2 + foamWave, py + ts + 7, ts - 4, 1);
            ctx.fillRect(px + 5 - foamWave, py + ts + 8, ts - 10, 1);
          }

          if (tLeft === TILE.WATER || tLeft === TILE.DEEP_WATER) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px, py, 2, ts);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.fillRect(px + 2, py, 1, ts);
          }
          if (tRight === TILE.WATER || tRight === TILE.DEEP_WATER) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px + ts - 2, py, 2, ts);
          }
        }

        // B. 유기적인 흙길 & 오솔길 자갈 디테일 (Organic Dirt Paths - Images 1, 3, 4)
        if (t === TILE.ROAD) {
          // 길 테두리에 잔디 침범 효과 (Grass Encroaching Tufts)
          ctx.fillStyle = '#16a34a';
          if (h % 3 === 0) {
            ctx.fillRect(px, py, 4, 3);
            ctx.fillRect(px + 18, py, 5, 2);
            ctx.fillRect(px + 8, py + ts - 3, 6, 3);
          } else if (h % 3 === 1) {
            ctx.fillRect(px + ts - 4, py, 4, 3);
            ctx.fillRect(px + 4, py + ts - 3, 5, 3);
            ctx.fillRect(px, py + 12, 3, 6);
          } else {
            ctx.fillRect(px + 12, py, 4, 2);
            ctx.fillRect(px + ts - 3, py + 14, 3, 5);
          }

          // 흩뿌려진 조약돌 & 자갈 (Pebbles & Stones)
          ctx.fillStyle = '#78716c';
          ctx.fillRect(px + (h % 18) + 6, py + ((h >> 3) % 18) + 6, 3, 2);
          ctx.fillStyle = '#d6d3d1';
          ctx.fillRect(px + (h % 18) + 6, py + ((h >> 3) % 18) + 6, 1, 1);

          if (h % 2 === 0) {
            ctx.fillStyle = '#57534e';
            ctx.fillRect(px + ((h >> 2) % 16) + 8, py + ((h >> 5) % 16) + 8, 2, 2);
            ctx.fillStyle = '#a8a29e';
            ctx.fillRect(px + ((h >> 2) % 16) + 8, py + ((h >> 5) % 16) + 8, 1, 1);
          }
        }

        // C. 정착지 중앙 광장 성채 석판 바닥 (Cobblestone Plaza - Image 2)
        if (t === TILE.CASTLE_FLOOR) {
          ctx.fillStyle = '#334155'; // 줄눈
          ctx.fillRect(px + 15, py, 2, ts);
          ctx.fillRect(px, py + 15, ts, 2);

          ctx.fillStyle = '#94a3b8'; // 석판 볼륨
          ctx.fillRect(px + 2, py + 2, 12, 1);
          ctx.fillRect(px + 2, py + 2, 1, 12);
          ctx.fillRect(px + 18, py + 2, 12, 1);
          ctx.fillRect(px + 18, py + 2, 1, 12);
          ctx.fillRect(px + 2, py + 18, 12, 1);
          ctx.fillRect(px + 2, py + 18, 1, 12);
          ctx.fillRect(px + 18, py + 18, 12, 1);
          ctx.fillRect(px + 18, py + 18, 1, 12);
        }

        // D. 목조 다리 디테일 (Wooden Bridge with Planks & Posts - Images 2, 3, 5)
        if (t === TILE.BRIDGE) {
          const isHoriz = (tiles[ty * width + Math.max(0, tx - 1)] === TILE.ROAD || tiles[ty * width + Math.min(width - 1, tx + 1)] === TILE.ROAD);
          if (isHoriz) {
            ctx.fillStyle = '#27190d';
            ctx.fillRect(px, py, ts, 4);
            ctx.fillRect(px, py + ts - 4, ts, 4);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(px, py + 1, ts, 2);
            ctx.fillRect(px, py + ts - 3, ts, 2);

            ctx.fillStyle = '#451a03';
            ctx.fillRect(px + 2, py - 2, 4, 7);
            ctx.fillRect(px + ts - 6, py - 2, 4, 7);
            ctx.fillRect(px + 2, py + ts - 5, 4, 7);
            ctx.fillRect(px + ts - 6, py + ts - 5, 4, 7);
          } else {
            ctx.fillStyle = '#27190d';
            ctx.fillRect(px, py, 4, ts);
            ctx.fillRect(px + ts - 4, py, 4, ts);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(px + 1, py, 2, ts);
            ctx.fillRect(px + ts - 3, py, 2, ts);

            ctx.fillStyle = '#451a03';
            ctx.fillRect(px - 2, py + 2, 7, 4);
            ctx.fillRect(px - 2, py + ts - 6, 7, 4);
            ctx.fillRect(px + ts - 5, py + 2, 7, 4);
            ctx.fillRect(px + ts - 5, py + ts - 6, 7, 4);
          }
        }
      }
    }
  }

  // 🌲 [5.5] 16/32비트 고품질 픽셀 자연 식생 & 환경 소품 렌더러 (Images 1, 2, 3, 4, 5)
  drawDetailedPixelProps(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec) {
    const { width, deco } = this.world;

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const idx = ty * width + tx;
        const d = deco[idx];
        if (!d) continue;

        const px = tx * ts;
        const py = ty * ts;

        // 1. 공통 다이렉셔널 드롭 섀도우 (Directional Drop Shadow - Image 4)
        if (d === 1 || d === 2 || d === 6 || d === 7 || d === 8) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.40)';
          ctx.beginPath();
          ctx.ellipse(px + ts / 2 + 7, py + ts / 2 + 8, 15, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (d === 4 || d === 9 || d === 10 || d === 12 || d === 13) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
          ctx.beginPath();
          ctx.ellipse(px + ts / 2 + 4, py + ts / 2 + 5, 10, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. 오브젝트별 정밀 픽셀아트 스프라이트
        switch (d) {
          case 1: {
            // 🌳 [대형 고대 참나무] (Grand Oak - Images 1, 3, 4)
            const cx = px + ts / 2;
            const cy = py + ts - 4;
            const sway = Math.round(Math.sin(timeSec * 2.0 + tx * 0.5) * 1.5);

            // 뿌리 & 줄기
            ctx.fillStyle = '#27190d';
            ctx.fillRect(cx - 7, cy - 2, 14, 4);
            ctx.fillStyle = '#451a03';
            ctx.fillRect(cx - 5, cy - 14, 10, 14);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(cx - 3, cy - 12, 3, 10);
            ctx.fillRect(cx + 2, cy - 10, 2, 8);
            ctx.fillStyle = '#4d7c0f';
            ctx.fillRect(cx - 5, cy - 4, 3, 3);

            // 잎사귀 볼륨 (3구 구형 클러스터)
            const leafY = cy - 22;
            const drawLeafCluster = (lx, ly, rad) => {
              ctx.fillStyle = '#14532d';
              ctx.beginPath();
              ctx.arc(lx + sway, ly, rad, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#16a34a';
              ctx.beginPath();
              ctx.arc(lx + sway, ly - 2, rad - 2, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#22c55e';
              ctx.beginPath();
              ctx.arc(lx + sway - 1, ly - 4, rad - 4, 0, Math.PI * 2);
              ctx.fill();

              ctx.fillStyle = '#86efac';
              ctx.beginPath();
              ctx.arc(lx + sway - 2, ly - 6, Math.max(2, rad - 6), 0, Math.PI * 2);
              ctx.fill();
            };

            drawLeafCluster(cx - 9, leafY + 3, 11);
            drawLeafCluster(cx + 9, leafY + 3, 11);
            drawLeafCluster(cx, leafY - 6, 13);

            ctx.fillStyle = '#451a03';
            ctx.fillRect(cx - 2, leafY + 4, 4, 6);
            break;
          }

          case 2: {
            // 🌲 [고산 침엽수] (Pine / Conifer - Images 2, 5)
            const cx = px + ts / 2;
            const cy = py + ts - 3;
            ctx.fillStyle = '#27190d';
            ctx.fillRect(cx - 3, cy - 8, 6, 8);

            const drawPineSkirt = (sy, w, h) => {
              ctx.fillStyle = '#064e3b';
              ctx.beginPath();
              ctx.moveTo(cx, sy - h);
              ctx.lineTo(cx - w, sy);
              ctx.lineTo(cx + w, sy);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#059669';
              ctx.beginPath();
              ctx.moveTo(cx, sy - h);
              ctx.lineTo(cx - w + 3, sy - 1);
              ctx.lineTo(cx + w - 3, sy - 1);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#34d399';
              ctx.fillRect(cx - 1, sy - h, 2, 2);
              ctx.fillRect(cx - w + 2, sy - 2, 2, 2);
              ctx.fillRect(cx + w - 4, sy - 2, 2, 2);
            };

            drawPineSkirt(cy - 6, 14, 10);
            drawPineSkirt(cy - 13, 11, 9);
            drawPineSkirt(cy - 20, 8, 8);
            break;
          }

          case 3: {
            // 🌸 [야생화 무리] (Wildflower Patches - Images 1, 3, 5)
            const flowers = [
              { ox: 6, oy: 8, col: '#facc15', cCol: '#ffffff' },
              { ox: 14, oy: 5, col: '#ffffff', cCol: '#facc15' },
              { ox: 22, oy: 9, col: '#f472b6', cCol: '#fef08a' },
              { ox: 9, oy: 18, col: '#f43f5e', cCol: '#ffffff' },
              { ox: 18, oy: 19, col: '#facc15', cCol: '#ffffff' },
              { ox: 25, oy: 16, col: '#ffffff', cCol: '#facc15' }
            ];
            for (const f of flowers) {
              ctx.fillStyle = '#16a34a';
              ctx.fillRect(px + f.ox, py + f.oy + 2, 1, 3);
              ctx.fillStyle = f.col;
              ctx.fillRect(px + f.ox - 1, py + f.oy - 1, 3, 3);
              ctx.fillStyle = f.cCol;
              ctx.fillRect(px + f.ox, py + f.oy, 1, 1);
            }
            break;
          }

          case 4: {
            // 🪨 [자연 화강암 바위] (Granite Boulder - Images 1, 3, 4)
            const bx = px + 4;
            const by = py + 7;
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(bx, by + 2, 24, 16);
            ctx.fillRect(bx + 2, by, 20, 20);

            ctx.fillStyle = '#334155';
            ctx.fillRect(bx + 2, by + 4, 20, 14);

            ctx.fillStyle = '#64748b';
            ctx.fillRect(bx + 4, by + 2, 14, 12);

            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(bx + 6, by + 2, 10, 6);

            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(bx + 7, by + 2, 5, 2);

            ctx.fillStyle = '#65a30d';
            ctx.fillRect(bx + 4, by + 12, 6, 3);
            ctx.fillRect(bx + 14, by + 13, 5, 2);
            break;
          }

          case 5: {
            // 🌴 [야자수 / 선인장]
            const cx = px + ts / 2;
            const cy = py + ts - 2;
            ctx.fillStyle = '#78350f';
            ctx.fillRect(cx - 2, cy - 20, 4, 20);
            ctx.fillStyle = '#a16207';
            ctx.fillRect(cx - 2, cy - 16, 4, 2);
            ctx.fillRect(cx - 2, cy - 8, 4, 2);

            ctx.fillStyle = '#15803d';
            ctx.fillRect(cx - 14, cy - 22, 12, 4);
            ctx.fillRect(cx + 2, cy - 22, 12, 4);
            ctx.fillRect(cx - 10, cy - 26, 20, 4);
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(cx - 8, cy - 24, 16, 2);
            break;
          }

          case 6: {
            // 🌸 [요정 벚꽃 신목] (Sacred Elven Cherry)
            const cx = px + ts / 2;
            const cy = py + ts - 4;
            ctx.fillStyle = '#451a03';
            ctx.fillRect(cx - 4, cy - 14, 8, 14);

            ctx.fillStyle = '#db2777';
            ctx.beginPath();
            ctx.arc(cx, cy - 20, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f472b6';
            ctx.beginPath();
            ctx.arc(cx - 1, cy - 22, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fbcfe8';
            ctx.beginPath();
            ctx.arc(cx - 2, cy - 24, 6, 0, Math.PI * 2);
            ctx.fill();

            const petalX = cx + Math.sin(timeSec * 3 + tx) * 8;
            const petalY = cy - 10 + (timeSec * 15 + ty * 3) % 18;
            ctx.fillStyle = '#fbcfe8';
            ctx.fillRect(petalX, petalY, 2, 2);
            break;
          }

          case 7: {
            // 🍁 [단풍나무] (Autumn Maple)
            const cx = px + ts / 2;
            const cy = py + ts - 4;
            ctx.fillStyle = '#451a03';
            ctx.fillRect(cx - 4, cy - 14, 8, 14);

            ctx.fillStyle = '#991b1b';
            ctx.beginPath();
            ctx.arc(cx, cy - 20, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.arc(cx - 1, cy - 22, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(cx - 2, cy - 24, 6, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case 8: {
            // 💎 [비전 마력 수정 첨탑] (Arcane Crystal Spire)
            const cx = px + ts / 2;
            const cy = py + ts - 3;
            ctx.fillStyle = '#3b0764';
            ctx.fillRect(cx - 5, cy - 18, 10, 18);
            ctx.fillStyle = '#7e22ce';
            ctx.fillRect(cx - 3, cy - 16, 6, 16);
            ctx.fillStyle = '#c084fc';
            ctx.fillRect(cx - 1, cy - 14, 3, 14);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx, cy - 12, 1, 8);
            break;
          }

          case 9: {
            // 🪵 [이끼 낀 나이테 그루터기] (Tree Stump - Images 1, 3, 5)
            const cx = px + ts / 2;
            const cy = py + ts / 2 + 2;

            ctx.fillStyle = '#27190d';
            ctx.fillRect(cx - 9, cy + 4, 18, 5);
            ctx.fillStyle = '#451a03';
            ctx.fillRect(cx - 7, cy - 2, 14, 8);

            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 2, 7, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 2, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 2, 2, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#27190d';
            ctx.fillRect(cx, cy - 3, 3, 1);
            ctx.fillStyle = '#65a30d';
            ctx.fillRect(cx - 6, cy + 2, 3, 3);
            ctx.fillRect(cx + 4, cy + 3, 2, 2);
            break;
          }

          case 10: {
            // 🪵 [쓰러진 고목 / 통나무] (Fallen Timber Log - Images 3, 5)
            const lx = px + 4;
            const ly = py + 12;

            ctx.fillStyle = '#27190d';
            ctx.fillRect(lx, ly, 24, 9);
            ctx.fillStyle = '#451a03';
            ctx.fillRect(lx + 1, ly + 1, 22, 7);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(lx + 3, ly + 2, 18, 3);

            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.ellipse(lx + 2, ly + 4, 2.5, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(lx + 1, ly + 3, 2, 2);

            ctx.fillStyle = '#65a30d';
            ctx.fillRect(lx + 8, ly - 1, 5, 2);
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(lx + 15, ly - 2, 4, 2);
            break;
          }

          case 11: {
            // 🪜 [목조 울타리] (Wooden Fence - Images 1, 2)
            const cx = px + ts / 2;
            const cy = py + ts / 2;

            ctx.fillStyle = '#451a03';
            ctx.fillRect(px, cy - 3, ts, 3);
            ctx.fillRect(px, cy + 3, ts, 3);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(px, cy - 2, ts, 1);
            ctx.fillRect(px, cy + 4, ts, 1);

            ctx.fillStyle = '#27190d';
            ctx.fillRect(cx - 4, cy - 8, 8, 16);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(cx - 3, cy - 7, 6, 14);
            ctx.fillStyle = '#b45309';
            ctx.fillRect(cx - 2, cy - 6, 2, 12);
            break;
          }

          case 12: {
            // 🔥 [자연 모닥불 & 화로] (Campfire with embers - Images 1, 2)
            const cx = px + ts / 2;
            const cy = py + ts / 2 + 2;

            const stones = [
              { ox: -8, oy: 0 }, { ox: -6, oy: -5 }, { ox: 0, oy: -7 },
              { ox: 6, oy: -5 }, { ox: 8, oy: 0 }, { ox: 6, oy: 5 },
              { ox: 0, oy: 7 }, { ox: -6, oy: 5 }
            ];
            for (const s of stones) {
              ctx.fillStyle = '#334155';
              ctx.fillRect(cx + s.ox - 2, cy + s.oy - 2, 4, 4);
              ctx.fillStyle = '#94a3b8';
              ctx.fillRect(cx + s.ox - 1, cy + s.oy - 1, 2, 2);
            }

            ctx.fillStyle = '#1c1917';
            ctx.fillRect(cx - 4, cy - 3, 8, 6);
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(cx - 3, cy - 2, 6, 4);

            const flicker = Math.sin(timeSec * 8 + tx) * 2;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(cx - 4, cy + 1);
            ctx.lineTo(cx, cy - 8 + flicker);
            ctx.lineTo(cx + 4, cy + 1);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.moveTo(cx - 2, cy);
            ctx.lineTo(cx, cy - 5 + flicker);
            ctx.lineTo(cx + 2, cy);
            ctx.closePath();
            ctx.fill();

            const sparkY = cy - 9 - ((timeSec * 20 + tx) % 12);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(cx + flicker, sparkY, 1.5, 1.5);
            break;
          }

          case 13: {
            // 🏛️ [고대 룬 유적 기둥] (Ancient Rune Pillars - Images 1, 2)
            const cx = px + ts / 2;
            const cy = py + ts - 4;

            ctx.fillStyle = '#1e293b';
            ctx.fillRect(cx - 8, cy - 2, 16, 5);
            ctx.fillStyle = '#475569';
            ctx.fillRect(cx - 7, cy - 1, 14, 3);

            ctx.fillStyle = '#334155';
            ctx.fillRect(cx - 5, cy - 22, 10, 20);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(cx - 4, cy - 21, 8, 19);

            const pulse = 0.5 + Math.sin(timeSec * 3 + tx) * 0.4;
            ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
            ctx.fillRect(cx - 2, cy - 18, 4, 2);
            ctx.fillRect(cx - 1, cy - 14, 2, 4);
            ctx.fillRect(cx - 2, cy - 8, 4, 2);

            ctx.fillStyle = '#1e293b';
            ctx.fillRect(cx - 5, cy - 22, 3, 2);
            break;
          }

          case 14: {
            // 🪷 [수련 & 연꽃] (Water Lilies - Images 3, 5)
            const cx = px + ts / 2;
            const cy = py + ts / 2;
            const bob = Math.sin(timeSec * 2.5 + tx) * 1.5;

            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.arc(cx, cy + bob, 7, 0.3, Math.PI * 1.8);
            ctx.lineTo(cx, cy + bob);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(cx - 1, cy - 1 + bob, 5, 0.3, Math.PI * 1.8);
            ctx.lineTo(cx - 1, cy - 1 + bob);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#f472b6';
            ctx.fillRect(cx - 2, cy - 4 + bob, 4, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(cx - 1, cy - 3 + bob, 2, 2);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(cx, cy - 2 + bob, 1, 1);
            break;
          }

          case 15: {
            // 🍄 [숲속 야생 버섯 군락] (Forest Mushrooms - Images 1, 4)
            const mush = [
              { ox: 8, oy: 14, r: 4, col: '#ef4444' },
              { ox: 16, oy: 10, r: 3, col: '#b45309' },
              { ox: 22, oy: 16, r: 3, col: '#ef4444' }
            ];
            for (const m of mush) {
              ctx.fillStyle = '#f1f5f9';
              ctx.fillRect(px + m.ox - 1, py + m.oy, 2, 5);
              ctx.fillStyle = m.col;
              ctx.beginPath();
              ctx.arc(px + m.ox, py + m.oy, m.r, Math.PI, 0);
              ctx.closePath();
              ctx.fill();
              if (m.col === '#ef4444') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(px + m.ox - 1, py + m.oy - 2, 1, 1);
                ctx.fillRect(px + m.ox + 1, py + m.oy - 1, 1, 1);
              }
            }
            break;
          }
        }
      }
    }
  }

  // 픽셀 해안선 파도 거품 애니메이션
  drawPixelShorelines(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec) {
    const wave = Math.floor((Math.sin(timeSec * 2.8) + 1) * 2); // 0, 1, 2, 3 정수 픽셀 스텝
    ctx.fillStyle = 'rgba(240, 249, 255, 0.45)';

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const t = this.world.getTile(tx, ty);
        if (t === TILE.WATER || t === TILE.DEEP_WATER) {
          // 인접 모래사장(SAND) 방향으로 하얀 포말 픽셀 라인
          if (this.world.getTile(tx + 1, ty) === TILE.SAND) {
            ctx.fillRect(tx * ts + ts - 3 - wave, ty * ts + 2, 2, ts - 4);
          }
          if (this.world.getTile(tx - 1, ty) === TILE.SAND) {
            ctx.fillRect(tx * ts + 1 + wave, ty * ts + 2, 2, ts - 4);
          }
          if (this.world.getTile(tx, ty + 1) === TILE.SAND) {
            ctx.fillRect(tx * ts + 2, ty * ts + ts - 3 - wave, ts - 4, 2);
          }
          if (this.world.getTile(tx, ty - 1) === TILE.SAND) {
            ctx.fillRect(tx * ts + 2, ty * ts + 1 + wave, ts - 4, 2);
          }
        }
      }
    }
  }

  drawSeaRoutes(ctx, ts, timeSec) {
    ctx.save();
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = -Math.floor(timeSec * 14);
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
    ctx.lineWidth = 2.0;

    const sMap = this.world.settlementMap;
    for (const r of this.world.seaRoutes) {
      const from = sMap[r.fromId];
      const to = sMap[r.toId];
      if (!from || !to) continue;

      const fx = Math.round((from.portWaterX || from.x) * ts);
      const fy = Math.round((from.portWaterY || from.y) * ts);
      const tx = Math.round((to.portWaterX || to.x) * ts);
      const ty = Math.round((to.portWaterY || to.y) * ts);

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      const mx = (fx + tx) / 2 + (fy - ty) * 0.12;
      const my = (fy + ty) / 2 + (tx - fx) * 0.12;
      ctx.quadraticCurveTo(mx, my, tx, ty);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPixelBuilding(ctx, b, ts, timeSec, zoom, worldTime) {
    const px = Math.round(b.x * ts);
    const py = Math.round(b.y * ts);
    const bw = Math.round(b.w * ts);
    const bh = Math.round(b.h * ts);
    const isNight = worldTime ? (worldTime.hour >= 19 || worldTime.hour < 6) : false;

    // 고품질 픽셀 건축 렌더러 우선 호출
    if (typeof PixelBuildings !== 'undefined') {
      if (PixelBuildings.render(ctx, b, px, py, bw, bh, timeSec, isNight)) {
        return;
      }
    }


    // 1. 발밑 그림자 (Pixel Drop Shadow)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.fillRect(px - bw / 2 + 2, py + bh / 2, bw - 2, 5);

    // 2. 건물 유형별 정밀 픽셀 건축 렌더링
    if (b.type === 'palace' || b.type === 'capital_keep') {
      // [황궁/성채] 3단 성벽, 배틀먼트 요철, 성문, 황실 사자 깃발
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - bw / 2 + 2, py - bh / 2 + 2, bw - 4, bh - 4);

      // 성벽 배틀먼트 요철
      for (let bx = px - bw / 2; bx <= px + bw / 2 - 6; bx += 8) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(bx, py - bh / 2 - 4, 5, 4);
      }
      // 중앙 아치형 성문
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 6, py + bh / 2 - 12, 12, 12);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px - 5, py + bh / 2 - 11, 10, 11);

      // 황금 원뿔 첨탑
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.moveTo(px - bw / 2, py - bh / 2);
      ctx.lineTo(px - bw / 2 + 6, py - bh / 2 - 16);
      ctx.lineTo(px - bw / 2 + 12, py - bh / 2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px + bw / 2 - 12, py - bh / 2);
      ctx.lineTo(px + bw / 2 - 6, py - bh / 2 - 16);
      ctx.lineTo(px + bw / 2, py - bh / 2);
      ctx.closePath();
      ctx.fill();

      // 펄럭이는 황실 깃발
      const flap = Math.round(Math.sin(timeSec * 4 + b.x) * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px - 2, py - bh / 2 - 20, 8 + flap, 6);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px + 1, py - bh / 2 - 18, 2, 2);
    } else if (b.type === 'temple' || b.type === 'cathedral') {
      // [대성당/신전] 고딕 장미창, 스테인드글라스, 십자가 첨탑
      ctx.fillStyle = '#475569';
      ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px - bw / 2 + 3, py - bh / 2 + 3, bw - 6, bh - 6);

      // 고딕 삼각 지붕
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(px - bw / 2 - 4, py - bh / 2);
      ctx.lineTo(px, py - bh / 2 - 20);
      ctx.lineTo(px + bw / 2 + 4, py - bh / 2);
      ctx.closePath();
      ctx.fill();

      // 원형 장미창 (스테인드글라스 발광)
      ctx.fillStyle = isNight ? '#38bdf8' : '#e0f2fe';
      ctx.beginPath();
      ctx.arc(px, py - bh / 4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(px - 2, py - bh / 4 - 2, 4, 4);

      // 황금 십자가
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 1, py - bh / 2 - 28, 2, 8);
      ctx.fillRect(px - 4, py - bh / 2 - 25, 8, 2);
    } else if (b.type === 'magic_spire' || b.type === 'guild') {
      // [아케인 마법탑 / 비전 관문] 고대 룬 석조 아치 + 회전하는 마력 소용돌이 포털 & 공중 부유 수정
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(px - bw / 3, py - bh / 2, (bw * 2) / 3, bh);
      ctx.fillStyle = '#4338ca';
      ctx.fillRect(px - bw / 3 + 2, py - bh / 2 + 2, (bw * 2) / 3 - 4, bh - 4);

      // 석조 룬 기둥 아치문
      ctx.fillStyle = '#312e81';
      ctx.fillRect(px - 10, py + bh / 2 - 16, 20, 16);
      // 회전하는 비전 차원문 (Arcane Portal Vortex)
      const pR = 7;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py + bh / 2 - 8, pR, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      // 포털 내부 회전 룬 소용돌이
      for (let r = 0; r < 4; r++) {
        const rAng = timeSec * 4 + (r * Math.PI / 2);
        const rx = px + Math.cos(rAng) * 4;
        const ry = (py + bh / 2 - 8) + Math.sin(rAng) * 3;
        ctx.fillStyle = r % 2 === 0 ? '#38bdf8' : '#e0e7ff';
        ctx.fillRect(rx - 1, ry - 1, 2, 2);
      }
      ctx.restore();

      // 공중 부유 아케인 수정구 (Levitating Crystal Spire)
      const orbY = py - bh / 2 - 16 + Math.round(Math.sin(timeSec * 3 + b.x) * 4);
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(px, orbY - 8);
      ctx.lineTo(px + 6, orbY);
      ctx.lineTo(px, orbY + 8);
      ctx.lineTo(px - 6, orbY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f3e8ff';
      ctx.fillRect(px - 2, orbY - 3, 4, 6);

      // 궤도 회전 마법 파편
      const orbAng = timeSec * 4;
      const ox = px + Math.cos(orbAng) * 12;
      const oy = orbY + Math.sin(orbAng) * 5;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(ox - 1, oy - 1, 3, 3);
    } else if (b.type === 'forge') {
      // [대장간] 석조 벽체 + 타오르는 화로 + 연기 굴뚝 + 야외 모루 & 땔감
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(px - bw / 2 - 3, py - bh / 2 - 10, bw + 6, 10);

      // 타오르는 화로 (Furnace Hearth)
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(px - 7, py + bh / 4 - 5, 14, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px - 5, py + bh / 4 - 3, 10, 7);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(px - 3, py + bh / 4 - 1, 6, 4);

      // 굴뚝 연기 & 불씨 파티클
      const chX = px + Math.round(bw / 3);
      const chY = py - Math.round(bh / 2) - 10;
      ctx.fillStyle = '#334155';
      ctx.fillRect(chX - 2, chY - 6, 6, 8);
      for (let s = 1; s <= 3; s++) {
        const sProg = ((timeSec * 1.5 + s * 0.33) % 1.0);
        const sx = chX + Math.round(Math.sin(timeSec * 2 + s) * 4);
        const sy = Math.round(chY - 6 - sProg * 26);
        const sr = Math.max(2, Math.round(3 + sProg * 4));
        ctx.fillStyle = `rgba(226, 232, 240, ${Math.max(0, 0.45 * (1 - sProg))})`;
        ctx.fillRect(sx - sr / 2, sy - sr / 2, sr, sr);
      }
      // 야외 강철 모루 + 달궈진 철괴
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + bw / 2 + 2, py + bh / 4, 7, 5);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px + bw / 2 + 1, py + bh / 4 - 2, 9, 3);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(px + bw / 2 + 3, py + bh / 4 - 3, 4, 2);

      // 쌓여있는 장작더미 (Firewood Stack)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px - bw / 2 - 8, py + bh / 4, 6, 3);
      ctx.fillRect(px - bw / 2 - 7, py + bh / 4 - 3, 5, 3);
    } else if (b.type === 'barracks') {
      // [요새 / 관문 / 병영] 석조 블록 벽돌, 배틀먼트 총안, 철제 쇠창살 성문, 횃불
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
      ctx.fillStyle = '#475569';
      ctx.fillRect(px - bw / 2 + 2, py - bh / 2 + 2, bw - 4, bh - 4);

      // 성벽 벽돌 줄눈
      ctx.fillStyle = '#1e293b';
      for (let row = py - bh / 2 + 4; row < py + bh / 2 - 4; row += 6) {
        ctx.fillRect(px - bw / 2 + 2, row, bw - 4, 1);
      }

      // 성벽 상단 배틀먼트 (Crenellations)
      for (let bx = px - bw / 2; bx <= px + bw / 2 - 5; bx += 7) {
        ctx.fillStyle = '#64748b';
        ctx.fillRect(bx, py - bh / 2 - 5, 5, 5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(bx + 1, py - bh / 2 - 3, 3, 3);
      }

      // 철제 격자 성문 (Iron Portcullis Gate)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 7, py + bh / 2 - 13, 14, 13);
      ctx.fillStyle = '#64748b';
      for (let bar = px - 5; bar <= px + 5; bar += 3) {
        ctx.fillRect(bar, py + bh / 2 - 12, 1, 12);
      }
      ctx.fillRect(px - 6, py + bh / 2 - 8, 12, 2);

      // 관문 양옆 벽걸이 횃불
      const fl1 = Math.round(Math.sin(timeSec * 8 + b.x) * 1.5);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px - 10, py + bh / 2 - 10, 2, 5);
      ctx.fillRect(px + 8, py + bh / 2 - 10, 2, 5);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - 10, py + bh / 2 - 12 + fl1, 3, 3);
      ctx.fillRect(px + 8, py + bh / 2 - 12 - fl1, 3, 3);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px - 9, py + bh / 2 - 11 + fl1, 2, 2);
      ctx.fillRect(px + 9, py + bh / 2 - 11 - fl1, 2, 2);
    } else if (b.type === 'lair') {
      // [마왕성 / 네크로폴리스 영묘 / 고대 제단] 흑요석 균열 석조, 악마 뿔 첨탑, 붉은 영혼의 화로
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(px - bw / 2 + 2, py - bh / 2 + 2, bw - 4, bh - 4);

      // 벽돌 균열 마법 발광
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px - 4, py - 6, 2, 8);
      ctx.fillRect(px - 2, py + 2, 6, 1);
      ctx.fillRect(px + 4, py - 2, 2, 6);

      // 뾰족한 흑요석 가시 뿔 (Spiked Demon Spires)
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(px - bw / 2, py - bh / 2);
      ctx.lineTo(px - bw / 2 - 3, py - bh / 2 - 14);
      ctx.lineTo(px - bw / 2 + 6, py - bh / 2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px + bw / 2 - 6, py - bh / 2);
      ctx.lineTo(px + bw / 2 + 3, py - bh / 2 - 14);
      ctx.lineTo(px + bw / 2, py - bh / 2);
      ctx.closePath();
      ctx.fill();

      // 중앙 심연의 악마 눈 / 영혼의 불꽃 (Soul Eye Portal)
      const eyeGlow = 0.6 + Math.sin(timeSec * 4) * 0.35;
      ctx.fillStyle = `rgba(168, 85, 247, ${eyeGlow})`;
      ctx.beginPath();
      ctx.arc(px, py - bh / 6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px - 1, py - bh / 6 - 3, 2, 6);
    } else if (b.type === 'shipyard') {
      if (b.name.includes('등대') || b.id === 'lb_tower') {
        // [외로운 회전 등대] 줄무늬 원통형 탑 + 회전 탐조등 광원
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(px - 6, py - bh / 2, 12, bh);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(px - 5, py - bh / 2 + 4, 10, 5);
        ctx.fillRect(px - 5, py - bh / 2 + 14, 10, 5);

        // 등대 유리 랜턴 돔
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 8, py - bh / 2 - 7, 16, 7);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px - 6, py - bh / 2 - 6, 12, 5);

        // 회전 광선 (Rotating Beacon Light Beam)
        ctx.save();
        const beamAng = timeSec * 2.2;
        ctx.translate(px, py - bh / 2 - 3);
        ctx.rotate(beamAng);
        ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(40, -14);
        ctx.lineTo(40, 14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        // [조선소 / 난파선 잔해] 목조 골조 & 크레인 도르래 & 선박 용골
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px - bw / 2 + 2, py - bh / 2 + 2, bw - 4, bh - 4);

        // 크레인 및 도르래 밧줄
        ctx.fillStyle = '#92400e';
        ctx.fillRect(px + bw / 2 - 4, py - bh / 2 - 12, 3, 14);
        ctx.fillRect(px + bw / 2 - 10, py - bh / 2 - 12, 8, 2);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(px + bw / 2 - 10, py - bh / 2 - 10, 1, 8);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(px + bw / 2 - 12, py - bh / 2 - 2, 5, 5); // 매달린 화물
      }
    } else if (b.type === 'windmill') {
      // [풍차] 원형 석조 베이스 + 회전 4날 캔버스 날개
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(px - bw / 2 - 2, py - bh / 2);
      ctx.lineTo(px, py - bh / 2 - 12);
      ctx.lineTo(px + bw / 2 + 2, py - bh / 2);
      ctx.closePath();
      ctx.fill();

      // 회전 날개
      ctx.save();
      ctx.translate(px, py - 4);
      ctx.rotate(timeSec * 1.8);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, -36, 4, 72);
      ctx.fillRect(-36, -2, 72, 4);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(2, -34, 10, 24);
      ctx.fillRect(2, 10, 10, 24);
      ctx.fillRect(-34, 2, 24, 10);
      ctx.fillRect(10, -12, 24, 10);
      ctx.restore();
    } else if (b.type === 'tavern') {
      // [여관/주점] 튜더 양식 목조 기둥 + 매달린 맥주잔 간판
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px - bw / 2, py - bh / 2, 3, bh);
      ctx.fillRect(px + bw / 2 - 3, py - bh / 2, 3, bh);
      ctx.fillRect(px - 1, py - bh / 2, 3, bh);

      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(px - bw / 2 - 4, py - bh / 2);
      ctx.lineTo(px, py - bh / 2 - 15);
      ctx.lineTo(px + bw / 2 + 4, py - bh / 2);
      ctx.closePath();
      ctx.fill();

      // 맥주잔 간판
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(px + bw / 2 + 1, py - 6, 7, 6);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(px + bw / 2 + 3, py - 5, 3, 4);
    } else if (b.type === 'market') {
      // [시장 / 바자르 가판대] 줄무늬 차양막 + 물결 밑단 + 상품 상자 & 나무통
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
      const awW = bw + 8;
      // 교차 빨강/하양 줄무늬 차양
      for (let ax = 0; ax < awW; ax += 6) {
        ctx.fillStyle = (ax / 6) % 2 === 0 ? '#ef4444' : '#f8fafc';
        ctx.fillRect(px - awW / 2 + ax, py - bh / 2 - 7, 6, 9);
        // 물결 스캘럽 처마
        ctx.fillRect(px - awW / 2 + ax + 1, py - bh / 2 + 2, 4, 2);
      }
      // 목재 가판 테이블
      ctx.fillStyle = '#92400e';
      ctx.fillRect(px - bw / 2 - 2, py + bh / 4 - 2, bw + 4, 3);

      // 과일 상자 (사과)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px - bw / 3 - 3, py + bh / 4 + 1, 8, 6);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px - bw / 3 - 2, py + bh / 4, 6, 3);

      // 곡물/채소 상자
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 2, py + bh / 4 + 1, 8, 6);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(px + 3, py + bh / 4, 6, 3);

      // 옆에 놓인 오크통 (Wine/Ale Barrel)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + bw / 2 + 2, py + bh / 4 - 1, 7, 9);
      ctx.fillStyle = '#475569';
      ctx.fillRect(px + bw / 2 + 2, py + bh / 4 + 1, 7, 1);
      ctx.fillRect(px + bw / 2 + 2, py + bh / 4 + 6, 7, 1);
    } else {
      // 기본 정밀 가옥
      ctx.fillStyle = b.color || '#cbd5e1';
      ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
      ctx.fillStyle = b.roofColor || '#78350f';
      ctx.beginPath();
      ctx.moveTo(px - bw / 2 - 4, py - bh / 2);
      ctx.lineTo(px, py - bh / 2 - 14);
      ctx.lineTo(px + bw / 2 + 4, py - bh / 2);
      ctx.closePath();
      ctx.fill();
    }

    // 창문 조명 (야간 호박색 발광 / 주간 틴트)
    if (zoom > 0.45) {
      const winColor = isNight ? '#f59e0b' : '#334155';
      ctx.fillStyle = winColor;
      ctx.fillRect(px - bw / 4 - 3, py - 3, 6, 7);
      ctx.fillRect(px + bw / 4 - 3, py - 3, 6, 7);
      if (isNight) {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(px - bw / 4 - 2, py - 2, 2, 2);
        ctx.fillRect(px + bw / 4 - 2, py - 2, 2, 2);
      }
    }

    // 이름 라벨
    if (zoom > 0.82) {
      ctx.font = 'bold 11px Pretendard, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 3;
      ctx.strokeText(b.name, px, py - Math.round(bh / 2) - 18);
      ctx.fillText(b.name, px, py - Math.round(bh / 2) - 18);
    }
  }

  // ==========================================================================
  // 수제 픽셀아트 엔티티 스프라이트 렌더러 (Pixel-Art Entity Sprite Engine)
  // ==========================================================================
  drawPixelEntity(ctx, e, ts, timeSec, zoom, isFilteredOut, isSelected) {
    const px = Math.round(e.x * ts);
    const py = Math.round(e.y * ts);
    const bounce = (Math.abs(e.vx) > 0.05 || Math.abs(e.vy) > 0.05)
      ? Math.round(Math.abs(Math.sin(e.animPhase)) * (e.isShip ? 2 : 4))
      : 0;

    ctx.save();
    if (isFilteredOut) ctx.globalAlpha = 0.22;

    // 타겟 선택 픽셀 링
    if (isSelected) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(px - 16 * e.scale, py - 18 * e.scale, 32 * e.scale, 36 * e.scale);
    }

    // 1. 해상 범선 픽셀아트 (Player ship, sea merchants, navy, pirates)
    if (e.isShip && e.monsterType !== 'kraken' && e.monsterType !== 'sea_serpent' && e.role !== 'animal' && e.role !== 'dragon') {
      this.drawSpriteShip(ctx, px, py, bounce, e, timeSec);
    }
    // 2. 고대 원소 드래곤 픽셀아트
    else if (e.role === 'dragon') {
      this.drawSpriteDragon(ctx, px, py, bounce, e, timeSec);
    }
    // 3. 육상 상단 마차
    else if (e.hasWagon && !e.isShip) {
      this.drawSpriteCaravan(ctx, px, py, bounce, e, timeSec);
    }
    // 4. 플레이어 영웅 & 인간/엘프/드워프/수인/몬스터/동물 픽셀 캐릭터
    else {
      this.drawSpriteCharacter(ctx, px, py, bounce, e, timeSec, zoom);
    }

    // 전투 중 픽셀 위험 느낌표
    if (e.state === 'combat') {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px - 1, py - 24 * e.scale - bounce, 3, 7);
      ctx.fillRect(px - 1, py - 15 * e.scale - bounce, 3, 3);
    }

    // 체력 바 & 이름
    if (zoom > 0.70 && e.maxHp > 0) {
      const bw = Math.round(24 * e.scale);
      const bh = 3;
      const bx = px - Math.round(bw / 2);
      const by = py - Math.round((e.isShip ? 26 : 20) * e.scale) - bounce;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      const hpRatio = Math.max(0, Math.min(1, e.hp / e.maxHp));
      ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.25 ? '#eab308' : '#ef4444');
      ctx.fillRect(bx, by, Math.round(bw * hpRatio), bh);

      if (zoom > 0.95) {
        ctx.font = 'bold 10px Pretendard, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 2.5;
        ctx.strokeText(e.name, px, by - 4);
        ctx.fillText(e.name, px, by - 4);
      }
    }

    ctx.restore();
  }

  // (A) 해상 범선 픽셀아트
  drawSpriteShip(ctx, px, py, bounce, e, timeSec) {
    const sc = e.scale;
    const sy = py - bounce;

    // 뱃머리 물살 거품
    const wake = Math.round(Math.sin(timeSec * 4 + e.id) * 2);
    ctx.fillStyle = 'rgba(240, 249, 255, 0.65)';
    ctx.fillRect(px - 16 * sc + wake, sy + 6 * sc, 4 * sc, 2 * sc);
    ctx.fillRect(px + 12 * sc - wake, sy + 6 * sc, 4 * sc, 2 * sc);

    // 목재 선체(Hull)
    ctx.fillStyle = e.faction === 'monster' ? '#0f172a' : '#451a03';
    ctx.fillRect(px - 16 * sc, sy - 2 * sc, 32 * sc, 9 * sc);
    ctx.fillStyle = e.faction === 'monster' ? '#1e293b' : '#78350f';
    ctx.fillRect(px - 14 * sc, sy - 1 * sc, 28 * sc, 6 * sc);

    // 포문 (Gunports)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px - 10 * sc, sy + 1 * sc, 2 * sc, 2 * sc);
    ctx.fillRect(px - 2 * sc, sy + 1 * sc, 2 * sc, 2 * sc);
    ctx.fillRect(px + 6 * sc, sy + 1 * sc, 2 * sc, 2 * sc);

    // 돛대 (Mast)
    ctx.fillStyle = '#92400e';
    ctx.fillRect(px - 1 * sc, sy - 18 * sc, 2 * sc, 16 * sc);

    // 펄럭이는 캔버스 돛(Billowing Sail)
    ctx.fillStyle = e.role === 'player'
      ? '#facc15'
      : (e.faction === 'monster' ? '#991b1b' : (e.role === 'navy' ? '#38bdf8' : '#fef3c7'));
    ctx.fillRect(px - 10 * sc, sy - 15 * sc, 20 * sc, 10 * sc);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(px - 8 * sc, sy - 14 * sc, 16 * sc, 2 * sc);

    // 꼭대기 깃발
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(px + 1 * sc, sy - 18 * sc, 5 * sc, 3 * sc);
  }

  // (B) 4대 고대 드래곤 & 전설 비룡 픽셀아트 (Epic Cinema-Grade Pixel Dragon Engine)
  drawSpriteDragon(ctx, px, py, bounce, e, timeSec) {
    this.drawEpicDragon(ctx, px, py, e, timeSec, false);
  }

  drawEpicDragon(ctx, px, py, e, timeSec, isMountedPlayer = false) {
    const sc = (e.scale || 1.0) * (isMountedPlayer ? 1.4 : 1.25);
    const facingLeft = isMountedPlayer ? (e.vx < -0.1) : (e.vx < -0.05);
    const dir = facingLeft ? -1 : 1;

    // 4대 원소별 고유 비늘 및 이펙트 팔레트
    let mainColor = '#dc2626';     // 화염 기본 (Red)
    let darkColor = '#7f1d1d';
    let hornColor = '#facc15';
    let eyeColor = '#fef08a';
    let coreColor = '#f97316';
    let webColor = 'rgba(239, 68, 68, 0.65)';
    let auraColor = '#ef4444';
    let breathColor = '#f97316';

    if (e.dragonType === 'frost') {
      mainColor = '#0284c7';
      darkColor = '#0c4a6e';
      hornColor = '#bae6fd';
      eyeColor = '#38bdf8';
      coreColor = '#7dd3fc';
      webColor = 'rgba(56, 189, 248, 0.65)';
      auraColor = '#38bdf8';
      breathColor = '#bae6fd';
    } else if (e.dragonType === 'thunder') {
      mainColor = '#ca8a04';
      darkColor = '#713f12';
      hornColor = '#fef08a';
      eyeColor = '#ffffff';
      coreColor = '#facc15';
      webColor = 'rgba(250, 204, 21, 0.65)';
      auraColor = '#eab308';
      breathColor = '#fde047';
    } else if (e.dragonType === 'poison' || e.dragonType === 'shadow') {
      mainColor = '#581c87';
      darkColor = '#2e1065';
      hornColor = '#c084fc';
      eyeColor = '#e879f9';
      coreColor = '#9333ea';
      webColor = 'rgba(192, 132, 252, 0.65)';
      auraColor = '#a855f7';
      breathColor = '#c084fc';
    }

    const altitude = isMountedPlayer ? 18 * sc : 12 * sc;
    const dy = py - altitude;
    const wingFlap = Math.sin(timeSec * 7 + (e.id || 0)) * 9 * sc;

    ctx.save();

    // 1. 거대 비행 그림자 (Immense Ground Shadow)
    ctx.fillStyle = 'rgba(11, 15, 25, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px, py + 8 * sc, 26 * sc, 8 * sc, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 후방 날개 (Back Wing - Behind Body)
    const backWingY = dy - 18 * sc - wingFlap * 0.8;
    ctx.fillStyle = darkColor;
    ctx.fillRect(px - dir * 6 * sc, backWingY, dir * -24 * sc, 4 * sc);
    ctx.fillRect(px - dir * 18 * sc, backWingY - 6 * sc, dir * -14 * sc, 3 * sc);
    ctx.fillStyle = webColor;
    ctx.fillRect(px - dir * 8 * sc, backWingY + 3 * sc, dir * -26 * sc, 14 * sc);

    // 3. 역동적인 뱀장어형 파동 꼬리 (Serpentine Sine Wave Tail)
    for (let seg = 1; seg <= 5; seg++) {
      const tailX = px - dir * (8 + seg * 5) * sc;
      const tailWave = Math.sin(timeSec * 5 + seg * 0.8) * 4 * sc;
      const tailY = dy + (2 + seg * 2) * sc + tailWave;
      const segSize = Math.max(3, (7 - seg)) * sc;
      ctx.fillStyle = mainColor;
      ctx.fillRect(tailX, tailY, segSize, segSize);
      ctx.fillStyle = hornColor;
      ctx.fillRect(tailX, tailY - 2 * sc, 2 * sc, 2 * sc);
    }
    const endWave = Math.sin(timeSec * 5 + 4.5) * 4 * sc;
    ctx.fillStyle = hornColor;
    ctx.fillRect(px - dir * 36 * sc, dy + 11 * sc + endWave, 6 * sc, 4 * sc);

    // 4. 주 동체 & 가슴 장갑 (Chest Scutes & Core)
    ctx.fillStyle = darkColor;
    ctx.fillRect(px - 14 * sc, dy - 10 * sc, 28 * sc, 18 * sc);
    ctx.fillStyle = mainColor;
    ctx.fillRect(px - 12 * sc, dy - 8 * sc, 24 * sc, 15 * sc);

    // 가슴 흉갑 비늘 & 맥동하는 심장 코어
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px - dir * 4 * sc, dy - 4 * sc, 10 * sc, 11 * sc);
    ctx.fillStyle = coreColor;
    const corePulse = (Math.sin(timeSec * 6) + 1) * 0.5;
    ctx.globalAlpha = 0.7 + corePulse * 0.3;
    ctx.fillRect(px - dir * 2 * sc, dy - 2 * sc, 6 * sc, 7 * sc);
    ctx.globalAlpha = 1.0;

    // 5. 드래곤 목과 머리 (Dragon Neck & Horned Skull)
    const headX = px + dir * 14 * sc;
    const headY = dy - 14 * sc;

    ctx.fillStyle = mainColor;
    ctx.fillRect(px + dir * 6 * sc, dy - 10 * sc, dir * 8 * sc, 10 * sc);

    ctx.fillStyle = darkColor;
    ctx.fillRect(headX - (dir < 0 ? 16 * sc : 0), headY, 16 * sc, 11 * sc);
    ctx.fillStyle = mainColor;
    ctx.fillRect(headX - (dir < 0 ? 14 * sc : -2 * sc), headY + 2 * sc, 13 * sc, 8 * sc);

    // 거대한 갈퀴형 드래곤 뿔 (Dual Sweeping Horns)
    ctx.fillStyle = hornColor;
    ctx.fillRect(headX - dir * 4 * sc, headY - 8 * sc, 4 * sc, 8 * sc);
    ctx.fillRect(headX - dir * 8 * sc, headY - 14 * sc, 3 * sc, 7 * sc);
    ctx.fillRect(headX - dir * 13 * sc, headY - 18 * sc, 2 * sc, 5 * sc);

    // 턱 & 이빨 (Jaws & Fangs)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(headX + dir * 4 * sc, headY + 7 * sc, dir * 8 * sc, 3 * sc);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(headX + dir * 6 * sc, headY + 6 * sc, 2 * sc, 2 * sc);
    ctx.fillRect(headX + dir * 9 * sc, headY + 6 * sc, 2 * sc, 2 * sc);

    // 맹렬한 안광 (Glow Slit Eyes)
    ctx.fillStyle = eyeColor;
    ctx.fillRect(headX + dir * 3 * sc, headY + 2 * sc, 3 * sc, 3 * sc);
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(headX + dir * 4 * sc, headY + 2 * sc, 1 * sc, 3 * sc);

    // 6. 전방 거대 날개 (Front Wing)
    const frontWingY = dy - 16 * sc + wingFlap;
    ctx.fillStyle = mainColor;
    ctx.fillRect(px - dir * 4 * sc, frontWingY, dir * 28 * sc, 5 * sc);
    ctx.fillRect(px + dir * 20 * sc, frontWingY - 10 * sc, dir * 18 * sc, 4 * sc);
    ctx.fillStyle = hornColor;
    ctx.fillRect(px + dir * 20 * sc, frontWingY - 12 * sc, 3 * sc, 3 * sc);
    ctx.fillRect(px + dir * 36 * sc, frontWingY - 8 * sc, 3 * sc, 3 * sc);

    ctx.fillStyle = webColor;
    ctx.fillRect(px - dir * 2 * sc, frontWingY + 4 * sc, dir * 34 * sc, 18 * sc);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(px + dir * 4 * sc, frontWingY + 5 * sc, dir * 26 * sc, 2 * sc);

    // 7. 발톱 & 다리 (Razor Talons)
    ctx.fillStyle = mainColor;
    ctx.fillRect(px - 6 * sc, dy + 6 * sc, 6 * sc, 8 * sc);
    ctx.fillRect(px + 4 * sc, dy + 6 * sc, 6 * sc, 8 * sc);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(px - 7 * sc, dy + 13 * sc, 3 * sc, 3 * sc);
    ctx.fillRect(px - 3 * sc, dy + 13 * sc, 3 * sc, 3 * sc);
    ctx.fillRect(px + 3 * sc, dy + 13 * sc, 3 * sc, 3 * sc);
    ctx.fillRect(px + 7 * sc, dy + 13 * sc, 3 * sc, 3 * sc);

    // 8. 플레이어 탑승 시 (Hero Riding the Dragon)
    if (isMountedPlayer) {
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(px - 5 * sc, dy - 12 * sc, 10 * sc, 4 * sc);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, dy - 14 * sc);
      ctx.lineTo(headX, headY + 3 * sc);
      ctx.stroke();

      const heroY = dy - 18 * sc;
      const capeFlap = Math.round(Math.sin(timeSec * 8) * 3 * sc);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(px - dir * 10 * sc, heroY + 2 * sc, dir * 8 * sc, 10 * sc + capeFlap);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(px - 3 * sc, heroY - 2 * sc, 7 * sc, 8 * sc);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px - 2 * sc, heroY - 7 * sc, 5 * sc, 5 * sc);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px - 3 * sc, heroY - 10 * sc, 7 * sc, 3 * sc);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(px + dir * 6 * sc, heroY - 13 * sc, 2 * sc, 12 * sc);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + dir * 5 * sc, heroY - 8 * sc, 4 * sc, 2 * sc);
    }

    // 9. 드래곤 브레스 & 원소 파티클 (Dragon Breath)
    const isBreathing = (e.state === 'combat') || (isMountedPlayer && (Math.sin(timeSec * 4) > 0.3));
    if (isBreathing) {
      const bX = headX + dir * 12 * sc;
      const bY = headY + 6 * sc;
      for (let p = 1; p <= 6; p++) {
        const pProg = (timeSec * 8 + p * 0.16) % 1.0;
        const pxPos = bX + dir * pProg * 42 * sc;
        const pyPos = bY + (Math.sin(timeSec * 15 + p) * 6 * pProg) * sc;
        const pRadius = Math.max(2, Math.round(3 + pProg * 8 * sc));
        ctx.fillStyle = (p % 2 === 0) ? '#ffffff' : breathColor;
        ctx.globalAlpha = Math.max(0, 1 - pProg * 0.8);
        ctx.beginPath();
        ctx.arc(pxPos, pyPos, pRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    } else {
      const smokeProg = (timeSec * 2) % 1.0;
      ctx.fillStyle = auraColor;
      ctx.globalAlpha = 0.6 * (1 - smokeProg);
      ctx.fillRect(headX + dir * 13 * sc, headY + 3 * sc - smokeProg * 8 * sc, 3 * sc, 3 * sc);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }

  // (C) 육상 상단 마차 픽셀아트
  drawSpriteCaravan(ctx, px, py, bounce, e, timeSec) {
    const wx = px - (e.vx >= 0 ? 12 : -12);
    const wy = py + 2;

    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(wx - 10, wy + 5, 20, 3);

    // 나무 마차 상자 & 흰색 천막
    ctx.fillStyle = '#78350f';
    ctx.fillRect(wx - 9, wy - 3, 18, 8);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(wx - 8, wy - 10, 16, 7);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(wx - 7, wy - 9, 14, 2);

    // 나무 바퀴 2개
    ctx.fillStyle = '#451a03';
    ctx.fillRect(wx - 7, wy + 4, 4, 4);
    ctx.fillRect(wx + 3, wy + 4, 4, 4);
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(wx - 6, wy + 5, 2, 2);
    ctx.fillRect(wx + 4, wy + 5, 2, 2);

    // 이끄는 갈색 말
    ctx.fillStyle = '#92400e';
    ctx.fillRect(px - 4, py - 6 - bounce, 8, 8);
    ctx.fillRect(px, py - 10 - bounce, 5, 5); // 머리
  }

  // (D) 인간·엘프·드워프·수인·몬스터 픽셀 캐릭터
  drawSpriteCharacter(ctx, px, py, bounce, e, timeSec, zoom) {
    const sc = e.scale;
    const sy = py - bounce;

    // Tiny RPG 16x16 / 24x24 정밀 픽셀 아트 매트릭스 엔진 우선 렌더링
    if (window.PixelSprites && window.PixelSprites.isReady) {
      // 1. 플레이어 고대 비룡 비행 탑승 특수 렌더링
      if (e.role === 'player' && e.isFlying && e.mount === 'dragon') {
        this.drawEpicDragon(ctx, px, py, e, timeSec, true);
        return;
      }

      // 2. 플레이어 백마 탑승 특수 렌더링
      const isNight = (this.lastWorldTime && (this.lastWorldTime.hour >= 20 || this.lastWorldTime.hour < 5));
      if (e.role === 'player' && e.mount === 'horse') {
        window.PixelSprites.draw(ctx, { ...e, animalType: 'horse', role: 'animal' }, px, py + 2 * sc, bounce, timeSec, isNight);
        // 말 위에 탑승한 플레이어 영웅 상체 (방향 및 장비 인식)
        const isLeft = (e.facing === 'left');
        const facingSign = isLeft ? -1 : 1;
        ctx.fillStyle = '#dc2626'; // 망토
        ctx.fillRect(px - facingSign * 5 * sc, sy - 11 * sc, 3 * sc, 8 * sc);
        ctx.fillStyle = '#1d4ed8'; // 블루 갑주
        ctx.fillRect(px - 3 * sc, sy - 12 * sc, 6 * sc, 7 * sc);
        ctx.fillStyle = '#fed7aa'; // 얼굴
        ctx.fillRect(px - 2 * sc, sy - 16 * sc, 4 * sc, 4 * sc);
        ctx.fillStyle = '#facc15'; // 황금 왕관
        ctx.fillRect(px - 3 * sc, sy - 18 * sc, 6 * sc, 2 * sc);
        if (window.PixelSprites && window.PixelSprites.drawEquippedGear) {
          window.PixelSprites.drawEquippedGear(ctx, e, px, sy - 4 * sc, 0, e.facing || 'down', e.state === 'combat', timeSec, sc);
        }
        return;
      }

      // 3. 모든 영웅/NPC/몬스터/야생동물 정밀 픽셀 아트 매트릭스 렌더링
      window.PixelSprites.draw(ctx, e, px, py, bounce, timeSec, isNight);
      return;
    }

    // [Fallback 레거시 렌더링]
    // 바닥 픽셀 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(px - 5 * sc, py + 4 * sc, 10 * sc, 3 * sc);

    // [플레이어 영웅] 탈것(비룡 비행 / 백마 질주 / 도보)에 따른 픽셀아트 렌더링
    if (e.role === 'player') {
      // 1. 고대 비룡 탑승 비행 모드
      if (e.isFlying && e.mount === 'dragon') {
        // 지면 거대 그림자
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(px - 14 * sc, py + 16 * sc, 28 * sc, 6 * sc);

        // 공중 상승 오프셋 (-14px) 및 날개 펄럭임
        const flyY = sy - 14 * sc;
        const flap = Math.round(Math.sin(timeSec * 7.5) * 5 * sc);

        // 붉은 비룡 동체 및 머리/꼬리
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(px - 10 * sc, flyY - 4 * sc, 20 * sc, 9 * sc);
        ctx.fillRect(px - 18 * sc, flyY - 1 * sc, 9 * sc, 4 * sc); // 꼬리
        ctx.fillRect(px + 8 * sc, flyY - 9 * sc, 8 * sc, 8 * sc);  // 용 머리
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px + 13 * sc, flyY - 8 * sc, 2 * sc, 2 * sc); // 안광

        // 불타는 날개
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(px - 16 * sc, flyY - 12 * sc + flap, 12 * sc, 3 * sc);
        ctx.fillRect(px + 4 * sc, flyY - 12 * sc + flap, 12 * sc, 3 * sc);
        ctx.fillStyle = '#f97316';
        ctx.globalAlpha = 0.75;
        ctx.fillRect(px - 14 * sc, flyY - 10 * sc + flap, 10 * sc, 6 * sc);
        ctx.fillRect(px + 6 * sc, flyY - 10 * sc + flap, 10 * sc, 6 * sc);
        ctx.globalAlpha = 1.0;

        // 비룡 등 위의 플레이어
        ctx.fillStyle = '#1d4ed8'; // 로열 블루 갑주
        ctx.fillRect(px - 2 * sc, flyY - 11 * sc, 5 * sc, 8 * sc);
        ctx.fillStyle = '#fed7aa'; // 얼굴
        ctx.fillRect(px - 1 * sc, flyY - 14 * sc, 4 * sc, 4 * sc);
        ctx.fillStyle = '#facc15'; // 황금 관
        ctx.fillRect(px - 2 * sc, flyY - 16 * sc, 6 * sc, 2 * sc);
        // 전설검
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px + 4 * sc, flyY - 17 * sc, 2 * sc, 9 * sc);
        return;
      }

      // 2. 왕실 백마 탑승 모드
      if (e.mount === 'horse') {
        // 붉은 망토
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(px - 6 * sc, sy - 8 * sc, 3 * sc, 10 * sc);

        // 백마
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(px - 7 * sc, sy - 3 * sc, 14 * sc, 8 * sc);
        ctx.fillRect(px + 4 * sc, sy - 8 * sc, 5 * sc, 6 * sc); // 말 머리
        ctx.fillStyle = '#b45309';
        ctx.fillRect(px - 2 * sc, sy - 4 * sc, 5 * sc, 3 * sc); // 안장

        // 영웅 본체
        ctx.fillStyle = '#1d4ed8'; // 로열 블루 갑주
        ctx.fillRect(px - 3 * sc, sy - 11 * sc, 6 * sc, 7 * sc);
        ctx.fillStyle = '#fed7aa'; // 얼굴
        ctx.fillRect(px - 2 * sc, sy - 15 * sc, 4 * sc, 4 * sc);
        ctx.fillStyle = '#facc15'; // 황금 왕관
        ctx.fillRect(px - 3 * sc, sy - 17 * sc, 6 * sc, 2 * sc);
        ctx.fillRect(px - 2 * sc, sy - 18 * sc, 1 * sc, 1 * sc);
        ctx.fillRect(px + 1 * sc, sy - 18 * sc, 1 * sc, 1 * sc);

        // 전설검
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px + 4 * sc, sy - 14 * sc, 2 * sc, 8 * sc);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 4 * sc, sy - 16 * sc, 2 * sc, 3 * sc);
        return;
      }

      // 3. 도보 탐험 모드
      ctx.fillStyle = '#dc2626'; // 망토
      ctx.fillRect(px - 5 * sc, sy - 5 * sc, 3 * sc, 8 * sc);

      const leg = Math.round(Math.sin(timeSec * 10) * 2 * sc);
      ctx.fillStyle = '#1e293b'; // 바지/다리
      ctx.fillRect(px - 3 * sc, sy + 1 * sc, 2 * sc, 5 * sc + leg);
      ctx.fillRect(px + 1 * sc, sy + 1 * sc, 2 * sc, 5 * sc - leg);

      ctx.fillStyle = '#1d4ed8'; // 갑주
      ctx.fillRect(px - 3 * sc, sy - 6 * sc, 6 * sc, 7 * sc);
      ctx.fillStyle = '#fed7aa'; // 얼굴
      ctx.fillRect(px - 2 * sc, sy - 10 * sc, 4 * sc, 4 * sc);
      ctx.fillStyle = '#facc15'; // 황금 관
      ctx.fillRect(px - 3 * sc, sy - 12 * sc, 6 * sc, 2 * sc);
      ctx.fillStyle = '#fef08a'; // 검
      ctx.fillRect(px + 3 * sc, sy - 8 * sc, 2 * sc, 7 * sc);
      return;
    }

    // [기사 & 성전사] 강철 투구 + 붉은 깃털 + 방패 + 롱소드
    if (e.role === 'soldier' || e.role === 'royal_guard') {
      ctx.fillStyle = '#64748b'; // 강철 갑옷
      ctx.fillRect(px - 4 * sc, sy - 9 * sc, 8 * sc, 10 * sc);
      ctx.fillStyle = '#cbd5e1'; // 투구
      ctx.fillRect(px - 3 * sc, sy - 14 * sc, 6 * sc, 5 * sc);
      ctx.fillStyle = '#0f172a'; // 바이저 틈
      ctx.fillRect(px - 2 * sc, sy - 12 * sc, 4 * sc, 1.5 * sc);
      ctx.fillStyle = '#dc2626'; // 투구 깃털
      ctx.fillRect(px - 1 * sc, sy - 17 * sc, 2 * sc, 3 * sc);

      // 방패 (좌) & 검 (우)
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(px - 7 * sc, sy - 8 * sc, 3 * sc, 6 * sc);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(px + 4 * sc, sy - 11 * sc, 2 * sc, 7 * sc);
      return;
    }

    // [마법사] 보라 뾰족 모자 + 로브 + 수정 지팡이
    if (e.subClass && (e.subClass.includes('마법') || e.subClass.includes('아크메이지') || e.role === 'magic_spire')) {
      ctx.fillStyle = '#6b21a8'; // 로브
      ctx.fillRect(px - 4 * sc, sy - 9 * sc, 8 * sc, 11 * sc);
      ctx.fillStyle = '#fed7aa'; // 얼굴
      ctx.fillRect(px - 2 * sc, sy - 13 * sc, 4 * sc, 4 * sc);
      ctx.fillStyle = '#7e22ce'; // 뾰족 모자
      ctx.fillRect(px - 4 * sc, sy - 14 * sc, 8 * sc, 2 * sc);
      ctx.fillRect(px - 2 * sc, sy - 18 * sc, 4 * sc, 4 * sc);

      // 수정 지팡이
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 4 * sc, sy - 14 * sc, 1.5 * sc, 14 * sc);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(px + 3 * sc, sy - 17 * sc, 3.5 * sc, 3.5 * sc);
      return;
    }

    // [엘프] 녹색 후드 + 뾰족 귀 + 활
    if (e.race === 'elf') {
      ctx.fillStyle = '#15803d'; // 숲 로브
      ctx.fillRect(px - 3 * sc, sy - 8 * sc, 6 * sc, 10 * sc);
      ctx.fillStyle = '#fef08a'; // 금발 & 얼굴
      ctx.fillRect(px - 2 * sc, sy - 12 * sc, 4 * sc, 4 * sc);
      ctx.fillStyle = '#16a34a'; // 엘프 후드
      ctx.fillRect(px - 3 * sc, sy - 14 * sc, 6 * sc, 3 * sc);

      // 뾰족 귀
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px - 4 * sc, sy - 11 * sc, 1.5 * sc, 2 * sc);
      ctx.fillRect(px + 2.5 * sc, sy - 11 * sc, 1.5 * sc, 2 * sc);

      // 활 (Bow)
      ctx.fillStyle = '#92400e';
      ctx.fillRect(px + 3.5 * sc, sy - 11 * sc, 1.5 * sc, 8 * sc);
      return;
    }

    // [드워프] 뿔 헬멧 + 긴 갈색 턱수염 + 전투도끼
    if (e.race === 'dwarf') {
      ctx.fillStyle = '#475569'; // 중갑
      ctx.fillRect(px - 5 * sc, sy - 7 * sc, 10 * sc, 8 * sc);
      ctx.fillStyle = '#92400e'; // 덥수룩한 턱수염
      ctx.fillRect(px - 3 * sc, sy - 6 * sc, 6 * sc, 5 * sc);
      ctx.fillStyle = '#64748b'; // 둥근 투구
      ctx.fillRect(px - 4 * sc, sy - 12 * sc, 8 * sc, 4 * sc);
      ctx.fillStyle = '#facc15'; // 뿔 장식
      ctx.fillRect(px - 5 * sc, sy - 13 * sc, 1.5 * sc, 3 * sc);
      ctx.fillRect(px + 3.5 * sc, sy - 13 * sc, 1.5 * sc, 3 * sc);

      // 대형 망치/도끼
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px + 4 * sc, sy - 11 * sc, 4 * sc, 3 * sc);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 5 * sc, sy - 8 * sc, 1.5 * sc, 7 * sc);
      return;
    }

    // [몬스터 (오크, 고블린, 해골)]
    if (e.faction === 'monster') {
      if (e.race === 'orc') {
        ctx.fillStyle = '#15803d'; // 초록 근육
        ctx.fillRect(px - 5 * sc, sy - 9 * sc, 10 * sc, 10 * sc);
        ctx.fillRect(px - 3 * sc, sy - 13 * sc, 6 * sc, 5 * sc); // 머리
        ctx.fillStyle = '#f8fafc'; // 엄니(Tusks)
        ctx.fillRect(px - 2 * sc, sy - 10 * sc, 1 * sc, 2 * sc);
        ctx.fillRect(px + 1 * sc, sy - 10 * sc, 1 * sc, 2 * sc);
      } else if (e.race === 'undead') {
        ctx.fillStyle = '#cbd5e1'; // 뼈대
        ctx.fillRect(px - 3 * sc, sy - 8 * sc, 6 * sc, 9 * sc);
        ctx.fillStyle = '#f8fafc'; // 해골 머리
        ctx.fillRect(px - 3 * sc, sy - 13 * sc, 6 * sc, 5 * sc);
        ctx.fillStyle = '#0f172a'; // 안와
        ctx.fillRect(px - 2 * sc, sy - 11 * sc, 1.5 * sc, 1.5 * sc);
        ctx.fillRect(px + 0.5 * sc, sy - 11 * sc, 1.5 * sc, 1.5 * sc);
      } else {
        ctx.fillStyle = '#b91c1c'; // 고블린/도적
        ctx.fillRect(px - 3 * sc, sy - 7 * sc, 6 * sc, 8 * sc);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(px - 2.5 * sc, sy - 11 * sc, 5 * sc, 4 * sc);
      }
      return;
    }

    // [야생 동물 (사슴, 토끼, 불곰, 낙타, 돌고래)]
    if (e.role === 'animal') {
      if (e.animalType === 'deer') {
        ctx.fillStyle = '#a16207'; // 사슴 몸
        ctx.fillRect(px - 6 * sc, sy - 6 * sc, 12 * sc, 7 * sc);
        ctx.fillRect(px + 4 * sc, sy - 11 * sc, 4 * sc, 6 * sc); // 목 & 머리
        ctx.fillStyle = '#451a03'; // 나뭇가지 뿔
        ctx.fillRect(px + 5 * sc, sy - 15 * sc, 1.5 * sc, 4 * sc);
        ctx.fillRect(px + 3 * sc, sy - 14 * sc, 2 * sc, 1.5 * sc);
      } else if (e.animalType === 'rabbit') {
        ctx.fillStyle = '#f8fafc'; // 흰 토끼
        ctx.fillRect(px - 3 * sc, sy - 4 * sc, 6 * sc, 5 * sc);
        ctx.fillStyle = '#f472b6'; // 쫑긋 귀
        ctx.fillRect(px - 2 * sc, sy - 8 * sc, 1.5 * sc, 4 * sc);
        ctx.fillRect(px + 0.5 * sc, sy - 8 * sc, 1.5 * sc, 4 * sc);
      } else if (e.animalType === 'bear') {
        ctx.fillStyle = '#451a03'; // 불곰
        ctx.fillRect(px - 7 * sc, sy - 8 * sc, 14 * sc, 10 * sc);
        ctx.fillRect(px + 4 * sc, sy - 11 * sc, 5 * sc, 5 * sc);
      } else if (e.animalType === 'camel') {
        ctx.fillStyle = '#d97706'; // 낙타 혹 2개
        ctx.fillRect(px - 7 * sc, sy - 6 * sc, 14 * sc, 8 * sc);
        ctx.fillRect(px - 5 * sc, sy - 10 * sc, 4 * sc, 4 * sc);
        ctx.fillRect(px + 1 * sc, sy - 10 * sc, 4 * sc, 4 * sc);
        ctx.fillRect(px + 5 * sc, sy - 13 * sc, 3 * sc, 8 * sc); // 긴 목
      } else if (e.animalType === 'dolphin') {
        ctx.fillStyle = '#0284c7'; // 돌고래 유영
        ctx.fillRect(px - 8 * sc, sy - 4 * sc, 16 * sc, 6 * sc);
        ctx.fillRect(px - 1 * sc, sy - 8 * sc, 3 * sc, 4 * sc); // 등지느러미
      } else if (e.animalType === 'croc' || (e.name && e.name.includes('악어'))) {
        // 🐊 늪지대 맹독 악어 (납작하고 긴 초록 비늘 몸통 + 돌출된 이빨 + 노란 안광)
        ctx.fillStyle = '#14532d'; // 짙은 늪지대 녹색 몸체
        ctx.fillRect(px - 10 * sc, sy - 4 * sc, 20 * sc, 6 * sc);
        ctx.fillStyle = '#16a34a'; // 등뼈 돌기
        ctx.fillRect(px - 6 * sc, sy - 6 * sc, 12 * sc, 2 * sc);
        // 길게 뻗은 주둥이 & 하얀 이빨
        ctx.fillStyle = '#14532d';
        ctx.fillRect(px + 7 * sc, sy - 3 * sc, 6 * sc, 4 * sc);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px + 9 * sc, sy - 4 * sc, 2 * sc, 1.5 * sc);
        ctx.fillRect(px + 11 * sc, sy - 1 * sc, 2 * sc, 1.5 * sc);
        // 노란 뱀눈
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + 6 * sc, sy - 5 * sc, 2 * sc, 2 * sc);
      } else if (e.animalType === 'cow' || (e.name && e.name.includes('소'))) {
        // 🐄 얼룩 젖소
        ctx.fillStyle = '#ffffff'; // 흰 몸체
        ctx.fillRect(px - 7 * sc, sy - 6 * sc, 14 * sc, 8 * sc);
        ctx.fillStyle = '#0f172a'; // 흑색 얼룩무늬
        ctx.fillRect(px - 4 * sc, sy - 5 * sc, 4 * sc, 4 * sc);
        ctx.fillRect(px + 2 * sc, sy - 4 * sc, 3 * sc, 5 * sc);
        ctx.fillStyle = '#fbcfe8'; // 분홍 주둥이
        ctx.fillRect(px + 5 * sc, sy - 6 * sc, 4 * sc, 4 * sc);
        ctx.fillStyle = '#facc15'; // 워낭 방울
        ctx.fillRect(px + 3 * sc, sy - 2 * sc, 3 * sc, 3 * sc);
      } else if (e.animalType === 'sheep' || (e.name && e.name.includes('양') && !e.name.includes('산양'))) {
        // 🐑 목초지 양 (폭신폭신한 흰 구름 털)
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(px, sy - 2 * sc, 6 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px - 4 * sc, sy - 3 * sc, 4.5 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + 4 * sc, sy - 3 * sc, 4.5 * sc, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fed7aa'; // 살구색 얼굴
        ctx.fillRect(px + 4 * sc, sy - 5 * sc, 3.5 * sc, 3.5 * sc);
      } else if (e.animalType === 'goat' || (e.name && e.name.includes('산양'))) {
        // 🐐 바위 산양 (뒤로 휜 뿔 + 턱수염)
        ctx.fillStyle = '#94a3b8'; // 회색 털
        ctx.fillRect(px - 5 * sc, sy - 5 * sc, 10 * sc, 6 * sc);
        ctx.fillRect(px + 3 * sc, sy - 8 * sc, 3.5 * sc, 5 * sc); // 머리
        ctx.fillStyle = '#334155'; // 뒤로 뻗은 뿔
        ctx.fillRect(px + 1 * sc, sy - 12 * sc, 2 * sc, 5 * sc);
        ctx.fillStyle = '#ffffff'; // 턱수염
        ctx.fillRect(px + 4 * sc, sy - 3 * sc, 2 * sc, 3 * sc);
      } else if (e.animalType === 'salamander' || (e.name && e.name.includes('도마뱀'))) {
        // 🦎 흑요석 불꽃도마뱀
        ctx.fillStyle = '#18181b';
        ctx.fillRect(px - 8 * sc, sy - 3 * sc, 16 * sc, 5 * sc);
        ctx.fillStyle = '#f97316'; // 불타는 등지느러미
        ctx.fillRect(px - 6 * sc, sy - 5 * sc, 12 * sc, 2 * sc);
        ctx.fillStyle = '#ef4444'; // 붉은 눈
        ctx.fillRect(px + 5 * sc, sy - 4 * sc, 2 * sc, 2 * sc);
      } else if (e.animalType === 'scorpion' || (e.name && e.name.includes('전갈'))) {
        // 🦂 사막 거대전갈
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px - 6 * sc, sy - 3 * sc, 12 * sc, 5 * sc);
        ctx.fillStyle = '#b45309'; // 앞 집게발
        ctx.fillRect(px + 5 * sc, sy - 5 * sc, 4 * sc, 3 * sc);
        ctx.fillRect(px + 5 * sc, sy + 1 * sc, 4 * sc, 3 * sc);
        // 치켜든 독침 꼬리
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px - 8 * sc, sy - 7 * sc, 3 * sc, 5 * sc);
        ctx.fillRect(px - 6 * sc, sy - 9 * sc, 3 * sc, 2 * sc);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px - 5 * sc, sy - 6 * sc, 10 * sc, 8 * sc);
      }
      return;
    }

    // 일반 주민 & 농부 & 어부
    ctx.fillStyle = e.color || '#3b82f6';
    ctx.fillRect(px - 3 * sc, sy - 8 * sc, 6 * sc, 9 * sc);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px - 2 * sc, sy - 12 * sc, 4 * sc, 4 * sc);
    if (e.role === 'farmer') {
      ctx.fillStyle = '#ca8a04'; // 짚모자
      ctx.fillRect(px - 4 * sc, sy - 13 * sc, 8 * sc, 2 * sc);
    }
  }

  drawSettlementLabels(ctx, ts, zoom, selectedItem) {
    if (zoom < 0.22) return;
    for (const s of this.world.settlements) {
      const sx = Math.round(s.x * ts);
      const sy = Math.round(s.y * ts);
      const isSelected = selectedItem && selectedItem.type === 'settlement' && selectedItem.data && selectedItem.data.id === s.id;

      ctx.save();
      const fontSize = isSelected ? 13 : (zoom > 0.8 ? 12 : 10);
      ctx.font = `bold ${fontSize}px Pretendard, sans-serif`;
      const label = `${s.icon} ${s.name}`;
      const tw = ctx.measureText(label).width + 16;
      const bh = fontSize + 10;

      ctx.fillStyle = isSelected
        ? 'rgba(234, 88, 12, 0.95)'
        : (s.faction === 'monster' ? 'rgba(69, 10, 10, 0.90)' : 'rgba(15, 23, 42, 0.88)');
      ctx.strokeStyle = isSelected
        ? '#facc15'
        : (s.faction === 'monster' ? '#ef4444' : '#d4af37');
      ctx.lineWidth = isSelected ? 2.5 : 1.5;

      ctx.beginPath();
      ctx.roundRect(sx - tw / 2, sy - bh / 2, tw, bh, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = s.faction === 'monster' ? '#fecaca' : '#fef08a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, sx, sy);
      ctx.restore();
    }
  }

  drawAtmosphereOverlay(ctx, cw, ch, worldTime, timeSec, camera = null) {
    const h = worldTime.hour + worldTime.minute / 60;
    let darkness = 0;
    if (h >= 20) darkness = Math.min(0.48, (h - 20) / 3 * 0.48);
    else if (h < 5) darkness = 0.48;
    else if (h < 7) darkness = Math.max(0, (7 - h) / 2 * 0.48);

    // 밤 조명 오버레이
    if (darkness > 0.01) {
      ctx.fillStyle = `rgba(7, 13, 34, ${darkness})`;
      ctx.fillRect(0, 0, cw, ch);
    }

    // 황혼/새벽의 골든아워 노을
    if ((h >= 18 && h < 20) || (h >= 5 && h < 7)) {
      ctx.fillStyle = 'rgba(234, 88, 12, 0.07)';
      ctx.fillRect(0, 0, cw, ch);
    }

    const camX = camera ? camera.x : 320;
    const camY = camera ? camera.y : 200;

    // 1. 빗줄기 & 지면 착탄 수면 파문 (Rain & Splash Ripples)
    if (worldTime.weather === 'rain' || worldTime.weather === 'storm') {
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.45)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < 95; i++) {
        const rx = Math.floor((i * 197 + timeSec * 280) % cw);
        const ry = Math.floor((i * 311 + timeSec * 650) % ch);
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 4, ry + 12);
      }
      ctx.stroke();

      // 지면 착탄 파문 링
      ctx.strokeStyle = 'rgba(191, 219, 254, 0.35)';
      ctx.lineWidth = 1.0;
      for (let i = 0; i < 18; i++) {
        const ripProg = ((timeSec * 2.5 + i * 0.3) % 1.0);
        const ripX = Math.floor((i * 241 + Math.sin(i) * 60) % cw);
        const ripY = Math.floor((i * 181 + Math.cos(i) * 60) % ch);
        const rRad = Math.round(2 + ripProg * 6);
        ctx.beginPath();
        ctx.ellipse(ripX, ripY, rRad * 1.5, rRad * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 폭풍우 천둥 번개 플래시 (Thunder Lightning Flash)
      if (worldTime.weather === 'storm') {
        const stormCycle = (timeSec * 0.8) % 6.0;
        if (stormCycle < 0.12) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
          ctx.fillRect(0, 0, cw, ch);
          if (camera && camera.shake === 0) camera.shake = 8;
        }
      }
    }

    // 2. ❄️ 북부 설원 눈보라 (Snowdrift for North Pole & Snow Weather)
    if (worldTime.weather === 'snow' || camY < 95) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let i = 0; i < 70; i++) {
        const sx = Math.floor((i * 181 + Math.sin(timeSec * 2.2 + i) * 24 + timeSec * 32) % cw);
        const sy = Math.floor((i * 269 + timeSec * 115) % ch);
        const sz = (i % 3 === 0) ? 3 : 2;
        ctx.fillRect(sx, sy, sz, sz);
      }
    }

    // 3. 🏜️ 서부 미라주 사막 모래폭풍 (Desert Sandstorm & Heat Shimmer)
    if (worldTime.weather === 'sandstorm' || (camX < 180 && camY > 170 && camY < 320)) {
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.28)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i < 55; i++) {
        const dx = Math.floor((i * 163 + timeSec * 420) % cw);
        const dy = Math.floor((i * 241 + Math.sin(timeSec * 1.8 + i) * 16) % ch);
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx + 26, dy + 2);
      }
      ctx.stroke();
    }

    // 4. 🔥 남부 드라코니아 화산재 & 불씨 파티클 (Volcanic Ash & Rising Embers)
    if (camY > 270 && camX > 250 && camX < 430) {
      for (let i = 0; i < 36; i++) {
        const ex = Math.floor((i * 191 + Math.sin(timeSec * 2.8 + i) * 25) % cw);
        const ey = Math.floor((i * 307 - timeSec * 130) % ch + ch) % ch;
        const prog = (timeSec * 1.8 + i * 0.1) % 1;
        ctx.fillStyle = (i % 2 === 0) ? '#f97316' : '#ef4444';
        ctx.globalAlpha = Math.max(0.15, 0.75 * (1 - prog));
        ctx.fillRect(ex, ey, 2.5, 2.5);
      }
      ctx.globalAlpha = 1.0;
    }

    // 5. 🌿 동부 안개 늪지대 도깨비불 (Swamp Will-o'-the-Wisps)
    if (camX > 450 && camY > 110 && camY < 280) {
      for (let i = 0; i < 22; i++) {
        const wx = Math.floor((i * 223 + Math.sin(timeSec * 1.1 + i * 2) * 45) % cw);
        const wy = Math.floor((i * 179 + Math.cos(timeSec * 0.8 + i * 2) * 35) % ch);
        const glow = 0.35 + Math.sin(timeSec * 3.5 + i) * 0.25;
        ctx.fillStyle = (i % 2 === 0) ? `rgba(74, 222, 128, ${glow})` : `rgba(192, 132, 252, ${glow})`;
        ctx.fillRect(wx - 2, wy - 2, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx - 1, wy - 1, 2, 2);
      }
    }

    // 6. 밤의 신비로운 황금 반딧불이 (Night Fireflies)
    if (darkness > 0.25) {
      ctx.fillStyle = '#fde047';
      for (let i = 0; i < 40; i++) {
        const fx = Math.floor((i * 271 + Math.sin(timeSec + i) * 40) % cw);
        const fy = Math.floor((i * 193 + Math.cos(timeSec * 0.8 + i) * 40) % ch);
        ctx.fillRect(fx, fy, 2, 2);
      }
    }
  }

  renderMinimap(camera, cw, ch, filterCategory) {
    const mCtx = this.minimapCtx;
    const mw = this.minimapCanvas.width;
    const mh = this.minimapCanvas.height;
    const scaleX = mw / this.world.width;
    const scaleY = mh / this.world.height;

    mCtx.clearRect(0, 0, mw, mh);
    mCtx.drawImage(this.minimapBaseCanvas, 0, 0, mw, mh);

    for (const e of this.entityMgr.entities) {
      if (filterCategory !== 'all') {
        const match = (filterCategory === 'animal' && e.role === 'animal') ||
                      (filterCategory === 'dragon' && e.role === 'dragon') ||
                      (filterCategory === 'elf' && e.race === 'elf') ||
                      (filterCategory === 'dwarf' && e.race === 'dwarf') ||
                      (filterCategory === 'beastkin' && e.race === 'beastkin') ||
                      (e.category === filterCategory || e.role === filterCategory) ||
                      (e.role === 'player');
        if (!match) continue;
      }
      mCtx.fillStyle = e.role === 'player'
        ? '#ffffff'
        : (e.role === 'dragon' ? '#f97316' : (e.role === 'animal' ? '#34d399' : (e.faction === 'monster' ? '#ef4444' : (e.category === 'merchant' ? '#facc15' : '#38bdf8'))));
      const sz = (e.role === 'player' || e.role === 'dragon') ? 4 : (e.category === 'merchant' ? 2.5 : 1.8);
      mCtx.fillRect(e.x * scaleX - sz / 2, e.y * scaleY - sz / 2, sz, sz);
    }

    for (const s of this.world.settlements) {
      mCtx.fillStyle = s.faction === 'monster' ? '#dc2626' : '#fde047';
      mCtx.beginPath();
      mCtx.arc(s.x * scaleX, s.y * scaleY, 3, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.strokeStyle = '#000';
      mCtx.lineWidth = 1;
      mCtx.stroke();
    }

    // 퀘스트 목표 위치 반짝이는 황금 별 표시
    if (this.entityMgr.questSystem && this.entityMgr.questSystem.activeQuest) {
      const q = this.entityMgr.questSystem.activeQuest;
      const qx = q.targetX * scaleX;
      const qy = q.targetY * scaleY;
      mCtx.fillStyle = '#facc15';
      mCtx.beginPath();
      mCtx.arc(qx, qy, 4.5, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.strokeStyle = '#ffffff';
      mCtx.lineWidth = 1.5;
      mCtx.stroke();
    }

    const viewTilesW = (cw / camera.zoom) / TILE_SIZE;
    const viewTilesH = (ch / camera.zoom) / TILE_SIZE;
    mCtx.strokeStyle = '#ffffff';
    mCtx.lineWidth = 1.5;
    mCtx.strokeRect(
      (camera.x - viewTilesW / 2) * scaleX,
      (camera.y - viewTilesH / 2) * scaleY,
      viewTilesW * scaleX,
      viewTilesH * scaleY
    );
  }

  // 퀘스트 타겟 천공 빔 & 비컨
  drawQuestBeacon(ctx, ts, timeSec, q) {
    const bx = Math.round(q.targetX * ts);
    const by = Math.round(q.targetY * ts);

    // 지면 황금 펄스 링
    const pulse = (Math.sin(timeSec * 4) + 1) * 0.5;
    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(bx, by, 16 + pulse * 14, 0, Math.PI * 2);
    ctx.stroke();

    // 수직 빛기둥 (천공의 빔)
    const grad = ctx.createLinearGradient(bx, by, bx, by - 120);
    grad.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
    grad.addColorStop(1, 'rgba(250, 204, 21, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(bx - 6, by - 120, 12, 120);

    // 상공 퀘스트 마커 배지
    const bobY = Math.round(Math.sin(timeSec * 5) * 4);
    ctx.font = 'bold 12px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(bx - 45, by - 52 + bobY, 90, 22);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx - 45, by - 52 + bobY, 90, 22);
    ctx.fillStyle = '#fde047';
    ctx.fillText(`⭐ ${q.category}`, bx, by - 37 + bobY);
    ctx.restore();
  }

  // 화면 나침반 네비게이션 가이드 화살표
  drawQuestNavigationCompass(ctx, camera, cw, ch, timeSec, p, q) {
    const distTiles = Math.hypot(q.targetX - p.x, q.targetY - p.y);
    if (distTiles < 3.2) return; // 목표에 매우 근접 시 나침반 숨김

    // 플레이어의 현재 화면 좌표
    const px = cw / 2 + (p.x - camera.x) * (TILE_SIZE * camera.zoom);
    const py = ch / 2 + (p.y - camera.y) * (TILE_SIZE * camera.zoom);

    const angle = Math.atan2(q.targetY - p.y, q.targetX - p.x);
    const orbitR = 48;
    const arrowX = px + Math.cos(angle) * orbitR;
    const arrowY = py + Math.sin(angle) * orbitR;

    // 화면 영역 내부일 때만 화살표 렌더링
    if (arrowX >= 25 && arrowX <= cw - 25 && arrowY >= 25 && arrowY <= ch - 25) {
      ctx.save();
      ctx.translate(arrowX, arrowY);
      ctx.rotate(angle);

      // 황금빛 픽셀 화살표
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(-7, -6);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-7, 6);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 거리 텍스트 배지
      ctx.save();
      ctx.font = 'bold 10px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(arrowX - 22, arrowY + 12, 44, 15);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      ctx.strokeRect(arrowX - 22, arrowY + 12, 44, 15);
      ctx.fillStyle = '#fde047';
      ctx.fillText(`${Math.round(distTiles * 10)}m`, arrowX, arrowY + 23);
      ctx.restore();
    }
  }

  // 플레이어 영지 건축 구조물 (타워, 부두, 성채, 대농장) 픽셀아트 렌더링
  drawPlayerStructures(ctx, ts, timeSec, zoom) {
    if (!this.entityMgr.rpgManager) return;
    for (const s of this.entityMgr.rpgManager.structures) {
      const px = Math.round(s.x * ts);
      const py = Math.round(s.y * ts);
      const bw = Math.round(s.w * ts);
      const bh = Math.round(s.h * ts);

      // 바닥 픽셀 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(px - bw / 2 + 2, py + bh / 2, bw - 2, 4);

      if (s.type === 'tower') {
        // 감시탑 본체
        ctx.fillStyle = '#475569';
        ctx.fillRect(px - 10, py - 26, 20, 26);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px - 8, py - 24, 16, 22);

        // 흉벽 (Battlements)
        ctx.fillStyle = '#334155';
        ctx.fillRect(px - 12, py - 32, 24, 6);
        ctx.fillRect(px - 12, py - 36, 6, 4);
        ctx.fillRect(px - 2, py - 36, 4, 4);
        ctx.fillRect(px + 6, py - 36, 6, 4);

        // 탑 위의 궁수
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px - 3, py - 42, 6, 7);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + 2, py - 44, 2, 8); // 활

        // 펄럭이는 깃발
        const flagWave = Math.round(Math.sin(timeSec * 5 + s.x) * 2);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(px - 14, py - 46, 8 + flagWave, 5);
      } else if (s.type === 'dock') {
        // 목재 부두 데크
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
        ctx.fillStyle = '#b45309';
        for (let i = 0; i < s.w; i++) {
          ctx.fillRect(px - bw / 2 + i * ts + 2, py - bh / 2 + 2, ts - 4, bh - 4);
        }
        // 계류 볼라드 & 램프
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px - bw / 2 + 3, py - bh / 2 - 4, 4, 6);
        ctx.fillRect(px + bw / 2 - 7, py - bh / 2 - 4, 4, 6);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(px - bw / 2 + 4, py - bh / 2 - 6, 2, 2);
      } else if (s.type === 'citadel') {
        // 영지 왕실 성채 (4대 타워 & 중앙 천수각)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
        ctx.fillStyle = '#334155';
        ctx.fillRect(px - bw / 2 + 4, py - bh / 2 + 4, bw - 8, bh - 8);

        // 중앙 성채 지붕 & 황금 깃발
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(px - 16, py - bh / 2);
        ctx.lineTo(px, py - bh / 2 - 20);
        ctx.lineTo(px + 16, py - bh / 2);
        ctx.closePath();
        ctx.fill();

        // 황금 사자 깃발
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(px - 1, py - bh / 2 - 28, 2, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + 1, py - bh / 2 - 28, 10, 6);
      } else {
        // 대농장 & 풍차
        ctx.fillStyle = '#4d7c0f';
        ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px - 8, py - bh / 2 - 12, 16, 14); // 헛간

        // 회전 풍차 날개
        ctx.save();
        ctx.translate(px, py - bh / 2 - 12);
        ctx.rotate(timeSec * 2);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-2, -20, 4, 40);
        ctx.fillRect(-20, -2, 40, 4);
        ctx.restore();
      }

      // 라벨 및 체력
      if (zoom > 0.75) {
        ctx.font = 'bold 10px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 2.5;
        ctx.strokeText(s.name, px, py - Math.round(bh / 2) - 10);
        ctx.fillText(s.name, px, py - Math.round(bh / 2) - 10);
      }
    }
  }

  // 필드 보물상자 픽셀아트 렌더링
  drawTreasureChests(ctx, ts, timeSec, zoom) {
    if (!this.entityMgr.rpgManager) return;
    for (const c of this.entityMgr.rpgManager.treasureChests) {
      const cx = Math.round(c.x * ts);
      const cy = Math.round(c.y * ts);

      if (c.opened) {
        // 열린 보물상자
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx - 7, cy - 4, 14, 8);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 6, cy - 8, 12, 4);
      } else {
        // 미개봉 보물상자 (반짝이는 황금빛 테두리 & 자물쇠)
        ctx.fillStyle = '#b45309';
        ctx.fillRect(cx - 8, cy - 7, 16, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(cx - 8, cy - 2, 16, 2);
        ctx.fillRect(cx - 2, cy - 3, 4, 4);

        // 반짝임 파티클
        const sparkle = Math.sin(timeSec * 6 + c.x);
        if (sparkle > 0.6) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cx + 6, cy - 8, 2, 2);
        }
      }

      if (zoom > 0.8 && !c.opened) {
        ctx.font = 'bold 9.5px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 2.0;
        ctx.strokeText(c.name, cx, cy - 11);
        ctx.fillText(c.name, cx, cy - 11);
      }
    }
  }

  // 건축 모드 고스트 프리뷰 렌더링
  drawBuildPreview(ctx, ts, camera) {
    const rpg = this.entityMgr.rpgManager;
    if (!rpg || !rpg.isBuildModeActive || !this.mouseWorldTile) return;

    const tx = this.mouseWorldTile.x;
    const ty = this.mouseWorldTile.y;
    const def = (typeof STRUCTURE_DEFS !== 'undefined') ? STRUCTURE_DEFS[rpg.selectedBuildType] : null;
    if (!def) return;

    const check = rpg.canPlaceStructure(rpg.selectedBuildType, tx, ty);
    const px = Math.round(tx * ts);
    const py = Math.round(ty * ts);
    const bw = Math.round(def.w * ts);
    const bh = Math.round(def.h * ts);

    ctx.save();
    ctx.fillStyle = check.ok ? 'rgba(74, 222, 128, 0.35)' : 'rgba(239, 68, 68, 0.4)';
    ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
    ctx.strokeStyle = check.ok ? '#4ade80' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(px - bw / 2, py - bh / 2, bw, bh);

    ctx.font = 'bold 11px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = check.ok ? '#fef08a' : '#fca5a5';
    ctx.fillText(`${def.icon} ${def.name} (${def.cost}G)`, px, py - bh / 2 - 6);
    ctx.restore();
  }

  // 12.2. 채집 및 채광 자원 노드 픽셀아트 렌더링
  drawResourceNodes(ctx, ts, timeSec, zoom) {
    if (!this.world.resourceNodes) return;
    for (const n of this.world.resourceNodes) {
      if (n.amount <= 0) continue;
      const px = Math.round(n.x * ts);
      const py = Math.round(n.y * ts);
      const bob = Math.sin(timeSec * 3 + n.x) * 1.5;

      if (n.type === 'mine') {
        // 광맥 (미스릴 / 황금)
        ctx.fillStyle = '#64748b';
        ctx.fillRect(px - 6, py - 4, 12, 8);
        ctx.fillStyle = n.resource === 'gold' ? '#facc15' : '#38bdf8';
        ctx.fillRect(px - 3, py - 7, 6, 6);
        ctx.fillRect(px + 2, py - 2, 4, 4);
        if (Math.sin(timeSec * 5 + n.y) > 0.5) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px - 1, py - 6, 2, 2);
        }
      } else if (n.type === 'tree') {
        // 고대 참나무
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px - 2, py - 2, 4, 7);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(px, py - 6, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(px - 2, py - 8, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (n.type === 'herb') {
        // 세계수 영약초
        ctx.fillStyle = '#10b981';
        ctx.fillRect(px - 1, py - 3, 2, 6);
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(px, py - 5 + bob, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(px - 1, py - 6 + bob, 2, 2);
      } else if (n.type === 'clam') {
        // 심해 진주조개
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(px, py - 2, 6, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (zoom > 0.85) {
        ctx.font = 'bold 9px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 2;
        ctx.strokeText(n.name, px, py - 11);
        ctx.fillText(n.name, px, py - 11);
      }
    }
  }

  // 12.3. 펫 컴패니언 렌더링
  drawPetCompanion(ctx, ts, timeSec, zoom) {
    const pet = this.entityMgr.pet;
    if (!pet || !pet.active) return;
    const px = Math.round(pet.x * ts);
    const py = Math.round(pet.y * ts);
    const flap = Math.round(Math.sin(timeSec * 10) * 3);

    // 아기 비룡 본체
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(px - 4, py - 4, 8, 8);
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(px + 2, py - 6, 4, 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + 4, py - 5, 2, 2);

    // 날개
    ctx.fillStyle = '#fda4af';
    ctx.fillRect(px - 2, py - 8 - flap, 5, 4);
    ctx.fillRect(px - 5, py - 8 - flap, 3, 3);

    // 꼬리
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(px - 6, py + 1, 3, 3);

    // 반짝이는 마력 스파크 파티클
    ctx.fillStyle = '#facc15';
    const spX = px + Math.sin(timeSec * 8) * 6;
    const spY = py + Math.cos(timeSec * 8) * 6;
    ctx.fillRect(Math.round(spX), Math.round(spY), 2, 2);

    if (zoom > 0.7) {
      ctx.font = 'bold 9px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f472b6';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.lineWidth = 2;
      ctx.strokeText(pet.name, px, py - 11);
      ctx.fillText(pet.name, px, py - 11);
    }
  }

  // 12.4. 밤/황혼 동적 2D 조명 (Dynamic Lighting & Lighthouse Beam)
  drawDynamicLighting(ctx, ts, timeSec, camera, worldTime) {
    const isNight = worldTime.hour >= 18 || worldTime.hour < 6;
    if (!isNight) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 1. 플레이어 랜턴 따뜻한 호박색 조명
    const p = this.entityMgr.player;
    if (p) {
      const px = Math.round(p.x * ts);
      const py = Math.round(p.y * ts);
      const grad = ctx.createRadialGradient(px, py, 2, px, py, 55);
      grad.addColorStop(0, 'rgba(253, 224, 71, 0.45)');
      grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.20)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, 55, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. 외딴 등대섬 (lone_beacon) 회전 등대 빔 서치라이트
    const lb = this.world.settlementMap.lone_beacon;
    if (lb) {
      const bx = Math.round(lb.x * ts);
      const by = Math.round(lb.y * ts);
      const beamAngle = timeSec * 1.4;
      const beamLen = 140;

      ctx.save();
      ctx.translate(bx, by - 12);
      ctx.rotate(beamAngle);

      const beamGrad = ctx.createRadialGradient(0, 0, 2, beamLen, 0, beamLen * 0.4);
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
      beamGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.25)');
      beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(0, -3);
      ctx.lineTo(beamLen, -25);
      ctx.lineTo(beamLen, 25);
      ctx.lineTo(0, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const lGrad = ctx.createRadialGradient(bx, by - 12, 1, bx, by - 12, 45);
      lGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      lGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = lGrad;
      ctx.beginPath();
      ctx.arc(bx, by - 12, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. 주요 도시 거점 가로등/성화 조명
    for (const s of this.world.settlements) {
      if (Math.abs(s.x - camera.x) > 30 || Math.abs(s.y - camera.y) > 25) continue;
      const sx = Math.round(s.x * ts);
      const sy = Math.round(s.y * ts);
      const sGrad = ctx.createRadialGradient(sx, sy, 2, sx, sy, 35);
      sGrad.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
      sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, 35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

window.WorldRenderer = WorldRenderer;
