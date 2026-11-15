const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function test(name, run) {
  run();
  console.log(`PASS ${name}`);
}

function game() {
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, {
        disabled: false,
        innerText: '',
        style: {},
        classList: { add() {}, remove() {} },
      });
      return elements.get(id);
    },
    querySelectorAll() { return []; },
  };
  const context = vm.createContext({ document, Image: class {}, alert() {} });
  vm.runInContext(fs.readFileSync('web/js/main.js', 'utf8'), context);
  return (code) => vm.runInContext(code, context);
}

test('browser build, upgrade, sale, undo and redo restore tower and gold', () => {
  const run = game();
  run('gameState.selectedBuildSpot = { id: 1, x: 20, y: 20, tower: null }; buildTower("archer")');
  assert.equal(run('gameState.gold'), 100);
  assert.equal(run('towers.length'), 1);
  run('undoTowerEdit()');
  assert.equal(run('gameState.gold'), 150);
  assert.equal(run('towers.length'), 0);
  run('redoTowerEdit()');
  assert.equal(run('towers[0].id'), 1);
  run('gameState.selectedTower = towers[0]; upgradeSelectedTower()');
  assert.equal(run('towers[0].level'), 2);
  run('undoTowerEdit()');
  assert.equal(run('towers[0].level'), 1);
  run('redoTowerEdit()');
  assert.equal(run('towers[0].level'), 2);
  run('gameState.selectedTower = towers[0]; sellSelectedTower()');
  assert.equal(run('towers.length'), 0);
  run('undoTowerEdit()');
  assert.equal(run('towers[0].level'), 2);
  assert.equal(run('towers[0].id'), 1);
});

test('new edit clears redo and wave blocks history', () => {
  const run = game();
  run('gameState.selectedBuildSpot = { id: 1, x: 20, y: 20, tower: null }; buildTower("archer"); undoTowerEdit()');
  assert.equal(run('redoStack.length'), 1);
  run('gameState.selectedBuildSpot = { id: 2, x: 40, y: 20, tower: null }; buildTower("archer")');
  assert.equal(run('redoStack.length'), 0);
  run('gameState.inWave = true; undoTowerEdit()');
  assert.equal(run('towers.length'), 1);
});

test('grid selection matches linear selection and handles ties and boundaries', () => {
  const run = game();
  assert.equal(run('new SpatialHashGrid(100).cellKey(-1, 100)'), '-1,1');
  run('var sampleEnemies = [{id: 3, x: 100, y: 0}, {id: 2, x: 0, y: 100}, {id: 1, x: 900, y: 0}]; var grid = new SpatialHashGrid(100); sampleEnemies.forEach(e => grid.add(e)); var tower = {x: 0, y: 0, range: 150}');
  assert.equal(run('selectNearestEnemy(tower, sampleEnemies).id'),
    run('selectNearestEnemy(tower, grid.nearby(tower.x, tower.y, tower.range)).id'));
  assert.equal(run('selectNearestEnemy(tower, grid.nearby(tower.x, tower.y, tower.range)).id'), 2);
  assert.equal(run('grid.nearby(0, 0, 150).includes(sampleEnemies[2])'), false);
  run('for (let i = 4; i < 104; i++) { const e = { id: i, x: (i * 37) % 600 - 100, y: (i * 53) % 400 - 100 }; sampleEnemies.push(e); grid.add(e); }');
  for (let x = -100; x <= 500; x += 50) {
    assert.equal(run(`selectNearestEnemy({x:${x}, y:50, range:120}, sampleEnemies)?.id`),
      run(`selectNearestEnemy({x:${x}, y:50, range:120}, grid.nearby(${x}, 50, 120))?.id`));
  }
});
