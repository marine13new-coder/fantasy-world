const fs = require('fs');

// Append to test_new_world.js to check tile of each settlement
const content = fs.readFileSync('scratch/test_new_world.js', 'utf8');

const testCode = `
settlements.forEach(s => {
  const t = res.tiles[res.idx(s.x, s.y)];
  console.log(\`[\${s.id}] \${s.name} at (\${s.x}, \${s.y}): Tile=\${t}\`);
});
`;

fs.writeFileSync('scratch/test_new_world.js', content + testCode);
