// ============================================================================
// renderer.js - 멀티 줌 레벨(전략 대륙 뷰 ↔ 근접 디테일 뷰) 2D 캔버스 렌더러
// ============================================================================

class WorldRenderer {
  constructor(canvas, minimapCanvas, world, entityMgr) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minimapCanvas = minimapCanvas;
    this.minimapCtx = minimapCanvas.getContext('2d');
    this.world = world;
    this.entityMgr = entityMgr;

    // 정적 지형 오프스크린 캐시 (성능 최적화)
    this.bakeScale = 16; // 타일 당 16px로 베이킹 (3840 x 3840)
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

        // 미세한 타일 체커보드 톤 변화
        tCtx.fillStyle = info.color;
        tCtx.fillRect(x * s, y * s, s, s);

        if ((x + y) % 2 === 0 && t !== TILE.DEEP_WATER && t !== TILE.WATER) {
          tCtx.fillStyle = 'rgba(255, 255, 255, 0.025)';
          tCtx.fillRect(x * s, y * s, s, s);
        }

        // 가도 및 다리 디테일
        if (t === TILE.ROAD) {
          tCtx.fillStyle = '#85755e';
          tCtx.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
          tCtx.fillStyle = '#a89982';
          tCtx.fillRect(x * s + 4, y * s + 4, 4, 4);
          tCtx.fillRect(x * s + 9, y * s + 9, 4, 4);
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
          tCtx.fillRect(x * s + 2, y * s + 2, s - 4, s - 6);
        } else if (t === TILE.DOCK) {
          tCtx.fillStyle = '#78502b';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#54361b';
          tCtx.fillRect(x * s, y * s + 6, s, 2);
        } else if (t === TILE.FARMLAND) {
          tCtx.fillStyle = '#594222';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#423017';
          for (let r = 2; r < s; r += 4) {
            tCtx.fillRect(x * s + 1, y * s + r, s - 2, 2);
          }
        }

