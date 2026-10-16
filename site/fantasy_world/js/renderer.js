// ============================================================================
// renderer.js - 초고화질 판타지 오픈월드 & 생태계 렌더러
// 해안선 파도 거품, 회전하는 풍차, 모락모락 굴뚝 연기, 밤의 창문 조명, 펄럭이는 성채 깃발,
// 3단 돛 해상 범선 & 물살, 4대 원소 드래곤 날개짓 & 브레스, 직업별 장비 디테일, 환경 파티클
// ============================================================================

class WorldRenderer {
  constructor(canvas, minimapCanvas, world, entityMgr) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minimapCanvas = minimapCanvas;
    this.minimapCtx = minimapCanvas.getContext('2d');
    this.world = world;
    this.entityMgr = entityMgr;

    this.bakeScale = 10; // 480x320 타일 베이킹 (4,800 x 3,200 px 고해상도)
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

        // 기본 베이스 타일
        tCtx.fillStyle = info.color;
        tCtx.fillRect(x * s, y * s, s, s);

        // 체스판 미세 노이즈 음영 (타일 텍스처 깊이감)
        if ((x + y) % 2 === 0 && t !== TILE.DEEP_WATER && t !== TILE.WATER) {
          tCtx.fillStyle = 'rgba(255, 255, 255, 0.025)';
          tCtx.fillRect(x * s, y * s, s, s);
        }

        // 지형별 정밀 텍스처 디테일
        if (t === TILE.ROAD) {
          // 왕국 포장 가도: 닳은 조약돌 블록과 가장자리 흙먼지
          tCtx.fillStyle = '#81735d';
          tCtx.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
          tCtx.fillStyle = '#a6977e';
          tCtx.fillRect(x * s + 2, y * s + 2, 3, 2);
          tCtx.fillRect(x * s + 6, y * s + 5, 2, 2);
          tCtx.fillRect(x * s + 3, y * s + 7, 3, 2);
        } else if (t === TILE.BRIDGE) {
          // 목조 다리: 가로 널빤지 및 못 자국
          tCtx.fillStyle = '#57371d';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#946137';
          for (let p = 1; p < s; p += 3) {
            tCtx.fillRect(x * s + 1, y * s + p, s - 2, 1.5);
          }
        } else if (t === TILE.CASTLE_FLOOR) {
          // 성채 석재 광장: 마름모형 석판 타일링
          tCtx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
          tCtx.lineWidth = 1;
          tCtx.strokeRect(x * s + 0.5, y * s + 0.5, s - 1, s - 1);
          tCtx.fillStyle = '#94a3b8';
          tCtx.fillRect(x * s + 4, y * s + 4, 2, 2);
        } else if (t === TILE.WALL) {
          // 방어 성벽: 벽돌 음영과 상단 요철
          tCtx.fillStyle = '#2d3748';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#718096';
          tCtx.fillRect(x * s + 1, y * s + 1, s - 2, 3);
          tCtx.fillStyle = '#4a5568';
          tCtx.fillRect(x * s + 2, y * s + 5, s - 4, s - 6);
        } else if (t === TILE.DOCK) {
          // 항구 부두: 튼튼한 나무 바닥과 말뚝
          tCtx.fillStyle = '#6f4724';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#4d3017';
          tCtx.fillRect(x * s, y * s + 4, s, 2);
          tCtx.fillStyle = '#926135';
          tCtx.fillRect(x * s + 1, y * s + 1, 2, 2);
          tCtx.fillRect(x * s + s - 3, y * s + 1, 2, 2);
        } else if (t === TILE.FARMLAND) {
          // 비옥한 경작지: 밭고랑
          tCtx.fillStyle = '#553d1f';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#3d2b14';
          for (let r = 1; r < s; r += 3) {
            tCtx.fillRect(x * s + 1, y * s + r, s - 2, 1.5);
          }
        } else if (t === TILE.DESERT) {
          // 황금 사막: 바람에 날린 모래언덕 주름
          tCtx.fillStyle = 'rgba(254, 215, 170, 0.2)';
          tCtx.fillRect(x * s + 1, y * s + 3, s - 2, 1.5);
          tCtx.fillRect(x * s + 2, y * s + 7, s - 4, 1.5);
        } else if (t === TILE.CORAL) {
          // 환상 산호초: 반투명 청록/분홍 산호 돌출
          tCtx.fillStyle = '#0284c7';
          tCtx.fillRect(x * s + 2, y * s + 2, 3, 3);
          tCtx.fillStyle = '#f472b6';
          tCtx.fillRect(x * s + 5, y * s + 5, 3, 3);
        } else if (t === TILE.AUTUMN_WOOD) {
          // 붉은 단풍림 지면
          tCtx.fillStyle = '#9a3412';
          tCtx.fillRect(x * s + 2, y * s + 4, 2, 2);
          tCtx.fillStyle = '#ea580c';
          tCtx.fillRect(x * s + 6, y * s + 2, 2, 2);
        } else if (t === TILE.LAVA) {
          // 용암
          tCtx.fillStyle = '#f97316';
          tCtx.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
          tCtx.fillStyle = '#fef08a';
          tCtx.fillRect(x * s + 4, y * s + 4, 2, 2);
        }

