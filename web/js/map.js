// Renders the dzong as SVG. Pure rendering + click dispatch — this file
// never decides whether a move, lock or interview is valid. It only
// forwards the id the player clicked; the server decides what happens.

const SVG_NS = 'http://www.w3.org/2000/svg';
const ROOM_RADIUS = 22;
const PADDING = 70;

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

function computeViewBox(rooms) {
  if (rooms.length === 0) return `0 0 ${PADDING * 2} ${PADDING * 2}`;
  const xs = rooms.map((r) => r.x);
  const ys = rooms.map((r) => r.y);
  const minX = Math.min(...xs) - PADDING;
  const minY = Math.min(...ys) - PADDING;
  const maxX = Math.max(...xs) + PADDING;
  const maxY = Math.max(...ys) + PADDING;
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
}

function buildEdgeGroup(edge, fromRoom, toRoom, lockModeActive, onEdgeClick) {
  const g = svgEl('g', {
    class: `edge${edge.locked ? ' locked' : ''}${lockModeActive ? ' lockable' : ''}`,
    'data-edge-id': edge.id,
  });

  const line = svgEl('line', {
    class: 'edge-line',
    x1: fromRoom.x, y1: fromRoom.y, x2: toRoom.x, y2: toRoom.y,
  });
  g.appendChild(line);

  const hit = svgEl('line', {
    class: 'edge-hit',
    x1: fromRoom.x, y1: fromRoom.y, x2: toRoom.x, y2: toRoom.y,
  });
  if (lockModeActive) {
    hit.addEventListener('click', () => onEdgeClick(edge.id));
  }
  g.appendChild(hit);

  const midX = (fromRoom.x + toRoom.x) / 2;
  const midY = (fromRoom.y + toRoom.y) / 2;
  g.appendChild(svgEl('rect', {
    class: 'edge-cost-bg',
    x: midX - 12, y: midY - 8, width: 24, height: 16, rx: 3,
  }));
  const costText = svgEl('text', { class: 'edge-cost-text', x: midX, y: midY + 0.5 });
  costText.textContent = String(edge.cost);
  g.appendChild(costText);

  return g;
}

function buildRoomGroup(room, isCurrent, isAdjacent, onRoomClick) {
  const classes = ['room', room.visited ? 'visited' : 'unvisited'];
  if (isCurrent) classes.push('current');
  if (isAdjacent) classes.push('adjacent');

  const g = svgEl('g', { class: classes.join(' '), 'data-room-id': room.id });

  const circle = svgEl('circle', {
    class: 'room-shape',
    cx: room.x, cy: room.y, r: ROOM_RADIUS,
  });
  if (isAdjacent) {
    circle.addEventListener('click', () => onRoomClick(room.id));
  }
  g.appendChild(circle);

  const label = svgEl('text', {
    class: 'room-label',
    x: room.x, y: room.y + ROOM_RADIUS + 16,
  });
  label.textContent = room.name;
  g.appendChild(label);

  if (room.anomalyCount > 0) {
    const badgeX = room.x + ROOM_RADIUS * 0.7;
    const badgeY = room.y - ROOM_RADIUS * 0.7;
    const badge = svgEl('g', { class: 'room-badge' });
    badge.appendChild(svgEl('circle', { cx: badgeX, cy: badgeY, r: 9 }));
    const badgeText = svgEl('text', { x: badgeX, y: badgeY + 0.5 });
    badgeText.textContent = String(room.anomalyCount);
    badge.appendChild(badgeText);
    g.appendChild(badge);
  }

  return g;
}

function buildWitnessMarkers(witnesses, roomsById, interviewModeActive, onWitnessClick) {
  const byRoom = new Map();
  for (const witness of witnesses) {
    if (!byRoom.has(witness.roomId)) byRoom.set(witness.roomId, []);
    byRoom.get(witness.roomId).push(witness);
  }

  const group = svgEl('g', { class: 'witness-layer' });
  for (const [roomId, list] of byRoom) {
    const room = roomsById.get(roomId);
    if (!room) continue;
    list.forEach((witness, index) => {
      const angle = (-90 + index * 40) * (Math.PI / 180);
      const dist = ROOM_RADIUS + 16;
      const wx = room.x + dist * Math.cos(angle);
      const wy = room.y + dist * Math.sin(angle);
      const targetable = interviewModeActive && !witness.interviewed;

      const classes = ['witness-marker'];
      if (witness.interviewed) classes.push('interviewed');
      if (targetable) classes.push('targetable');

      const g = svgEl('g', { class: classes.join(' '), 'data-witness-id': witness.id });
      const circle = svgEl('circle', { cx: wx, cy: wy, r: 7 });
      if (targetable) {
        circle.addEventListener('click', () => onWitnessClick(witness.id));
      }
      g.appendChild(circle);
      group.appendChild(g);
    });
  }
  return group;
}

export function renderMap(container, state, viewState, callbacks) {
  const { lockModeActive = false, interviewModeActive = false } = viewState || {};
  const { onRoomClick, onEdgeClick, onWitnessClick } = callbacks || {};

  const svg = svgEl('svg', {
    viewBox: computeViewBox(state.rooms),
    preserveAspectRatio: 'xMidYMid meet',
  });

  const roomsById = new Map(state.rooms.map((r) => [r.id, r]));
  const adjacentSet = new Set(state.adjacent || []);

  const edgeLayer = svgEl('g', { class: 'edge-layer' });
  for (const edge of state.edges) {
    const fromRoom = roomsById.get(edge.from);
    const toRoom = roomsById.get(edge.to);
    if (!fromRoom || !toRoom) continue;
    edgeLayer.appendChild(buildEdgeGroup(edge, fromRoom, toRoom, lockModeActive, onEdgeClick));
  }
  svg.appendChild(edgeLayer);

  const roomLayer = svgEl('g', { class: 'room-layer' });
  for (const room of state.rooms) {
    const isCurrent = room.id === state.currentRoom;
    const isAdjacent = adjacentSet.has(room.id);
    roomLayer.appendChild(buildRoomGroup(room, isCurrent, isAdjacent, onRoomClick));
  }
  svg.appendChild(roomLayer);

  svg.appendChild(buildWitnessMarkers(state.witnesses || [], roomsById, interviewModeActive, onWitnessClick));

  container.replaceChildren(svg);
}
