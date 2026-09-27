// Renders the dzong as SVG. Pure rendering + click dispatch — this file
// never decides whether a move, lock or interview is valid. It only
// forwards the id the player clicked; the server decides what happens.
//
// The SVG is built once and updated in place on every subsequent render
// (rather than torn down and rebuilt) so that CSS transitions can animate
// between states: the player token slides from room to room, sky colour
// eases with the clock, badge counts pop when they change.

const SVG_NS = 'http://www.w3.org/2000/svg';
const ROOM_RADIUS = 24;
const PADDING = 90;

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

function computeBounds(rooms) {
  if (rooms.length === 0) return { minX: 0, minY: 0, w: PADDING * 2, h: PADDING * 2 };
  const xs = rooms.map((r) => r.x);
  const ys = rooms.map((r) => r.y);
  const minX = Math.min(...xs) - PADDING;
  const minY = Math.min(...ys) - PADDING;
  const maxX = Math.max(...xs) + PADDING;
  const maxY = Math.max(...ys) + PADDING;
  return { minX, minY, w: maxX - minX, h: maxY - minY };
}

function frac(bounds, fx, fy) {
  return { x: bounds.minX + bounds.w * fx, y: bounds.minY + bounds.h * fy };
}

function pointsAttr(pts) {
  return pts.map((p) => `${p.x},${p.y}`).join(' ');
}

// Time-of-day colour ramp: the sky eases from festival daylight down to a
// deep dusk as the clock runs out. Purely presentational — it reads the
// same timeRemaining/timeTotal ratio the time bar already shows.
const SKY_STOPS = [
  { at: 1.00, c: [237, 230, 218] },
  { at: 0.60, c: [231, 202, 160] },
  { at: 0.30, c: [193, 138, 102] },
  { at: 0.12, c: [122, 80, 67] },
  { at: 0.00, c: [56, 45, 42] },
];

function skyColor(ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const a = SKY_STOPS[i];
    const b = SKY_STOPS[i + 1];
    if (r <= a.at && r >= b.at) {
      const span = a.at - b.at || 1;
      const t = (a.at - r) / span;
      const mix = (x, y) => Math.round(x + (y - x) * t);
      return `rgb(${mix(a.c[0], b.c[0])}, ${mix(a.c[1], b.c[1])}, ${mix(a.c[2], b.c[2])})`;
    }
  }
  const last = SKY_STOPS[SKY_STOPS.length - 1].c;
  return `rgb(${last[0]}, ${last[1]}, ${last[2]})`;
}

function buildBackground(svg, bounds) {
  const bg = svgEl('g', { class: 'map-bg' });

  const sky = svgEl('rect', {
    class: 'map-sky',
    x: bounds.minX, y: bounds.minY, width: bounds.w, height: bounds.h,
  });
  bg.appendChild(sky);

  const hillPts = [
    frac(bounds, 0, 1), frac(bounds, 0, 0.84), frac(bounds, 0.14, 0.72),
    frac(bounds, 0.28, 0.8), frac(bounds, 0.42, 0.64), frac(bounds, 0.58, 0.76),
    frac(bounds, 0.74, 0.62), frac(bounds, 0.88, 0.74), frac(bounds, 1, 0.68),
    frac(bounds, 1, 1),
  ];
  bg.appendChild(svgEl('polygon', { class: 'map-hills', points: pointsAttr(hillPts) }));

  // A low, hand-drawn silhouette of the dzong itself, watermarked behind
  // the room graph — purely decorative, never interactive.
  const dzong = svgEl('g', { class: 'map-watermark' });
  const body = [frac(bounds, 0.36, 1), frac(bounds, 0.36, 0.8), frac(bounds, 0.64, 0.8), frac(bounds, 0.64, 1)];
  dzong.appendChild(svgEl('polygon', { points: pointsAttr(body) }));
  const roof = [frac(bounds, 0.32, 0.8), frac(bounds, 0.68, 0.8), frac(bounds, 0.5, 0.68)];
  dzong.appendChild(svgEl('polygon', { points: pointsAttr(roof) }));
  const tower = [frac(bounds, 0.46, 0.68), frac(bounds, 0.46, 0.52), frac(bounds, 0.54, 0.52), frac(bounds, 0.54, 0.68)];
  dzong.appendChild(svgEl('polygon', { points: pointsAttr(tower) }));
  const towerRoof = [frac(bounds, 0.44, 0.52), frac(bounds, 0.56, 0.52), frac(bounds, 0.5, 0.42)];
  dzong.appendChild(svgEl('polygon', { points: pointsAttr(towerRoof) }));
  bg.appendChild(dzong);

  svg.appendChild(bg);
  return { sky };
}

