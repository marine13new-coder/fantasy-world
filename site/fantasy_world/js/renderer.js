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

    this.bakeScale = 8; // 타일당 8픽셀 정밀 베이킹 (3840 x 2560: 4096px GPU/모바일 텍스처 한계 완전 호환 & 36% 메모리 절약)
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
    tCtx.imageSmoothingEnabled = false;
    mCtx.imageSmoothingEnabled = false;

    const s = this.bakeScale;
    const { width, height, tiles, deco } = this.world;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const t = tiles[idx];
        const info = TILE_INFO[t] || TILE_INFO[TILE.GRASS];

        // 1. 기본 베이스 픽셀 컬러
        tCtx.fillStyle = info.color;
        tCtx.fillRect(x * s, y * s, s, s);

        // 2. 픽셀아트 타일 텍스처 & 도트 패턴
        if (t === TILE.DEEP_WATER) {
          // 대해양: 짙은 남색 픽셀 디더링 & 미세 물결 글리터
          tCtx.fillStyle = '#061320';
          tCtx.fillRect(x * s + 1, y * s + 1, 3, 1);
          tCtx.fillRect(x * s + 5, y * s + 5, 3, 1);
          if ((x * 7 + y * 13) % 11 === 0) {
            tCtx.fillStyle = 'rgba(56, 189, 248, 0.25)';
            tCtx.fillRect(x * s + 3, y * s + 3, 2, 1);
          }
        } else if (t === TILE.WATER) {
          // 연안/강: 부드러운 청색 픽셀 물결 줄무늬
          tCtx.fillStyle = '#1e40af';
          tCtx.fillRect(x * s, y * s + 3, s - 2, 1);
          tCtx.fillRect(x * s + 2, y * s + 7, s - 3, 1);
          tCtx.fillStyle = 'rgba(147, 197, 253, 0.35)';
          tCtx.fillRect(x * s + 3, y * s + 4, 3, 1);
        } else if (t === TILE.GRASS) {
          // 초원: 2픽셀 세로 풀잎 도트
          tCtx.fillStyle = '#2f5a2b';
          tCtx.fillRect(x * s + 2, y * s + 3, 1, 2);
          tCtx.fillRect(x * s + 7, y * s + 6, 1, 2);
          tCtx.fillStyle = '#447d3d';
          tCtx.fillRect(x * s + 3, y * s + 2, 1, 1);
          tCtx.fillRect(x * s + 8, y * s + 5, 1, 1);
        } else if (t === TILE.MEADOW) {
          // 평야: 에메랄드 풀밭과 작은 야생화 도트
          tCtx.fillStyle = '#3c6e35';
          tCtx.fillRect(x * s + 1, y * s + 2, 2, 1);
          tCtx.fillRect(x * s + 6, y * s + 7, 2, 1);
          if ((x + y) % 3 === 0) {
            tCtx.fillStyle = (x * 3 + y) % 2 === 0 ? '#facc15' : '#f472b6';
            tCtx.fillRect(x * s + 4, y * s + 4, 1.5, 1.5);
          }
        } else if (t === TILE.ROAD) {
          // 왕국 가도: 고전 RPG 스타일 조약돌 보도블록
          tCtx.fillStyle = '#7a6c57';
          tCtx.fillRect(x * s, y * s, s, s);
          // 조약돌 4개 배치
          tCtx.fillStyle = '#9c8c74';
          tCtx.fillRect(x * s + 1, y * s + 1, 3, 3);
          tCtx.fillRect(x * s + 5, y * s + 1, 4, 3);
          tCtx.fillRect(x * s + 1, y * s + 5, 4, 4);
          tCtx.fillRect(x * s + 6, y * s + 5, 3, 4);
          // 돌 모서리 하이라이트
          tCtx.fillStyle = '#b8a68a';
          tCtx.fillRect(x * s + 1, y * s + 1, 1, 1);
          tCtx.fillRect(x * s + 5, y * s + 1, 1, 1);
          tCtx.fillRect(x * s + 1, y * s + 5, 1, 1);
          tCtx.fillRect(x * s + 6, y * s + 5, 1, 1);
        } else if (t === TILE.BRIDGE) {
          // 목조 다리: 갈색 가로 널빤지와 못 자국
          tCtx.fillStyle = '#4a2f18';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#855834';
          for (let p = 1; p < s; p += 3) {
            tCtx.fillRect(x * s + 1, y * s + p, s - 2, 2);
            tCtx.fillStyle = '#29180c';
            tCtx.fillRect(x * s + 1, y * s + p, 1, 1);
            tCtx.fillRect(x * s + s - 2, y * s + p, 1, 1);
            tCtx.fillStyle = '#855834';
          }
        } else if (t === TILE.CASTLE_FLOOR) {
          // 성채 바닥: 마름모형 석재 타일
          tCtx.fillStyle = '#64748b';
          tCtx.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
          tCtx.fillStyle = '#94a3b8';
          tCtx.fillRect(x * s + 2, y * s + 2, 2, 2);
          tCtx.fillRect(x * s + 6, y * s + 6, 2, 2);
        } else if (t === TILE.WALL) {
          // 성벽: 3D 블록 음영과 총안구
          tCtx.fillStyle = '#1e293b';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#64748b';
          tCtx.fillRect(x * s + 1, y * s + 1, s - 2, 3);
          tCtx.fillStyle = '#475569';
          tCtx.fillRect(x * s + 1, y * s + 5, s - 2, 4);
          tCtx.fillStyle = '#94a3b8';
          tCtx.fillRect(x * s + 1, y * s + 1, 2, 2);
          tCtx.fillRect(x * s + s - 3, y * s + 1, 2, 2);
        } else if (t === TILE.DOCK) {
          // 부두: 바다 위 목재 데크
          tCtx.fillStyle = '#54361b';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#855831';
          tCtx.fillRect(x * s + 1, y * s + 1, s - 2, 3);
          tCtx.fillRect(x * s + 1, y * s + 5, s - 2, 3);
          tCtx.fillStyle = '#2d180b';
          tCtx.fillRect(x * s + 1, y * s + 4, s - 2, 1);
        } else if (t === TILE.FARMLAND) {
          // 밭: 갈색 고랑과 초록 새싹
          tCtx.fillStyle = '#4d361b';
          tCtx.fillRect(x * s, y * s, s, s);
          tCtx.fillStyle = '#684f2b';
          tCtx.fillRect(x * s + 1, y * s + 1, s - 2, 2);
          tCtx.fillRect(x * s + 1, y * s + 5, s - 2, 2);
          tCtx.fillStyle = '#84cc16';
          tCtx.fillRect(x * s + 3, y * s + 2, 1.5, 1);
          tCtx.fillRect(x * s + 7, y * s + 6, 1.5, 1);
        } else if (t === TILE.DESERT) {
          // 사막: 황금빛 픽셀 모래언덕
          tCtx.fillStyle = '#b45309';
          tCtx.fillRect(x * s + 1, y * s + 3, s - 2, 1);
          tCtx.fillRect(x * s + 3, y * s + 7, s - 4, 1);
          tCtx.fillStyle = '#fde68a';
          tCtx.fillRect(x * s + 2, y * s + 2, 2, 1);
        } else if (t === TILE.CORAL) {
          // 산호초: 산호 픽셀 클러스터
          tCtx.fillStyle = '#0284c7';
          tCtx.fillRect(x * s + 2, y * s + 2, 2, 2);
          tCtx.fillStyle = '#f472b6';
          tCtx.fillRect(x * s + 6, y * s + 5, 2, 2);
        } else if (t === TILE.AUTUMN_WOOD) {
          // 단풍림 지면: 붉은/주황 낙엽 도트
          tCtx.fillStyle = '#9a3412';
          tCtx.fillRect(x * s + 2, y * s + 3, 2, 1);
          tCtx.fillStyle = '#ea580c';
          tCtx.fillRect(x * s + 6, y * s + 6, 2, 1);
        } else if (t === TILE.LAVA) {
          // 용암
          tCtx.fillStyle = '#ef4444';
          tCtx.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
          tCtx.fillStyle = '#fef08a';
          tCtx.fillRect(x * s + 4, y * s + 4, 2, 2);
        }

        // 3. 픽셀아트 자연 식생 & 오브젝트
        const d = deco[idx];
        if (d === 1) {
          // 참나무 (Oak Tree): 픽셀 나무 기둥 + 풍성한 3단 둥근 잎사귀
          tCtx.fillStyle = '#451a03'; // 줄기
          tCtx.fillRect(x * s + 4, y * s + 6, 2, 3);
          tCtx.fillStyle = '#14532d'; // 짙은 잎
          tCtx.fillRect(x * s + 2, y * s + 2, 6, 5);
          tCtx.fillStyle = '#16a34a'; // 하이라이트 잎
          tCtx.fillRect(x * s + 3, y * s + 1, 4, 3);
          tCtx.fillRect(x * s + 4, y * s + 1, 2, 1);
        } else if (d === 2) {
          // 침엽수 (Pine Tree): 픽셀 계단식 피라미드
          tCtx.fillStyle = '#27190d';
          tCtx.fillRect(x * s + 4, y * s + 7, 2, 2);
          tCtx.fillStyle = '#064e3b';
          tCtx.fillRect(x * s + 1, y * s + 5, 8, 3);
          tCtx.fillRect(x * s + 2, y * s + 3, 6, 2);
          tCtx.fillStyle = '#059669';
          tCtx.fillRect(x * s + 4, y * s + 1, 2, 2);
        } else if (d === 3) {
          // 꽃 (Flowers): 4방향 픽셀 꽃잎
          tCtx.fillStyle = (x + y) % 2 === 0 ? '#f43f5e' : '#facc15';
          tCtx.fillRect(x * s + 4, y * s + 4, 2, 2);
          tCtx.fillStyle = '#ffffff';
          tCtx.fillRect(x * s + 5, y * s + 4, 1, 1);
        } else if (d === 4) {
          // 바위 (Rock): 각진 픽셀 돌멩이
          tCtx.fillStyle = '#3f3f46';
          tCtx.fillRect(x * s + 2, y * s + 4, 6, 4);
          tCtx.fillStyle = '#71717a';
          tCtx.fillRect(x * s + 3, y * s + 3, 4, 3);
          tCtx.fillStyle = '#a1a1aa';
          tCtx.fillRect(x * s + 4, y * s + 3, 2, 1);
        } else if (d === 5) {
          // 사막 야자수 / 선인장
          tCtx.fillStyle = '#15803d';
          tCtx.fillRect(x * s + 4, y * s + 2, 2, 7);
          tCtx.fillRect(x * s + 2, y * s + 4, 2, 3);
          tCtx.fillRect(x * s + 6, y * s + 3, 2, 3);
        } else if (d === 6) {
          // 요정 벚꽃나무 (엘븐하임)
          tCtx.fillStyle = '#3b2512';
          tCtx.fillRect(x * s + 4, y * s + 6, 2, 3);
          tCtx.fillStyle = '#ec4899';
          tCtx.fillRect(x * s + 2, y * s + 2, 6, 5);
          tCtx.fillStyle = '#fbcfe8';
          tCtx.fillRect(x * s + 3, y * s + 1, 4, 3);
        } else if (d === 7) {
          // 단풍나무 (Maple)
          tCtx.fillStyle = '#451a03';
          tCtx.fillRect(x * s + 4, y * s + 6, 2, 3);
          tCtx.fillStyle = '#c2410c';
          tCtx.fillRect(x * s + 2, y * s + 2, 6, 5);
          tCtx.fillStyle = '#ea580c';
          tCtx.fillRect(x * s + 3, y * s + 1, 4, 3);
        } else if (d === 8) {
          // 빛나는 얼음/마법 수정
          tCtx.fillStyle = '#0284c7';
          tCtx.fillRect(x * s + 4, y * s + 2, 2, 6);
          tCtx.fillStyle = '#38bdf8';
          tCtx.fillRect(x * s + 3, y * s + 4, 4, 2);
          tCtx.fillStyle = '#ffffff';
          tCtx.fillRect(x * s + 4, y * s + 3, 1, 1);
        }

        // 미니맵 픽셀
        mCtx.fillStyle = info.miniColor;
        mCtx.fillRect(x, y, 1, 1);
      }
    }
  }

  render(camera, worldTime, filterCategory, selectedItem, timeSec) {
    const ctx = this.ctx;
    const { width: cw, height: ch } = this.canvas;
    const ts = TILE_SIZE;

    ctx.imageSmoothingEnabled = false; // 픽셀 아트 레더링 유지

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#061320';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(cw / 2, ch / 2);
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
    for (const e of this.entityMgr.entities) {
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
    this.drawAtmosphereOverlay(ctx, cw, ch, worldTime, timeSec);

    // 14. 미니맵 렌더링
    this.renderMinimap(camera, cw, ch, filterCategory);
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

    // 픽셀 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(px - bw / 2 + 3, py + bh / 2, bw - 2, 4);

    // 픽셀 외벽 (벽돌 패턴)
    ctx.fillStyle = b.color;
    ctx.fillRect(px - bw / 2, py - bh / 2, bw, bh);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(px - bw / 2, py + bh / 2 - 4, bw, 4);

    // 픽셀 지붕 (박공 지붕 삼각형)
    ctx.fillStyle = b.roofColor;
    ctx.beginPath();
    ctx.moveTo(px - bw / 2 - 4, py - bh / 2);
    ctx.lineTo(px, py - bh / 2 - 16);
    ctx.lineTo(px + bw / 2 + 4, py - bh / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(px - bw / 4, py - bh / 2 - 8, bw / 2, 2); // 지붕 하이라이트 라인

    // 창문 (밤에는 따스한 호박색 픽셀 조명)
    const isNight = worldTime.hour >= 19 || worldTime.hour < 6;
    if (isNight && zoom > 0.45) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - bw / 4 - 3, py - 4, 6, 8);
      ctx.fillRect(px + bw / 4 - 3, py - 4, 6, 8);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(px - bw / 4 - 2, py - 3, 2, 2);
      ctx.fillRect(px + bw / 4 - 2, py - 3, 2, 2);
    } else if (zoom > 0.5) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(px - bw / 4 - 3, py - 4, 6, 8);
      ctx.fillRect(px + bw / 4 - 3, py - 4, 6, 8);
    }

    // 굴뚝 & 모락모락 픽셀 연기
    if (b.type === 'forge' || b.type === 'tavern' || b.type === 'market') {
      const chX = px + Math.round(bw / 3);
      const chY = py - Math.round(bh / 2) - 10;
      ctx.fillStyle = '#334155';
      ctx.fillRect(chX - 2, chY, 5, 10);

      for (let s = 1; s <= 3; s++) {
        const sProg = ((timeSec * 1.5 + s * 0.33) % 1.0);
        const sx = chX + Math.round(Math.sin(timeSec * 2 + s) * 4);
        const sy = Math.round(chY - sProg * 26);
        const sr = Math.max(2, Math.round(3 + sProg * 4));
        ctx.fillStyle = `rgba(226, 232, 240, ${Math.max(0, 0.45 * (1 - sProg))})`;
        ctx.fillRect(sx - sr / 2, sy - sr / 2, sr, sr);
      }
    }

    // 회전하는 픽셀 풍차
    if (b.type === 'windmill') {
      const cx = px;
      const cy = py - 4;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(timeSec * 1.6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, -36, 4, 72);
      ctx.fillRect(-36, -2, 72, 4);

      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(2, -34, 10, 24);
      ctx.fillRect(2, 10, 10, 24);
      ctx.fillRect(-34, 2, 24, 10);
      ctx.fillRect(10, -12, 24, 10);
      ctx.restore();
    }

    // 펄럭이는 픽셀 깃발
    if (b.type === 'barracks' || b.type === 'palace') {
      const fx = px;
      const fy = py - Math.round(bh / 2) - 16;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(fx, fy - 12, 2, 12);
      const flap = Math.round(Math.sin(timeSec * 4 + b.x) * 2);
      ctx.fillStyle = b.roofColor;
      ctx.fillRect(fx + 2, fy - 12, 8 + flap, 6);
    }

    if (zoom > 0.45) {
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.icon, px, py + 4);

      if (zoom > 0.82) {
        ctx.font = 'bold 11px Pretendard, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        ctx.strokeText(b.name, px, py - Math.round(bh / 2) - 18);
        ctx.fillText(b.name, px, py - Math.round(bh / 2) - 18);
      }
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

  // (B) 4대 고대 드래곤 픽셀아트
  drawSpriteDragon(ctx, px, py, bounce, e, timeSec) {
    const sc = e.scale;
    const flap = Math.round(Math.sin(e.wingsPhase) * 6);
    const dColor = e.dragonType === 'frost'
      ? '#0284c7'
      : (e.dragonType === 'thunder' ? '#ca8a04' : (e.dragonType === 'poison' ? '#15803d' : '#b91c1c'));
    const bellyColor = e.dragonType === 'frost' ? '#bae6fd' : '#fef08a';

    // 몸체 & 꼬리
    ctx.fillStyle = dColor;
    ctx.fillRect(px - 7 * sc, py - 6 * sc - bounce, 14 * sc, 12 * sc);
    ctx.fillRect(px - 14 * sc, py + 2 * sc - bounce, 8 * sc, 4 * sc); // 꼬리
    ctx.fillRect(px + 5 * sc, py - 12 * sc - bounce, 7 * sc, 7 * sc); // 머리
    ctx.fillStyle = bellyColor;
    ctx.fillRect(px - 4 * sc, py - 3 * sc - bounce, 8 * sc, 8 * sc); // 배 비늘

    // 빛나는 슬릿 눈
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(px + 9 * sc, py - 10 * sc - bounce, 2 * sc, 2 * sc);

    // 날개 2단 박쥐 골격
    ctx.fillStyle = dColor;
    ctx.fillRect(px - 22 * sc, py - 16 * sc + flap * sc, 16 * sc, 3 * sc);
    ctx.fillRect(px + 4 * sc, py - 16 * sc + flap * sc, 16 * sc, 3 * sc);
    ctx.fillStyle = e.projColor;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(px - 20 * sc, py - 13 * sc + flap * sc, 14 * sc, 8 * sc);
    ctx.fillRect(px + 6 * sc, py - 13 * sc + flap * sc, 14 * sc, 8 * sc);
    ctx.globalAlpha = 1.0;

    // 입김 파티클
    ctx.fillStyle = e.projColor;
    ctx.fillRect(px + 12 * sc + Math.round(Math.sin(timeSec * 8) * 3), py - 9 * sc, 3 * sc, 3 * sc);
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

    // 황혼/새벽의 골든아워 노을
    if ((h >= 18 && h < 20) || (h >= 5 && h < 7)) {
      ctx.fillStyle = 'rgba(234, 88, 12, 0.07)';
      ctx.fillRect(0, 0, cw, ch);
    }

    // 날씨별 픽셀 파티클
    if (worldTime.weather === 'rain') {
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.42)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < 95; i++) {
        const rx = Math.floor((i * 197 + timeSec * 280) % cw);
        const ry = Math.floor((i * 311 + timeSec * 650) % ch);
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 4, ry + 12);
      }
      ctx.stroke();
    } else if (darkness > 0.25) {
      // 밤의 신비로운 반딧불이
      ctx.fillStyle = '#fde047';
      for (let i = 0; i < 45; i++) {
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
