// ============================================================================
// scratch/test_pixel_buildings.js - Test Pixel Art Building & Prop Renderer
// ============================================================================

const fs = require('fs');

console.log('Building Pixel Building Architecture Test...');

const PALETTE = {
  // Roofs
  roof_slate: '#3b5278',
  roof_slate_dark: '#263750',
  roof_slate_light: '#5374a6',
  roof_terracotta: '#9a3412',
  roof_terracotta_dark: '#7c2d12',
  roof_moss: '#2d6a4f',
  
  // Timbers & Wood
  timber_dark: '#582f1c',
  timber_mid: '#78350f',
  timber_light: '#a16207',
  wood_plank: '#b45309',
  wood_light: '#d97706',
  
  // Plaster Wall
  plaster: '#ede0c8',
  plaster_shadow: '#cfc0a3',
  plaster_dark: '#a8987b',
  
  // Stone Masonry & Foundation
  stone_light: '#94a3b8',
  stone_mid: '#64748b',
  stone_dark: '#475569',
  stone_deep: '#1e293b',
  
  // Windows & Lights
  window_frame: '#451a03',
  window_glass_day: '#bae6fd',
  window_glass_night: '#fef08a',
  window_glow: 'rgba(254, 240, 138, 0.45)',
  
  // Market Awning Stripes
  awning_red: '#dc2626',
  awning_blue: '#2563eb',
  awning_green: '#16a34a',
  awning_white: '#f8fafc',
  awning_yellow: '#facc15',
  
  // Details
  iron: '#334155',
  iron_highlight: '#64748b',
  gold: '#facc15',
  fire_orange: '#f97316',
  fire_yellow: '#fef08a',
  smoke: 'rgba(203, 213, 225, 0.45)'
};

console.log('Palette configured with', Object.keys(PALETTE).length, 'precision pixel colors.');