function buildPlayerToken() {
  const g = svgEl('g', { class: 'player-token' });
  g.appendChild(svgEl('circle', { class: 'player-halo', r: 15 }));
  const body = svgEl('path', {
    class: 'player-body',
    d: 'M 0 -12 C 6 -12 9 -7 9 -1 C 9 4 6 8 0 10 C -6 8 -9 4 -9 -1 C -9 -7 -6 -12 0 -12 Z',
  });
  g.appendChild(body);
  g.appendChild(svgEl('circle', { class: 'player-dot', r: 2.6 }));
  return g;
}

export function renderMap(container, state, viewState, callbacks) {
  let view = container._mapView;

  const roomIds = state.rooms.map((r) => r.id).join(',');
  const edgeIds = state.edges.map((e) => e.id).join(',');
  const needsRebuild = !view || view.roomIds !== roomIds || view.edgeIds !== edgeIds;

  if (needsRebuild) {
    view = buildStatic(container, state, callbacks);
    view.roomIds = roomIds;
    view.edgeIds = edgeIds;
    container._mapView = view;
  }

  // Keep the mutable flags the persistent listeners close over up to date.
  view.flags.lockModeActive = !!(viewState && viewState.lockModeActive);
  view.flags.interviewModeActive = !!(viewState && viewState.interviewModeActive);
  view.flags.adjacent = new Set(state.adjacent || []);

  const ratio = state.timeTotal > 0 ? state.timeRemaining / state.timeTotal : 1;
  view.sky.style.fill = skyColor(ratio);

  for (const edge of state.edges) {
    const el = view.edgesById.get(edge.id);
    if (!el) continue;
    el.g.classList.toggle('locked', !!edge.locked);
    el.g.classList.toggle('lockable', view.flags.lockModeActive);
  }

  for (const room of state.rooms) {
    const el = view.roomsById.get(room.id);
    if (!el) continue;
    const isCurrent = room.id === state.currentRoom;
    const isAdjacent = view.flags.adjacent.has(room.id);
    el.g.classList.toggle('visited', !!room.visited);
    el.g.classList.toggle('unvisited', !room.visited);
    el.g.classList.toggle('current', isCurrent);
    el.g.classList.toggle('adjacent', isAdjacent);

    const prevCount = view.anomalyCounts.get(room.id) || 0;
    if (room.anomalyCount > 0) {
      el.badgeText.textContent = String(room.anomalyCount);
      el.badge.removeAttribute('hidden');
      if (room.anomalyCount > prevCount) {
        el.badge.classList.remove('badge-pop');
        void el.badge.getBBox();
        el.badge.classList.add('badge-pop');
      }
    } else {
      el.badge.setAttribute('hidden', '');
    }
    view.anomalyCounts.set(room.id, room.anomalyCount);
  }

  for (const witness of state.witnesses || []) {
    const el = view.witnessesById.get(witness.id);
    if (!el) continue;
    const targetable = view.flags.interviewModeActive && !witness.interviewed;
    el.g.classList.toggle('interviewed', !!witness.interviewed);
    el.g.classList.toggle('targetable', targetable);
  }

  movePlayerToken(view, state);
}

