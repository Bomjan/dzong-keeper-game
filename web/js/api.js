// data stuff. the java backend isnt done yet so for now we just
// read a json file (data/state.json) and the actions dont do anything yet
// TODO: switch these to fetch('/api/...') when the backend is ready

let saved = null;

async function loadData() {
  if (!saved) {
    const res = await fetch('data/state.json');
    if (!res.ok) throw new Error('Could not load data/state.json');
    saved = await res.json();
  }
  return saved;
}

function notDone(name) {
  throw new Error(name + ' is not done yet, backend coming soon');
}

export async function getState() {
  const data = await loadData();
  return data.state;
}

export async function searchRegister(query) {
  const data = await loadData();
  const q = query.toLowerCase();
  return data.registerLedger.filter(function (entry) {
    return entry.itemName.toLowerCase().includes(q) || entry.category.toLowerCase().includes(q);
  });
}

export async function move(roomId) {
  notDone('Move');
}

export async function inspect() {
  notDone('Inspect');
}

export async function interview(witnessId) {
  notDone('Interview');
}

export async function lockEdge(edgeId) {
  notDone('Lock');
}

export async function accuse(suspectId) {
  notDone('Accuse');
}
