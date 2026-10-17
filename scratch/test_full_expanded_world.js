const fs = require('fs');

global.window = global;
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// We will test updating world_gen.js with the new layout
console.log('Testing prototype world gen expansion...');
