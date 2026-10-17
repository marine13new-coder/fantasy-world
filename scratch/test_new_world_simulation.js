const fs = require('fs');

global.window = global;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

console.log('Testing SpatialGrid integration...');