        // 자연 장식물 (나무, 바위, 야생화)
        const d = deco[idx];
        if (d === 1) {
          // 참나무
          tCtx.fillStyle = 'rgba(0,0,0,0.28)';
          tCtx.beginPath();
          tCtx.arc(x * s + 9, y * s + 11, 6, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.fillStyle = '#1e4620';
          tCtx.beginPath();
          tCtx.arc(x * s + 8, y * s + 8, 6.5, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.fillStyle = '#2e6b30';
          tCtx.beginPath();
          tCtx.arc(x * s + 6.5, y * s + 6.5, 4.2, 0, Math.PI * 2);
          tCtx.fill();
        } else if (d === 2) {
          // 그림자 숲 침엽수
          tCtx.fillStyle = '#11221c';
          tCtx.beginPath();
          tCtx.moveTo(x * s + 8, y * s + 1);
          tCtx.lineTo(x * s + 14, y * s + 14);
          tCtx.lineTo(x * s + 2, y * s + 14);
          tCtx.closePath();
          tCtx.fill();
        } else if (d === 3) {
          // 야생화
          tCtx.fillStyle = (x + y) % 3 === 0 ? '#facc15' : '#f472b6';
          tCtx.fillRect(x * s + 5, y * s + 5, 3, 3);
          tCtx.fillRect(x * s + 10, y * s + 9, 3, 3);
        } else if (d === 4) {
          // 바위/광석
          tCtx.fillStyle = '#64748b';
          tCtx.beginPath();
          tCtx.arc(x * s + 8, y * s + 9, 5.5, 0, Math.PI * 2);
          tCtx.fill();
          tCtx.fillStyle = '#94a3b8';
          tCtx.beginPath();
          tCtx.arc(x * s + 6.5, y * s + 7.5, 3, 0, Math.PI * 2);
          tCtx.fill();
        }

        // 미니맵 픽셀 기록
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
    ctx.fillStyle = '#081729';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    // 카메라 변환 (화면 중앙 기준 줌 및 위치 이동)
    ctx.translate(cw / 2, ch / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x * ts, -camera.y * ts);

    // 1. 베이크된 대륙 지형 캔버스 그리기
    const worldPxW = this.world.width * ts;
    const worldPxH = this.world.height * ts;
    ctx.drawImage(this.terrainCanvas, 0, 0, worldPxW, worldPxH);

    // 현재 카메라 뷰포트 경계 (타일 단위 컬링용)
    const halfW = (cw / 2 / camera.zoom) / ts + 4;
    const halfH = (ch / 2 / camera.zoom) / ts + 4;
    const minTx = Math.max(0, Math.floor(camera.x - halfW));
    const maxTx = Math.min(this.world.width - 1, Math.ceil(camera.x + halfW));
    const minTy = Math.max(0, Math.floor(camera.y - halfH));
    const maxTy = Math.min(this.world.height - 1, Math.ceil(camera.y + halfH));

    // 2. 경작지 작물 성장 렌더링 (황금밀, 약초, 호박)
    if (camera.zoom > 0.32) {
      for (const plot of this.world.farmPlots) {
        if (plot.x < minTx || plot.x > maxTx || plot.y < minTy || plot.y > maxTy) continue;
        const px = plot.x * ts;
        const py = plot.y * ts;
        const ratio = plot.growth / 100;
        const sway = Math.sin(timeSec * 3 + plot.x * 0.7) * 2.2 * ratio;

        ctx.fillStyle = plot.cropType === '약초'
          ? '#34d399'
          : (ratio > 0.75 ? '#facc15' : '#84cc16');

        const h = Math.max(4, ratio * 16);
        for (let c = 6; c <= 24; c += 8) {
          ctx.fillRect(px + c + sway, py + 24 - h, 4, h);
        }
      }
    }

    // 3. 어부들의 고기잡이배 & 광산 광맥 반짝임 렌더링
    for (const sp of this.world.fishingSpots) {
      if (!sp.isBoat) continue;
      if (sp.x < minTx || sp.x > maxTx || sp.y < minTy || sp.y > maxTy) continue;
      const bx = sp.x * ts + ts / 2;
      const by = sp.y * ts + ts / 2 + Math.sin(timeSec * 2.5 + sp.x) * 2.5;

      // 물결 파문
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(bx, by + 3, 20, 9, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 목선 본체
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

    // 4. 성채, 왕궁, 풍차, 시장, 대장간 등 주요 건물 렌더링
    for (const b of this.world.buildings) {
      if (b.x + b.w < minTx || b.x - b.w > maxTx || b.y + b.h < minTy || b.y - b.h > maxTy) continue;
      this.drawBuilding(ctx, b, ts, timeSec, camera.zoom, worldTime);
    }

    // 5. 어부들의 낚싯줄과 찌(Bobber) 렌더링
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

          // 빨간 낚시 찌
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(wx, wy, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // 물결 원
          ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
          ctx.beginPath();
          ctx.arc(wx, wy, 6 + (timeSec * 6 % 6), 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // 6. 엔티티 (NPC, 상단 마차, 병사, 모험가, 몬스터) 렌더링
    for (const e of this.entityMgr.entities) {
      if (e.x < minTx || e.x > maxTx || e.y < minTy || e.y > maxTy) continue;
      const isFilteredOut = filterCategory !== 'all' && e.category !== filterCategory;
      const isSelected = selectedItem && selectedItem.type === 'entity' && selectedItem.data.id === e.id;
      this.drawEntity(ctx, e, ts, timeSec, camera.zoom, isFilteredOut, isSelected);
    }

    // 7. 마법 탄환 / 화살 투사체 렌더링
    for (const p of this.entityMgr.projectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * ts, p.y * ts - 8, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. 플로팅 데미지 & 골드 텍스트 렌더링
    if (camera.zoom > 0.38) {
      ctx.font = 'bold 12px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      for (const ft of this.entityMgr.floatingTexts) {
        if (ft.x < minTx || ft.x > maxTx || ft.y < minTy || ft.y > maxTy) continue;
        const alpha = Math.max(0, 1 - ft.age / ft.duration);
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = alpha;
        ctx.fillText(ft.text, ft.x * ts, ft.y * ts - 16);
      }
      ctx.globalAlpha = 1.0;
    }

    // 9. 거점 이름 배너 (줌아웃 전략 뷰 및 일반 뷰 모두 가독성 있게 표시)
    this.drawSettlementBanners(ctx, ts, camera.zoom, selectedItem);

    ctx.restore();

    // 10. 밤/새벽 시간대 조명 효과 및 날씨 파티클
    this.drawAtmosphereOverlay(ctx, cw, ch, worldTime, timeSec);

    // 11. 미니맵 업데이트
    this.renderMinimap(camera, cw, ch, filterCategory);
  }

  drawBuilding(ctx, b, ts, timeSec, zoom, worldTime) {
    const px = (b.x - b.w / 2) * ts;
    const py = (b.y - b.h / 2) * ts;
    const pw = b.w * ts;
    const ph = b.h * ts;
    const isNight = worldTime.hour >= 20 || worldTime.hour < 6;

    // 건물 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.fillRect(px + 6, py + 8, pw, ph);

    // 외벽
    ctx.fillStyle = b.color;
    ctx.fillRect(px, py, pw, ph);

    // 지붕
    ctx.fillStyle = b.roofColor;
    ctx.fillRect(px + 3, py + 3, pw - 6, ph - 10);

    // 테두리
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    // 밤 시간대 창문 불빛
    if (isNight && b.type !== 'lair') {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(px + 8, py + ph - 9, 6, 5);
      ctx.fillRect(px + pw - 14, py + ph - 9, 6, 5);
    }

    // 황금밀 마을 대풍차 회전 날개 연출
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

    // 건물 아이콘 & 이름 (가까이 줌인했을 때 표시)
    if (zoom > 0.55) {
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.icon, b.x * ts, b.y * ts + 4);

      if (zoom > 0.85) {
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
      ? Math.abs(Math.sin(e.animPhase)) * 4
      : 0;

    ctx.save();
    if (isFilteredOut) ctx.globalAlpha = 0.22;

    // 선택된 개체 강조 오라
    if (isSelected) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(px, py, 18 * e.scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 상인인 경우 짐마차(Wagon) 먼저 그리기
    if (e.hasWagon) {
      const wx = px - (e.vx >= 0 ? 16 : -16);
      const wy = py + 2;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(wx - 12, wy - 4, 24, 14);
      // 마차 몸체와 천막
      ctx.fillStyle = '#92400e';
      ctx.fillRect(wx - 11, wy - 8, 22, 12);
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(wx, wy - 8, 10, Math.PI, 0);
      ctx.fill();
      // 바퀴
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(wx - 7, wy + 4, 4, 0, Math.PI * 2);
      ctx.arc(wx + 7, wy + 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px, py + 5, 8 * e.scale, 4 * e.scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 캐릭터 원형 바디
    const r = 9.5 * e.scale;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(px, py - 4 - bounce, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = e.faction === 'monster' ? '#450a0a' : '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 전투 중일 때 검격/이펙트 링 표시
    if (e.state === 'combat') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(px, py - 4, r + 4 + Math.sin(timeSec * 12) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 아이콘 표시
    if (zoom > 0.35) {
      ctx.font = `${Math.round(13 * e.scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.icon, px, py - 4 - bounce);
    }

    // 체력바 (체력이 깎였거나 전투 중이거나 선택된 경우)
    if ((e.hp < e.maxHp || isSelected) && zoom > 0.45) {
      const bw = 24 * e.scale;
      const bh = 4;
      const bx = px - bw / 2;
      const by = py - 19 * e.scale - bounce;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(bx, by, bw, bh);
      const hpRatio = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = e.faction === 'monster' ? '#ef4444' : '#22c55e';
      ctx.fillRect(bx, by, bw * hpRatio, bh);
    }

    // 근접 줌 또는 선택 시 이름 & 말풍선 표시
    if ((zoom > 0.95 || isSelected) && !isFilteredOut) {
      ctx.font = 'bold 10.5px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 3;
      ctx.strokeText(e.name, px, py + 15);
      ctx.fillStyle = e.faction === 'monster' ? '#fca5a5' : '#f8fafc';
      ctx.fillText(e.name, px, py + 15);

      // 선택되었거나 아주 가까이 확대한 경우 현재 행동/생각 말풍선 표시
      if (isSelected || zoom > 1.35) {
        const bubbleText = e.thought;
        ctx.font = '10px Pretendard, sans-serif';
        const tw = ctx.measureText(bubbleText).width + 12;
        const bx = px - tw / 2;
        const by = py - 36 * e.scale - bounce;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = isSelected ? '#facc15' : 'rgba(255,255,255,0.25)';
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
      const fontSize = zoom < 0.45 ? Math.round(14 / Math.max(0.22, zoom)) : 14;
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

    // 비 또는 꽃잎/반딧불이 날씨 효과
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
      // 밤 시간대 반딧불이 파티클
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

    mCtx.clearRect(0, 0, mw, mh);
    mCtx.drawImage(this.minimapBaseCanvas, 0, 0, mw, mh);

    // 엔티티 점 표시
    for (const e of this.entityMgr.entities) {
      if (filterCategory !== 'all' && e.category !== filterCategory) continue;
      mCtx.fillStyle = e.faction === 'monster' ? '#ef4444' : (e.role === 'merchant' ? '#facc15' : '#38bdf8');
      const sz = e.role === 'merchant' ? 3 : 2;
      mCtx.fillRect(e.x - sz / 2, e.y - sz / 2, sz, sz);
    }

    // 거점 포인트 표시
    for (const s of this.world.settlements) {
      mCtx.fillStyle = s.faction === 'monster' ? '#dc2626' : '#fde047';
      mCtx.beginPath();
      mCtx.arc(s.x, s.y, 3.5, 0, Math.PI * 2);
      mCtx.fill();
      mCtx.strokeStyle = '#000';
      mCtx.lineWidth = 1;
      mCtx.stroke();
    }

    // 현재 카메라 뷰포트 사각형 표시
    const viewTilesW = (cw / camera.zoom) / TILE_SIZE;
    const viewTilesH = (ch / camera.zoom) / TILE_SIZE;
    mCtx.strokeStyle = '#ffffff';
    mCtx.lineWidth = 1.5;
    mCtx.strokeRect(
      camera.x - viewTilesW / 2,
      camera.y - viewTilesH / 2,
      viewTilesW,
      viewTilesH
    );
  }
}

window.WorldRenderer = WorldRenderer;
