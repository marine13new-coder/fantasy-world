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

    // 🖥️ Hi-DPI 초고해상도 레티나 스케일링 계수
    this.dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.5) : 1;

    // 🌸 대기 환경 파티클 (꽃잎, 반딧불이, 단풍잎, 눈꽃 결정, 화산 불꽃재, 수면 반짝임)
    this.ambientParticles = [];
    for (let i = 0; i < 110; i++) {
      let pType = 'petal';
      let pColor = '#f472b6';
      if (i < 25) { pType = 'petal'; pColor = Math.random() > 0.4 ? '#f472b6' : '#ffffff'; }
      else if (i < 45) { pType = 'firefly'; pColor = '#bef264'; }
      else if (i < 65) { pType = 'leaf'; pColor = Math.random() > 0.5 ? '#ea580c' : '#d97706'; }
      else if (i < 85) { pType = 'snow'; pColor = '#f8fafc'; }
      else if (i < 98) { pType = 'ash'; pColor = Math.random() > 0.5 ? '#f97316' : '#ef4444'; }
      else { pType = 'shimmer'; pColor = '#ffffff'; }

      this.ambientParticles.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        vx: (pType === 'snow' || pType === 'ash') ? (-0.5 + Math.random()) * 0.8 : (0.6 + Math.random() * 1.6),
        vy: (pType === 'snow' || pType === 'leaf') ? (0.8 + Math.random() * 1.2) : (pType === 'ash' ? (-0.8 - Math.random() * 1.0) : (0.2 + Math.random() * 0.7)),
        size: (pType === 'leaf') ? (3 + Math.random() * 2) : (2 + Math.random() * 2),
        type: pType,
        phase: Math.random() * Math.PI * 2,
        color: pColor
      });
    }

    this.screenFlashTimer = 0;
    this.screenFlashColor = '#ffffff';

    this.bakeStaticTerrain();
  }

  // ☀️ 실시간 태양 궤적에 따른 다이내믹 투영 그림자 벡터 (Dynamic Sun Angle Shadows)
  getSunShadowOffset(worldTime) {
    if (!worldTime) return { dx: 6, dy: 6, alpha: 0.35, stretch: 1.0 };
    const h = worldTime.hour + (worldTime.minute || 0) / 60;
    let dx = 0;
    let dy = 5;
    let alpha = 0.35;
    let stretch = 1.0;

    if (h >= 5.5 && h < 18.5) {
      const sunRatio = (h - 5.5) / 13; // 0 (Dawn) to 1 (Dusk)
      dx = Math.round((sunRatio - 0.5) * 26);
      const noonDist = Math.abs(h - 12);
      dy = Math.round(3 + noonDist * 0.6);
      stretch = 0.85 + noonDist * 0.08;
      alpha = Math.max(0.2, 0.44 - noonDist * 0.025);
    } else {
      dx = 4;
      dy = 4;
      alpha = 0.20;
      stretch = 0.75;
    }
    return { dx, dy, alpha, stretch };
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

    // 3. 미니맵 베이스에 300개 정착지 거점 아이콘 사전 베이킹 (초당 300회 beginPath 제거)
    if (this.world && this.world.settlements) {
      const scaleX = mw / width;
      const scaleY = mh / height;
      for (const s of this.world.settlements) {
        mCtx.fillStyle = s.faction === 'monster' ? '#dc2626' : '#fde047';
        mCtx.beginPath();
        mCtx.arc(s.x * scaleX, s.y * scaleY, 2.5, 0, Math.PI * 2);
        mCtx.fill();
        mCtx.strokeStyle = '#000000';
        mCtx.lineWidth = 0.8;
        mCtx.stroke();
      }
    }
  }

  render(camera, worldTime, filterCategory, selectedItem, timeSec) {
    const ctx = this.ctx;
    const dpr = this.dpr || 1;
    const { width: cw, height: ch } = this.canvas;
    const ts = TILE_SIZE;

    this.lastWorldTime = worldTime;
    this.lastCameraZoom = camera.zoom;
    ctx.imageSmoothingEnabled = false; // 픽셀 아트 레더링 유지

    if (this.screenFlashTimer > 0) {
      this.screenFlashTimer = Math.max(0, this.screenFlashTimer - 0.016);
    }

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#061320';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    const shakeMag = camera.shake || 0;
    const shakeX = shakeMag > 0 ? (Math.random() - 0.5) * shakeMag * 2 : 0;
    const shakeY = shakeMag > 0 ? (Math.random() - 0.5) * shakeMag * 2 : 0;
    const effectiveZoom = camera.zoom * (1 + (camera.zoomPulse || 0) * 0.06);
    ctx.translate(cw / 2 + shakeX * dpr, ch / 2 + shakeY * dpr);
    ctx.scale(effectiveZoom * dpr, effectiveZoom * dpr);
    ctx.translate(-camera.x * ts, -camera.y * ts);

    // 뷰포트 컬링 바운드 (Hi-DPI dpr 반영)
    const halfW = (cw / (2 * dpr) / camera.zoom) / ts + 4;
    const halfH = (ch / (2 * dpr) / camera.zoom) / ts + 4;
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
      if (worldTime && (worldTime.weather === 'rain' || worldTime.weather === 'storm')) {
        this.drawRainPuddles(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec);
      }
    }

    // 2. 동적 해안선 픽셀 파도 거품 애니메이션 & 대양 백색 포말 물결 & 수면 거울 반사 & 다이아몬드 코스틱 굴절광
    if (camera.zoom > 0.36) {
      this.drawPixelShorelines(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec);
      this.drawOceanFoam(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec);
      this.drawWaterCaustics(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec);
      if (worldTime && (worldTime.weather === 'rain' || worldTime.weather === 'storm')) {
        this.drawWaterDropletRipples(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec);
      }
      this.drawWaterReflections(ctx, ts, timeSec, minTx, maxTx, minTy, maxTy);
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
      if (camera.zoom > 0.35) {
        this.drawBioluminescentSprites(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec);
      }
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

    // 8.4. 🩸 다크 판타지 영구 지속 지면 전투 혈흔 및 그을음 데칼
    this.drawGroundDecals(ctx, ts, minTx, maxTx, minTy, maxTy);

    // 8.5. ⚠️ 보스/엘리트 공격 전조 위험 장판 (Telegraphed Hazard Zones)
    this.drawHazardZones(ctx, ts, timeSec, minTx, maxTx, minTy, maxTy);

    // 8.6. 💥 방사형 충격파 링 (Expanding Shockwaves)
    this.drawShockwaves(ctx, ts);

    // 8.7. ⚔️ 무기 궤적 슬래시 리본 아크 (Melee Weapon Arc Trails)
    this.drawWeaponSlashArcs(ctx, ts);

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

    // 9.5. ⚡ 인챈트 무기 원소 오라 & 회전 위스프 (Enchanted Weapon Aura)
    this.drawEnchantedWeaponAura(ctx, ts, timeSec);

    // 9.6. ⚡ 플레이어 기 모으기 차징 오라 (Charge Aura)
    this.drawPlayerChargeAura(ctx, ts, timeSec);

    // 9.7. 🏹 원거리 활 차징 조준 탄도 궤적선 (Bow Aiming Trajectory)
    this.drawAimingTrajectory(ctx, this.entityMgr.player, ts, timeSec);

    // 10. 투사체 (관통 화살, 대포알, 마법탄)
    for (const p of this.entityMgr.projectiles) {
      if (p.isArrow) {
        this.drawPixelArrow(ctx, p, ts);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x * ts - 3), Math.round(p.y * ts - 11), 6, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(p.x * ts - 1), Math.round(p.y * ts - 9), 2, 2);
      }
    }

    // 10.5. 픽셀 히트 스파크 & 레벨업 스타버스트 파티클 (Batched)
    if (this.entityMgr.sparkParticles && this.entityMgr.sparkParticles.length > 0) {
      ctx.save();
      for (const sp of this.entityMgr.sparkParticles) {
        if (sp.x < minTx || sp.x > maxTx || sp.y < minTy || sp.y > maxTy) continue;
        const alpha = Math.max(0, 1 - sp.age / sp.duration);
        if (alpha <= 0.02) continue;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = sp.color;
        const spx = Math.round(sp.x * ts);
        const spy = Math.round(sp.y * ts);
        ctx.fillRect(spx - sp.size / 2, spy - sp.size / 2, sp.size, sp.size);
      }
      ctx.restore();
    }

    // 10.5. 💎 필드 발자국 & 전리품 드롭 & 수면 파문 & 대시 잔상 & 오버헤드 16비트 전투 체력바
    if (camera.zoom > 0.30) {
      this.drawFootprints(ctx, ts, minTx, maxTx, minTy, maxTy);
      this.drawDroppedLoot(ctx, ts, timeSec, minTx, maxTx, minTy, maxTy);
      this.drawWaterWadingRipples(ctx, ts, timeSec, minTx, maxTx, minTy, maxTy);
      this.drawWaterWakes(ctx, ts, timeSec, minTx, maxTx, minTy, maxTy);
      this.drawGrassDebris(ctx, ts);
      this.drawDeadRemains(ctx, ts, minTx, maxTx, minTy, maxTy);
      this.drawDustPuffs(ctx, ts);
      this.drawTreasureExcavationSite(ctx, ts, timeSec);
      this.drawDashGhostTrails(ctx, ts);
      this.drawShadowDecoys(ctx, ts, timeSec);
      this.drawFalconFamiliar(ctx, ts, timeSec);
      this.drawFireflies(ctx, ts, timeSec, cw, ch);
      this.drawEntityCombatHUD(ctx, ts, camera.zoom, minTx, maxTx, minTy, maxTy);
    }

    // 11. 플로팅 텍스트 (바운시 팝 & 크리티컬 하이라이트)
    if (camera.zoom > 0.30) {
      ctx.textAlign = 'center';
      for (const ft of this.entityMgr.floatingTexts) {
        if (ft.x < minTx || ft.x > maxTx || ft.y < minTy || ft.y > maxTy) continue;
        const progress = Math.min(1, ft.age / ft.duration);
        const alpha = Math.max(0, 1 - progress);
        const isCrit = ft.text.includes('CRIT') || ft.text.includes('피니셔') || ft.text.includes('LEVEL UP');
        const popScale = isCrit ? Math.max(1, 1.4 - progress * 0.4) : Math.max(1, 1.2 - progress * 0.2);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = isCrit ? 'bold 15px Pretendard, sans-serif' : 'bold 12px Pretendard, sans-serif';
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = isCrit ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = isCrit ? 4 : 3;

        // 부드럽게 튀어 오르는 포물선 바운스 궤적
        const rise = Math.sin(progress * Math.PI * 0.5) * 28;
        const ty = Math.round(ft.y * ts - rise);
        const tx = Math.round(ft.x * ts);

        ctx.strokeText(ft.text, tx, ty);
        ctx.fillText(ft.text, tx, ty);
        ctx.restore();
      }
    }

    // 12. 거점 이름표
    this.drawSettlementLabels(ctx, ts, camera.zoom, selectedItem);

    // 12.1. 플레이어 건축 구조물 (방어타워, 선착장, 성채, 대농장) & 보물상자
    if (this.entityMgr.rpgManager) {
      this.drawPlayerStructures(ctx, ts, timeSec, camera.zoom);
      this.drawTreasureChests(ctx, ts, timeSec, camera.zoom);
      this.drawAncientShrines(ctx, ts, timeSec, camera.zoom);
      this.drawDungeonPortals(ctx, ts, timeSec, camera.zoom);
      this.drawMonolithSteles(ctx, ts, timeSec, camera.zoom);
      this.drawBossArenaBarrier(ctx, ts, timeSec, camera.zoom);
      this.drawBuildPreview(ctx, ts, camera);
    }

    // 12.2. 채집 및 채광 자원 노드 (Resource Nodes)
    this.drawResourceNodes(ctx, ts, timeSec, camera.zoom);

    // 12.3. 펫 컴패니언 (Pet Companion)
    this.drawPetCompanion(ctx, ts, timeSec, camera.zoom);

    // 12.35. ☁️ 대륙 대기 입체 구름 그림자 (Volumetric Cloud Shadows)
    this.drawCloudShadows(ctx, ts, timeSec, camera, worldTime, minTx, maxTx, minTy, maxTy);

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

    // 13.1. ⚡ 불릿 타임 (Witch Time) 시공간 왜곡 스피드 비네트
    this.drawWitchTimeVignette(ctx, cw, ch, timeSec);

    // 13.2. 🌌 북극광 오로라 커튼 (Celestial Northern Aurora Borealis)
    this.drawAuroraBorealis(ctx, cw, ch, timeSec, worldTime, camera);

    // 13.2-B. 🌌 고해상도 밤하늘 성운 & 항성계 (Dynamic Celestial Night Sky & Cosmic Nebula)
    this.drawCelestialNightSky(ctx, cw, ch, timeSec, worldTime, camera);

    // 13.3. ☀️ 대기 볼류메트릭 갓레이 (God Rays / Volumetric Sunbeams)
    this.drawVolumetricGodRays(ctx, cw, ch, timeSec, worldTime);

    // 13.5. 🌸 대기 환경 부유 파티클 (꽃잎, 밤 반딧불이, 사막 먼지, 불꽃, 수면 반짝임)
    this.drawAtmosphericParticles(ctx, cw, ch, timeSec, camera, worldTime);

    // 13.8. 🎬 다크 판타지 시네마틱 비네트 & 콘트라스트 렌즈 림 (Cinematic Vignette Rim)
    this.drawCinematicVignette(ctx, cw, ch);

    // 13.9. 🔥 연속 킬스트릭 피버 모드 화면 테두리 화염 (Killstreak Fever Rim)
    this.drawKillstreakFeverRim(ctx, cw, ch, timeSec, this.entityMgr.player);

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

        // B. [CUTE FANTASY 스타일] 따뜻한 오솔길 & 스캘럽 픽셀 에지 & 조약돌 (Scalloped Dirt Road)
        if (t === TILE.ROAD) {
          const tUp = ty > 0 ? tiles[(ty - 1) * width + tx] : t;
          const tDown = ty < height - 1 ? tiles[(ty + 1) * width + tx] : t;
          const tLeft = tx > 0 ? tiles[ty * width + (tx - 1)] : t;
          const tRight = tx < width - 1 ? tiles[ty * width + (tx + 1)] : t;

          // 1. 따뜻한 모래흙길 바닥 질감 (Warm Sandstone Dirt Base)
          ctx.fillStyle = '#df9c68';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#f1c597';
          ctx.fillRect(px + 4, py + 4, ts - 8, ts - 8);

          // 2. 잔디와 맞닿는 경계면의 스캘럽(Scalloped) 둥근 톱니 픽셀 에지 및 1px 짙은 외곽선
          const edgeCol = '#1a4724'; // 짙은 에메랄드 외곽선 (Cute Fantasy Outlines)
          const toothCol = '#4bb352'; // 잔디 색상

          if (tUp === TILE.GRASS || tUp === TILE.MEADOW) {
            ctx.fillStyle = edgeCol;
            ctx.fillRect(px, py, ts, 2);
            ctx.fillStyle = toothCol;
            ctx.fillRect(px + 2, py, 6, 4);
            ctx.fillRect(px + 12, py, 8, 3);
            ctx.fillRect(px + 24, py, 6, 4);
            ctx.fillStyle = edgeCol;
            ctx.fillRect(px + 2, py + 4, 6, 1);
            ctx.fillRect(px + 12, py + 3, 8, 1);
            ctx.fillRect(px + 24, py + 4, 6, 1);
          }
          if (tDown === TILE.GRASS || tDown === TILE.MEADOW) {
            ctx.fillStyle = edgeCol;
            ctx.fillRect(px, py + ts - 2, ts, 2);
            ctx.fillStyle = toothCol;
            ctx.fillRect(px + 4, py + ts - 4, 7, 4);
            ctx.fillRect(px + 15, py + ts - 5, 8, 5);
            ctx.fillRect(px + 26, py + ts - 3, 5, 3);
            ctx.fillStyle = edgeCol;
            ctx.fillRect(px + 4, py + ts - 5, 7, 1);
            ctx.fillRect(px + 15, py + ts - 6, 8, 1);
            ctx.fillRect(px + 26, py + ts - 4, 5, 1);
          }
          if (tLeft === TILE.GRASS || tLeft === TILE.MEADOW) {
            ctx.fillStyle = edgeCol;
            ctx.fillRect(px, py, 2, ts);
            ctx.fillStyle = toothCol;
            ctx.fillRect(px, py + 3, 4, 7);
            ctx.fillRect(px, py + 16, 5, 8);
            ctx.fillStyle = edgeCol;
            ctx.fillRect(px + 4, py + 3, 1, 7);
            ctx.fillRect(px + 5, py + 16, 1, 8);
          }
          if (tRight === TILE.GRASS || tRight === TILE.MEADOW) {
            ctx.fillStyle = edgeCol;
            ctx.fillRect(px + ts - 2, py, 2, ts);
            ctx.fillStyle = toothCol;
            ctx.fillRect(px + ts - 4, py + 6, 4, 8);
            ctx.fillRect(px + ts - 5, py + 19, 5, 7);
            ctx.fillStyle = edgeCol;
            ctx.fillRect(px + ts - 5, py + 6, 1, 8);
            ctx.fillRect(px + ts - 6, py + 19, 1, 7);
          }

          // 3. 길 위에 흩뿌려진 귀여운 둥근 조약돌 (Cute Rounded Pebbles with Highlights & Shadows)
          if ((h % 5) === 0) {
            const rx = px + ((h >> 2) % 20) + 6;
            const ry = py + ((h >> 4) % 20) + 6;
            // 그림자
            ctx.fillStyle = '#8c5830';
            ctx.fillRect(rx - 1, ry + 3, 5, 2);
            // 본체
            ctx.fillStyle = '#64748b';
            ctx.fillRect(rx, ry, 4, 3);
            // 상단 하이라이트
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(rx + 1, ry, 2, 1);
          }
        }

        // C. 정착지 중앙 광장 성채 석판 바닥 (Cobblestone Plaza)
        if (t === TILE.CASTLE_FLOOR) {
          ctx.fillStyle = '#475569'; // 줄눈
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

        // D. [CUTE FANTASY 스타일] 울창한 에메랄드 잔디 & 4잎 핑크 야생화 & 버터컵 꽃밭
        if ((t === TILE.GRASS || t === TILE.MEADOW) && (!this.lastCameraZoom || this.lastCameraZoom >= 0.38)) {
          // 3가닥 짙은 녹색 풀잎 클러스터 (동적 바람 흔들림 + 발걸음 짓밟힘 인터랙션 Displacement)
          if ((h % 4) === 0) {
            const gx = px + (h % 22) + 5;
            const gy = py + ((h >> 2) % 22) + 5;

            // 🌿 바람 살랑임
            const windSway = Math.sin(timeSec * 2.4 + tx * 0.5 + ty * 0.3) * 1.5;

            // 👣 플레이어 짓밟힘 반발력 (Interactive Grass Trampling Displacement)
            let trBendX = 0;
            let trBendY = 0;
            const p = this.entityMgr ? this.entityMgr.player : null;
            if (p) {
              const pdx = (tx + 0.5) - p.x;
              const pdy = (ty + 0.5) - p.y;
              if (Math.abs(pdx) < 1.35 && Math.abs(pdy) < 1.35) {
                const pdist = Math.hypot(pdx, pdy);
                if (pdist < 1.35) {
                  const trFactor = (1.35 - pdist) / 1.35;
                  trBendX = (pdx >= 0 ? 1 : -1) * trFactor * 3.5;
                  trBendY = (pdy >= 0 ? 1 : -1) * trFactor * 2.2;
                }
              }
            }

            const bx = Math.round(gx + windSway + trBendX);
            const by = Math.round(gy + trBendY);

            ctx.fillStyle = '#1e3a1f';
            ctx.fillRect(bx, by + 1, 1, 3);
            ctx.fillRect(bx + 2, by, 1, 4);
            ctx.fillRect(bx + 4, by + 2, 1, 2);
            ctx.fillStyle = '#4ade80';
            ctx.fillRect(bx + 2, by, 1, 1);
          }

          // 🌸 귀여운 4잎 핑크 꽃 & 노란 버터컵 & 하얀 데이지 (Reference Image Match)
          if ((h & 7) === 0) {
            const fx = px + ((h >> 3) % 22) + 5;
            const fy = py + ((h >> 5) % 22) + 5;
            const ftype = (h >> 2) % 4;

            if (ftype === 0 || ftype === 1) {
              // 🌸 시그니처 4잎 핑크 꽃 (중앙 황금 화심)
              ctx.fillStyle = '#f472b6'; // 분홍 꽃잎 4개
              ctx.fillRect(fx - 2, fy, 5, 2);
              ctx.fillRect(fx, fy - 2, 2, 5);
              ctx.fillStyle = '#fde047'; // 황금 꽃술
              ctx.fillRect(fx, fy, 2, 2);
              // 꽃받침 줄기
              ctx.fillStyle = '#166534';
              ctx.fillRect(fx, fy + 3, 1, 2);
            } else if (ftype === 2) {
              // 🌼 화사한 노란 버터컵 / 민들레
              ctx.fillStyle = '#facc15';
              ctx.fillRect(fx - 1, fy - 1, 3, 3);
              ctx.fillStyle = '#fef08a';
              ctx.fillRect(fx, fy, 1, 1);
              ctx.fillStyle = '#15803d';
              ctx.fillRect(fx, fy + 2, 1, 2);
            } else {
              // 💜 신비로운 보랏빛 라벤더 / 벨플라워
              ctx.fillStyle = '#c084fc';
              ctx.fillRect(fx - 1, fy - 2, 3, 3);
              ctx.fillStyle = '#a855f7';
              ctx.fillRect(fx, fy - 1, 1, 3);
              ctx.fillStyle = '#15803d';
              ctx.fillRect(fx, fy + 2, 1, 2);
            }
          }
        }

        // E. [CUTE FANTASY 스타일] 비옥한 텃밭 농경지 & 당근/양배추/가지/옥수수 작물 & 나무 울타리
        if (t === TILE.FARMLAND) {
          // 갈아엎은 흙 이랑 (Tilled Soil Furrows)
          ctx.fillStyle = '#8b4513';
          ctx.fillRect(px, py + 4, ts, 2);
          ctx.fillRect(px, py + 12, ts, 2);
          ctx.fillRect(px, py + 20, ts, 2);
          ctx.fillRect(px, py + 28, ts, 2);

          // 이랑 위에 심어진 탐스러운 채소 작물들
          const ctype = (tx + ty) % 4;
          for (let cx = 4; cx <= 24; cx += 10) {
            const cy = 6 + (cx % 3) * 8;
            if (ctype === 0) {
              // 🥕 당근: 흙 밖으로 솟은 주황 당근 어깨 + 싱싱한 초록 잎사귀
              ctx.fillStyle = '#f97316';
              ctx.fillRect(px + cx, py + cy + 1, 4, 3);
              ctx.fillStyle = '#22c55e';
              ctx.fillRect(px + cx - 1, py + cy - 2, 6, 2);
              ctx.fillRect(px + cx + 1, py + cy - 4, 2, 2);
            } else if (ctype === 1) {
              // 🥬 동글동글 싱싱한 양배추
              ctx.fillStyle = '#16a34a';
              ctx.fillRect(px + cx - 1, py + cy - 1, 6, 5);
              ctx.fillStyle = '#86efac';
              ctx.fillRect(px + cx, py + cy, 4, 3);
              ctx.fillStyle = '#4ade80';
              ctx.fillRect(px + cx + 1, py + cy + 1, 2, 1);
            } else if (ctype === 2) {
              // 🍆 보랏빛 가지 / 무 (Purple Turnip)
              ctx.fillStyle = '#7e22ce';
              ctx.fillRect(px + cx, py + cy, 5, 4);
              ctx.fillStyle = '#c084fc';
              ctx.fillRect(px + cx + 1, py + cy + 1, 2, 2);
              ctx.fillStyle = '#22c55e';
              ctx.fillRect(px + cx + 1, py + cy - 2, 3, 2);
            } else {
              // 🌽 황금 옥수수 대
              ctx.fillStyle = '#15803d';
              ctx.fillRect(px + cx + 1, py + cy - 5, 2, 9);
              ctx.fillStyle = '#facc15';
              ctx.fillRect(px + cx, py + cy - 3, 4, 4);
              ctx.fillStyle = '#fef08a';
              ctx.fillRect(px + cx + 1, py + cy - 2, 2, 2);
            }
          }

          // 농작물 푯말 (Crop Signpost)
          if ((h % 9) === 0) {
            const sx = px + 2;
            const sy = py + ts - 12;
            // 나무 기둥
            ctx.fillStyle = '#78350f';
            ctx.fillRect(sx + 3, sy + 4, 2, 8);
            // 사각 푯말
            ctx.fillStyle = '#92400e';
            ctx.fillRect(sx, sy, 8, 6);
            ctx.fillStyle = '#b45309';
            ctx.fillRect(sx + 1, sy + 1, 6, 4);
            // 아이콘 점
            ctx.fillStyle = '#f97316';
            ctx.fillRect(sx + 2, sy + 2, 3, 2);
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

        // G. 🌌 천공의 부유 군도 / 에테르 수정 (Celestial Aether Crystals & Starlight Shimmer)
        if (t === TILE.CORAL || t === TILE.CRYSTAL_CAVE) {
          const crystalPhase = (timeSec * 2.5 + tx * 0.7 + ty * 0.5) % (Math.PI * 2);
          const glowAlpha = 0.35 + Math.sin(crystalPhase) * 0.25;
          const cx = px + (h % 14) + 9;
          const cy = py + ((h >> 3) % 14) + 9;

          // 보랏빛/청록빛 에테르 펄스 발광
          ctx.fillStyle = `rgba(168, 85, 247, ${glowAlpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fill();

          // 3D 픽셀 수정체 (Faceted Aether Crystal Shard)
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(cx - 2, cy - 4, 4, 8);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(cx - 1, cy - 3, 2, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(cx - 1, cy - 2, 1, 2);

          // 반짝이는 별빛 파티클
          if ((h % 3) === 0) {
            const sparkleX = px + ((h >> 5) % 24) + 4;
            const sparkleY = py + ((h >> 7) % 24) + 4;
            const spAlpha = Math.max(0, Math.sin(timeSec * 4.0 + tx + ty));
            ctx.fillStyle = `rgba(255, 255, 255, ${spAlpha})`;
            ctx.fillRect(sparkleX, sparkleY - 1, 1, 3);
            ctx.fillRect(sparkleX - 1, sparkleY, 3, 1);
          }
        }

        // H. 🌋 심연의 심층 단층 / 용암 균열 (Abyssal Magma Fissures & Molten Glow)
        if (t === TILE.LAVA || t === TILE.OBSIDIAN) {
          const lavaPhase = (timeSec * 1.8 + tx * 0.4 + ty * 0.6) % (Math.PI * 2);
          const heatAlpha = 0.4 + Math.sin(lavaPhase) * 0.3;
          
          // 마그마 지열 펄스
          ctx.fillStyle = `rgba(239, 68, 68, ${heatAlpha * 0.35})`;
          ctx.fillRect(px + 4, py + 4, ts - 8, ts - 8);

          // 용암 분출 크랙 (Molten Fissure Cracks)
          const fx = px + (h % 16) + 6;
          const fy = py + ((h >> 4) % 16) + 6;
          ctx.fillStyle = '#f97316';
          ctx.fillRect(fx, fy, 5, 2);
          ctx.fillRect(fx + 2, fy - 2, 2, 6);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(fx + 1, fy, 2, 1);

          // 상승하는 잉걸불 불티 (Rising Embers)
          if ((h % 4) === 0) {
            const emberY = (py + ts - ((timeSec * 18 + h) % ts));
            const emberX = px + ((h >> 2) % 24) + 4 + Math.sin(timeSec * 3 + ty) * 2;
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(emberX, emberY, 2, 2);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(emberX, emberY + 1, 2, 1);
          }
        }
      }
    }
  }

  // 🌲 [5.5] 16/32비트 고품질 픽셀 자연 식생 & 환경 소품 렌더러 (Images 1, 2, 3, 4, 5)
  // 🌲 [5.5] 16/32비트 고품질 픽셀 자연 식생 & 환경 소품 렌더러 (공간 청크 O(1) 초고속 컬링)
  drawDetailedPixelProps(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec) {
    const sh = this.getSunShadowOffset(this.lastWorldTime);

    // ⚡ 공간 청크(Spatial Chunks) 인덱싱이 있으면 뷰포트 범위 내 청크만 렌더링 (초당 수천 회 타일 검사 제거)
    if (this.world && this.world.propChunks) {
      const minCx = Math.floor(minTx / 32);
      const maxCx = Math.floor(maxTx / 32);
      const minCy = Math.floor(minTy / 32);
      const maxCy = Math.floor(maxTy / 32);

      for (let cy = minCy; cy <= maxCy; cy++) {
        for (let cx = minCx; cx <= maxCx; cx++) {
          const chunk = this.world.propChunks[`${cx}_${cy}`];
          if (!chunk) continue;
          for (let i = 0; i < chunk.length; i++) {
            const p = chunk[i];
            if (p.x < minTx || p.x > maxTx || p.y < minTy || p.y > maxTy) continue;
            this.drawSinglePixelProp(ctx, p.x, p.y, p.type, ts, timeSec, sh);
          }
        }
      }
      return;
    }

    // 하위 호환 폴백 (Fallback)
    const { width, deco } = this.world;
    if (!deco) return;
    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const d = deco[ty * width + tx];
        if (d) this.drawSinglePixelProp(ctx, tx, ty, d, ts, timeSec, sh);
      }
    }
  }

  drawSinglePixelProp(ctx, tx, ty, d, ts, timeSec, sh) {
    const px = tx * ts;
    const py = ty * ts;

    // 1. 실시간 태양각 다이내믹 드롭 섀도우 (Dynamic Sun-Tracking Drop Shadow)
    if (d === 1 || d === 2 || d === 6 || d === 7 || d === 8) {
      ctx.fillStyle = `rgba(15, 23, 42, ${sh.alpha})`;
      ctx.beginPath();
      ctx.ellipse(px + ts / 2 + sh.dx, py + ts / 2 + sh.dy, 15 * sh.stretch, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d === 4 || d === 9 || d === 10 || d === 12 || d === 13) {
      ctx.fillStyle = `rgba(15, 23, 42, ${sh.alpha * 0.9})`;
      ctx.beginPath();
      ctx.ellipse(px + ts / 2 + Math.round(sh.dx * 0.6), py + ts / 2 + Math.round(sh.dy * 0.8), 10 * sh.stretch, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 1.5. 기저부 미세 밀착 그림자 (Contact Ambient Occlusion - Zero-floating Grounding)
    if (d === 1 || d === 2 || d === 6 || d === 7 || d === 8) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.38)';
      ctx.fillRect(px + ts / 2 - 8, py + ts - 2, 16, 3);
    } else if (d === 4 || d === 9 || d === 10 || d === 12 || d === 13) {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.32)';
      ctx.fillRect(px + ts / 2 - 5, py + ts - 2, 10, 2);
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
            const sway = Math.round(Math.sin(timeSec * 2.2 + tx * 0.7) * 1.5);
            ctx.fillStyle = '#27190d';
            ctx.fillRect(cx - 3, cy - 8, 6, 8);

            const drawPineSkirt = (sy, w, h, skirtSway = 0) => {
              const topX = cx + skirtSway;
              ctx.fillStyle = '#064e3b';
              ctx.beginPath();
              ctx.moveTo(topX, sy - h);
              ctx.lineTo(cx - w, sy);
              ctx.lineTo(cx + w, sy);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#059669';
              ctx.beginPath();
              ctx.moveTo(topX, sy - h);
              ctx.lineTo(cx - w + 3, sy - 1);
              ctx.lineTo(cx + w - 3, sy - 1);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#34d399';
              ctx.fillRect(topX - 1, sy - h, 2, 2);
              ctx.fillRect(cx - w + 2, sy - 2, 2, 2);
              ctx.fillRect(cx + w - 4, sy - 2, 2, 2);
            };

            drawPineSkirt(cy - 6, 14, 10, 0);
            drawPineSkirt(cy - 13, 11, 9, Math.round(sway * 0.6));
            drawPineSkirt(cy - 20, 8, 8, sway);
            break;
          }

          case 3: {
            // 🌸 [야생화 무리] (Wildflower Patches - Wind Sway & Proximity Bending)
            let bendX = 0;
            if (this.entityMgr && this.entityMgr.player) {
              const p = this.entityMgr.player;
              const pDist = Math.hypot((tx + 0.5) - p.x, (ty + 0.5) - p.y);
              if (pDist < 1.25) {
                bendX = Math.round((p.vx !== 0 ? Math.sign(p.vx) : ((tx + 0.5) - p.x)) * 2.5);
              }
            }

            const flowers = [
              { ox: 6, oy: 8, col: '#facc15', cCol: '#ffffff' },
              { ox: 14, oy: 5, col: '#ffffff', cCol: '#facc15' },
              { ox: 22, oy: 9, col: '#f472b6', cCol: '#fef08a' },
              { ox: 9, oy: 18, col: '#f43f5e', cCol: '#ffffff' },
              { ox: 18, oy: 19, col: '#facc15', cCol: '#ffffff' },
              { ox: 25, oy: 16, col: '#ffffff', cCol: '#facc15' }
            ];
            for (const f of flowers) {
              const windSway = Math.sin(timeSec * 3.2 + tx * 0.7 + f.ox * 0.3);
              const fSway = Math.round(windSway * 1.2) + bendX;
              ctx.fillStyle = '#16a34a';
              ctx.fillRect(px + f.ox, py + f.oy + 2, 1, 3);
              ctx.fillStyle = f.col;
              ctx.fillRect(px + f.ox - 1 + fSway, py + f.oy - 1, 3, 3);
              ctx.fillStyle = f.cCol;
              ctx.fillRect(px + f.ox + fSway, py + f.oy, 1, 1);
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

            // 우천 시 바위 상단 젖은 표면 스페큘러 광택
            if (this.lastWorldTime && (this.lastWorldTime.weather === 'rain' || this.lastWorldTime.weather === 'storm')) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
              ctx.fillRect(bx + 6, by + 1, 12, 1.5);
            }
            ctx.fillStyle = '#65a30d';
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

  // 픽셀 해안선 파도 거품 애니메이션 & 수면 태양광 펄/윤슬 (Water Caustics & Shoreline Wave Foam)
  drawPixelShorelines(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec) {
    const wave = Math.floor((Math.sin(timeSec * 2.8) + 1) * 2); // 0, 1, 2, 3 정수 픽셀 스텝
    const isWater = (tile) => (tile === TILE.WATER || tile === TILE.DEEP_WATER || tile === TILE.OCEAN || tile === TILE.DEEP_OCEAN);

    const isDay = (this.lastWorldTime && this.lastWorldTime.hour >= 6 && this.lastWorldTime.hour < 18);
    const sunGlintAlpha = isDay ? (Math.sin(timeSec * 3.5) * 0.25 + 0.45) : (Math.sin(timeSec * 2.0) * 0.15 + 0.25);
    const glintColor = isDay ? `rgba(254, 240, 138, ${sunGlintAlpha})` : `rgba(186, 230, 253, ${sunGlintAlpha})`;

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const t = this.world.getTile(tx, ty);
        if (isWater(t)) {
          const px = tx * ts;
          const py = ty * ts;

          // 1. 대양 & 강변 윤슬 (Sun/Moon Glint Sparkles on water)
          const hash = (tx * 73 + ty * 37) & 63;
          if (hash === 7 || hash === 23 || hash === 41) {
            const sparkPhase = Math.sin(timeSec * 4.2 + tx * 0.8 + ty * 0.5);
            if (sparkPhase > 0.35) {
              const sx = px + (hash % (ts - 6)) + 3;
              const sy = py + ((hash >> 2) % (ts - 6)) + 3;
              ctx.fillStyle = glintColor;
              ctx.fillRect(sx, sy, 2, 2);
              if (sparkPhase > 0.75) {
                ctx.fillRect(sx - 1, sy, 4, 1);
                ctx.fillRect(sx, sy - 1, 1, 4);
              }
            }
          }

          // 2. 육지와 접하는 모든 방향 해안선 파도 포말 (Shoreline Foam)
          const tRight = this.world.getTile(tx + 1, ty);
          const tLeft = this.world.getTile(tx - 1, ty);
          const tDown = this.world.getTile(tx, ty + 1);
          const tUp = this.world.getTile(tx, ty - 1);

          ctx.fillStyle = 'rgba(240, 249, 255, 0.48)';

          if (tRight !== null && !isWater(tRight)) {
            ctx.fillRect(px + ts - 3 - wave, py + 2, 2, ts - 4);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.fillRect(px + ts - 5 - wave, py + 4, 1, ts - 8);
            ctx.fillStyle = 'rgba(240, 249, 255, 0.48)';
          }
          if (tLeft !== null && !isWater(tLeft)) {
            ctx.fillRect(px + 1 + wave, py + 2, 2, ts - 4);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.fillRect(px + 3 + wave, py + 4, 1, ts - 8);
            ctx.fillStyle = 'rgba(240, 249, 255, 0.48)';
          }
          if (tDown !== null && !isWater(tDown)) {
            ctx.fillRect(px + 2, py + ts - 3 - wave, ts - 4, 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.fillRect(px + 4, py + ts - 5 - wave, ts - 8, 1);
            ctx.fillStyle = 'rgba(240, 249, 255, 0.48)';
          }
          if (tUp !== null && !isWater(tUp)) {
            ctx.fillRect(px + 2, py + 1 + wave, ts - 4, 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
            ctx.fillRect(px + 4, py + 3 + wave, ts - 8, 1);
            ctx.fillStyle = 'rgba(240, 249, 255, 0.48)';
          }
        }
      }
    }
  }

  // 🧚 [3.2] 밤/숲 생체발광 반딧불이 & 마나 정령 렌더러 (Bioluminescent Fireflies & Spirit Wisps)
  drawBioluminescentSprites(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec) {
    const isNight = (this.lastWorldTime && (this.lastWorldTime.hour >= 19 || this.lastWorldTime.hour < 6));
    if (!isNight) return;

    for (let ty = minTy; ty <= maxTy; ty += 2) {
      for (let tx = minTx; tx <= maxTx; tx += 2) {
        const hash = (tx * 101 + ty * 47) & 127;
        if (hash < 12) { // 숲/수풀/습지 일대에 은은한 분산
          const t = this.world.getTile(tx, ty);
          if (t === TILE.WATER || t === TILE.DEEP_WATER || t === TILE.MOUNTAIN_HIGH || t === TILE.LAVA) continue;

          // 부드러운 3차원 유영 궤적
          const fOffX = Math.sin(timeSec * 1.8 + hash) * 14;
          const fOffY = Math.cos(timeSec * 2.2 + hash * 1.5) * 10 - Math.sin(timeSec * 0.8 + hash) * 6;
          const fx = Math.round(tx * ts + 8 + fOffX);
          const fy = Math.round(ty * ts + 8 + fOffY);

          const pulse = (Math.sin(timeSec * 3.2 + hash) + 1) * 0.5;
          const isEmerald = (hash % 2 === 0);

          // 외곽 은은한 빛 무리 (Soft Glow Aura)
          ctx.fillStyle = isEmerald
            ? `rgba(167, 243, 208, ${0.12 + pulse * 0.18})`
            : `rgba(254, 240, 138, ${0.12 + pulse * 0.18})`;
          ctx.fillRect(fx - 2, fy - 2, 5, 5);

          // 중심 발광 코어 (Bioluminescent Core)
          ctx.fillStyle = isEmerald ? '#a7f3d0' : '#fef08a';
          ctx.fillRect(fx, fy, 2, 2);
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

    // 0. 건축물 기저부 미세 접촉 앰비언트 오클루전 그림자 (Contact Ambient Occlusion)
    ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
    ctx.fillRect(px - bw / 2, py + bh / 2 - 2, bw, 4);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.20)';
    ctx.fillRect(px - bw / 2 - 2, py + bh / 2, bw + 4, 3);

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

    // 실시간 태양각 다이내믹 엔티티 드롭 섀도우 (Dynamic Sun-Angle Drop Shadow)
    if (!e.isShip) {
      const sh = this.getSunShadowOffset(this.lastWorldTime);
      ctx.fillStyle = `rgba(15, 23, 42, ${sh.alpha * 0.85})`;
      ctx.beginPath();
      ctx.ellipse(px + Math.round(sh.dx * 0.5), py + Math.round(sh.dy * 0.6), 8 * e.scale * sh.stretch, 4.5 * e.scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ⚔️ 플레이어 3대 전투 태세 발밑 룬 씰 (Dynamic Stance Runic Seal)
    if (e.role === 'player' && e.combatStance) {
      ctx.save();
      ctx.translate(px, py + 2);
      ctx.scale(1.0, 0.52);
      ctx.rotate(timeSec * 2.2);
      const stanceColor = e.combatStance === 'berserk' ? '#ef4444' : (e.combatStance === 'guardian' ? '#38bdf8' : '#facc15');
      ctx.strokeStyle = stanceColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();

      for (let k = 0; k < 3; k++) {
        const kAngle = (Math.PI * 2 / 3) * k;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.cos(kAngle) * 16 - 1.5, Math.sin(kAngle) * 16 - 1.5, 3, 3);
      }
      ctx.restore();
    }

    // 👹 정예 챔피언 몬스터 아우라 & 황금 해골 왕관 (Elite Champion Badge & Aura)
    if (e.isElite) {
      ctx.save();
      const elitePulse = 14 + Math.sin(timeSec * 4 + (e.id || 1)) * 3;
      ctx.strokeStyle = e.eliteAura || '#facc15';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(px, py + 2, elitePulse, elitePulse * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑', px, py - 30 * e.scale);
      ctx.restore();
    }

    // 💀 처형 가능 표식 (Glory Kill / Execution Finisher Marker)
    if (e.canExecute && e.hp > 0) {
      ctx.save();
      const exBob = Math.sin(timeSec * 7) * 3;
      const exY = py - (e.isShip ? 40 : 34) * e.scale + exBob;

      // 붉은 해골 펄스 광배
      const pulseR = 14 + Math.sin(timeSec * 10) * 3;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(px, exY - 2, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      // 배지 텍스트
      ctx.font = 'bold 11px Pretendard, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef2f2';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText('💀 EXECUTE [E]', px, exY);
      ctx.fillText('💀 EXECUTE [E]', px, exY);

      // 하향 붉은 화살표
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(px - 4, exY + 4);
      ctx.lineTo(px + 4, exY + 4);
      ctx.lineTo(px, exY + 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
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

    // 🔥 상태이상 비주얼 오버레이: 화상 (Burning Flames)
    if (e.burningTimer > 0) {
      const flmBob = Math.sin(timeSec * 16 + e.id) * 3;
      ctx.save();
      ctx.fillStyle = '#f97316';
      ctx.fillRect(px - 4, py - 18 * e.scale + flmBob, 3, 6);
      ctx.fillRect(px + 2, py - 20 * e.scale - flmBob, 3, 7);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(px - 3, py - 16 * e.scale + flmBob, 2, 4);
      ctx.fillRect(px + 3, py - 18 * e.scale - flmBob, 2, 5);
      ctx.restore();
    }

    // ❄️ 상태이상 비주얼 오버레이: 빙결 (Crystalline Frost Shell)
    if (e.frozenTimer > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.fillRect(px - 14 * e.scale, py - 24 * e.scale, 28 * e.scale, 28 * e.scale);
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - 14 * e.scale, py - 24 * e.scale, 28 * e.scale, 28 * e.scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 8 * e.scale, py - 20 * e.scale, 3, 3);
      ctx.fillRect(px + 6 * e.scale, py - 12 * e.scale, 3, 3);
      ctx.restore();
    }

    // 💫 상태이상 비주얼 오버레이: 기절 (Orbiting Stun Stars)
    if (e.stunTimer > 0) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      for (let sIdx = 0; sIdx < 3; sIdx++) {
        const sAng = timeSec * 8 + (sIdx * (Math.PI * 2 / 3));
        const sx = px + Math.cos(sAng) * (11 * e.scale);
        const sy = py - 24 * e.scale + Math.sin(sAng) * 4;
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 1, sy - 1, 2, 2);
      }
      ctx.restore();
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

      // 2.5. 플레이어 펜리르 섀도우 울프 탑승 특수 렌더링
      if (e.role === 'player' && e.mount === 'wolf') {
        // 그림자 야수 발밑 오라
        ctx.save();
        ctx.fillStyle = 'rgba(168, 85, 247, 0.28)';
        ctx.beginPath();
        ctx.ellipse(px, py + 4 * sc, 12 * sc, 5 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 울프 라이더 정밀 스프라이트 렌더링
        window.PixelSprites.draw(ctx, { ...e, role: 'wolfrider' }, px, py, bounce, timeSec, isNight);

        // 잔상 그림자 불꽃 파티클 (질주 시)
        if (Math.abs(e.vx || 0) > 0.05 || Math.abs(e.vy || 0) > 0.05) {
          const trailSign = (e.facing === 'left' || (e.vx || 0) < 0) ? 1 : -1;
          ctx.fillStyle = 'rgba(192, 132, 252, 0.65)';
          const flpY = py - ((timeSec * 24) % 8) * sc;
          ctx.fillRect(px + trailSign * 10 * sc, flpY, 2 * sc, 2 * sc);
        }
        return;
      }

      // 2.8. 플레이어 영웅 2차 각성 회전 룬 마법진 오라 (Awakening Sacred Aura)
      if (e.role === 'player' && this.entityMgr.rpgManager && this.entityMgr.rpgManager.awakening) {
        this.drawHeroAwakeningAura(ctx, px, py + 3 * sc, sc, timeSec, this.entityMgr.rpgManager.awakening);
      }

      // 3. 모든 영웅/NPC/몬스터/야생동물 정밀 픽셀 아트 매트릭스 렌더링
      window.PixelSprites.draw(ctx, e, px, py, bounce, timeSec, isNight);

      // 3.1. 🏕️ 모닥불 야외 요리 & 휴식 모션 연출 (Campfire Skewer & Sizzle Steam)
      if (e.role === 'player' && e.isCooking) {
        this.drawCookingSkewerMotion(ctx, px, py, timeSec);
      }

      // 3.2. 🍖 [Well-Fed / 포만감] 활성 상태 오버헤드 룬 인디케이터
      if (e.role === 'player' && e.wellFedTimer > 0) {
        this.drawWellFedBuffBadge(ctx, px, py, timeSec, e.wellFedTimer);
      }
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

    // 💡 [동적 조명 엔진] 밤 대기 어둠 오버레이 & 픽셀 포인트 라이트 투과 (Dynamic Night Light Engine - 1/2 Buffer Optimized)
    if (darkness > 0.01) {
      const lw = Math.max(1, Math.ceil(cw / 2));
      const lh = Math.max(1, Math.ceil(ch / 2));
      if (!this.lightCanvas) {
        this.lightCanvas = document.createElement('canvas');
        this.lightCtx = this.lightCanvas.getContext('2d');
      }
      if (this.lightCanvas.width !== lw || this.lightCanvas.height !== lh) {
        this.lightCanvas.width = lw;
        this.lightCanvas.height = lh;
      }

      const lCtx = this.lightCtx;
      lCtx.clearRect(0, 0, lw, lh);
      lCtx.fillStyle = `rgba(7, 13, 34, ${darkness})`;
      lCtx.fillRect(0, 0, lw, lh);

      // destination-out 모드로 광원 주변 어둠을 부드럽게 뚫어냄 (Soft Light Carving)
      lCtx.globalCompositeOperation = 'destination-out';

      const ts = this.tileSize || 32;
      const cam = camera || { x: 320, y: 200, zoom: 1 };
      const zoom = cam.zoom || 1;
      const scale = lw / cw;

      // 광원 뚫기 헬퍼 함수
      const carveLight = (worldX, worldY, baseRadius, intensity = 1.0) => {
        const sx = (cw / 2 + (worldX - cam.x) * ts * zoom) * scale;
        const sy = (ch / 2 + (worldY - cam.y) * ts * zoom) * scale;
        const rad = baseRadius * zoom * scale;
        if (sx < -rad || sx > lw + rad || sy < -rad || sy > lh + rad) return;

        const flicker = (Math.sin(timeSec * 7.5 + worldX * 1.5) * 3) * scale;
        const grad = lCtx.createRadialGradient(sx, sy, Math.max(1, rad * 0.15), sx, sy, Math.max(2, rad + flicker));
        grad.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
        grad.addColorStop(0.55, `rgba(0, 0, 0, ${intensity * 0.55})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        lCtx.fillStyle = grad;
        lCtx.beginPath();
        lCtx.arc(sx, sy, Math.max(2, rad + flicker), 0, Math.PI * 2);
        lCtx.fill();
      };

      // 1. 플레이어 랜턴 / 횃불 광원
      if (this.entityMgr && this.entityMgr.player) {
        const p = this.entityMgr.player;
        carveLight(p.x, p.y, p.isFlying ? 160 : 125, 0.95);
      }

      // 2. 동료 호위단 광원
      if (this.entityMgr && this.entityMgr.rpgManager && this.entityMgr.rpgManager.companionsActive) {
        for (const c of this.entityMgr.rpgManager.companions) {
          if (c.x > 0) carveLight(c.x, c.y, 75, 0.7);
        }
      }

      // 3. 주요 도시 및 거점 화톳불 & 가로등
      if (this.world && this.world.settlements) {
        for (const s of this.world.settlements) {
          carveLight(s.x, s.y, 140, 0.9);
        }
      }

      // 4. 고대 시련 성소의 룬 광원
      if (this.entityMgr && this.entityMgr.rpgManager && this.entityMgr.rpgManager.ancientShrines) {
        for (const shrine of this.entityMgr.rpgManager.ancientShrines) {
          carveLight(shrine.x, shrine.y, 160, 0.95);
        }
      }

      // 5. 고대 던전 포탈의 심연 광원
      if (this.entityMgr && this.entityMgr.rpgManager && this.entityMgr.rpgManager.dungeons) {
        for (const dg of this.entityMgr.rpgManager.dungeons) {
          carveLight(dg.x, dg.y, 150, 0.9);
        }
      }

      // 6. 플레이어 설치 건축물 (성채, 타워)
      if (this.entityMgr && this.entityMgr.rpgManager && this.entityMgr.rpgManager.structures) {
        for (const st of this.entityMgr.rpgManager.structures) {
          carveLight(st.x, st.y, 110, 0.85);
        }
      }

      // 7. 고대 보물지도 발굴 현장 황금빛 비콘 광원
      if (this.entityMgr && this.entityMgr.player && this.entityMgr.player.treasureMap) {
        const tm = this.entityMgr.player.treasureMap;
        carveLight(tm.x, tm.y, 120, 0.95);
      }

      lCtx.globalCompositeOperation = 'source-over';

      // 어둠 마스크 합성
      ctx.drawImage(this.lightCanvas, 0, 0);

      // 부드러운 호박색 & 룬 색상 광원 블룸 후광 (Warm Atmospheric Bloom)
      ctx.save();
      const drawWarmHalo = (worldX, worldY, radius, col) => {
        const sx = cw / 2 + (worldX - cam.x) * ts * zoom;
        const sy = ch / 2 + (worldY - cam.y) * ts * zoom;
        const rad = radius * zoom;
        if (sx < -rad || sx > cw + rad || sy < -rad || sy > ch + rad) return;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
        grad.addColorStop(0, col);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI * 2);
        ctx.fill();
      };

      if (this.entityMgr && this.entityMgr.player) {
        const p = this.entityMgr.player;
        drawWarmHalo(p.x, p.y, 75, 'rgba(251, 191, 36, 0.18)');
        if (p.treasureMap) {
          drawWarmHalo(p.treasureMap.x, p.treasureMap.y, 85, 'rgba(250, 204, 21, 0.4)');
        }
      }
      if (this.entityMgr && this.entityMgr.rpgManager && this.entityMgr.rpgManager.ancientShrines) {
        for (const shrine of this.entityMgr.rpgManager.ancientShrines) {
          drawWarmHalo(shrine.x, shrine.y, 90, shrine.cleared ? 'rgba(250, 204, 21, 0.22)' : 'rgba(56, 189, 248, 0.18)');
        }
      }
      ctx.restore();
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

      // 폭풍우 천둥 번개 플래시 & 지그재그 픽셀 낙뢰 (Thunder Lightning Flash & Jagged Bolt Arcs)
      if (worldTime.weather === 'storm' || worldTime.weather === 'rain') {
        const stormCycle = (timeSec * 0.75) % 6.5;
        if (stormCycle < 0.14) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fillRect(0, 0, cw, ch);
          if (camera && camera.shake === 0) camera.shake = 9;

          // 지그재그 번개 줄기
          ctx.save();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          let bx = (timeSec * 811) % (cw * 0.8) + cw * 0.1;
          let by = 0;
          ctx.moveTo(bx, by);
          for (let step = 0; step < 7; step++) {
            bx += (Math.sin(step * 2.5 + timeSec * 15) > 0 ? 1 : -1) * (18 + (step % 3) * 10);
            by += ch * 0.11;
            ctx.lineTo(bx, by);
            if (step === 3 || step === 5) {
              ctx.moveTo(bx, by);
              ctx.lineTo(bx + 24, by + 18);
              ctx.moveTo(bx, by);
            }
          }
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 2. ❄️ 북부 설원 눈보라 & 얼어붙은 서리 비네트 (Snowdrift & Polar Frost Borders)
    if (worldTime.weather === 'snow' || camY < 120) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let i = 0; i < 70; i++) {
        const sx = Math.floor((i * 181 + Math.sin(timeSec * 2.2 + i) * 24 + timeSec * 32) % cw);
        const sy = Math.floor((i * 269 + timeSec * 115) % ch);
        const sz = (i % 3 === 0) ? 3 : 2;
        ctx.fillRect(sx, sy, sz, sz);
      }

      // 화면 모서리 서리 비네트
      if (camY < 95) {
        const frostGrad = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.45, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
        frostGrad.addColorStop(0, 'rgba(186, 230, 253, 0)');
        frostGrad.addColorStop(1, 'rgba(186, 230, 253, 0.28)');
        ctx.fillStyle = frostGrad;
        ctx.fillRect(0, 0, cw, ch);
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

    // 6.5. ☀️ 천공의 황금빛 틈새 광선 (Sunbeam God Rays / Crepuscular Sunlight)
    if (darkness < 0.22 && worldTime.weather !== 'storm') {
      const sunAlpha = (h >= 7 && h <= 17) ? 0.12 : ((h >= 5 && h < 7) ? 0.08 : 0);
      if (sunAlpha > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.08)';
        const rayOffset = (timeSec * 14) % 240;
        for (let r = -cw * 0.4; r < cw * 1.4; r += 160) {
          const rx = r + rayOffset;
          ctx.beginPath();
          ctx.moveTo(rx, 0);
          ctx.lineTo(rx + 65, 0);
          ctx.lineTo(rx + 210, ch);
          ctx.lineTo(rx + 110, ch);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 7. 🩸 치명상 위기 심장박동 비네트 (Low HP Pulsating Crimson Vignette)
    const p = this.entityMgr.player;
    if (p && p.hp > 0 && (p.hp / p.maxHp) < 0.28) {
      const pulse = 0.26 + 0.16 * Math.sin(timeSec * 7.5);
      const radGrad = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.72);
      radGrad.addColorStop(0, 'rgba(220, 38, 38, 0)');
      radGrad.addColorStop(1, `rgba(185, 28, 28, ${pulse})`);
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, cw, ch);
    }

    // 8. ⚡ 피격 / 치명타 / 피니셔 화면 섬광 (Impact Screen Flash)
    if (this.screenFlashTimer > 0) {
      ctx.save();
      ctx.fillStyle = this.screenFlashColor || '#ffffff';
      ctx.globalAlpha = Math.min(0.42, this.screenFlashTimer * 3.5);
      ctx.fillRect(0, 0, cw, ch);
      ctx.restore();
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


    // 🚨 월드 보스 레이드 출현 시 펄싱 붉은 해골/링 표시
    if (this.entityMgr.rpgManager && this.entityMgr.rpgManager.activeBoss && this.entityMgr.rpgManager.activeBoss.hp > 0) {
      const b = this.entityMgr.rpgManager.activeBoss;
      const bx = b.x * scaleX;
      const by = b.y * scaleY;
      const pulseR = 5 + Math.sin(Date.now() / 150) * 2;
      mCtx.save();
      mCtx.strokeStyle = '#ef4444';
      mCtx.lineWidth = 1.5;
      mCtx.beginPath();
      mCtx.arc(bx, by, pulseR, 0, Math.PI * 2);
      mCtx.stroke();
      mCtx.fillStyle = '#dc2626';
      mCtx.beginPath();
      mCtx.arc(bx, by, 3.5, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.restore();
    }

    // 🌟 플레이어 레이더 위치 강조 (백색 + 황금 펄스 링)
    if (this.entityMgr.player) {
      const px = this.entityMgr.player.x * scaleX;
      const py = this.entityMgr.player.y * scaleY;
      mCtx.save();
      mCtx.strokeStyle = '#facc15';
      mCtx.lineWidth = 1.6;
      mCtx.beginPath();
      mCtx.arc(px, py, 4.5, 0, Math.PI * 2);
      mCtx.stroke();
      mCtx.fillStyle = '#ffffff';
      mCtx.beginPath();
      mCtx.arc(px, py, 2.5, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.restore();
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

  // 🏛️ [12.1-B] 고대 시련의 사당 & 성소 픽셀아트 렌더러 (Ancient Shrines of Power)
  drawAncientShrines(ctx, ts, timeSec, zoom) {
    const rpg = this.entityMgr.rpgManager;
    if (!rpg || !rpg.ancientShrines) return;

    for (const sh of rpg.ancientShrines) {
      const px = Math.round(sh.x * ts);
      const py = Math.round(sh.y * ts);

      // 1. 지면 고대 룬 결계 진 (Pulsing Concentric Runic Rings)
      const pulse = 0.5 + 0.5 * Math.sin(timeSec * 3 + sh.x);
      ctx.save();
      ctx.strokeStyle = sh.color;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(px, py, 20 + pulse * 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.stroke();

      // 2. 고대 제단 석조 기단
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - 14, py - 8, 28, 16);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - 12, py - 6, 24, 12);

      // 4대 기둥 (Stone Pillars with Glowing Runes)
      const pillars = [
        { dx: -12, dy: -12 },
        { dx: 12, dy: -12 },
        { dx: -12, dy: 6 },
        { dx: 12, dy: 6 }
      ];
      for (const pil of pillars) {
        ctx.fillStyle = '#475569';
        ctx.fillRect(px + pil.dx - 3, py + pil.dy - 10, 6, 14);
        ctx.fillStyle = sh.color;
        ctx.fillRect(px + pil.dx - 1, py + pil.dy - 6, 2, 6);
      }

      // 3. 중앙 공중 부유 회전 룬 다이아몬드 (Floating Rotating Runic Crystal)
      const bobY = Math.sin(timeSec * 3.5 + sh.y) * 4;
      const cryY = py - 18 + bobY;
      ctx.fillStyle = sh.color;
      ctx.beginPath();
      ctx.moveTo(px, cryY - 9);
      ctx.lineTo(px + 7, cryY);
      ctx.lineTo(px, cryY + 9);
      ctx.lineTo(px - 7, cryY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 2, cryY - 3, 4, 6);

      // 4. 완수된 사당: 영구 하늘 천공 빛기둥 (Permanent Celestial Pillar of Light)
      if (sh.cleared) {
        const pillarGrad = ctx.createLinearGradient(px, py, px, py - 180);
        pillarGrad.addColorStop(0, `${sh.color}88`);
        pillarGrad.addColorStop(1, `${sh.color}00`);
        ctx.fillStyle = pillarGrad;
        ctx.fillRect(px - 10, py - 180, 20, 180);

        // 상공 완료 왕관 배지
        ctx.font = 'bold 12px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fde047';
        ctx.fillText(`👑 [${sh.traitName} 각성]`, px, py - 32 + bobY);
      } else {
        // 미완료 사당 상공 이름표
        if (zoom > 0.45) {
          ctx.font = 'bold 11px Pretendard, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(px - 45, py - 36 + bobY, 90, 18);
          ctx.strokeStyle = sh.color;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(px - 45, py - 36 + bobY, 90, 18);
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(`${sh.icon} ${sh.name}`, px, py - 23 + bobY);
        }
      }
      ctx.restore();
    }
  }

  // 💀 [12.1-C] 고대 심연 던전 카타콤 차원문 픽셀아트 렌더러 (Ancient Dungeon Portals)
  drawDungeonPortals(ctx, ts, timeSec, zoom) {
    const rpg = this.entityMgr.rpgManager;
    if (!rpg || !rpg.dungeons) return;

    for (const dg of rpg.dungeons) {
      const px = Math.round(dg.x * ts);
      const py = Math.round(dg.y * ts);

      ctx.save();

      // 1. 심연 차원 균열 오라 (Abyssal Swirling Void Energy)
      const pulse = 0.5 + 0.5 * Math.sin(timeSec * 3.5 + dg.x);
      const grad = ctx.createRadialGradient(px, py - 10, 4, px, py - 10, 24 + pulse * 6);
      grad.addColorStop(0, dg.color);
      grad.addColorStop(0.65, `${dg.color}66`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py - 10, 24 + pulse * 6, 0, Math.PI * 2);
      ctx.fill();

      // 2. 석조 아치형 포탈 게이트 기둥 & 아치 (Carved Stone Portal Arch)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 16, py - 26, 32, 28);
      ctx.fillStyle = '#1e293b';
      // 좌우 지주석
      ctx.fillRect(px - 15, py - 24, 6, 24);
      ctx.fillRect(px + 9, py - 24, 6, 24);
      // 상단 아치 린텔
      ctx.fillRect(px - 17, py - 28, 34, 6);
      // 룬 음각 조각
      ctx.fillStyle = dg.color;
      ctx.fillRect(px - 14, py - 20, 2, 4);
      ctx.fillRect(px - 14, py - 12, 2, 4);
      ctx.fillRect(px + 12, py - 20, 2, 4);
      ctx.fillRect(px + 12, py - 12, 2, 4);
      ctx.fillRect(px - 4, py - 27, 8, 2);

      // 3. 차원 포탈 소용돌이 게이트 내부 (Swirling Portal Vortex)
      ctx.save();
      ctx.translate(px, py - 10);
      ctx.rotate(timeSec * 2.2);
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = dg.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 4. 배출되는 픽셀 파티클 스파크
      for (let p = 0; p < 3; p++) {
        const pPhase = (timeSec * 2.5 + p * 0.7) % 1.0;
        const spY = py - 10 - pPhase * 16;
        const spX = px + Math.sin(timeSec * 4 + p) * 8;
        ctx.fillStyle = dg.color;
        ctx.fillRect(spX, spY, 2, 2);
      }

      // 5. 상단 이름표 및 레벨 배지
      if (zoom > 0.35) {
        ctx.font = 'bold 11px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        const nameText = `${dg.icon} ${dg.name} [Lv.${dg.levelReq}+]`;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        const tw = ctx.measureText(nameText).width;
        ctx.fillRect(px - tw / 2 - 5, py - 38, tw + 10, 16);
        ctx.fillStyle = '#fef08a';
        ctx.fillText(nameText, px, py - 26);
      }

      ctx.restore();
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
      const shake = (n.shakeTimer && n.shakeTimer > 0) ? Math.sin(timeSec * 45) * 3 : 0;
      const px = Math.round(n.x * ts + shake);
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

    // 4. 모닥불 & 야외 화로 따뜻한 깜빡임 조명 (Campfire Flicker Glow)
    if (this.world.props) {
      for (const pr of this.world.props) {
        if (pr.type === 'campfire' || pr.type === 'campfire_stools') {
          if (Math.abs(pr.x - camera.x) > 28 || Math.abs(pr.y - camera.y) > 22) continue;
          const cx = Math.round(pr.x * ts);
          const cy = Math.round(pr.y * ts);
          const flickerRad = 32 + Math.sin(timeSec * 8 + pr.x) * 4;
          const cGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, flickerRad);
          cGrad.addColorStop(0, 'rgba(251, 146, 60, 0.48)');
          cGrad.addColorStop(0.6, 'rgba(234, 88, 12, 0.18)');
          cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = cGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, flickerRad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 5. 어둠 속 몬스터 & 포식자의 영롱한 야광 안광 (Predator Glowing Eyes)
    for (const ent of this.entityMgr.entities) {
      if (ent.hp <= 0) continue;
      if (Math.abs(ent.x - camera.x) > 26 || Math.abs(ent.y - camera.y) > 20) continue;
      if (ent.faction === 'monster' || ent.isPredator || ent.role === 'dragon') {
        const ex = Math.round(ent.x * ts);
        const ey = Math.round(ent.y * ts - 11 * (ent.scale || 1));
        const eyeColor = ent.role === 'dragon' ? '#fde047' : (ent.race === 'undead' ? '#c084fc' : '#ef4444');
        ctx.fillStyle = eyeColor;
        ctx.fillRect(ex - 2, ey, 1.5, 1.5);
        ctx.fillRect(ex + 1, ey, 1.5, 1.5);
      }
    }

    ctx.restore();
  }

  // ⚠️ [8.5] 보스/엘리트 공격 전조 위험 장판 렌더러 (Telegraphed Hazard Zones)
  drawHazardZones(ctx, ts, timeSec, minTx, maxTx, minTy, maxTy) {
    if (!this.entityMgr.hazardZones || this.entityMgr.hazardZones.length === 0) return;
    for (const hz of this.entityMgr.hazardZones) {
      if (hz.x < minTx || hz.x > maxTx || hz.y < minTy || hz.y > maxTy) continue;
      const hx = Math.round(hz.x * ts);
      const hy = Math.round(hz.y * ts);
      const rad = Math.round(hz.radius * ts);
      const progress = Math.max(0, Math.min(1, 1 - (hz.timer / hz.maxTimer)));

      ctx.save();
      // 위험 장판 내부 반투명 붉은 점멸 채우기
      const pulseAlpha = 0.18 + Math.sin(timeSec * 14) * 0.08;
      ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
      ctx.beginPath();
      ctx.arc(hx, hy, rad, 0, Math.PI * 2);
      ctx.fill();

      // 외곽 점선 회전 경고 림
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -timeSec * 18;
      ctx.beginPath();
      ctx.arc(hx, hy, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 내부에서 외곽으로 차오르는 전조 카운트다운 링
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.arc(hx, hy, Math.round(rad * progress), 0, Math.PI * 2);
      ctx.stroke();

      // 중심부 위험 경고 표식
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('⚠️', hx, hy + 5);

      ctx.restore();
    }
  }

  // 💎 [10.5-D] 필드 전리품 드롭 렌더러 (Bouncing Loot Drops & Floating Pickups)
  drawDroppedLoot(ctx, ts, timeSec, minTx, maxTx, minTy, maxTy) {
    if (!this.entityMgr.droppedLoot || this.entityMgr.droppedLoot.length === 0) return;
    for (const loot of this.entityMgr.droppedLoot) {
      if (loot.x < minTx || loot.x > maxTx || loot.y < minTy || loot.y > maxTy) continue;
      const lx = Math.round(loot.x * ts);
      const ly = Math.round(loot.y * ts);
      const bob = Math.sin(timeSec * 4.5 + (loot.x * 3)) * 2.5;
      const itemY = Math.round(ly + (loot.bounceY || 0) + bob);

      ctx.save();
      // 1. 지면 타원형 드롭 섀도우
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(lx, ly + 2, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. 황금빛 / 비전 에너지 오라 광채
      ctx.fillStyle = loot.itemType === 'gem' ? 'rgba(168, 85, 247, 0.28)' : 'rgba(250, 204, 21, 0.32)';
      ctx.beginPath();
      ctx.arc(lx, itemY - 4, 9, 0, Math.PI * 2);
      ctx.fill();

      // 3. 16비트 픽셀 아이템 렌더링
      if (loot.itemType === 'gold') {
        // 회전하는 16비트 황금 코인
        const coinW = Math.max(2, Math.round(Math.abs(Math.sin(timeSec * 6 + loot.x)) * 8));
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(lx - coinW / 2 - 1, itemY - 8, coinW + 2, 8);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(lx - coinW / 2, itemY - 7, coinW, 6);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(lx - coinW / 4, itemY - 6, Math.max(1, coinW / 2), 2);
      } else if (loot.itemType === 'wood') {
        // 나이테 통나무
        ctx.fillStyle = '#451a03';
        ctx.fillRect(lx - 5, itemY - 6, 10, 6);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(lx - 4, itemY - 5, 8, 4);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(lx + 2, itemY - 4, 2, 2);
      } else if (loot.itemType === 'ore') {
        // 반짝이는 마정석/철광석
        ctx.fillStyle = '#475569';
        ctx.fillRect(lx - 4, itemY - 6, 8, 7);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(lx - 2, itemY - 5, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(lx - 1, itemY - 4, 2, 2);
      } else {
        // 기타 전리품 이모지 (고기 🥩, 물약 🧪, 보석 💎)
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(loot.icon, lx, itemY - 1);
      }

      ctx.restore();
    }
  }

  // 🌊 [10.5-A] 수면 보행 & 항해 파문 링 (Water Wading Ripples)
  drawWaterWadingRipples(ctx, ts, timeSec, minTx, maxTx, minTy, maxTy) {
    if (!this.entityMgr.waterRipples || this.entityMgr.waterRipples.length === 0) return;
    for (const r of this.entityMgr.waterRipples) {
      if (r.x < minTx || r.x > maxTx || r.y < minTy || r.y > maxTy) continue;
      const progress = r.age / r.duration;
      const alpha = Math.max(0, 1 - progress) * 0.75;
      const curRadius = r.radius;
      const rx = Math.round(r.x * ts);
      const ry = Math.round(r.y * ts);

      ctx.save();
      ctx.strokeStyle = `rgba(186, 230, 253, ${alpha})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(rx, ry + 2, curRadius, curRadius * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ⚡ [9.6] 플레이어 기 모으기 차징 오라 (Charge Aura & Overcharge Sparks)
  drawPlayerChargeAura(ctx, ts, timeSec) {
    const p = this.entityMgr.player;
    if (!p || !p.isCharging) return;

    const px = Math.round(p.x * ts);
    const py = Math.round(p.y * ts + 4);
    const ct = p.chargeTime || 0;
    const progress = Math.min(1.0, ct / 0.85);
    const isMax = p.chargeMaxReached || progress >= 1.0;
    const auraColor = (p.weaponMode === 'ranged') ? '#38bdf8' : '#facc15';

    ctx.save();

    // 1. 바닥 마법진 회전 룬 링
    const spin = timeSec * (isMax ? 12 : 5);
    const baseRadius = 16 + progress * 6;

    ctx.strokeStyle = isMax ? '#ffffff' : auraColor;
    ctx.lineWidth = isMax ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.arc(px, py, baseRadius, spin, spin + Math.PI * 2 * progress);
    ctx.stroke();

    // 내부 반투명 에너지 웰
    ctx.fillStyle = isMax ? 'rgba(254, 240, 138, 0.35)' : 'rgba(56, 189, 248, 0.18)';
    ctx.beginPath();
    ctx.arc(px, py, baseRadius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 2. 최대 충전 시 8방향 스타버스트 빔
    if (isMax) {
      const pulse = (Math.sin(timeSec * 22) + 1) * 0.5;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.0;
      for (let i = 0; i < 8; i++) {
        const rayAng = (Math.PI / 4) * i + timeSec * 4;
        const r1 = baseRadius + 2;
        const r2 = baseRadius + 10 + pulse * 6;
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(rayAng) * r1, py + Math.sin(rayAng) * r1);
        ctx.lineTo(px + Math.cos(rayAng) * r2, py + Math.sin(rayAng) * r2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // ⚡ [13.1] 불릿 타임 (Witch Time) 시공간 왜곡 스피드 비네트
  drawWitchTimeVignette(ctx, cw, ch, timeSec) {
    if (!this.entityMgr || this.entityMgr.witchTimeTimer <= 0) return;

    ctx.save();
    const pulse = (Math.sin(timeSec * 16) + 1) * 0.5;

    // 외곽 골든-시안 래디얼 글로우
    const grad = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.35, cw / 2, ch / 2, Math.max(cw, ch) * 0.72);
    grad.addColorStop(0, 'rgba(14, 165, 233, 0)');
    grad.addColorStop(0.7, `rgba(56, 189, 248, ${0.18 + pulse * 0.12})`);
    grad.addColorStop(1, `rgba(250, 204, 21, ${0.45 + pulse * 0.25})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    // 스피드 라인 림
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + pulse * 0.35})`;
    ctx.lineWidth = 3.0;
    ctx.strokeRect(10, 10, cw - 20, ch - 20);

    ctx.restore();
  }

  // ☀️ [13.3] 대기 볼류메트릭 갓레이 (God Rays / Volumetric Sunbeams)
  drawVolumetricGodRays(ctx, cw, ch, timeSec, worldTime) {
    if (!worldTime) return;
    const h = worldTime.hour + worldTime.minute / 60;
    if (h < 6.0 || h > 18.5) return;
    if (worldTime.weather === 'rain' || worldTime.weather === 'storm') return;

    const isGoldenHour = (h >= 6.0 && h <= 8.5) || (h >= 16.5 && h <= 18.5);
    const rayColor = isGoldenHour ? 'rgba(251, 191, 36, 0.055)' : 'rgba(254, 249, 195, 0.038)';

    ctx.save();
    ctx.translate(cw * 0.25, -50);
    ctx.rotate(0.38);

    const numRays = 7;
    for (let i = 0; i < numRays; i++) {
      const rayX = i * (cw / 5) + Math.sin(timeSec * 0.4 + i * 1.5) * 45;
      const rayWidth = 45 + Math.sin(timeSec * 0.6 + i) * 18;
      const alpha = (Math.sin(timeSec * 0.8 + i * 2) + 1.2) * 0.5;

      const rayGrad = ctx.createLinearGradient(rayX, 0, rayX, ch * 1.6);
      rayGrad.addColorStop(0, rayColor.replace(/0\.\d+\)/, `${0.12 * alpha})`));
      rayGrad.addColorStop(0.5, rayColor.replace(/0\.\d+\)/, `${0.06 * alpha})`));
      rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = rayGrad;
      ctx.fillRect(rayX - rayWidth / 2, 0, rayWidth, ch * 1.6);
    }

    ctx.restore();
  }

  // 🏹 [10.1] 정밀 픽셀 화살 렌더링 (Elven Piercing Arrow with Wind Trail)
  drawPixelArrow(ctx, p, ts) {
    const px = Math.round(p.x * ts);
    const py = Math.round(p.y * ts);
    const ang = p.angle !== undefined ? p.angle : Math.atan2(p.vy, p.vx);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);

    if (p.isSolarBeam) {
      // ⚡ [태양의 관통 광선화살] (Solar Piercing Beam Arrow)
      const trailLen = 38;
      const grad = ctx.createLinearGradient(-trailLen, 0, 0, 0);
      grad.addColorStop(0, 'rgba(245, 158, 11, 0)');
      grad.addColorStop(0.6, 'rgba(251, 191, 36, 0.85)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 1.0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 6.0;
      ctx.beginPath();
      ctx.moveTo(-trailLen, 0);
      ctx.lineTo(12, 0);
      ctx.stroke();

      // 내부 백색 레이저 코어
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-trailLen * 0.7, 0);
      ctx.lineTo(16, 0);
      ctx.stroke();

      // 태양 화살촉
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(10, -5);
      ctx.lineTo(20, 0);
      ctx.lineTo(10, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      return;
    }

    // 1. 바람 꼬리 궤적 리본 (Wind Trail Ribbon)
    const trailLen = 18;
    const grad = ctx.createLinearGradient(-trailLen, 0, 0, 0);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.65)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-trailLen, 0);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // 2. 화살대 (Elven Wood Shaft)
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();

    // 3. 깃털 화살깃 (Feather Fletching)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-13, -3.5);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-13, 3.5);
    ctx.closePath();
    ctx.fill();

    // 4. 엘븐 크리스탈 화살촉 (Glowing Crystal Arrowhead)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(6, -2.5);
    ctx.lineTo(11, 0);
    ctx.lineTo(6, 2.5);
    ctx.closePath();
    ctx.fill();

    // 5. 발광 팁
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, -1, 3, 2);

    ctx.restore();
  }

  // 🌊 [10.5-A3] 선박 & 수영 픽셀 V자 물보라 항적 (Dynamic V-Shaped Foaming Water Wakes)
  drawWaterWakes(ctx, ts, timeSec, minTx, maxTx, minTy, maxTy) {
    if (!this.entityMgr.waterWakes || this.entityMgr.waterWakes.length === 0) return;
    for (const w of this.entityMgr.waterWakes) {
      if (w.x < minTx || w.x > maxTx || w.y < minTy || w.y > maxTy) continue;
      const progress = w.age / w.duration;
      const alpha = Math.max(0, 1 - progress);
      const wx = Math.round(w.x * ts);
      const wy = Math.round(w.y * ts);
      const spread = (progress * 18 + 4) * (w.scale || 1.0);
      const wakeLen = (progress * 24 + 8) * (w.scale || 1.0);

      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(w.angle || 0);

      // V자 좌우 거품 선
      ctx.strokeStyle = `rgba(224, 242, 254, ${alpha * 0.75})`;
      ctx.lineWidth = Math.max(1, (2.4 * (1 - progress * 0.5) * (w.scale || 1.0)));
      ctx.beginPath();
      // 좌측 V라인
      ctx.moveTo(0, 0);
      ctx.lineTo(-wakeLen, -spread);
      // 우측 V라인
      ctx.moveTo(0, 0);
      ctx.lineTo(-wakeLen, spread);
      ctx.stroke();

      // 중간 포밍 물보라 파편
      if (progress < 0.6) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
        ctx.fillRect(-wakeLen * 0.4, -spread * 0.5, 2, 2);
        ctx.fillRect(-wakeLen * 0.4, spread * 0.5, 2, 2);
        ctx.fillRect(-wakeLen * 0.7, 0, 2, 2);
      }
      ctx.restore();
    }
  }

  // 🦅 [10.6] 상공 정찰매 사역마 동료 (Spirit Falcon Scouting Companion)
  drawFalconFamiliar(ctx, ts, timeSec) {
    const f = this.entityMgr.falcon;
    if (!f || !f.active) return;

    const fx = Math.round(f.x * ts);
    const fy = Math.round((f.y - 0.7) * ts);

    // 1. 고도 동적 보간 (급강하 시 지면으로 수직 하강 24px -> 4px)
    const isDiving = (f.state === 'dive' && f.target);
    const diveDist = isDiving ? Math.hypot(f.target.x - f.x, f.target.y - f.y) : 6.0;
    const altY = isDiving ? Math.max(4, Math.round(24 * Math.min(1.0, diveDist / 4.5))) : 24;

    // 2. 지면 정찰매 투영 그림자 (고도가 낮아질수록 더 크고 짙어짐)
    ctx.save();
    const shadowScale = isDiving ? (1.6 - (altY / 24) * 0.6) : 1.0;
    const shadowAlpha = isDiving ? (0.55 - (altY / 24) * 0.25) : 0.28;
    ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 8 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. 상공 비행체 드로잉
    ctx.translate(fx, fy - altY);

    let flightAngle = f.angle || 0;
    if (f.state === 'dive' && f.target) {
      flightAngle = Math.atan2(f.target.y - f.y, f.target.x - f.x);
    }
    ctx.rotate(flightAngle);

    // 날개짓 애니메이션 (급강하 시에는 날개를 쐐기형으로 접어 공기저항 최소화)
    const wingFlap = isDiving ? -2 : Math.sin(f.wingCycle || 0) * 5;

    // 솔개 몸통 (Golden Falcon Body)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 황금 깃털 날개
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(isDiving ? -3 : 2, -8 + wingFlap);
    ctx.lineTo(-5, -5 + wingFlap);
    ctx.lineTo(-2, -2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(isDiving ? -3 : 2, 8 - wingFlap);
    ctx.lineTo(-5, 5 - wingFlap);
    ctx.lineTo(-2, 2);
    ctx.closePath();
    ctx.fill();

    // 솔개 부리 & 눈
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(6, -1, 3, 2);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, -1, 1, 1);

    // 급강하 시 초음속 기류풍 및 깃털 잔상
    if (isDiving) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-18, -3);
      ctx.lineTo(0, -3);
      ctx.moveTo(-18, 3);
      ctx.lineTo(0, 3);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(-24, 0);
      ctx.lineTo(-4, 0);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 👣 [10.5-A2] 동적 지형 발자국 및 선박 항적 (Dynamic Footprints & Foaming Wakes)
  drawFootprints(ctx, ts, minTx, maxTx, minTy, maxTy) {
    if (!this.entityMgr.footprints || this.entityMgr.footprints.length === 0) return;
    for (const fp of this.entityMgr.footprints) {
      if (fp.x < minTx || fp.x > maxTx || fp.y < minTy || fp.y > maxTy) continue;
      const progress = fp.age / fp.duration;
      const alpha = Math.max(0, 1 - progress);
      const fx = Math.round(fp.x * ts);
      const fy = Math.round(fp.y * ts);

      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(fp.angle || 0);

      if (fp.type === 'wake') {
        // 선박 쌍발 거품 항적
        ctx.strokeStyle = `rgba(224, 242, 254, ${alpha * 0.6})`;
        ctx.lineWidth = 1.4;
        const wakeSpread = (progress * 7) + 3;
        ctx.beginPath();
        ctx.moveTo(0, -wakeSpread);
        ctx.lineTo(-14, -wakeSpread * 2);
        ctx.moveTo(0, wakeSpread);
        ctx.lineTo(-14, wakeSpread * 2);
        ctx.stroke();
      } else if (fp.type === 'horse') {
        // 말발굽 편자 자국
        const col = (fp.tile === TILE.SNOW || fp.tile === TILE.ICE)
          ? `rgba(186, 230, 253, ${alpha * 0.7})`
          : (fp.tile === TILE.SAND || fp.tile === TILE.DESERT_DUNES
            ? `rgba(180, 83, 9, ${alpha * 0.5})`
            : `rgba(20, 40, 20, ${alpha * 0.35})`);
        ctx.fillStyle = col;
        const offset = fp.side ? 2.5 : -2.5;
        ctx.fillRect(-2, offset - 1, 4, 3);
        ctx.clearRect(-1, offset, 2, 1);
      } else if (fp.type === 'wolf') {
        // 늑대 발자국 (발바닥 패드 + 앞 발톱 3개)
        const col = (fp.tile === TILE.SNOW || fp.tile === TILE.ICE)
          ? `rgba(147, 197, 253, ${alpha * 0.75})`
          : (fp.tile === TILE.SAND || fp.tile === TILE.DESERT_DUNES
            ? `rgba(180, 83, 9, ${alpha * 0.55})`
            : `rgba(88, 28, 135, ${alpha * 0.4})`);
        ctx.fillStyle = col;
        const offset = fp.side ? 2 : -2;
        ctx.fillRect(-1, offset - 1, 3, 2);
        ctx.fillRect(-2, offset - 2, 1, 1);
        ctx.fillRect(0, offset - 3, 1, 1);
        ctx.fillRect(2, offset - 2, 1, 1);
      } else if (fp.type === 'dragon') {
        // 비룡 발톱 흔적
        ctx.fillStyle = `rgba(15, 23, 42, ${alpha * 0.4})`;
        ctx.fillRect(-2, -3, 3, 2);
        ctx.fillRect(0, -1, 3, 2);
        ctx.fillRect(-2, 1, 3, 2);
      } else {
        // 도보 인간 발자국
        const col = (fp.tile === TILE.SNOW || fp.tile === TILE.ICE)
          ? `rgba(186, 230, 253, ${alpha * 0.75})`
          : (fp.tile === TILE.SAND || fp.tile === TILE.DESERT_DUNES
            ? `rgba(180, 83, 9, ${alpha * 0.55})`
            : `rgba(20, 40, 20, ${alpha * 0.35})`);
        ctx.fillStyle = col;
        const offset = fp.side ? 2 : -2;
        ctx.fillRect(-2, offset - 1, 4, 2);
      }
      ctx.restore();
    }
  }

  // 💨 [10.5-B] 회피 롤 / 대시 잔상 (Dash Ghost Trails - Batched)
  drawDashGhostTrails(ctx, ts) {
    if (!this.entityMgr.ghostTrails || this.entityMgr.ghostTrails.length === 0) return;
    ctx.save();
    for (const gt of this.entityMgr.ghostTrails) {
      const progress = gt.age / gt.duration;
      const alpha = Math.max(0, 1 - progress) * 0.55;
      if (alpha <= 0.02) continue;
      const gx = Math.round(gt.x * ts);
      const gy = Math.round(gt.y * ts);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = gt.color || '#38bdf8';
      ctx.fillRect(gx - 5, gy - 12, 10, 12);
      ctx.fillRect(gx - 3, gy - 16, 6, 4);
    }
    ctx.restore();
  }

  // 👥 [10.5-B2] 그림자 분신 & 환영검무 참격 (Shadow Decoy & Phantom Blade Cleave)
  drawShadowDecoys(ctx, ts, timeSec) {
    if (!this.entityMgr.shadowDecoys || this.entityMgr.shadowDecoys.length === 0) return;
    ctx.save();
    for (const sd of this.entityMgr.shadowDecoys) {
      const sx = Math.round(sd.x * ts);
      const sy = Math.round(sd.y * ts);
      const alpha = Math.max(0, 1 - (sd.age / sd.duration));
      if (alpha <= 0.02) continue;

      ctx.save();
      ctx.globalAlpha = alpha * 0.88;

      // 1. 발밑 그림자 분신 마법진 (Purple Phantom Circle & Pulse)
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 3, 14, 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 분신 펄싱 외곽선
      const ringR = 8 + (sd.age * 22) % 12;
      ctx.strokeStyle = `rgba(192, 132, 252, ${alpha * 0.45})`;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 3, ringR, ringR * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 2. 환영 실루엣 렌더링 (Ethereal Phantom Shadow Hero)
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(sx - 6, sy - 14, 12, 14);
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(sx - 4, sy - 18, 8, 5);
      ctx.fillStyle = '#e879f9';
      const eyeOff = (sd.facing === 'left') ? -3 : 2;
      ctx.fillRect(sx + eyeOff, sy - 16, 2, 2);

      // 3. 그림자 검
      ctx.fillStyle = '#a855f7';
      const swordX = (sd.facing === 'left') ? sx - 10 : sx + 7;
      ctx.fillRect(swordX, sy - 12, 3, 10);
      ctx.fillStyle = '#f0abfc';
      ctx.fillRect(swordX, sy - 14, 3, 3);

      // 4. 환영검무 참격 베기 연출 (360-Degree Phantom Crescent Cleave)
      if (sd.slashed) {
        const slashAge = sd.age - 0.20;
        const slashProgress = Math.min(1, slashAge / 0.35);
        const slashRadius = 16 + slashProgress * 22;
        const slashAlpha = Math.max(0, 1 - slashProgress);

        ctx.strokeStyle = `rgba(216, 180, 254, ${slashAlpha * 0.95})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(sx, sy - 6, slashRadius, timeSec * 6, timeSec * 6 + Math.PI * 1.6);
        ctx.stroke();

        ctx.strokeStyle = `rgba(240, 171, 252, ${slashAlpha * 0.7})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy - 6, slashRadius * 0.75, -timeSec * 5, -timeSec * 5 + Math.PI * 1.4);
        ctx.stroke();
      }

      ctx.restore();
    }
    ctx.restore();
  }

  // ⚔️ [10.5-C] 16비트 오버헤드 전투 체력바 (Retro Overhead Combat HP Bar)
  drawEntityCombatHUD(ctx, ts, zoom, minTx, maxTx, minTy, maxTy) {
    if (zoom < 0.35) return;
    for (const e of this.entityMgr.entities) {
      if (e.x < minTx || e.x > maxTx || e.y < minTy || e.y > maxTy) continue;
      if (e.hp >= e.maxHp && (!e.hitTimer || e.hitTimer <= 0)) continue;
      if (e.hp <= 0) continue;

      const px = Math.round(e.x * ts);
      const sc = e.scale || 1.0;
      const py = Math.round(e.y * ts - 19 * sc);
      const w = Math.round(22 * Math.max(0.8, Math.min(1.6, sc)));
      const h = 4;
      const pct = Math.max(0, Math.min(1, e.hp / e.maxHp));

      // 16비트 픽셀 테두리 & 배경
      ctx.fillStyle = '#090d16';
      ctx.fillRect(px - Math.floor(w / 2) - 1, py - 1, w + 2, h + 2);

      // 체력 바 색상 (플레이어/아군: 에메랄드, 몬스터: 루비레드, 보스: 골든오렌지)
      const isPlayer = (e.role === 'player');
      const isBoss = (e.isBoss || (this.entityMgr.rpgManager && this.entityMgr.rpgManager.activeBoss === e));
      const barColor = isBoss ? '#f97316' : (isPlayer ? '#22c55e' : (e.faction === 'monster' ? '#ef4444' : '#38bdf8'));

      ctx.fillStyle = barColor;
      ctx.fillRect(px - Math.floor(w / 2), py, Math.round(w * pct), h);

      // 상단 하이라이트 림
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(px - Math.floor(w / 2), py, Math.round(w * pct), 1);
    }
  }

  // 🌸 [13.5] 대기 환경 부유 파티클 (꽃잎, 밤 반딧불이, 사막 먼지, 불꽃, 수면 반짝임)
  drawAtmosphericParticles(ctx, cw, ch, timeSec, camera, worldTime) {
    if (!this.ambientParticles) return;
    const isNight = worldTime ? (worldTime.hour >= 19 || worldTime.hour < 5) : false;

    for (let i = 0; i < this.ambientParticles.length; i++) {
      const p = this.ambientParticles[i];

      // 파티클 위치 갱신 (화면 래핑)
      p.x += p.vx;
      p.y += p.vy + Math.sin(timeSec * 2.2 + p.phase) * 0.45;

      if (p.x > cw + 10) p.x = -10;
      if (p.x < -10) p.x = cw + 10;
      if (p.y > ch + 10) p.y = -10;
      if (p.y < -10) p.y = ch + 10;

      if (p.type === 'petal') {
        // 🌸 바람에 실려 흩날리는 분홍 벚꽃잎 & 데이지 꽃잎
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.phase + timeSec * 1.5);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.72;
        ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
        ctx.restore();
      } else if (p.type === 'firefly' && isNight) {
        // 🌟 밤에 영롱하게 반짝이는 초록/황금 반딧불이 (Sine Wave Glow Pulse)
        const alpha = Math.max(0, Math.sin(timeSec * 3.5 + p.phase));
        if (alpha > 0.05) {
          ctx.save();
          ctx.fillStyle = `rgba(190, 242, 100, ${alpha * 0.85})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (p.type === 'spark') {
        // 🔥 은은하게 피어오르는 황혼/야외 불꽃 스파크
        ctx.save();
        ctx.fillStyle = '#f97316';
        ctx.globalAlpha = 0.65;
        ctx.fillRect(p.x, p.y, 2, 2);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(p.x, p.y - 1, 1, 1);
        ctx.restore();
      } else if (p.type === 'shimmer') {
        // ✨ 수면/들판 햇살 다이아몬드 반짝임
        const shimmerAlpha = Math.max(0, Math.sin(timeSec * 4.0 + p.phase));
        if (shimmerAlpha > 0.3) {
          ctx.save();
          ctx.fillStyle = `rgba(255, 255, 255, ${shimmerAlpha * 0.75})`;
          ctx.fillRect(p.x, p.y - 2, 1, 5);
          ctx.fillRect(p.x - 2, p.y, 5, 1);
          ctx.restore();
        }
      } else if (p.type === 'leaf') {
        // 🍂 가을 숲 바람에 실려 흩날리는 황금/오렌지 단풍잎
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.phase + timeSec * 2.0);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-p.size, -p.size / 2, p.size * 1.8, p.size * 0.9);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, -1, 1, p.size);
        ctx.restore();
      } else if (p.type === 'snow') {
        // ❄️ 북부 설원 & 겨울의 흩날리는 순백 눈꽃 결정
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      } else if (p.type === 'ash') {
        // 🌋 화산 군도 및 황무지의 붉은 불꽃 재
        ctx.save();
        const ashGlow = Math.sin(timeSec * 5.0 + p.phase);
        ctx.fillStyle = ashGlow > 0 ? '#f97316' : '#ef4444';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(p.x, p.y, 2, 2);
        ctx.restore();
      }
    }
  }

  // 💥 [8.6] 방사형 충격파 링 렌더러 (Expanding Radial Shockwave Renderer)
  drawShockwaves(ctx, ts) {
    if (!this.entityMgr.shockwaves || this.entityMgr.shockwaves.length === 0) return;
    for (const sw of this.entityMgr.shockwaves) {
      const progress = sw.age / sw.duration;
      const curR = Math.round(sw.maxRadius * ts * Math.sin(progress * Math.PI * 0.5));
      const alpha = Math.max(0, 1 - progress);
      const px = Math.round(sw.x * ts);
      const py = Math.round(sw.y * ts);

      ctx.save();
      ctx.globalAlpha = alpha;

      // 외곽 팽창 충격파 링 (Outer shockwave ring)
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = Math.max(1, 4 * (1 - progress));
      ctx.beginPath();
      ctx.arc(px, py, curR, 0, Math.PI * 2);
      ctx.stroke();

      // 내부 광채 링 (Inner luminous rim)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(0.5, 2 * (1 - progress));
      ctx.beginPath();
      ctx.arc(px, py, Math.max(1, curR * 0.82), 0, Math.PI * 2);
      ctx.stroke();

      // 바닥 잔광 왜곡 필드 (Soft luminous glow fill)
      ctx.fillStyle = sw.color;
      ctx.globalAlpha = alpha * 0.15;
      ctx.beginPath();
      ctx.arc(px, py, curR, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ☁️ [12.35] 대륙 대기 입체 구름 그림자 (Volumetric Cloud Shadows Drifting Across Continent)
  drawCloudShadows(ctx, ts, timeSec, camera, worldTime, minTx, maxTx, minTy, maxTy) {
    const hour = worldTime ? worldTime.hour : 12;
    // 주간(6시~18시) 동안 부드럽게 나타나고 아침/저녁에 페이드인/아웃
    let daylight = 0;
    if (hour >= 6 && hour < 8) {
      daylight = (hour - 6) / 2;
    } else if (hour >= 8 && hour < 17) {
      daylight = 1.0;
    } else if (hour >= 17 && hour < 19) {
      daylight = 1.0 - (hour - 17) / 2;
    } else {
      return; // 야간에는 구름 그림자 숨김
    }

    const worldPixelW = this.world.width * ts;
    const worldPixelH = this.world.height * ts;
    const speed = 24; // 초당 24픽셀 속도로 북동쪽으로 자연스럽게 부유
    const offsetX = (timeSec * speed) % (worldPixelW * 0.5);
    const offsetY = (timeSec * (speed * 0.45)) % (worldPixelH * 0.5);

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.18)'; // 깊이감 있는 푸른 네이비톤 그림자
    ctx.globalAlpha = daylight * 0.85;

    const stepX = 460;
    const stepY = 360;
    const startX = Math.floor((minTx * ts - offsetX) / stepX) * stepX + offsetX;
    const endX = maxTx * ts + 260;
    const startY = Math.floor((minTy * ts - offsetY) / stepY) * stepY + offsetY;
    const endY = maxTy * ts + 260;

    for (let cx = startX; cx <= endX; cx += stepX) {
      for (let cy = startY; cy <= endY; cy += stepY) {
        const gx = Math.floor(cx / stepX);
        const gy = Math.floor(cy / stepY);
        const seed = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);
        if (rand > 0.65) continue; // 일부 구역은 맑은 하늘 연출

        const r1 = 85 + (rand * 65);
        const r2 = r1 * (0.58 + (rand * 0.28));
        const rot = rand * Math.PI;

        ctx.beginPath();
        ctx.ellipse(cx, cy, r1, r2, rot, 0, Math.PI * 2);
        ctx.ellipse(cx + r1 * 0.52, cy - r2 * 0.28, r1 * 0.65, r2 * 0.6, rot + 0.35, 0, Math.PI * 2);
        ctx.ellipse(cx - r1 * 0.42, cy + r2 * 0.25, r1 * 0.55, r2 * 0.5, rot - 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // ✨ [2.8] 플레이어 영웅 2차 각성 회전 룬 마법진 오라 (Hero Awakening Aura)
  drawHeroAwakeningAura(ctx, px, py, sc, timeSec, awakening) {
    ctx.save();
    const rot = timeSec * 1.8;
    const col = awakening.color || '#f59e0b';

    // 1. 발밑 회전 마법진 링
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.68 + Math.sin(timeSec * 4) * 0.2;

    ctx.beginPath();
    ctx.ellipse(px, py, 14 * sc, 7 * sc, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(px, py, 10 * sc, 5 * sc, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. 4방위 회전 룬 표식
    for (let i = 0; i < 4; i++) {
      const ang = rot + (Math.PI / 2) * i;
      const rx = px + Math.cos(ang) * (14 * sc);
      const ry = py + Math.sin(ang) * (7 * sc);
      ctx.fillStyle = col;
      ctx.fillRect(rx - 1.5 * sc, ry - 1.5 * sc, 3 * sc, 3 * sc);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx - 0.5 * sc, ry - 0.5 * sc, 1 * sc, 1 * sc);
    }

    // 3. 클래스별 고유 오라 효과
    if (awakening.id === 'blademaster') {
      // ⚔️ 검성: 회전하는 황금 검기 잔영
      const sAng = -rot * 2.2;
      const sx = px + Math.cos(sAng) * (18 * sc);
      const sy = py - 8 * sc + Math.sin(sAng) * (6 * sc);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(sx - 1 * sc, sy - 4 * sc, 2 * sc, 8 * sc);
    } else if (awakening.id === 'archmage') {
      // 🔮 아크메이지: 궤도 선회 비전 보주 3개
      for (let j = 0; j < 3; j++) {
        const oAng = rot * 1.5 + (Math.PI * 2 / 3) * j;
        const ox = px + Math.cos(oAng) * (15 * sc);
        const oy = py - 10 * sc + Math.sin(oAng) * (7 * sc);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(ox - 2 * sc, oy - 2 * sc, 4 * sc, 4 * sc);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox - 1 * sc, oy - 1 * sc, 2 * sc, 2 * sc);
      }
    } else if (awakening.id === 'skyhunter') {
      // 🏹 스카이헌터: 상승하는 에메랄드 깃털 스파크
      const featherY = py - ((timeSec * 25) % (24 * sc));
      const featherX = px + Math.sin(timeSec * 5) * (8 * sc);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(featherX, featherY, 2 * sc, 3 * sc);
    }

    ctx.restore();
  }

  // 🌧️ [1.5-B] 비 올 때 도로/흙길 지면 물웅덩이 & 하늘 반사 & 젖은 표면 스페큘러 광택 (Rain Puddles & Specular Sheen)
  drawRainPuddles(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec) {
    const { width, tiles } = this.world;
    for (let ty = minTy; ty <= maxTy; ty += 2) {
      for (let tx = minTx; tx <= maxTx; tx += 2) {
        const idx = ty * width + tx;
        const t = tiles[idx];
        if (t === TILE.ROAD || t === TILE.DIRT || t === TILE.COBBLESTONE || t === TILE.CASTLE_FLOOR || t === TILE.BRIDGE) {
          // 1. 젖은 노면 상단 1px 스페큘러 광택선 (Wet Surface Specular Gloss)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.fillRect(tx * ts, ty * ts, ts, 1.5);

          const h = (tx * 31 + ty * 59) & 63;
          if (h < 22) {
            const px = tx * ts + (h % 12);
            const py = ty * ts + ((h >> 2) % 12);
            const pw = 16 + (h % 12);
            const ph = 9 + (h % 6);

            ctx.save();
            // 2. 웅덩이 수면 하늘 반사 그래디언트 (Sky Reflection Sheen)
            const grad = ctx.createLinearGradient(px, py, px, py + ph);
            grad.addColorStop(0, 'rgba(186, 230, 253, 0.42)');
            grad.addColorStop(0.4, 'rgba(96, 165, 250, 0.28)');
            grad.addColorStop(1, 'rgba(30, 58, 138, 0.38)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(px + pw / 2, py + ph / 2, pw / 2, ph / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // 3. 다중 빗방울 동심 파문 (Dual Concentric Ripples)
            const ripPhase1 = (timeSec * 3.2 + h * 0.18) % 1.0;
            const ripR1 = (pw / 2) * ripPhase1;
            ctx.strokeStyle = `rgba(240, 249, 255, ${0.55 * (1 - ripPhase1)})`;
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.ellipse(px + pw / 2, py + ph / 2, Math.max(1, ripR1), Math.max(0.5, ripR1 * 0.5), 0, 0, Math.PI * 2);
            ctx.stroke();

            const ripPhase2 = (timeSec * 3.2 + h * 0.18 + 0.45) % 1.0;
            const ripR2 = (pw / 2) * ripPhase2;
            ctx.strokeStyle = `rgba(224, 242, 254, ${0.40 * (1 - ripPhase2)})`;
            ctx.beginPath();
            ctx.ellipse(px + pw / 2, py + ph / 2, Math.max(1, ripR2), Math.max(0.5, ripR2 * 0.5), 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
          }
        }
      }
    }
  }

  // ⚔️ [8.7] 무기 궤적 슬래시 리본 아크 (Melee Weapon Arc Trails - Multi-Layer Fluid Dissolve)
  drawWeaponSlashArcs(ctx, ts) {
    if (!this.entityMgr.slashArcs || this.entityMgr.slashArcs.length === 0) return;
    for (const arc of this.entityMgr.slashArcs) {
      const progress = arc.age / arc.duration;
      const alpha = Math.max(0, 1 - progress);
      const px = Math.round(arc.x * ts);
      const py = Math.round(arc.y * ts);
      const r = arc.radius * ts;

      ctx.save();
      // 1. 외곽 에너지 분산 발광 림
      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = arc.color || '#facc15';
      ctx.lineWidth = Math.max(2.5, 7.5 * (1 - progress));
      ctx.beginPath();
      ctx.arc(px, py, r, arc.startAngle, arc.endAngle);
      ctx.stroke();

      // 2. 주 검기 리본 아크
      ctx.globalAlpha = alpha * 0.90;
      ctx.strokeStyle = arc.color || '#facc15';
      ctx.lineWidth = Math.max(1.8, 4.2 * (1 - progress));
      ctx.beginPath();
      ctx.arc(px, py, r, arc.startAngle, arc.endAngle);
      ctx.stroke();

      // 3. 백색 고에너지 칼날 코어 (Hot White Blade Core)
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(0.8, 2.0 * (1 - progress));
      ctx.beginPath();
      ctx.arc(px, py, r * 0.96, arc.startAngle, arc.endAngle);
      ctx.stroke();

      ctx.restore();
    }
  }

  // ⚡ [8.8] 인챈트 무기 원소 오라 & 회전 위스프 (Enchanted Weapon Aura & Wisps)
  drawEnchantedWeaponAura(ctx, ts, timeSec) {
    const p = this.entityMgr.player;
    const rpg = this.entityMgr.rpgManager;
    if (!p || !rpg || !rpg.enchantedRunes || !rpg.enchantedRunes.weapon) return;
    const runeId = rpg.enchantedRunes.weapon;
    const rune = rpg.runestones ? rpg.runestones.find(r => r.id === runeId) : null;
    if (!rune) return;

    const px = Math.round(p.x * ts);
    const py = Math.round(p.y * ts);

    ctx.save();
    // 룬별 고유 회전 에너지 위스프 파티클 & 오라 링
    const numWisps = 4;
    for (let i = 0; i < numWisps; i++) {
      const angle = timeSec * 3.5 + (i / numWisps) * Math.PI * 2;
      const dist = 13 + Math.sin(timeSec * 5 + i * 1.5) * 3;
      const wx = px + Math.cos(angle) * dist;
      const wy = py + Math.sin(angle) * dist - 6;

      ctx.globalAlpha = 0.65 + Math.sin(timeSec * 8 + i) * 0.25;
      ctx.fillStyle = rune.color;
      ctx.shadowColor = rune.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(wx, wy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 위스프 꼬리 잔상
      const tailAngle = angle - 0.25;
      const tx = px + Math.cos(tailAngle) * (dist * 0.95);
      const ty = py + Math.sin(tailAngle) * (dist * 0.95) - 6;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(tx, ty, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 발밑 원형 원소 마법진 펄스
    ctx.globalAlpha = 0.25 + Math.sin(timeSec * 4) * 0.1;
    ctx.strokeStyle = rune.color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(px, py + 2, 12, 6, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // 🌊 [2.2] 대양 심해 백색 포말 물결 파도 (Deep Ocean Foam Crests)
  drawOceanFoam(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec) {
    const { width, height, tiles } = this.world;
    ctx.save();

    for (let ty = minTy; ty < maxTy; ty += 2) {
      const row = ty * width;
      for (let tx = minTx; tx < maxTx; tx += 2) {
        const t = tiles[row + tx];
        if (t !== TILE.DEEP_WATER && t !== TILE.WATER) continue;

        // 해양 파도 파동 함수
        const wave = Math.sin(tx * 0.38 + ty * 0.28 + timeSec * 1.6);
        if (wave > 0.65) {
          const intensity = (wave - 0.65) / 0.35;
          const px = Math.round(tx * ts);
          const py = Math.round(ty * ts + Math.sin(timeSec * 2.0 + tx) * 2);
          const foamLen = Math.round(10 * intensity);

          ctx.globalAlpha = 0.35 * intensity;
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(px, py, foamLen, 1.5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 2, py - 0.5, Math.max(2, foamLen - 4), 1);
        }
      }
    }
    ctx.restore();
  }

  // 🌌 [13.2] 북극광 오로라 커튼 (Celestial Northern Aurora Borealis)
  drawAuroraBorealis(ctx, cw, ch, timeSec, worldTime, camera) {
    if (!worldTime) return;
    const h = worldTime.hour + worldTime.minute / 60;
    const isNight = (h >= 19.5 || h < 4.8);
    if (!isNight) return;

    const camY = camera ? camera.y : 300;
    if (camY > 280) return; // 북부 고위도로 갈수록 장엄하게 발현

    const northFactor = Math.max(0, Math.min(1, (280 - camY) / 200));
    const baseAlpha = 0.42 * northFactor;
    if (baseAlpha <= 0.02) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 3겹의 다층 하모닉 오로라 리본
    const layers = [
      { color1: 'rgba(52, 211, 153, ', color2: 'rgba(56, 189, 248, ', speed: 0.35, freq: 0.004, amp: 45, yOffset: 0.12 },
      { color1: 'rgba(56, 189, 248, ', color2: 'rgba(168, 85, 247, ', speed: -0.28, freq: 0.0055, amp: 38, yOffset: 0.18 },
      { color1: 'rgba(168, 85, 247, ', color2: 'rgba(236, 72, 153, ', speed: 0.42, freq: 0.0035, amp: 50, yOffset: 0.24 }
    ];

    layers.forEach((ly, idx) => {
      const grad = ctx.createLinearGradient(0, 0, 0, ch * 0.5);
      const alphaVal = baseAlpha * (0.7 + Math.sin(timeSec * 0.8 + idx) * 0.3);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.2, ly.color1 + (alphaVal * 0.7) + ')');
      grad.addColorStop(0.5, ly.color2 + alphaVal + ')');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);

      const step = 20;
      for (let x = 0; x <= cw; x += step) {
        const wave1 = Math.sin(x * ly.freq + timeSec * ly.speed) * ly.amp;
        const wave2 = Math.cos(x * ly.freq * 1.8 - timeSec * (ly.speed * 0.7)) * (ly.amp * 0.5);
        const y = ch * ly.yOffset + wave1 + wave2;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(cw, 0);
      ctx.closePath();
      ctx.fill();
    });

    ctx.restore();
  }

  // 🌌 [13.2-B] 고해상도 밤하늘 성운 & 항성계 (Dynamic Celestial Night Sky & Cosmic Nebula)
  drawCelestialNightSky(ctx, cw, ch, timeSec, worldTime, camera) {
    if (!worldTime) return;
    const h = worldTime.hour + worldTime.minute / 60;
    const isNight = (h >= 19.0 || h < 5.8);
    if (!isNight) return;

    let nightFactor = 0;
    if (h >= 19.0 && h < 21.2) nightFactor = (h - 19.0) / 2.2;
    else if (h >= 21.2 || h < 4.2) nightFactor = 1.0;
    else if (h >= 4.2 && h < 5.8) nightFactor = Math.max(0, (5.8 - h) / 1.6);

    if (nightFactor <= 0.02) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // 1. 거대 은하수 / 성운 리본 (Cosmic Nebula Ribbon)
    const nebAlpha = 0.36 * nightFactor;
    if (nebAlpha > 0.02) {
      const camOffX = camera ? camera.x * 0.08 : 0;
      const camOffY = camera ? camera.y * 0.08 : 0;
      const nebTime = timeSec * 0.12;

      // 대각선 성운 구름 3대 권역 (보랏빛 심연, 에메랄드 시안, 성운 마젠타)
      const nebPatches = [
        { x: cw * 0.28 - (camOffX % (cw * 0.4)), y: ch * 0.32 - (camOffY % (ch * 0.4)), rx: cw * 0.46, ry: ch * 0.22, rot: -0.38, col1: `rgba(147, 51, 234, ${nebAlpha * 0.75})`, col2: 'rgba(88, 28, 135, 0)' },
        { x: cw * 0.68 - (camOffX % (cw * 0.4)), y: ch * 0.48 - (camOffY % (ch * 0.4)), rx: cw * 0.50, ry: ch * 0.25, rot: -0.42, col1: `rgba(45, 212, 191, ${nebAlpha * 0.65})`, col2: 'rgba(15, 118, 110, 0)' },
        { x: cw * 0.46 - (camOffX % (cw * 0.4)), y: ch * 0.66 - (camOffY % (ch * 0.4)), rx: cw * 0.38, ry: ch * 0.18, rot: -0.34, col1: `rgba(236, 72, 153, ${nebAlpha * 0.55})`, col2: 'rgba(157, 23, 77, 0)' }
      ];

      for (let n = 0; n < nebPatches.length; n++) {
        const np = nebPatches[n];
        ctx.save();
        ctx.translate(np.x + Math.sin(nebTime + n) * 12, np.y + Math.cos(nebTime * 0.8 + n) * 8);
        ctx.rotate(np.rot + Math.sin(nebTime * 0.5 + n) * 0.05);
        const grad = ctx.createRadialGradient(0, 0, Math.max(2, np.ry * 0.15), 0, 0, np.rx);
        grad.addColorStop(0, np.col1);
        grad.addColorStop(0.5, np.col1.replace(/[\d\.]+\)$/, (nebAlpha * 0.35) + ')'));
        grad.addColorStop(1, np.col2);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(0, 0, np.rx, np.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. 다중 등급 반짝이는 항성계 & 별자리 (Twinkling Multi-Magnitude Starfield)
    const starAlpha = 0.85 * nightFactor;
    const cellW = 85;
    const cellH = 85;
    const startCellX = Math.floor((camera ? camera.x * 0.12 : 0) / cellW) - 1;
    const endCellX = startCellX + Math.ceil(cw / cellW) + 2;
    const startCellY = Math.floor((camera ? camera.y * 0.12 : 0) / cellH) - 1;
    const endCellY = startCellY + Math.ceil(ch / cellH) + 2;

    const camXShift = camera ? (camera.x * 0.12) : 0;
    const camYShift = camera ? (camera.y * 0.12) : 0;

    for (let cy = startCellY; cy <= endCellY; cy++) {
      for (let cx = startCellX; cx <= endCellX; cx++) {
        const hash = Math.sin(cx * 127.1 + cy * 311.7) * 43758.5453123;
        const rand1 = hash - Math.floor(hash);
        const rand2 = (hash * 1.5) - Math.floor(hash * 1.5);
        const rand3 = (hash * 2.3) - Math.floor(hash * 2.3);

        const screenX = Math.round((cx * cellW + rand1 * (cellW - 12)) - camXShift);
        const screenY = Math.round((cy * cellH + rand2 * (cellH - 12)) - camYShift);

        if (screenX < 0 || screenX > cw || screenY < 0 || screenY > ch) continue;

        const twinkle = 0.45 + 0.55 * Math.sin(timeSec * (2.2 + rand3 * 3.2) + rand1 * 6.28);
        const curAlpha = starAlpha * twinkle;
        if (curAlpha <= 0.05) continue;

        ctx.globalAlpha = curAlpha;

        if (rand3 > 0.82) {
          // 1등급 큰 별 (십자 회절 빔 스파이크)
          ctx.fillStyle = rand1 > 0.5 ? '#bae6fd' : '#fef08a';
          ctx.fillRect(screenX, screenY, 2, 2);
          ctx.globalAlpha = curAlpha * 0.65;
          ctx.fillRect(screenX - 2, screenY, 6, 1);
          ctx.fillRect(screenX, screenY - 2, 1, 6);
        } else if (rand3 > 0.45) {
          // 2등급 별 (2px 픽셀 스타)
          ctx.fillStyle = rand2 > 0.5 ? '#e0f2fe' : '#ffffff';
          ctx.fillRect(screenX, screenY, 2, 2);
        } else {
          // 3등급 미세 별 (1px)
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(screenX, screenY, 1, 1);
        }
      }
    }

    ctx.restore();
  }

  // 🏕️ [3.1] 모닥불 꼬치구이 요리 & 지글거리는 연기 모션
  drawCookingSkewerMotion(ctx, px, py, timeSec) {
    ctx.save();
    // 1. 꼬치 꼬챙이 (Wooden Skewer)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + 4, py - 6, 12, 2);

    // 2. 꼬치 고기 덩어리
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(px + 6, py - 9, 8, 8);
    // 그릴 자국
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px + 8, py - 9, 1, 8);
    ctx.fillRect(px + 11, py - 9, 1, 8);
    // 황금빛 시즈닝 글레이즈
    ctx.fillStyle = '#fde047';
    ctx.fillRect(px + 7, py - 8, 2, 2);

    // 3. 지글거리는 모락모락 연기 3줄기
    ctx.fillStyle = 'rgba(241, 245, 249, 0.65)';
    for (let s = 0; s < 3; s++) {
      const sAge = (timeSec * 2.5 + s * 0.4) % 1.2;
      const sX = px + 10 + Math.sin(timeSec * 4 + s) * 3;
      const sY = py - 10 - sAge * 14;
      const sAlpha = Math.max(0, 1 - sAge / 1.2) * 0.6;
      ctx.globalAlpha = sAlpha;
      ctx.fillRect(Math.round(sX), Math.round(sY), 2 + Math.floor(sAge * 2), 2 + Math.floor(sAge * 2));
    }
    ctx.restore();
  }

  // 🍖 [3.2] 포만감(Well-Fed) 활성 상태 오버헤드 룬 인디케이터
  drawWellFedBuffBadge(ctx, px, py, timeSec, timer) {
    ctx.save();
    const bob = Math.sin(timeSec * 3.5) * 2;
    const bx = px + 14;
    const by = py - 20 + bob;

    // 미니 뱃지 배경
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(bx - 1, by - 1, 28, 10);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(bx, by, 26, 8);

    // 고기 아이콘 & 텍스트
    ctx.font = 'bold 7px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🍖${Math.ceil(timer)}s`, bx + 13, by + 4);
    ctx.restore();
  }

  // 🏛️ [12.1-B] 5대 고대 석판 모놀리스 (5 Ancient Monolith Steles)
  drawMonolithSteles(ctx, ts, timeSec, zoom) {
    if (!this.entityMgr.rpgManager || !this.entityMgr.rpgManager.monoliths) return;
    const p = this.entityMgr.player;

    for (const m of this.entityMgr.rpgManager.monoliths) {
      const px = Math.round(m.x * ts);
      const py = Math.round(m.y * ts);

      ctx.save();

      // 모놀리스 기단부 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(px, py + 4, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // 고대 석재 본체 기둥 (3단 오벨리스크)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(px - 10, py - 36, 20, 38);
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - 8, py - 34, 16, 34);

      // 상단 피라미디온 꼭지점
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(px - 10, py - 36);
      ctx.lineTo(px, py - 48);
      ctx.lineTo(px + 10, py - 36);
      ctx.closePath();
      ctx.fill();

      // 룬 각인 발광
      const pulse = 0.5 + Math.sin(timeSec * 3 + m.x) * 0.45;
      ctx.fillStyle = m.color;
      ctx.shadowColor = m.color;
      ctx.shadowBlur = 10 * pulse;
      ctx.globalAlpha = m.unlocked ? 0.9 : 0.65 * pulse;

      // 새겨진 고대 룬 문자
      ctx.fillRect(px - 2, py - 30, 4, 6);
      ctx.fillRect(px - 4, py - 21, 8, 3);
      ctx.fillRect(px - 2, py - 15, 4, 5);
      ctx.fillRect(px - 3, py - 7, 6, 2);

      // 상단 공전 유물 아이콘
      ctx.font = '16px serif';
      ctx.textAlign = 'center';
      const floatY = py - 52 + Math.sin(timeSec * 2.5 + m.y) * 4;
      ctx.fillText(m.icon, px, floatY);

      // 플레이어 접근 시 인터랙션 프롬프트
      if (p) {
        const dist = Math.hypot(p.x - m.x, p.y - m.y);
        if (dist < 4.0) {
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;
          ctx.font = 'bold 11px Pretendard, sans-serif';
          ctx.fillStyle = '#0f172a';
          const label = m.unlocked ? `📖 [${m.name}] (판독 완료)` : `✨ [E] ${m.name} 판독`;
          const textW = ctx.measureText(label).width;
          ctx.fillRect(px - textW / 2 - 6, py - 72, textW + 12, 18);
          ctx.strokeStyle = m.color;
          ctx.lineWidth = 1;
          ctx.strokeRect(px - textW / 2 - 6, py - 72, textW + 12, 18);
          ctx.fillStyle = m.unlocked ? '#4ade80' : '#fde047';
          ctx.fillText(label, px, py - 59);
        }
      }

      ctx.restore();
    }
  }

  // ⚔️ [12.1-D] 보스 결계 룬 링 & 2페이즈 광폭화 오라 (Boss Arena Barrier & Phase 2 Enrage Aura)
  drawBossArenaBarrier(ctx, ts, timeSec, zoom) {
    const rpg = this.entityMgr.rpgManager;
    if (!rpg || !rpg.activeBoss || rpg.activeBoss.hp <= 0) return;
    const boss = rpg.activeBoss;

    const bx = Math.round(boss.x * ts);
    const by = Math.round(boss.y * ts);

    ctx.save();

    // 1. 2페이즈 광폭화 시 보스 본체 화염 오라 (Pulsing Crimson Enrage Aura)
    if (boss.phase2) {
      const auraR = (boss.scale || 1.3) * 26 + Math.sin(timeSec * 6) * 4;
      const grad = ctx.createRadialGradient(bx, by, Math.max(2, auraR * 0.2), bx, by, auraR);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      grad.addColorStop(0.6, 'rgba(220, 38, 38, 0.22)');
      grad.addColorStop(1, 'rgba(153, 27, 27, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, auraR, 0, Math.PI * 2);
      ctx.fill();

      // 주변을 맴도는 붉은 룬 스파크
      for (let s = 0; s < 4; s++) {
        const sAng = timeSec * 5 + (s * Math.PI / 2);
        const sx = bx + Math.cos(sAng) * (auraR * 0.85);
        const sy = by + Math.sin(sAng) * (auraR * 0.85);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(Math.round(sx - 1), Math.round(sy - 1), 3, 3);
      }
    }

    // 2. 던전 또는 보스 전장 결계 원형 배리어 (Runic Arena Barrier)
    const barrierRadius = 9.5 * ts;
    const isEnraged = !!boss.phase2;
    const barrierColor = isEnraged ? '#ef4444' : '#a855f7';
    const barrierAlpha = 0.55 + Math.sin(timeSec * 3) * 0.15;

    ctx.globalAlpha = barrierAlpha;
    ctx.strokeStyle = barrierColor;
    ctx.lineWidth = 2.0;

    // 회전하는 룬 배리어 링
    ctx.beginPath();
    ctx.arc(bx, by, barrierRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 동심 보조 링
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = isEnraged ? '#fca5a5' : '#e9d5ff';
    ctx.beginPath();
    ctx.arc(bx, by, barrierRadius * 0.96, 0, Math.PI * 2);
    ctx.stroke();

    // 8방위 룬 기둥 표식
    for (let r = 0; r < 8; r++) {
      const rAng = (r * Math.PI / 4) + (timeSec * 0.4 * (isEnraged ? 2.0 : 1.0));
      const rx = bx + Math.cos(rAng) * barrierRadius;
      const ry = by + Math.sin(rAng) * barrierRadius;
      ctx.fillStyle = isEnraged ? '#fef08a' : '#c084fc';
      ctx.fillRect(Math.round(rx - 2), Math.round(ry - 2), 5, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(rx - 1), Math.round(ry - 1), 2, 2);
    }

    ctx.restore();
  }

  // 🌊 [2.2] 수면 거울 반사 효과 (Dynamic Water Mirror Reflections & Distorted Ripples)
  drawWaterReflections(ctx, ts, timeSec, minTx, maxTx, minTy, maxTy) {
    if (!this.entityMgr || !this.entityMgr.entities) return;
    const ents = this.entityMgr.entities;
    if (!ents || ents.length === 0) return;

    ctx.save();
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.hp <= 0) continue;
      if (e.x < minTx - 1 || e.x > maxTx + 1 || e.y < minTy - 1 || e.y > maxTy + 2) continue;

      const tx = Math.floor(e.x);
      const ty = Math.floor(e.y);
      const tileCur = this.world.getTile(tx, ty);
      const tileBelow = this.world.getTile(tx, ty + 1);

      const onWater = (tileCur === TILE.WATER || tileCur === TILE.DEEP_WATER);
      const nearWater = (tileBelow === TILE.WATER || tileBelow === TILE.DEEP_WATER);
      if (!onWater && !nearWater && !e.isShip) continue;

      const px = Math.round(e.x * ts);
      const py = Math.round(e.y * ts);

      // 수면 파동 왜곡 (Wave displacement)
      const rippleDisplace = Math.sin(timeSec * 3.5 + e.x * 2.0 + e.y) * 2.4;

      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.translate(px + rippleDisplace, py + 8);
      ctx.scale(1.0, -0.6); // 상하 반전 및 납작하게 왜곡

      const col = e.isShip ? '#38bdf8' : (e.role === 'dragon' ? '#ef4444' : (e.color || '#94a3b8'));
      ctx.fillStyle = col;

      const radX = (e.role === 'dragon' || e.isShip) ? 20 : 10;
      const radY = (e.role === 'dragon' || e.isShip) ? 14 : 7;
      ctx.beginPath();
      ctx.ellipse(0, 0, radX, radY, 0, 0, Math.PI * 2);
      ctx.fill();

      // 수면 거울 물결 줄무늬
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-radX * 0.9, 2);
      ctx.lineTo(radX * 0.9, 2);
      ctx.moveTo(-radX * 0.6, 5);
      ctx.lineTo(radX * 0.6, 5);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  // 💎 [2.3] 다이아몬드 코스틱 굴절광 (Dynamic Water Caustics Shimmer - High Resolution Dual Layer)
  drawWaterCaustics(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec) {
    if (!this.world || !this.world.tiles) return;
    const tiles = this.world.tiles;
    const width = this.world.width;
    ctx.save();

    for (let ty = minTy; ty <= maxTy; ty += 2) {
      for (let tx = minTx; tx <= maxTx; tx += 2) {
        const t = tiles[ty * width + tx];
        if (t === 0 || t === 1 || t === 26) { // Deep Water, Water, Oasis
          const px = tx * ts;
          const py = ty * ts;
          const w1 = Math.sin(timeSec * 2.2 + tx * 0.85 + ty * 0.45);
          const w2 = Math.cos(timeSec * 1.7 - tx * 0.55 + ty * 0.95);
          if (w1 + w2 > 0.82) {
            const cx = px + (w1 * 0.5 + 0.5) * (ts - 6);
            const cy = py + (w2 * 0.5 + 0.5) * (ts - 6);

            // 1층: 시안 수면 굴절 코스틱
            ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
            ctx.fillRect(Math.round(cx), Math.round(cy), 4, 2);
            ctx.fillRect(Math.round(cx + 1), Math.round(cy - 1), 2, 4);

            // 2층: 얕은 물 햇살 황금빛 윤슬 (Shallow Sunlight Ribbons)
            if (t === 1) {
              ctx.fillStyle = 'rgba(254, 240, 138, 0.32)';
              ctx.fillRect(Math.round(cx - 1), Math.round(cy), 2, 1);
              ctx.fillRect(Math.round(cx + 1), Math.round(cy + 1), 1, 2);
            }
          }
        }
      }
    }
    ctx.restore();
  }

  // 🏹 [9.7] 원거리 활 차징 조준 탄도 궤적선 (Bow Aiming Trajectory & Reticle)
  drawAimingTrajectory(ctx, p, ts, timeSec) {
    if (!p || !p.isCharging || p.weaponMode !== 'ranged') return;

    let targetX = p.x;
    let targetY = p.y;
    if (this.mouseWorldTile) {
      targetX = this.mouseWorldTile.x + 0.5;
      targetY = this.mouseWorldTile.y + 0.5;
    }
    let dx = targetX - p.x;
    let dy = targetY - p.y;
    if (Math.hypot(dx, dy) < 0.5) {
      if (p.facing === 'left') dx = -1;
      else if (p.facing === 'right') dx = 1;
      else if (p.facing === 'up') dy = -1;
      else dy = 1;
    }
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const trajDist = 18.0;

    const startX = Math.round(p.x * ts);
    const startY = Math.round(p.y * ts);
    const endX = Math.round((p.x + nx * trajDist) * ts);
    const endY = Math.round((p.y + ny * trajDist) * ts);

    ctx.save();

    // 1. 점선 조준 궤적선 (Dotted glowing laser guide)
    ctx.strokeStyle = p.chargeMaxReached ? '#fde047' : '#38bdf8';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 6]);
    ctx.lineDashOffset = -timeSec * 35;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 2. 조준점 십자선 (Crosshair Target Reticle)
    const retX = Math.round((p.x + nx * Math.min(len, trajDist)) * ts);
    const retY = Math.round((p.y + ny * Math.min(len, trajDist)) * ts);
    const retR = 7 + Math.sin(timeSec * 12) * 2;

    ctx.setLineDash([]);
    ctx.strokeStyle = p.chargeMaxReached ? '#fde047' : '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(retX, retY, retR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = p.chargeMaxReached ? '#facc15' : '#38bdf8';
    ctx.fillRect(retX - 1, retY - 1, 3, 3);
    ctx.restore();
  }

  // 🌿 [10.6] 상호작용형 픽셀 풀잎 잔디 파티클 (Interactive Grass Blades & Foliage Debris - Batched)
  drawGrassDebris(ctx, ts) {
    if (!this.entityMgr.grassLeaves || this.entityMgr.grassLeaves.length === 0) return;
    ctx.save();
    for (const gl of this.entityMgr.grassLeaves) {
      const alpha = Math.max(0, 1 - gl.age / gl.duration);
      if (alpha <= 0.02) continue;
      const gx = Math.round(gl.x * ts);
      const gy = Math.round(gl.y * ts);
      const sz = Math.round(gl.size);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = gl.color;
      ctx.fillRect(gx, gy, sz, Math.max(1, sz - 1));
      ctx.fillStyle = '#bbf7d0';
      ctx.fillRect(gx + 1, gy, 1, 1);
    }
    ctx.restore();
  }

  // 🩸 [8.4] 다크 판타지 영구 지속 지면 전투 혈흔 및 그을음 데칼 (Ground Blood & Blast Scorch Decals)
  drawGroundDecals(ctx, ts, minTx, maxTx, minTy, maxTy) {
    if (!this.entityMgr || !this.entityMgr.bloodDecals) return;
    const decals = this.entityMgr.bloodDecals;
    if (decals.length === 0) return;

    ctx.save();
    for (let i = 0; i < decals.length; i++) {
      const d = decals[i];
      if (d.x < minTx - 1 || d.x > maxTx + 1 || d.y < minTy - 1 || d.y > maxTy + 1) continue;
      const progress = d.age / d.duration;
      const alpha = Math.max(0, 1 - progress * 0.85) * 0.84;
      if (alpha <= 0.02) continue;

      const px = Math.round(d.x * ts);
      const py = Math.round(d.y * ts);
      const r = d.radius;

      ctx.fillStyle = d.color;
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      if (d.shape === 0) {
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.arc(px + r * 0.7, py - r * 0.5, r * 0.4, 0, Math.PI * 2);
        ctx.arc(px - r * 0.8, py + r * 0.3, r * 0.35, 0, Math.PI * 2);
      } else if (d.shape === 1) {
        ctx.ellipse(px, py, r * 1.5, r * 0.65, 0.45, 0, Math.PI * 2);
        ctx.arc(px + r * 1.1, py + r * 0.4, r * 0.3, 0, Math.PI * 2);
      } else {
        ctx.ellipse(px, py, r * 1.2, r * 0.8, -0.6, 0, Math.PI * 2);
        ctx.arc(px - r * 0.6, py - r * 0.6, r * 0.45, 0, Math.PI * 2);
        ctx.arc(px + r * 0.7, py + r * 0.4, r * 0.25, 0, Math.PI * 2);
      }
      ctx.fill();

      // 시간이 흐를수록 응고되어 어둡게 변하는 중심 핵
      ctx.fillStyle = '#1c1917';
      ctx.globalAlpha = alpha * 0.45;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 🎬 [13.8] 다크 판타지 시네마틱 비네트 & 콘트라스트 렌즈 림 (Cinematic Dark Fantasy Vignette)
  drawCinematicVignette(ctx, cw, ch) {
    ctx.save();
    const radius = Math.hypot(cw, ch) / 2;
    const grad = ctx.createRadialGradient(cw / 2, ch / 2, radius * 0.42, cw / 2, ch / 2, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.70, 'rgba(10, 15, 29, 0.16)');
    grad.addColorStop(1, 'rgba(2, 6, 18, 0.58)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
    ctx.restore();
  }

  // 💀 [8.5] 영구 지속 픽셀 유골 및 전사자 잔해 (Persistent Skeletal Remains & Carcasses)
  drawDeadRemains(ctx, ts, minTx, maxTx, minTy, maxTy) {
    if (!this.entityMgr || !this.entityMgr.deadRemains) return;
    const remains = this.entityMgr.deadRemains;
    if (remains.length === 0) return;

    ctx.save();
    for (let i = 0; i < remains.length; i++) {
      const r = remains[i];
      if (r.x < minTx - 1 || r.x > maxTx + 1 || r.y < minTy - 1 || r.y > maxTy + 1) continue;
      const progress = r.age / r.duration;
      const alpha = Math.max(0, 1 - progress * 0.7);
      if (alpha <= 0.05) continue;

      const px = Math.round(r.x * ts);
      const py = Math.round(r.y * ts);
      const sc = r.scale || 1.0;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(px, py + 2);
      ctx.rotate(r.angle || 0);

      // 바닥 픽셀 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
      ctx.fillRect(-7 * sc, 1 * sc, 14 * sc, 3 * sc);

      // 해골 뼈대 & 잔해 픽셀 (Skeletal Remains)
      ctx.fillStyle = '#cbd5e1'; // 뼈대
      ctx.fillRect(-5 * sc, -2 * sc, 10 * sc, 3 * sc); // 척추
      ctx.fillRect(-4 * sc, -4 * sc, 4 * sc, 3 * sc);  // 두개골
      ctx.fillRect(2 * sc, -3 * sc, 3 * sc, 2 * sc);   // 늑골

      ctx.fillStyle = '#64748b'; // 부서진 금속 파편
      ctx.fillRect(-6 * sc, 0, 3 * sc, 2 * sc);
      ctx.fillRect(4 * sc, -1 * sc, 3 * sc, 2 * sc);

      ctx.fillStyle = '#475569'; // 눈구멍 암영
      ctx.fillRect(-3 * sc, -3 * sc, 1 * sc, 1 * sc);
      ctx.restore();
    }
    ctx.restore();
  }

  // 🌧️ [2.4] 비/폭풍우 수면 빗방울 동심원 파문 (Dynamic Rain Water Droplet Ripples - Optimized)
  drawWaterDropletRipples(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec) {
    if (!this.world || !this.world.tiles) return;
    const tiles = this.world.tiles;
    const width = this.world.width;
    ctx.save();
    ctx.lineWidth = 1.0;

    for (let ty = minTy; ty <= maxTy; ty += 2) {
      for (let tx = minTx; tx <= maxTx; tx += 2) {
        const t = tiles[ty * width + tx];
        if (t === 0 || t === 1 || t === 26) { // Deep Water, Water, Oasis
          const px = tx * ts;
          const py = ty * ts;
          const hash = (tx * 137 + ty * 349) % 100;
          const phase = (timeSec * 3.5 + hash * 0.1) % 1.0;
          const r = phase * 6.5;
          const alpha = (1 - phase) * 0.55;
          if (alpha > 0.05) {
            ctx.strokeStyle = `rgba(224, 242, 254, ${alpha.toFixed(2)})`;
            ctx.beginPath();
            ctx.ellipse(px + (hash % 10) + 3, py + ((hash >> 2) % 10) + 3, r, r * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }
    ctx.restore();
  }

  // ✨ [10.7] 몽환적인 야간 발광 반딧불이 군집 (Nighttime Bioluminescent Fireflies - Batched)
  drawFireflies(ctx, ts, timeSec, cw, ch) {
    if (!this.entityMgr || !this.entityMgr.fireflies) return;
    const isNight = (this.lastWorldTime && (this.lastWorldTime.hour >= 19 || this.lastWorldTime.hour < 5));
    if (!isNight) return;

    ctx.save();
    for (const ff of this.entityMgr.fireflies) {
      const pulse = Math.sin(timeSec * 4.0 + ff.phase);
      if (pulse < -0.2) continue; // 깜빡임
      const alpha = Math.max(0, pulse) * 0.85;

      const fx = Math.round(ff.x * ts + Math.sin(timeSec * 1.5 + ff.phase) * 6);
      const fy = Math.round(ff.y * ts + Math.cos(timeSec * 1.2 + ff.phase) * 6);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = ff.color;
      ctx.fillRect(fx - 1, fy - 1, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx, fy, 1, 1);
    }
    ctx.restore();
  }

  // 🔥 [13.9] 연속 킬스트릭 피버 모드 화면 테두리 화염 (Killstreak Fever Rim)
  drawKillstreakFeverRim(ctx, cw, ch, timeSec, player) {
    if (!player || (player.killstreak || 0) < 3) return;
    const ks = player.killstreak;
    const feverAlpha = Math.min(0.55, 0.2 + (ks >= 8 ? 0.35 : (ks >= 5 ? 0.22 : 0.1)));
    const feverColor = ks >= 8 ? '#ef4444' : (ks >= 5 ? '#f59e0b' : '#f97316');

    ctx.save();
    const grad = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.42, cw / 2, ch / 2, Math.max(cw, ch) * 0.72);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, feverColor);
    ctx.globalAlpha = feverAlpha * (0.8 + Math.sin(timeSec * 8) * 0.2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    // 킬스트릭 배너
    ctx.font = 'bold 13px Pretendard, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    const title = ks >= 8 ? '👑 GODLIKE FEVER x' + ks : (ks >= 5 ? '⚡ RAMPAGE x' + ks : '🔥 TRIPLE KILL x' + ks);
    ctx.strokeText(title, cw / 2, 48);
    ctx.fillText(title, cw / 2, 48);
    ctx.restore();
  }

  // 💨 [1.4] 닷지 롤 & 착지 모래 먼지 구름 파티클 (Dodge Dust Puffs - Batched)
  drawDustPuffs(ctx, ts) {
    if (!this.entityMgr || !this.entityMgr.dustPuffs) return;
    const dusts = this.entityMgr.dustPuffs;
    if (dusts.length === 0) return;

    ctx.save();
    for (let i = 0; i < dusts.length; i++) {
      const d = dusts[i];
      const prog = d.age / d.duration;
      const alpha = Math.max(0, (1 - prog) * 0.7);
      if (alpha <= 0.02) continue;

      const px = Math.round(d.x * ts);
      const py = Math.round(d.y * ts);
      const sz = Math.round(d.size * (1 + prog * 0.8));

      ctx.globalAlpha = alpha;
      ctx.fillStyle = prog > 0.5 ? '#d97706' : '#fef08a';
      ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(px - sz / 4, py - sz / 4, sz / 2, sz / 2);
    }
    ctx.restore();
  }

  // 📜 [9.3] 고대 유물 보물지도 발굴 현장 및 비콘 룬 (Ancient Treasure Map Excavation Site)
  drawTreasureExcavationSite(ctx, ts, timeSec) {
    if (!this.entityMgr) return;
    const player = this.entityMgr.player || (this.entityMgr.entities && this.entityMgr.entities.find(e => e.isPlayer));
    if (!player || !player.treasureMap) return;
    const tm = player.treasureMap;

    const px = Math.round(tm.x * ts);
    const py = Math.round(tm.y * ts);
    const pulse = 0.5 + Math.sin(timeSec * 3.5) * 0.5;

    ctx.save();
    // 1. 지면 회전 발굴 룬 서클 및 황금빛 오라
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(timeSec * 0.8);
    ctx.fillStyle = 'rgba(234, 179, 8, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, 24 + pulse * 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(250, 204, 21, ${0.4 + pulse * 0.4})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(0, 0, 20 + pulse * 4, 0, Math.PI * 2);
    ctx.stroke();

    // 4방위 고대 룬 표시
    ctx.fillStyle = '#fef08a';
    for (let r = 0; r < 4; r++) {
      const ang = (r * Math.PI) / 2;
      const rx = Math.cos(ang) * 20;
      const ry = Math.sin(ang) * 20;
      ctx.fillRect(rx - 2, ry - 2, 4, 4);
    }
    ctx.restore();

    // 2. 발굴 지점 X 마크 룬
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(px - 10, py - 10);
    ctx.lineTo(px + 10, py + 10);
    ctx.moveTo(px + 10, py - 10);
    ctx.lineTo(px - 10, py + 10);
    ctx.stroke();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(px - 10, py - 10);
    ctx.lineTo(px + 10, py + 10);
    ctx.moveTo(px + 10, py - 10);
    ctx.lineTo(px - 10, py + 10);
    ctx.stroke();

    // 3. 하늘로 뻗는 빛의 기둥 비콘 (Heavenly Beacon Light)
    const beamGrad = ctx.createLinearGradient(px, py, px, py - 160);
    beamGrad.addColorStop(0, `rgba(250, 204, 21, ${0.45 + pulse * 0.25})`);
    beamGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(px - 8, py - 160, 16, 160);

    // 4. 플레이어가 근처에 있을 때 상호작용 프롬프트 안내
    const distToPlayer = Math.hypot(player.x - tm.x, player.y - tm.y);
    if (distToPlayer <= 5.0) {
      ctx.font = 'bold 12px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      const text = '⛏️ [E] 고대 전설 유물 발굴하기!';
      ctx.strokeText(text, px, py - 26 - Math.sin(timeSec * 5) * 3);
      ctx.fillText(text, px, py - 26 - Math.sin(timeSec * 5) * 3);
    }

    ctx.restore();
  }
}

window.WorldRenderer = WorldRenderer;
