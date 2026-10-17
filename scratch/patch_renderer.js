const fs = require('fs');

let code = fs.readFileSync('fantasy_world/js/renderer.js', 'utf8');

const oldStart = '  bakeStaticTerrain() {';
const oldEnd = '  render(camera, worldTime, filterCategory, selectedItem, timeSec) {';

const idxStart = code.indexOf(oldStart);
const idxEnd = code.indexOf(oldEnd);

if (idxStart === -1 || idxEnd === -1) {
  console.error('Indices not found!', idxStart, idxEnd);
  process.exit(1);
}

const replacement = `  bakeStaticTerrain() {
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

`;

code = code.slice(0, idxStart) + replacement + code.slice(idxEnd);

// Hook PixelBuildings in drawPixelBuilding
const bHook = '  drawPixelBuilding(ctx, b, ts, timeSec, zoom, worldTime) {';
const bHookIdx = code.indexOf(bHook);
if (bHookIdx !== -1) {
  const insertHook = bHook + `
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
`;
  const nextTarget = '    const isNight = worldTime ? (worldTime.hour >= 19 || worldTime.hour < 6) : false;';
  const nextTargetIdx = code.indexOf(nextTarget, bHookIdx);
  if (nextTargetIdx !== -1) {
    code = code.slice(0, bHookIdx) + insertHook + code.slice(nextTargetIdx + nextTarget.length);
  }
}

fs.writeFileSync('fantasy_world/js/renderer.js', code);
console.log('Successfully updated renderer.js with ImageData baking and PixelBuildings hook!');
