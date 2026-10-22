// GitHub Pages is a static preview. When Spring serves this view, actions go
// through its controller and the server owns the game state.
export const isPreview = location.hostname.endsWith('github.io');

async function request(path, method = 'GET') {
  const response = await fetch(`/api/game${path}`, { method });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const error = await response.json();
      message = error.detail || error.title || message;
    } catch { /* A non-JSON server error still has the status message. */ }
    throw new Error(message);
  }
  return response.json();
}

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
  if (!isPreview) return request('');
  const data = await loadData();
  return data.state;
}

export async function searchRegister(query) {
  if (!isPreview) return request(`/register?q=${encodeURIComponent(query)}`);
  const data = await loadData();
  const q = query.toLowerCase();
  return data.registerLedger.filter(function (entry) {
    return entry.itemName.toLowerCase().includes(q) || entry.category.toLowerCase().includes(q);
  });
}

// move is the only action that works for now
export async function move(roomId) {
  if (!isPreview) return request(`/move/${encodeURIComponent(roomId)}`, 'POST');
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

// These actions are available when Spring serves the page. GitHub Pages is a static preview.
export async function inspect() {
  if (!isPreview) return request('/inspect', 'POST');
  return (await loadData()).state;
}

export async function interview(witnessId) {
  if (!isPreview) return request(`/interview/${encodeURIComponent(witnessId)}`, 'POST');
  return (await loadData()).state;
}

export async function lockEdge(edgeId) {
  if (!isPreview) return request(`/edges/${encodeURIComponent(edgeId)}/toggle`, 'POST');
  return (await loadData()).state;
}

export async function accuse(suspectId) {
  if (!isPreview) return request(`/accuse/${encodeURIComponent(suspectId)}`, 'POST');
  return (await loadData()).state;
}
