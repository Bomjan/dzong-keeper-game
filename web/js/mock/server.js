// Fake backend for local development.
//
// Importing this module installs a `window.fetch` wrapper that intercepts
// every `/api/...` request, mutates an in-memory copy of fixture.json, and
// answers with the same shapes the real Java backend will use. Everything
// else falls through to the real network fetch.
//
// To develop against the real backend instead, remove the import of this
// file from api.js — that is the only change required.

const REAL_FETCH = window.fetch.bind(window);

// Bump this above 0 to rehearse the error banner during development.
const MOCK_FAIL_RATE = 0;

let fixturePromise = null;
let state = null;
let culpritSuspectId = null;
let hiddenFindings = null;
let hiddenClues = null;
let registerLedger = null;

function loadFixture() {
  if (!fixturePromise) {
    fixturePromise = REAL_FETCH(new URL('./fixture.json', import.meta.url))
      .then((res) => res.json())
      .then((fixture) => {
        state = structuredClone(fixture.state);
        culpritSuspectId = fixture.culpritSuspectId;
        hiddenFindings = structuredClone(fixture.hiddenFindings || {});
        hiddenClues = structuredClone(fixture.hiddenClues || {});
        registerLedger = structuredClone(fixture.registerLedger || []);
      });
  }
  return fixturePromise;
}

