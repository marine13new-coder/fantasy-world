// ============================================================================
// renderer.js - 다중 대륙(본토·대해양·신대륙), 해상 범선, 해전 포격, 플레이어 이펙트 렌더러
// ============================================================================

class WorldRenderer {
  constructor(canvas, minimapCanvas, world, entityMgr) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minimapCanvas = minimapCanvas;
    this.minimapCtx = minimapCanvas.getContext('2d');
    this.world = world;
    this.entityMgr = entityMgr;

    this.bakeScale = 14; // 340x240 타일 베이킹 (4760 x 3360)
    this.terrainCanvas = document.createElement('canvas');
    this.terrainCanvas.width = world.width * this.bakeScale;
    this.terrainCanvas.height = world.height * this.bakeScale;

    this.minimapBaseCanvas = document.createElement('canvas');
    this.minimapBaseCanvas.width = world.width;
    this.minimapBaseCanvas.height = world.height;

    this.bakeStaticTerrain();
  }

  bakeStaticTerrain() {
    const tCtx = this.terrainCanvas.getContext('2d');
    const mCtx = this.minimapBaseCanvas.getContext('2d');
    const s = this.bakeScale;
    const { width, height, tiles, deco } = this.world;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const t = tiles[idx];
        const info = TILE_INFO[t] || TILE_INFO[TILE.GRASS];

        tCtx.fillStyle = info.color;
        tCtx.fillRect(x * s, y * s, s, s);

        if ((x + y) % 2 === 0 && t !== TILE.DEEP_WATER && t !== TILE.WATER) {
          tCtx.fillStyle = 'rgba(255, 255, 255, 0.025)';
          tCtx.fillRect(x * s, y * s, s, s);
        }

        if (t === TILE.ROAD) {
          tCtx.fillStyle = '#85755e';
          tCtx.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
          tCtx.fillStyle = '#a89982';
          tCtx.fillRect(x * s + 3, y * s + 3, 3, 3);
          tCtx.fillRect(x * s + 8, y * s + 8, 3, 3);
        } else if (t === TILE.BRIDGE) {
          tCtx.fillStyle = '#5c3a1e';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#9c6639';
          for (let p = 1; p < s; p += 4) {
            tCtx.fillRect(x * s + 1, y * s + p, s - 2, 2);
          }
        } else if (t === TILE.CASTLE_FLOOR) {
          tCtx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
          tCtx.lineWidth = 1;
          tCtx.strokeRect(x * s + 0.5, y * s + 0.5, s - 1, s - 1);
        } else if (t === TILE.WALL) {
          tCtx.fillStyle = '#334155';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#94a3b8';
          tCtx.fillRect(x * s + 2, y * s + 2, s - 4, s - 5);
        } else if (t === TILE.DOCK) {
          tCtx.fillStyle = '#78502b';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#54361b';
          tCtx.fillRect(x * s, y * s + 5, s, 2);
        } else if (t === TILE.FARMLAND) {
          tCtx.fillStyle = '#594222';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#423017';
          for (let r = 2; r < s; r += 4) {
            tCtx.fillRect(x * s + 1, y * s + r, s - 2, 2);
          }
        } else if (t === TILE.LAVA) {
          tCtx.fillStyle = '#f97316';
          tCtx.fillRect(x * s + 3, y * s + 3, s - 6, s - 6);
        }

        const d = deco[idx];
        if (d === 1) {
          // 참나무
          tCtx.fillStyle = '#1e4620';
          tCtx.beginPath();
          tCtx.arc(x * s + 7, y * s + 7, 5.5, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.fillStyle = '#2e6b30';
          tCtx.beginPath();
          tCtx.arc(x * s + 6, y * s + 6, 3.5, 0, Math.PI * 2);
          tCtx.fill();
        } else if (d === 2) {
          // 그림자 숲 침엽수
          tCtx.fillStyle = '#11221c';
          tCtx.beginPath();
          tCtx.moveTo(x * s + 7, y * s + 1);
          tCtx.lineTo(x * s + 13, y * s + 13);
          tCtx.lineTo(x * s + 1, y * s + 13);
          tCtx.closePath();
          tCtx.fill();
        } else if (d === 3) {
          tCtx.fillStyle = (x + y) % 3 === 0 ? '#facc15' : '#f472b6';
          tCtx.fillRect(x * s + 4, y * s + 4, 3, 3);
          tCtx.fillRect(x * s + 9, y * s + 8, 3, 3);
        } else if (d === 4) {
          tCtx.fillStyle = '#64748b';
          tCtx.beginPath();
          tCtx.arc(x * s + 7, y * s + 8, 4.8, 0, Math.PI * 2);
          tCtx.fill();
        } else if (d === 5) {
          // 사막 야자수 / 선인장
          tCtx.fillStyle = '#15803d';
          tCtx.beginPath();
          tCtx.arc(x * s + 7, y * s + 6, 4.5, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.fillStyle = '#4ade80';
          tCtx.fillRect(x * s + 6, y * s + 4, 2, 5);
        } else if (d === 6) {
          // 엘븐하임 신비의 벚꽃/요정수
          tCtx.fillStyle = '#0f766e';
          tCtx.beginPath();
          tCtx.arc(x * s + 7, y * s + 7, 5.8, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.fillStyle = (x + y) % 2 === 0 ? '#f472b6' : '#5eead4';
          tCtx.beginPath();
          tCtx.arc(x * s + 6, y * s + 5.5, 3.6, 0, Math.PI * 2);
          tCtx.fill();
        }

        mCtx.fillStyle = info.miniColor;
        mCtx.fillRect(x, y, 1, 1);
      }
    }
  }

  render(camera, worldTime, filterCategory, selectedItem, timeSec) {
    const ctx = this.ctx;
    const { width: cw, height: ch } = this.canvas;
    const ts = TILE_SIZE;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#071526';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x * ts, -camera.y * ts);

    const halfW = (cw / 2 / camera.zoom) / ts + 4;
    const halfH = (ch / 2 / camera.zoom) / ts + 4;
    const minTx = Math.max(0, Math.floor(camera.x - halfW));
    const maxTx = Math.min(this.world.width, Math.ceil(camera.x + halfW));
    const minTy = Math.max(0, Math.floor(camera.y - halfH));
    const maxTy = Math.min(this.world.height, Math.ceil(camera.y + halfH));

    // 최적화: 전체 4760x3360 캔버스를 매 프레임 그리지 않고 현재 화면에 보이는 영역만 슬라이싱 렌더링
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

    // 1. 대해양 해상 무역 항로 점선 표시 (전략 뷰 및 중간 뷰)
    this.drawSeaRoutes(ctx, ts, timeSec);

    // 2. 농작물 렌더링
    if (camera.zoom > 0.30) {
      for (const plot of this.world.farmPlots) {
        if (plot.x < minTx || plot.x > maxTx || plot.y < minTy || plot.y > maxTy) continue;
        const px = plot.x * ts;
        const py = plot.y * ts;
        const ratio = plot.growth / 100;
        const sway = Math.sin(timeSec * 3 + plot.x * 0.7) * 2.2 * ratio;

        ctx.fillStyle = plot.cropType === '향신료'
          ? '#fb923c'
          : (plot.cropType === '약초' ? '#2dd4bf' : (ratio > 0.75 ? '#facc15' : '#84cc16'));

        const h = Math.max(4, ratio * 16);
        for (let c = 6; c <= 24; c += 8) {
          ctx.fillRect(px + c + sway, py + 24 - h, 4, h);
        }
      }
    }

    // 3. 어부들의 고기잡이배 & 광산 광맥
    for (const sp of this.world.fishingSpots) {
      if (!sp.isBoat) continue;
      if (sp.x < minTx || sp.x > maxTx || sp.y < minTy || sp.y > maxTy) continue;
      const bx = sp.x * ts + ts / 2;
      const by = sp.y * ts + ts / 2 + Math.sin(timeSec * 2.5 + sp.x) * 2.5;

      ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(bx, by + 3, 20, 9, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(bx, by, 17, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(bx, by - 1, 13, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const mn of this.world.mineNodes) {
      if (mn.x < minTx || mn.x > maxTx || mn.y < minTy || mn.y > maxTy) continue;
      const mx = mn.x * ts + ts / 2;
      const my = mn.y * ts + ts / 2;
      ctx.fillStyle = mn.oreType === '금광석' ? '#facc15' : (mn.oreType === '마정석' ? '#c084fc' : '#94a3b8');
      ctx.beginPath();
      ctx.arc(mx, my, 7 + Math.sin(timeSec * 4) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. 주요 건물 렌더링
    for (const b of this.world.buildings) {
      if (b.x + b.w < minTx || b.x - b.w > maxTx || b.y + b.h < minTy || b.y - b.h > maxTy) continue;
      this.drawBuilding(ctx, b, ts, timeSec, camera.zoom, worldTime);
    }

    // 5. 어부들의 낚싯줄과 찌
    if (camera.zoom > 0.35) {
      for (const e of this.entityMgr.entities) {
        if (e.fishingLine && e.x >= minTx && e.x <= maxTx && e.y >= minTy && e.y <= maxTy) {
          const ex = e.x * ts;
          const ey = e.y * ts - 8;
          const wx = e.fishingLine.wx * ts + ts / 2;
          const wy = e.fishingLine.wy * ts + ts / 2 + Math.sin(timeSec * 5 + e.id) * 2.5;

          ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.quadraticCurveTo((ex + wx) / 2, Math.min(ey, wy) - 18, wx, wy);
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(wx, wy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 6. 광역 마법 & 왕국 개입 특수 이펙트 렌더링
    for (const fx of this.entityMgr.specialEffects) {
      const progress = fx.age / fx.duration;
      const curR = fx.radius * ts * (0.3 + progress * 0.7);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(fx.x * ts, fx.y * ts, curR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = fx.color;
      ctx.globalAlpha = Math.max(0, (1 - progress) * 0.25);
      ctx.fill();
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

    // 7. 엔티티 (NPC, 해상 범선, 해군, 해적선, 플레이어, 동물, 드래곤) 렌더링
    for (const e of this.entityMgr.entities) {
      if (e.x < minTx || e.x > maxTx || e.y < minTy || e.y > maxTy) continue;
      const isFilteredOut = !checkEntityFilter(e, filterCategory);
      const isSelected = selectedItem && selectedItem.type === 'entity' && selectedItem.data && selectedItem.data.id === e.id;
      this.drawEntity(ctx, e, ts, timeSec, camera.zoom, isFilteredOut, isSelected);
    }

    // 8. 투사체 렌더링
    for (const p of this.entityMgr.projectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * ts, p.y * ts - 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 9. 플로팅 텍스트 렌더링
    if (camera.zoom > 0.32) {
      ctx.font = 'bold 12px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      for (const ft of this.entityMgr.floatingTexts) {
        if (ft.x < minTx || ft.x > maxTx || ft.y < minTy || ft.y > maxTy) continue;
        const alpha = Math.max(0, 1 - ft.age / ft.duration);
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = alpha;
        ctx.fillText(ft.text, ft.x * ts, ft.y * ts - 18);
      }
      ctx.globalAlpha = 1.0;
    }

    // 10. 거점 배너 렌더링
    this.drawSettlementBanners(ctx, ts, camera.zoom, selectedItem);

    ctx.restore();

    // 11. 밤/날씨 오버레이 & 미니맵
    this.drawAtmosphereOverlay(ctx, cw, ch, worldTime, timeSec);
    this.renderMinimap(camera, cw, ch, filterCategory);
  }

  drawSeaRoutes(ctx, ts, timeSec) {
    const sMap = this.world.settlementMap;
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.lineDashOffset = -timeSec * 18;

    for (const sr of this.world.seaRoutes) {
      const a = sMap[sr.from];
      const b = sMap[sr.to];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.portWaterX * ts, a.portWaterY * ts);
      ctx.quadraticCurveTo(
        ((a.portWaterX + b.portWaterX) / 2) * ts,
        ((a.portWaterY + b.portWaterY) / 2 - 14) * ts,
        b.portWaterX * ts,
        b.portWaterY * ts
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  drawBuilding(ctx, b, ts, timeSec, zoom, worldTime) {
    const px = (b.x - b.w / 2) * ts;
    const py = (b.y - b.h / 2) * ts;
    const pw = b.w * ts;
    const ph = b.h * ts;
    const isNight = worldTime.hour >= 20 || worldTime.hour < 6;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.fillRect(px + 6, py + 8, pw, ph);

    ctx.fillStyle = b.color;
    ctx.fillRect(px, py, pw, ph);

    ctx.fillStyle = b.roofColor;
    ctx.fillRect(px + 3, py + 3, pw - 6, ph - 10);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    if (isNight && b.type !== 'lair') {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(px + 8, py + ph - 9, 6, 5);
      ctx.fillRect(px + pw - 14, py + ph - 9, 6, 5);
    }

    if (b.id === 'gw_mill') {
      const cx = b.x * ts;
      const cy = b.y * ts;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(timeSec * 1.1);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 34);
        ctx.stroke();
        ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
        ctx.fillRect(0, 10, 9, 22);
      }
      ctx.restore();
    }

    if (zoom > 0.50) {
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.icon, b.x * ts, b.y * ts + 4);

      if (zoom > 0.82) {
        ctx.font = 'bold 11px Pretendard, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(b.name, b.x * ts, py - 5);
        ctx.fillText(b.name, b.x * ts, py - 5);
      }
    }
  }

  drawEntity(ctx, e, ts, timeSec, zoom, isFilteredOut, isSelected) {
    const px = e.x * ts;
    const py = e.y * ts;
    const bounce = (Math.abs(e.vx) > 0.05 || Math.abs(e.vy) > 0.05)
      ? Math.abs(Math.sin(e.animPhase)) * (e.isShip ? 2.5 : 4)
      : 0;

    ctx.save();
    if (isFilteredOut) ctx.globalAlpha = 0.22;

    // 플레이어 영웅 황금 오라
    if (e.role === 'player') {
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py - 2, 22 + Math.sin(timeSec * 6) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (isSelected) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px, py, 20 * e.scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    // (A) 해상 범선 / 해군 함대 / 해적선 / 바다 괴수 렌더링
    if (e.isShip) {
      // 물결 파문
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(px, py + 4, 22 * e.scale, 10 * e.scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (e.monsterType !== 'kraken' && e.monsterType !== 'sea_serpent' && e.role !== 'animal' && e.role !== 'dragon') {
        // 선체(Hull)
        ctx.fillStyle = e.faction === 'monster' ? '#1e293b' : '#78350f';
        ctx.beginPath();
        ctx.ellipse(px, py - bounce, 20 * e.scale, 9 * e.scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 돛(Sail)
        ctx.fillStyle = e.role === 'player'
          ? '#fde047'
          : (e.faction === 'monster' ? '#991b1b' : (e.role === 'navy' ? '#38bdf8' : '#fef3c7'));
        ctx.beginPath();
        ctx.arc(px, py - 8 - bounce, 11 * e.scale, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
      }
    }

    // (B) 🐉 거대한 고대 드래곤 전용 렌더링 (거대한 날개짓 & 원소 오라)
    if (e.role === 'dragon') {
      const wingFlap = Math.sin(e.wingsPhase) * 16;
      const wingSpan = 26 * e.scale;
      // 원소 오라
      ctx.fillStyle = e.projColor;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(px, py - 6, 28 * e.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = isFilteredOut ? 0.22 : 1.0;

      // 거대한 날개 (좌/우)
      ctx.fillStyle = e.dragonType === 'frost' ? '#0284c7' : (e.dragonType === 'thunder' ? '#ca8a04' : (e.dragonType === 'poison' ? '#15803d' : '#991b1b'));
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;

      // 좌측 날개
      ctx.beginPath();
      ctx.moveTo(px - 4, py - 6);
      ctx.lineTo(px - wingSpan, py - 18 + wingFlap);
      ctx.lineTo(px - wingSpan * 0.7, py + 8 + wingFlap * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 우측 날개
      ctx.beginPath();
      ctx.moveTo(px + 4, py - 6);
      ctx.lineTo(px + wingSpan, py - 18 + wingFlap);
      ctx.lineTo(px + wingSpan * 0.7, py + 8 + wingFlap * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // (C) 육상 상인 짐마차(Wagon)
    if (e.hasWagon && !e.isShip) {
      const wx = px - (e.vx >= 0 ? 16 : -16);
      const wy = py + 2;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(wx - 12, wy - 4, 24, 14);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(wx - 11, wy - 8, 22, 12);
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(wx, wy - 8, 10, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(wx - 7, wy + 4, 4, 0, Math.PI * 2);
      ctx.arc(wx + 7, wy + 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 캐릭터 / 동물 바디
    if ((!e.isShip || e.monsterType === 'kraken' || e.monsterType === 'sea_serpent' || e.role === 'animal') && e.role !== 'dragon') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(px, py + 5, 8 * e.scale, 4 * e.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // 종족별 고유 비주얼 오라
      if (e.race === 'elf' && zoom > 0.6) {
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py - 4 - bounce, 12 * e.scale, 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.race === 'dwarf' && zoom > 0.6) {
        ctx.fillStyle = '#64748b'; // 드워프 강철 투구 장식
        ctx.fillRect(px - 6 * e.scale, py - 13 * e.scale - bounce, 12 * e.scale, 4);
      }

      const r = (e.role === 'animal' ? 7.5 : 9.5) * e.scale;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(px, py - 4 - bounce, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = e.faction === 'monster' ? '#450a0a' : (e.role === 'animal' ? '#065f46' : '#0f172a');
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    if (e.state === 'combat') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py - 4, 13 * e.scale + Math.sin(timeSec * 12) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (zoom > 0.30) {
      ctx.font = `${Math.round(13 * e.scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.icon, px, py - (e.isShip ? 8 : 4) - bounce);
    }

    if ((e.hp < e.maxHp || isSelected || e.role === 'player' || e.role === 'dragon') && zoom > 0.40) {
      const bw = (e.role === 'dragon' ? 38 : 26) * e.scale;
      const bh = e.role === 'dragon' ? 5 : 4;
      const bx = px - bw / 2;
      const by = py - (e.role === 'dragon' ? 26 : 21) * e.scale - bounce;
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(bx, by, bw, bh);
      const hpRatio = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = e.faction === 'monster' ? '#ef4444' : (e.role === 'player' ? '#facc15' : (e.role === 'animal' ? '#10b981' : '#22c55e'));
      ctx.fillRect(bx, by, bw * hpRatio, bh);
    }

    if ((zoom > 0.90 || isSelected || e.role === 'player' || e.role === 'dragon') && !isFilteredOut) {
      ctx.font = 'bold 10.5px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 3;
      ctx.strokeText(e.name, px, py + 16);
      ctx.fillStyle = e.role === 'player' ? '#fde047' : (e.faction === 'monster' ? '#fca5a5' : '#f8fafc');
      ctx.fillText(e.name, px, py + 16);

      if (isSelected || zoom > 1.30 || e.role === 'player') {
        const bubbleText = e.thought;
        ctx.font = '10px Pretendard, sans-serif';
        const tw = ctx.measureText(bubbleText).width + 12;
        const bx = px - tw / 2;
        const by = py - 38 * e.scale - bounce;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = (isSelected || e.role === 'player') ? '#facc15' : 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, tw, 17, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.fillText(bubbleText, px, by + 9);
      }
    }

    ctx.restore();
  }

  drawSettlementBanners(ctx, ts, zoom, selectedItem) {
    for (const s of this.world.settlements) {
      const sx = s.x * ts;
      const sy = (s.y - s.radius - 1.5) * ts;
      const isSelected = selectedItem && selectedItem.type === 'settlement' && selectedItem.data.id === s.id;

      ctx.save();
      const fontSize = zoom < 0.42 ? Math.round(13.5 / Math.max(0.18, zoom)) : 14;
      ctx.font = `bold ${fontSize}px Pretendard, sans-serif`;
      const label = `${s.icon} ${s.name}`;
      const tw = ctx.measureText(label).width + 20;
      const bh = fontSize + 12;

      ctx.fillStyle = s.faction === 'monster'
        ? 'rgba(69, 10, 10, 0.88)'
        : 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = isSelected
        ? '#facc15'
        : (s.faction === 'monster' ? '#ef4444' : '#d4af37');
      ctx.lineWidth = isSelected ? 2.5 : 1.5;

      ctx.beginPath();
      ctx.roundRect(sx - tw / 2, sy - bh / 2, tw, bh, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = s.faction === 'monster' ? '#fecaca' : '#fef08a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, sx, sy);
      ctx.restore();
    }
  }

  drawAtmosphereOverlay(ctx, cw, ch, worldTime, timeSec) {
    const h = worldTime.hour + worldTime.minute / 60;
    let darkness = 0;
    if (h >= 20) darkness = Math.min(0.45, (h - 20) / 3 * 0.45);
    else if (h < 5) darkness = 0.45;
    else if (h < 7) darkness = Math.max(0, (7 - h) / 2 * 0.45);

    if (darkness > 0.01) {
      ctx.fillStyle = `rgba(8, 15, 38, ${darkness})`;
      ctx.fillRect(0, 0, cw, ch);
    }

    if (worldTime.weather === 'rain') {
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.38)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 85; i++) {
        const rx = ((i * 197 + timeSec * 280) % cw);
        const ry = ((i * 311 + timeSec * 650) % ch);
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 5, ry + 14);
      }
      ctx.stroke();
    } else if (darkness > 0.25) {
      ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
      for (let i = 0; i < 35; i++) {
        const fx = (i * 271 + Math.sin(timeSec + i) * 35) % cw;
        const fy = (i * 193 + Math.cos(timeSec * 0.8 + i) * 35) % ch;
        ctx.beginPath();
        ctx.arc(fx, fy, 2, 0, Math.PI * 2);
        ctx.fill();
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
}

window.WorldRenderer = WorldRenderer;