        // 자연 장식물 정밀 렌더링
        const d = deco[idx];
        if (d === 1) {
          // 참나무: 잎사귀 캐노피와 줄기
          tCtx.fillStyle = '#163b19';
          tCtx.beginPath();
          tCtx.arc(x * s + 5, y * s + 5, 4.2, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.fillStyle = '#2d6a30';
          tCtx.beginPath();
          tCtx.arc(x * s + 4.5, y * s + 4.2, 2.8, 0, Math.PI * 2);
          tCtx.fill();
        } else if (d === 2) {
          // 그림자 침엽수: 뾰족한 삼각형 피라미드
          tCtx.fillStyle = '#0f1d17';
          tCtx.beginPath();
          tCtx.moveTo(x * s + 5, y * s + 1);
          tCtx.lineTo(x * s + 9, y * s + 9);
          tCtx.lineTo(x * s + 1, y * s + 9);
          tCtx.closePath();
          tCtx.fill();
        } else if (d === 3) {
          // 들꽃 군락
          tCtx.fillStyle = (x + y) % 3 === 0 ? '#facc15' : ((x + y) % 3 === 1 ? '#f472b6' : '#60a5fa');
          tCtx.fillRect(x * s + 3, y * s + 3, 2, 2);
          tCtx.fillRect(x * s + 6, y * s + 6, 2, 2);
        } else if (d === 4) {
          // 바위
          tCtx.fillStyle = '#52525b';
          tCtx.beginPath();
          tCtx.arc(x * s + 5, y * s + 6, 3.5, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.fillStyle = '#71717a';
          tCtx.beginPath();
          tCtx.arc(x * s + 4, y * s + 5, 1.8, 0, Math.PI * 2);
          tCtx.fill();
        } else if (d === 5) {
          // 사막 야자수 / 선인장
          tCtx.fillStyle = '#15803d';
          tCtx.beginPath();
          tCtx.arc(x * s + 5, y * s + 4, 3.5, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.fillStyle = '#4ade80';
          tCtx.fillRect(x * s + 4, y * s + 3, 2, 4);
        } else if (d === 6) {
          // 요정 벚꽃나무 (엘븐하임)
          tCtx.fillStyle = '#0f766e';
          tCtx.beginPath();
          tCtx.arc(x * s + 5, y * s + 5, 4.4, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.fillStyle = (x + y) % 2 === 0 ? '#f472b6' : '#5eead4';
          tCtx.beginPath();
          tCtx.arc(x * s + 4.5, y * s + 4, 2.8, 0, Math.PI * 2);
          tCtx.fill();
        } else if (d === 7) {
          // 붉은 단풍나무
          tCtx.fillStyle = '#7c2d12';
          tCtx.beginPath();
          tCtx.arc(x * s + 5, y * s + 5, 4.2, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.fillStyle = '#ea580c';
          tCtx.beginPath();
          tCtx.arc(x * s + 4.5, y * s + 4, 2.6, 0, Math.PI * 2);
          tCtx.fill();
        } else if (d === 8) {
          // 빛나는 얼음/마법 수정
          tCtx.fillStyle = '#38bdf8';
          tCtx.beginPath();
          tCtx.moveTo(x * s + 5, y * s + 1);
          tCtx.lineTo(x * s + 8, y * s + 8);
          tCtx.lineTo(x * s + 2, y * s + 8);
          tCtx.closePath();
          tCtx.fill();
        }

        // 미니맵 기본 색상 픽셀
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
    ctx.fillStyle = '#061320';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x * ts, -camera.y * ts);

    // 뷰포트 컬링 바운드 계산
    const halfW = (cw / 2 / camera.zoom) / ts + 4;
    const halfH = (ch / 2 / camera.zoom) / ts + 4;
    const minTx = Math.max(0, Math.floor(camera.x - halfW));
    const maxTx = Math.min(this.world.width, Math.ceil(camera.x + halfW));
    const minTy = Math.max(0, Math.floor(camera.y - halfH));
    const maxTy = Math.min(this.world.height, Math.ceil(camera.y + halfH));

    // 1. 고해상도 지형 슬라이싱 렌더링 (최적화)
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

    // 2. 동적 해안선 파도 거품 애니메이션 (Shoreline Waves)
    if (camera.zoom > 0.38) {
      this.drawShorelineWaves(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec);
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
        const sway = Math.sin(timeSec * 3 + plot.x * 0.7) * 2.2 * ratio;

        ctx.fillStyle = plot.cropType === '향신료'
          ? '#fb923c'
          : (plot.cropType === '약초' ? '#2dd4bf' : (ratio > 0.75 ? '#facc15' : '#84cc16'));

        const h = Math.max(4, ratio * 16);
        for (let c = 6; c <= 24; c += 8) {
          ctx.fillRect(px + c + sway, py + 24 - h, 3.5, h);
        }
      }
    }

    // 5. 어부 배 & 광산 노드
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

    // 6. 건물 렌더링 (풍차 회전, 굴뚝 연기, 밤의 조명 창문 포함)
    for (const b of this.world.buildings) {
      if (b.x + b.w < minTx || b.x - b.w > maxTx || b.y + b.h < minTy || b.y - b.h > maxTy) continue;
      this.drawBuilding(ctx, b, ts, timeSec, camera.zoom, worldTime);
    }

    // 7. 낚싯줄
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

    // 8. 광역 마법 & 스킬 특수효과
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

    // 9. 엔티티 렌더링 (그림자, 직업별 장비, 펄럭이는 돛, 물살, 드래곤 날개)
    for (const e of this.entityMgr.entities) {
      if (e.x < minTx || e.x > maxTx || e.y < minTy || e.y > maxTy) continue;
      const isFilteredOut = !checkEntityFilter(e, filterCategory);
      const isSelected = selectedItem && selectedItem.type === 'entity' && selectedItem.data && selectedItem.data.id === e.id;
      this.drawEntity(ctx, e, ts, timeSec, camera.zoom, isFilteredOut, isSelected);
    }

    // 10. 투사체 (브레스 탄막, 대포알, 화살)
    for (const p of this.entityMgr.projectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * ts, p.y * ts - 8, 5.5, 0, Math.PI * 2);
      ctx.fill();
      // 투사체 빛 꼬리 잔상
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x * ts, p.y * ts - 8);
      ctx.lineTo((p.x - (p.vx || 0) * 0.04) * ts, (p.y - (p.vy || 0) * 0.04) * ts - 8);
      ctx.stroke();
    }

    // 11. 플로팅 전투/골드 텍스트
    if (camera.zoom > 0.32) {
      ctx.font = 'bold 12px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      for (const ft of this.entityMgr.floatingTexts) {
        if (ft.x < minTx || ft.x > maxTx || ft.y < minTy || ft.y > maxTy) continue;
        const alpha = Math.max(0, 1 - ft.age / ft.duration);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 3;
        const ty = (ft.y - (ft.age / ft.duration) * 1.8) * ts;
        ctx.strokeText(ft.text, ft.x * ts, ty);
        ctx.fillText(ft.text, ft.x * ts, ty);
        ctx.restore();
      }
    }

