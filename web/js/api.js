// data stuff. the java backend isnt done yet so for now we just
// read a json file (data/state.json) and the actions dont do anything yet
// TODO: switch these to fetch('/api/...') when the backend is ready

let saved = null;

async function loadData() {
  if (!saved) {
    const res = await fetch(new URL('../data/state.json', import.meta.url));
    if (!res.ok) throw new Error('Could not load data/state.json');
    saved = await res.json();
  }
  return saved;
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

// move is the only action that works for now
export async function move(roomId) {
  const state = (await loadData()).state;
  const edge = state.edges.find(function (e) {
    return !e.locked &&
      ((e.from === state.currentRoom && e.to === roomId) || (e.to === state.currentRoom && e.from === roomId));
  });
  if (!edge || edge.cost > state.timeRemaining) {
    return state;
  }

  state.currentRoom = roomId;
  state.timeRemaining -= edge.cost;
  const room = state.rooms.find(function (r) { return r.id === roomId; });
  room.visited = true;
  state.message = 'You walk to the ' + room.name + '.';

  // work out which rooms are next to the new room
  state.adjacent = [];
  for (const e of state.edges) {
    if (e.locked) continue;
    if (e.from === roomId) state.adjacent.push(e.to);
    if (e.to === roomId) state.adjacent.push(e.from);
  }
  return state;
}

// TODO: these dont do anything yet
export async function inspect() {
  return (await loadData()).state;
}

export async function interview(witnessId) {
  return (await loadData()).state;
}

export async function lockEdge(edgeId) {
  return (await loadData()).state;
}

export async function accuse(suspectId) {
  return (await loadData()).state;
}