function buildStatic(container, state, callbacks) {
  const { onRoomClick, onEdgeClick, onWitnessClick } = callbacks || {};
  const bounds = computeBounds(state.rooms);
  const roomsById = new Map(state.rooms.map((r) => [r.id, r]));

  const svg = svgEl('svg', {
    viewBox: `${bounds.minX} ${bounds.minY} ${bounds.w} ${bounds.h}`,
    preserveAspectRatio: 'xMidYMid meet',
  });

  const flags = { lockModeActive: false, interviewModeActive: false, adjacent: new Set() };

  const defs = svgEl('defs');
  const filter = svgEl('filter', { id: 'room-shadow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
  filter.appendChild(svgEl('feDropShadow', { dx: 0, dy: 1.5, stdDeviation: 1.6, 'flood-opacity': 0.28 }));
  defs.appendChild(filter);
  svg.appendChild(defs);

  const { sky } = buildBackground(svg, bounds);

  const edgesById = new Map();
  const edgeLayer = svgEl('g', { class: 'edge-layer' });
  for (const edge of state.edges) {
    const fromRoom = roomsById.get(edge.from);
    const toRoom = roomsById.get(edge.to);
    if (!fromRoom || !toRoom) continue;

    const g = svgEl('g', { class: 'edge', 'data-edge-id': edge.id });
    const line = svgEl('line', { class: 'edge-line', x1: fromRoom.x, y1: fromRoom.y, x2: toRoom.x, y2: toRoom.y });
    g.appendChild(line);
    const hit = svgEl('line', { class: 'edge-hit', x1: fromRoom.x, y1: fromRoom.y, x2: toRoom.x, y2: toRoom.y });
    hit.addEventListener('click', () => {
      if (!flags.lockModeActive) return;
      onEdgeClick(edge.id);
    });
    g.appendChild(hit);

    const midX = (fromRoom.x + toRoom.x) / 2;
    const midY = (fromRoom.y + toRoom.y) / 2;
    g.appendChild(svgEl('rect', { class: 'edge-cost-bg', x: midX - 12, y: midY - 8, width: 24, height: 16, rx: 3 }));
    const costText = svgEl('text', { class: 'edge-cost-text', x: midX, y: midY + 0.5 });
    costText.textContent = String(edge.cost);
    g.appendChild(costText);

    edgeLayer.appendChild(g);
    edgesById.set(edge.id, { g, line });
  }
  svg.appendChild(edgeLayer);

  const roomsById_ = new Map();
  const roomLayer = svgEl('g', { class: 'room-layer' });
  for (const room of state.rooms) {
    const g = svgEl('g', { class: 'room unvisited', 'data-room-id': room.id });

    const shape = svgEl('circle', { class: 'room-shape', cx: room.x, cy: room.y, r: ROOM_RADIUS, filter: 'url(#room-shadow)' });
    shape.addEventListener('click', () => {
      if (!flags.adjacent.has(room.id)) return;
      onRoomClick(room.id);
    });
    g.appendChild(shape);

    const glow = svgEl('circle', { class: 'room-current-glow', cx: room.x, cy: room.y, r: ROOM_RADIUS + 8 });
    g.insertBefore(glow, shape);

    const label = svgEl('text', { class: 'room-label', x: room.x, y: room.y + ROOM_RADIUS + 17 });
    label.textContent = room.name;
    g.appendChild(label);

    const badgeX = room.x + ROOM_RADIUS * 0.72;
    const badgeY = room.y - ROOM_RADIUS * 0.72;
    const badge = svgEl('g', { class: 'room-badge', hidden: '' });
    badge.appendChild(svgEl('circle', { cx: badgeX, cy: badgeY, r: 9.5 }));
    const badgeText = svgEl('text', { x: badgeX, y: badgeY + 0.5 });
    badge.appendChild(badgeText);
    g.appendChild(badge);

    roomLayer.appendChild(g);
    roomsById_.set(room.id, { g, badge, badgeText });
  }
  svg.appendChild(roomLayer);

  const witnessesById = new Map();
  const witnessLayer = svgEl('g', { class: 'witness-layer' });
  const byRoom = new Map();
  for (const witness of state.witnesses || []) {
    if (!byRoom.has(witness.roomId)) byRoom.set(witness.roomId, []);
    byRoom.get(witness.roomId).push(witness);
  }
  for (const [roomId, list] of byRoom) {
    const room = roomsById.get(roomId);
    if (!room) continue;
    list.forEach((witness, index) => {
      const angle = (-90 + index * 40) * (Math.PI / 180);
      const dist = ROOM_RADIUS + 17;
      const wx = room.x + dist * Math.cos(angle);
      const wy = room.y + dist * Math.sin(angle);

      const g = svgEl('g', { class: 'witness-marker', 'data-witness-id': witness.id });
      const circle = svgEl('circle', { cx: wx, cy: wy, r: 7.5 });
      circle.addEventListener('click', () => {
        if (!flags.interviewModeActive || witness.interviewed) return;
        onWitnessClick(witness.id);
      });
      g.appendChild(circle);
      witnessLayer.appendChild(g);
      witnessesById.set(witness.id, { g });
    });
  }
  svg.appendChild(witnessLayer);

  const playerToken = buildPlayerToken();
  svg.appendChild(playerToken);

  container.replaceChildren(svg);

  return {
    svg,
    sky,
    flags,
    edgesById,
    roomsById: roomsById_,
    witnessesById,
    playerToken,
    anomalyCounts: new Map(),
    lastRoomId: null,
    roomsData: roomsById,
  };
}

function movePlayerToken(view, state) {
  const room = view.roomsData.get(state.currentRoom);
  if (!room) return;

  // Parked to the room's lower-left, clear of witness markers (which sit
  // above the room) and the name label (just below it).
  const tokenX = room.x - ROOM_RADIUS - 15;
  const tokenY = room.y + ROOM_RADIUS * 0.4;

  if (view.lastRoomId === null) {
    view.playerToken.style.transition = 'none';
    view.playerToken.style.transform = `translate(${tokenX}px, ${tokenY}px)`;
    // Force layout so the next transform change (if any) actually animates.
    void view.playerToken.getBoundingClientRect();
    view.playerToken.style.transition = '';
  } else if (view.lastRoomId !== state.currentRoom) {
    view.playerToken.style.transform = `translate(${tokenX}px, ${tokenY}px)`;
    view.playerToken.classList.remove('walking');
    void view.playerToken.getBoundingClientRect();
    view.playerToken.classList.add('walking');
  }
  view.lastRoomId = state.currentRoom;
}