    // 12. 거점 이름표 렌더링
    this.drawSettlementLabels(ctx, ts, camera.zoom, selectedItem);

    ctx.restore();

    // 13. 대기 및 날씨 조명 오버레이
    this.drawAtmosphereOverlay(ctx, cw, ch, worldTime, timeSec);

    // 14. 미니맵 렌더링
    this.renderMinimap(camera, cw, ch, filterCategory);
  }

  // 해안선 파도 거품 애니메이션
  drawShorelineWaves(ctx, minTx, maxTx, minTy, maxTy, ts, timeSec) {
    const waveProgress = (Math.sin(timeSec * 2.6) + 1) / 2;
    ctx.strokeStyle = `rgba(240, 249, 255, ${0.25 + waveProgress * 0.35})`;
    ctx.lineWidth = 2.0;

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const t = this.world.getTile(tx, ty);
        if (t === TILE.WATER || t === TILE.DEEP_WATER) {
          // 인접 타일에 육지(모래나 초원)가 있는지 확인
          const hasLandNeighbor = (
            this.world.getTile(tx + 1, ty) === TILE.SAND ||
            this.world.getTile(tx - 1, ty) === TILE.SAND ||
            this.world.getTile(tx, ty + 1) === TILE.SAND ||
            this.world.getTile(tx, ty - 1) === TILE.SAND
          );
          if (hasLandNeighbor) {
            const px = tx * ts + ts / 2;
            const py = ty * ts + ts / 2;
            const waveOffset = Math.sin(timeSec * 3 + tx * 0.5 + ty * 0.5) * 4 * waveProgress;
            ctx.beginPath();
            ctx.arc(px + waveOffset, py + waveOffset, 7 + waveProgress * 4, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }
  }

  drawSeaRoutes(ctx, ts, timeSec) {
    ctx.save();
    ctx.setLineDash([8, 12]);
    ctx.lineDashOffset = -timeSec * 16;
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
    ctx.lineWidth = 2.2;

    const sMap = this.world.settlementMap;
    for (const r of this.world.seaRoutes) {
      const from = sMap[r.fromId];
      const to = sMap[r.toId];
      if (!from || !to) continue;

      const fx = (from.portWaterX || from.x) * ts;
      const fy = (from.portWaterY || from.y) * ts;
      const tx = (to.portWaterX || to.x) * ts;
      const ty = (to.portWaterY || to.y) * ts;

      ctx.beginPath();
      ctx.moveTo(fx, fy);
      const mx = (fx + tx) / 2 + (fy - ty) * 0.12;
      const my = (fy + ty) / 2 + (tx - fx) * 0.12;
      ctx.quadraticCurveTo(mx, my, tx, ty);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawBuilding(ctx, b, ts, timeSec, zoom, worldTime) {
    const px = b.x * ts;
    const py = b.y * ts;
    const bw = b.w * ts;
    const bh = b.h * ts;

    // 건물 지면 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px, py + bh / 2 + 3, bw * 0.55, bh * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 건물 바디
    ctx.fillStyle = b.color;
    ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);

    // 지붕 (박공 지붕 스타일)
    ctx.fillStyle = b.roofColor;
    ctx.beginPath();
    ctx.moveTo(px - bw / 2 - 4, py - bh / 2);
    ctx.lineTo(px, py - bh / 2 - 16);
    ctx.lineTo(px + bw / 2 + 4, py - bh / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 밤의 따스한 창문 불빛
    const isNight = worldTime.hour >= 19 || worldTime.hour < 6;
    if (isNight && zoom > 0.45) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.fillRect(px - bw / 4 - 3, py - 4, 6, 8);
      ctx.fillRect(px + bw / 4 - 3, py - 4, 6, 8);
      ctx.shadowBlur = 0;
    } else if (zoom > 0.5) {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(px - bw / 4 - 3, py - 4, 6, 8);
      ctx.fillRect(px + bw / 4 - 3, py - 4, 6, 8);
    }

    // 굴뚝 & 모락모락 피어오르는 연기 파티클
    if (b.type === 'forge' || b.type === 'tavern' || b.type === 'market') {
      const chX = px + bw / 3;
      const chY = py - bh / 2 - 10;
      ctx.fillStyle = '#334155';
      ctx.fillRect(chX - 2, chY, 5, 10);

      // 연기 방울 3개
      for (let s = 1; s <= 3; s++) {
        const sProg = ((timeSec * 1.5 + s * 0.33) % 1.0);
        const sx = chX + Math.sin(timeSec * 2 + s) * 6;
        const sy = chY - sProg * 28;
        const sr = 3 + sProg * 5;
        ctx.fillStyle = `rgba(226, 232, 240, ${Math.max(0, 0.45 * (1 - sProg))})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 회전하는 풍차 (Windmill Sails)
    if (b.type === 'windmill') {
      const cx = b.x * ts;
      const cy = b.y * ts - 4;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(timeSec * 1.6);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 36);
        ctx.stroke();
        // 돛 천
        ctx.fillStyle = 'rgba(254, 243, 199, 0.75)';
        ctx.fillRect(0, 8, 10, 26);
      }
      ctx.restore();
    }

    // 펄럭이는 성채 깃발 (Barracks / Palace / Fortress)
    if (b.type === 'barracks' || b.type === 'palace') {
      const fx = px;
      const fy = py - bh / 2 - 16;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx, fy - 12);
      ctx.stroke();

      const flap = Math.sin(timeSec * 4 + b.x) * 3;
      ctx.fillStyle = b.roofColor;
      ctx.beginPath();
      ctx.moveTo(fx, fy - 12);
      ctx.lineTo(fx + 10 + flap, fy - 9);
      ctx.lineTo(fx, fy - 6);
      ctx.closePath();
      ctx.fill();
    }

    if (zoom > 0.45) {
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.icon, b.x * ts, b.y * ts + 4);

      if (zoom > 0.82) {
        ctx.font = 'bold 11px Pretendard, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        ctx.strokeText(b.name, b.x * ts, py - bh / 2 - 18);
        ctx.fillText(b.name, b.x * ts, py - bh / 2 - 18);
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

    // [A] 해상 범선 / 함대 / 해적선
    if (e.isShip) {
      // 뱃머리 좌우로 퍼지는 하얀 물살(Bow Wake Waves)
      const wakeSway = Math.sin(timeSec * 3 + e.id) * 3;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.65)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(px, py - 2);
      ctx.lineTo(px - 18 * e.scale + wakeSway, py + 14 * e.scale);
      ctx.moveTo(px, py - 2);
      ctx.lineTo(px + 18 * e.scale - wakeSway, py + 14 * e.scale);
      ctx.stroke();

      if (e.monsterType !== 'kraken' && e.monsterType !== 'sea_serpent' && e.role !== 'animal' && e.role !== 'dragon') {
        // 목재 선체(Hull)
        ctx.fillStyle = e.faction === 'monster' ? '#1e293b' : '#78350f';
        ctx.beginPath();
        ctx.ellipse(px, py - bounce, 21 * e.scale, 9 * e.scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // 3단 돛(Sails)
        ctx.fillStyle = e.role === 'player'
          ? '#fde047'
          : (e.faction === 'monster' ? '#991b1b' : (e.role === 'navy' ? '#38bdf8' : '#fef3c7'));
        ctx.beginPath();
        ctx.arc(px, py - 8 - bounce, 12 * e.scale, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
      }
    }

    // [B] 고대 원소 드래곤 (거대한 날개짓 & 원소 오라 & 입김 파티클)
    if (e.role === 'dragon') {
      const wingFlap = Math.sin(e.wingsPhase) * 18;
      const wingSpan = 28 * e.scale;

      // 원소 오라
      ctx.fillStyle = e.projColor;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(px, py - 6, 32 * e.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = isFilteredOut ? 0.22 : 1.0;

      // 좌/우 날개
      ctx.fillStyle = e.dragonType === 'frost'
        ? '#0284c7'
        : (e.dragonType === 'thunder' ? '#ca8a04' : (e.dragonType === 'poison' ? '#15803d' : '#991b1b'));
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.6;

      ctx.beginPath();
      ctx.moveTo(px - 4, py - 6);
      ctx.lineTo(px - wingSpan, py - 20 + wingFlap);
      ctx.lineTo(px - wingSpan * 0.65, py + 10 + wingFlap * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(px + 4, py - 6);
      ctx.lineTo(px + wingSpan, py - 20 + wingFlap);
      ctx.lineTo(px + wingSpan * 0.65, py + 10 + wingFlap * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 입에서 뿜어지는 미세한 원소 화염/냉기 연기
      ctx.fillStyle = e.projColor;
      ctx.beginPath();
      ctx.arc(px + Math.sin(timeSec * 8) * 4, py - 16, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // [C] 육상 상단 마차
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

    // 캐릭터 / 동물 몸체 & 그림자
    if ((!e.isShip || e.monsterType === 'kraken' || e.monsterType === 'sea_serpent' || e.role === 'animal') && e.role !== 'dragon') {
      // 앰비언트 소프트 드롭 섀도우
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(px, py + 5, 8 * e.scale, 4 * e.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // 종족별 비주얼 효과
      if (e.race === 'elf' && zoom > 0.5) {
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py - 4 - bounce, 13 * e.scale, 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.race === 'dwarf' && zoom > 0.5) {
        ctx.fillStyle = '#64748b'; // 드워프 뿔 투구
        ctx.fillRect(px - 7 * e.scale, py - 14 * e.scale - bounce, 14 * e.scale, 4);
      }

      const r = (e.role === 'animal' ? 8 : 10) * e.scale;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(px, py - 4 - bounce, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = e.faction === 'monster' ? '#450a0a' : (e.role === 'animal' ? '#065f46' : '#0f172a');
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // 전투 중 위험 이펙트
    if (e.state === 'combat') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(px, py - 4, 14 * e.scale + Math.sin(timeSec * 12) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 아이콘 표시
    if (zoom > 0.28) {
      ctx.font = `${Math.round(14 * e.scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.icon, px, py - (e.isShip ? 8 : 4) - bounce);
    }

    // 체력 바 & 이름
    if (zoom > 0.72 && e.maxHp > 0) {
      const bw = 24 * e.scale;
      const bh = 3.5;
      const bx = px - bw / 2;
      const by = py - (e.isShip ? 24 : 18) * e.scale - bounce;

      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      const hpRatio = Math.max(0, Math.min(1, e.hp / e.maxHp));
      ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.25 ? '#eab308' : '#ef4444');
      ctx.fillRect(bx, by, bw * hpRatio, bh);

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

  drawSettlementLabels(ctx, ts, zoom, selectedItem) {
    if (zoom < 0.22) return;
    for (const s of this.world.settlements) {
      const sx = s.x * ts;
      const sy = s.y * ts;
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
    if (h >= 20) darkness = Math.min(0.48, (h - 20) / 3 * 0.48);
    else if (h < 5) darkness = 0.48;
    else if (h < 7) darkness = Math.max(0, (7 - h) / 2 * 0.48);

    // 밤 조명 오버레이
    if (darkness > 0.01) {
      ctx.fillStyle = `rgba(7, 13, 34, ${darkness})`;
      ctx.fillRect(0, 0, cw, ch);
    }

    // 황혼/새벽의 은은한 골든아워 노을
    if ((h >= 18 && h < 20) || (h >= 5 && h < 7)) {
      ctx.fillStyle = 'rgba(234, 88, 12, 0.07)';
      ctx.fillRect(0, 0, cw, ch);
    }

    // 날씨별 특수 파티클
    if (worldTime.weather === 'rain') {
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.42)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < 95; i++) {
        const rx = ((i * 197 + timeSec * 280) % cw);
        const ry = ((i * 311 + timeSec * 650) % ch);
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 5, ry + 15);
      }
      ctx.stroke();

      // 지면/수면에 튀는 빗방울 원형 파문
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.28)';
      ctx.lineWidth = 1.0;
      for (let i = 0; i < 20; i++) {
        const rx = ((i * 383 + timeSec * 150) % cw);
        const ry = ((i * 269 + timeSec * 190) % ch);
        const rSize = (timeSec * 8 + i) % 6;
        ctx.beginPath();
        ctx.arc(rx, ry, rSize, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (darkness > 0.25) {
      // 밤의 신비로운 반딧불이
      ctx.fillStyle = 'rgba(250, 204, 21, 0.65)';
      for (let i = 0; i < 45; i++) {
        const fx = (i * 271 + Math.sin(timeSec + i) * 40) % cw;
        const fy = (i * 193 + Math.cos(timeSec * 0.8 + i) * 40) % ch;
        ctx.beginPath();
        ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
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