function delay() {
  const ms = 250 + Math.random() * 300;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonResponse(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(status, message) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function findRoom(id) {
  return state.rooms.find((r) => r.id === id);
}

function findEdgeBetween(a, b) {
  return state.edges.find(
    (e) => (e.from === a && e.to === b) || (e.from === b && e.to === a)
  );
}

function recomputeAdjacent() {
  state.adjacent = state.edges
    .filter((e) => !e.locked && (e.from === state.currentRoom || e.to === state.currentRoom))
    .map((e) => (e.from === state.currentRoom ? e.to : e.from));
}

function elapsed() {
  return state.timeTotal - state.timeRemaining;
}

function spendTime(cost) {
  state.timeRemaining = Math.max(0, state.timeRemaining - cost);
  if (state.timeRemaining === 0 && state.phase !== 'WON') {
    state.phase = 'LOST';
    state.message = 'The tshechu ends. Whatever was taken is gone with it.';
    return true;
  }
  return false;
}

function shortestPath(fromId, toId) {
  if (fromId === toId) return { from: fromId, to: toId, path: [fromId], totalCost: 0 };
  const dist = new Map([[fromId, 0]]);
  const prev = new Map();
  const visited = new Set();
  const queue = new Set(state.rooms.map((r) => r.id));

  while (queue.size) {
    let current = null;
    let currentDist = Infinity;
    for (const id of queue) {
      const d = dist.has(id) ? dist.get(id) : Infinity;
      if (d < currentDist) {
        currentDist = d;
        current = id;
      }
    }
    if (current === null) break;
    queue.delete(current);
    visited.add(current);
    if (current === toId) break;

    const neighbours = state.edges.filter(
      (e) => !e.locked && (e.from === current || e.to === current)
    );
    for (const edge of neighbours) {
      const next = edge.from === current ? edge.to : edge.from;
      if (visited.has(next)) continue;
      const candidate = currentDist + edge.cost;
      if (candidate < (dist.has(next) ? dist.get(next) : Infinity)) {
        dist.set(next, candidate);
        prev.set(next, current);
      }
    }
  }

  if (!dist.has(toId)) {
    return { from: fromId, to: toId, path: [], totalCost: null };
  }

  const path = [toId];
  let cursor = toId;
  while (cursor !== fromId) {
    cursor = prev.get(cursor);
    path.unshift(cursor);
  }
  return { from: fromId, to: toId, path, totalCost: dist.get(toId) };
}

const routes = {
  async 'GET /api/state'() {
    return jsonResponse(state);
  },

  async 'POST /api/move'(params) {
    const roomId = params.get('roomId');
    const room = findRoom(roomId);
    const edge = room ? findEdgeBetween(state.currentRoom, roomId) : null;

    if (!room || !edge || edge.locked) {
      state.message = 'There is no open corridor there.';
      return jsonResponse(state);
    }

    const ranOut = spendTime(edge.cost);
    if (!ranOut) {
      state.currentRoom = roomId;
      room.visited = true;
      recomputeAdjacent();
      state.message = `You arrive at ${room.name}.`;
    }
    return jsonResponse(state);
  },

  async 'POST /api/inspect'() {
    const room = findRoom(state.currentRoom);
    const ranOut = spendTime(15);
    if (!ranOut) {
      room.visited = true;
      room.lastInspectedAt = elapsed();

      const revealed = hiddenFindings[room.id];
      if (revealed && revealed.length) {
        state.findings.push(...revealed);
        room.anomalyCount += revealed.filter((f) => f.type !== 'EXPLAINED').length;
        delete hiddenFindings[room.id];
        state.message = 'You find something amiss.';
      } else {
        state.message = 'Nothing further to note here.';
      }
    }
    return jsonResponse(state);
  },

  async 'POST /api/interview'(params) {
    const witnessId = params.get('witnessId');
    const witness = state.witnesses.find((w) => w.id === witnessId);
    if (!witness) {
      return errorResponse(404, 'No such witness.');
    }

    const alreadyDone = witness.interviewed && !(hiddenClues[witnessId] || []).length;
    if (alreadyDone) {
      state.message = `${witness.name} has nothing more to say.`;
      return jsonResponse(state);
    }

    const ranOut = spendTime(20);
    if (!ranOut) {
      witness.interviewed = true;
      const revealed = hiddenClues[witnessId];
      if (revealed && revealed.length) {
        state.clues.push(...revealed);
        delete hiddenClues[witnessId];
        state.message = `${witness.name} recalls something useful.`;
      } else {
        state.message = `${witness.name} answers your questions.`;
      }
    }
    return jsonResponse(state);
  },

  async 'GET /api/register'(params) {
    const q = (params.get('q') || '').trim().toLowerCase();
    const matches = q
      ? registerLedger.filter((entry) => entry.itemName.toLowerCase().includes(q))
      : registerLedger;
    return jsonResponse(matches);
  },

  async 'GET /api/patrol'(params) {
    const from = params.get('from');
    const to = params.get('to');
    if (!findRoom(from) || !findRoom(to)) {
      return errorResponse(400, 'Unknown room.');
    }
    return jsonResponse(shortestPath(from, to));
  },

  async 'POST /api/lock'(params) {
    const edgeId = params.get('edgeId');
    const edge = state.edges.find((e) => e.id === edgeId);
    if (!edge) {
      return errorResponse(404, 'No such corridor.');
    }
    const ranOut = spendTime(5);
    if (!ranOut) {
      edge.locked = !edge.locked;
      recomputeAdjacent();
      state.message = edge.locked ? 'The corridor is barred.' : 'The corridor is opened again.';
    }
    return jsonResponse(state);
  },

  async 'POST /api/accuse'(params) {
    const suspectId = params.get('suspectId');
    const suspect = state.suspects.find((s) => s.id === suspectId);
    if (!suspect) {
      return errorResponse(404, 'No such suspect.');
    }

    if (suspectId === culpritSuspectId) {
      state.phase = 'WON';
      state.message = 'You name the intruder correctly. The dzong is secure.';
      return jsonResponse({ correct: true, message: state.message, phase: state.phase });
    }

    suspect.eliminated = true;
    const message = `${suspect.label} is cleared. The real intruder is still inside.`;
    state.message = message;
    return jsonResponse({ correct: false, message, phase: state.phase });
  },
};

function parseRequest(input, init) {
  const raw = typeof input === 'string' ? input : input.url;
  const [path, queryString] = raw.split('?');
  const method = ((init && init.method) || 'GET').toUpperCase();
  const params = method === 'GET'
    ? new URLSearchParams(queryString || '')
    : new URLSearchParams((init && init.body) || '');
  return { path, method, params };
}

window.fetch = async function mockFetch(input, init) {
  const { path, method, params } = parseRequest(input, init);
  if (!path.startsWith('/api/')) {
    return REAL_FETCH(input, init);
  }

  await loadFixture();
  await delay();

  if (MOCK_FAIL_RATE > 0 && Math.random() < MOCK_FAIL_RATE) {
    return errorResponse(500, 'The register office is not answering.');
  }

  const handler = routes[`${method} ${path}`];
  if (!handler) {
    return errorResponse(404, `No mock route for ${method} ${path}`);
  }
  return handler(params);
};
