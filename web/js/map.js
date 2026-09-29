// draws the dzong map with svg
// this file doesnt check if a move is allowed, it just sends the id
// of whatever u clicked and the server figures it out
// we build the svg once and then just update it, otherwise the css
// transitions dont work (spent like 2 hrs on this lol)

const SVG_NS = 'http://www.w3.org/2000/svg';
const PADDING = 105;

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

// sky gets darker as time runs out, looks cool ngl
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

// ---- rooms ----
// each room is a little building instead of a circle
// numbers are offsets from the room x,y. negative y = up

const FOOTPRINTS = {
  tower:      { halfW: 28, wallTop: -30, roofPeak: -78, base: 4, hitR: 42 },
  gate:       { halfW: 30, wallTop: -22, roofPeak: -38, base: 4, hitR: 38 },
  courtyard:  { halfW: 26, wallTop: 0, roofPeak: 0, base: 2, hitR: 32 },
  watchtower: { halfW: 15, wallTop: -34, roofPeak: -66, base: 4, hitR: 30 },
  building:   { halfW: 21, wallTop: -28, roofPeak: -46, base: 4, hitR: 32 },
};

function classifyRoom(room) {
  const n = room.name.toLowerCase();
  if (n.includes('utse')) return 'tower';
  if (n.includes('courtyard')) return 'courtyard';
  if (n.includes('gate')) return 'gate';
  if (n.includes('watchtower')) return 'watchtower';
  return 'building';
}

function buildBuildingGlyph(kind) {
  const g = svgEl('g', { class: `bldg bldg-${kind}` });

  if (kind === 'courtyard') {
    const fp = FOOTPRINTS.courtyard;
    const tile = svgEl('rect', {
      class: 'bldg-courtyard-tile',
      x: -fp.halfW, y: -fp.halfW, width: fp.halfW * 2, height: fp.halfW * 2,
      transform: 'rotate(45)',
    });
    g.appendChild(tile);
    for (let i = 1; i < 4; i++) {
      const o = -fp.halfW + (fp.halfW * 2 * i) / 4;
      g.appendChild(svgEl('line', { class: 'bldg-courtyard-grid', x1: -fp.halfW, y1: o, x2: fp.halfW, y2: o, transform: 'rotate(45)' }));
      g.appendChild(svgEl('line', { class: 'bldg-courtyard-grid', x1: o, y1: -fp.halfW, x2: o, y2: fp.halfW, transform: 'rotate(45)' }));
    }
    return g;
  }

  if (kind === 'tower') {
    const w1 = 28, w2 = 18;
    const top1 = -30, top2 = -54, peak = -78;
    g.appendChild(svgEl('rect', { class: 'bldg-wall', x: -w1, y: top1, width: w1 * 2, height: -top1 + 4 }));
    g.appendChild(svgEl('rect', { class: 'bldg-band', x: -w1, y: top1, width: w1 * 2, height: 8 }));
    g.appendChild(svgEl('rect', { class: 'bldg-window', x: -6, y: top1 + 14, width: 5, height: 9 }));
    g.appendChild(svgEl('rect', { class: 'bldg-window', x: 1, y: top1 + 14, width: 5, height: 9 }));
    g.appendChild(svgEl('polygon', {
      class: 'bldg-eave',
      points: pointsAttr([{ x: -w1 - 4, y: top1 }, { x: w1 + 4, y: top1 }, { x: w2, y: top2 }, { x: -w2, y: top2 }]),
    }));
    g.appendChild(svgEl('rect', { class: 'bldg-wall', x: -w2, y: top2, width: w2 * 2, height: top1 - top2 }));
    g.appendChild(svgEl('rect', { class: 'bldg-band', x: -w2, y: top2, width: w2 * 2, height: 6 }));
    g.appendChild(svgEl('polygon', {
      class: 'bldg-roof',
      points: pointsAttr([{ x: -w2 - 5, y: top2 }, { x: w2 + 5, y: top2 }, { x: 0, y: peak }]),
    }));
    g.appendChild(svgEl('line', { class: 'bldg-ridge', x1: 0, y1: peak, x2: 0, y2: peak - 9 }));
    g.appendChild(svgEl('circle', { class: 'bldg-finial', cx: 0, cy: peak - 11, r: 3 }));
    g.appendChild(svgEl('rect', { class: 'bldg-base', x: -w1 - 3, y: 0, width: (w1 + 3) * 2, height: 4 }));
    return g;
  }

  if (kind === 'gate') {
    const fp = FOOTPRINTS.gate;
    const w = fp.halfW;
    g.appendChild(svgEl('rect', { class: 'bldg-wall', x: -w, y: fp.wallTop, width: w * 2, height: -fp.wallTop + 4 }));
    g.appendChild(svgEl('rect', { class: 'bldg-band', x: -w, y: fp.wallTop, width: w * 2, height: 7 }));
    const archTop = -15;
    g.appendChild(svgEl('rect', { class: 'bldg-arch', x: -9, y: archTop, width: 18, height: -archTop + 4 }));
    g.appendChild(svgEl('path', { class: 'bldg-arch', d: `M -9 ${archTop} A 9 9 0 0 1 9 ${archTop} Z` }));
    g.appendChild(svgEl('polygon', {
      class: 'bldg-roof',
      points: pointsAttr([{ x: -w - 5, y: fp.wallTop }, { x: w + 5, y: fp.wallTop }, { x: 0, y: fp.roofPeak }]),
    }));
    g.appendChild(svgEl('line', { class: 'bldg-ridge', x1: -w + 4, y1: fp.roofPeak + 6, x2: w - 4, y2: fp.roofPeak + 6 }));
    g.appendChild(svgEl('rect', { class: 'bldg-base', x: -w - 3, y: 0, width: (w + 3) * 2, height: 4 }));
    return g;
  }

  if (kind === 'watchtower') {
    const fp = FOOTPRINTS.watchtower;
    const w = fp.halfW;
    g.appendChild(svgEl('rect', { class: 'bldg-wall', x: -w, y: fp.wallTop, width: w * 2, height: -fp.wallTop + 4 }));
    g.appendChild(svgEl('rect', { class: 'bldg-band', x: -w, y: fp.wallTop, width: w * 2, height: 7 }));
    g.appendChild(svgEl('rect', { class: 'bldg-window', x: -3, y: fp.wallTop + 12, width: 6, height: 8 }));
    g.appendChild(svgEl('polygon', {
      class: 'bldg-roof',
      points: pointsAttr([{ x: -w - 4, y: fp.wallTop }, { x: w + 4, y: fp.wallTop }, { x: 0, y: fp.roofPeak }]),
    }));
    g.appendChild(svgEl('line', { class: 'bldg-flagpole', x1: 0, y1: fp.roofPeak, x2: 0, y2: fp.roofPeak - 20 }));
    g.appendChild(svgEl('polygon', { class: 'bldg-flag', points: pointsAttr([{ x: 0, y: fp.roofPeak - 20 }, { x: 14, y: fp.roofPeak - 16 }, { x: 0, y: fp.roofPeak - 12 }]) }));
    g.appendChild(svgEl('rect', { class: 'bldg-base', x: -w - 3, y: 0, width: (w + 3) * 2, height: 4 }));
    return g;
  }

  // normal building
  const fp = FOOTPRINTS.building;
  const w = fp.halfW;
  g.appendChild(svgEl('rect', { class: 'bldg-wall', x: -w, y: fp.wallTop, width: w * 2, height: -fp.wallTop + 4 }));
  g.appendChild(svgEl('rect', { class: 'bldg-band', x: -w, y: fp.wallTop, width: w * 2, height: 6 }));
  g.appendChild(svgEl('rect', { class: 'bldg-window', x: -w + 6, y: fp.wallTop + 12, width: 5, height: 8 }));
  g.appendChild(svgEl('rect', { class: 'bldg-window', x: w - 11, y: fp.wallTop + 12, width: 5, height: 8 }));
  g.appendChild(svgEl('polygon', {
    class: 'bldg-roof',
    points: pointsAttr([{ x: -w - 5, y: fp.wallTop }, { x: w + 5, y: fp.wallTop }, { x: 0, y: fp.roofPeak }]),
  }));
  g.appendChild(svgEl('line', { class: 'bldg-ridge', x1: -w + 3, y1: fp.roofPeak + 7, x2: w - 3, y2: fp.roofPeak + 7 }));
  g.appendChild(svgEl('rect', { class: 'bldg-base', x: -w - 3, y: 0, width: (w + 3) * 2, height: 4 }));
  return g;
}

// ---- background ----

function buildBackground(svg, bounds) {
  const bg = svgEl('g', { class: 'map-bg' });

  const sky = svgEl('rect', {
    class: 'map-sky',
    x: bounds.minX, y: bounds.minY, width: bounds.w, height: bounds.h,
  });
  bg.appendChild(sky);

  const hillPts = [
    frac(bounds, 0, 1), frac(bounds, 0, 0.86), frac(bounds, 0.14, 0.76),
    frac(bounds, 0.28, 0.83), frac(bounds, 0.42, 0.7), frac(bounds, 0.58, 0.8),
    frac(bounds, 0.74, 0.68), frac(bounds, 0.88, 0.78), frac(bounds, 1, 0.73),
    frac(bounds, 1, 1),
  ];
  bg.appendChild(svgEl('polygon', { class: 'map-hills', points: pointsAttr(hillPts) }));

  // the big wall (white + red stripe + the bumps on top)
  const wallInset = 34;
  const wx = bounds.minX + wallInset;
  const wy = bounds.minY + wallInset * 0.75;
  const ww = bounds.w - wallInset * 2;
  const wh = bounds.h - wallInset * 1.4;

  bg.appendChild(svgEl('rect', { class: 'wall-face', x: wx, y: wy, width: ww, height: wh, rx: 6 }));
  bg.appendChild(svgEl('rect', { class: 'wall-band', x: wx, y: wy, width: ww, height: 14, rx: 6 }));

  const merlons = svgEl('g', { class: 'wall-merlons' });
  const merlonW = 16;
  const merlonGap = 10;
  const count = Math.max(3, Math.floor(ww / (merlonW + merlonGap)));
  const span = ww - merlonW;
  for (let i = 0; i < count; i++) {
    const mx = wx + (count === 1 ? span / 2 : (span * i) / (count - 1));
    merlons.appendChild(svgEl('rect', { x: mx, y: wy - 9, width: merlonW, height: 10 }));
  }
  bg.appendChild(merlons);

  // ground
  const groundInset = 10;
  const gx = wx + groundInset;
  const gy = wy + 14 + groundInset * 0.5;
  const gw = ww - groundInset * 2;
  const gh = wh - 14 - groundInset;
  bg.appendChild(svgEl('rect', { class: 'ground-fill', x: gx, y: gy, width: gw, height: gh }));

  const tileSize = 46;
  const cols = Math.ceil(gw / tileSize);
  const rows = Math.ceil(gh / tileSize);
  const tiles = svgEl('g', { class: 'ground-tiles' });
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if ((row + col) % 2 === 0) continue;
      const tx = gx + col * tileSize;
      const ty = gy + row * tileSize;
      tiles.appendChild(svgEl('rect', {
        x: tx, y: ty,
        width: Math.min(tileSize, gx + gw - tx),
        height: Math.min(tileSize, gy + gh - ty),
      }));
    }
  }
  bg.appendChild(tiles);

  // prayer flags!!
  const flagY = gy + gh * 0.14;
  const flagX1 = gx + gw * 0.12;
  const flagX2 = gx + gw * 0.88;
  const sag = 22;
  const bunting = svgEl('g', { class: 'prayer-flags' });
  bunting.appendChild(svgEl('path', {
    class: 'bunting-line',
    d: `M ${flagX1} ${flagY} Q ${(flagX1 + flagX2) / 2} ${flagY + sag} ${flagX2} ${flagY}`,
  }));
  const flagColors = ['flag-blue', 'flag-white', 'flag-red', 'flag-green', 'flag-yellow'];
  const flagCount = 11;
  for (let i = 0; i < flagCount; i++) {
    const t = i / (flagCount - 1);
    const x = flagX1 + (flagX2 - flagX1) * t;
    const y = flagY + sag * 4 * t * (1 - t);
    bunting.appendChild(svgEl('polygon', {
      class: `bunting-flag ${flagColors[i % flagColors.length]}`,
      points: pointsAttr([{ x, y }, { x: x + 7, y: y + 2 }, { x, y: y + 11 }]),
    }));
  }
  bg.appendChild(bunting);

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

  // update flags so the listeners see the new values
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
  const footprintByRoom = new Map(state.rooms.map((r) => [r.id, FOOTPRINTS[classifyRoom(r)]]));

  const svg = svgEl('svg', {
    viewBox: `${bounds.minX} ${bounds.minY} ${bounds.w} ${bounds.h}`,
    preserveAspectRatio: 'xMidYMid meet',
  });

  const flags = { lockModeActive: false, interviewModeActive: false, adjacent: new Set() };

  const { sky } = buildBackground(svg, bounds);

  const edgesById = new Map();
  const edgeLayer = svgEl('g', { class: 'edge-layer' });
  for (const edge of state.edges) {
    const fromRoom = roomsById.get(edge.from);
    const toRoom = roomsById.get(edge.to);
    if (!fromRoom || !toRoom) continue;

    const g = svgEl('g', { class: 'edge', 'data-edge-id': edge.id });
    const pathWide = svgEl('line', { class: 'path-wide', x1: fromRoom.x, y1: fromRoom.y, x2: toRoom.x, y2: toRoom.y });
    g.appendChild(pathWide);
    const pathCore = svgEl('line', { class: 'path-core', x1: fromRoom.x, y1: fromRoom.y, x2: toRoom.x, y2: toRoom.y });
    g.appendChild(pathCore);

    const hit = svgEl('line', { class: 'edge-hit', x1: fromRoom.x, y1: fromRoom.y, x2: toRoom.x, y2: toRoom.y });
    hit.addEventListener('click', () => {
      if (!flags.lockModeActive) return;
      onEdgeClick(edge.id);
    });
    g.appendChild(hit);

    const midX = (fromRoom.x + toRoom.x) / 2;
    const midY = (fromRoom.y + toRoom.y) / 2;

    const barrier = svgEl('g', { class: 'edge-barrier', transform: `translate(${midX} ${midY})` });
    barrier.appendChild(svgEl('line', { x1: -11, y1: -7, x2: 11, y2: 7 }));
    barrier.appendChild(svgEl('line', { x1: -11, y1: 7, x2: 11, y2: -7 }));
    g.appendChild(barrier);

    const waypoint = svgEl('g', { class: 'edge-waypoint', transform: `translate(${midX} ${midY})` });
    waypoint.appendChild(svgEl('circle', { class: 'edge-cost-bg', r: 10.5 }));
    const costText = svgEl('text', { class: 'edge-cost-text', y: 0.5 });
    costText.textContent = String(edge.cost);
    waypoint.appendChild(costText);
    g.appendChild(waypoint);

    edgeLayer.appendChild(g);
    edgesById.set(edge.id, { g });
  }
  svg.appendChild(edgeLayer);

  const roomsById_ = new Map();
  const roomLayer = svgEl('g', { class: 'room-layer' });
  for (const room of state.rooms) {
    const kind = classifyRoom(room);
    const fp = FOOTPRINTS[kind];
    const g = svgEl('g', { class: `room unvisited room-kind-${kind}`, 'data-room-id': room.id, transform: `translate(${room.x} ${room.y})` });

    const glow = svgEl('ellipse', { class: 'room-current-glow', cx: 0, cy: fp.base, rx: fp.halfW + 16, ry: 10 });
    g.appendChild(glow);

    g.appendChild(buildBuildingGlyph(kind));

    const hit = svgEl('rect', {
      class: 'room-hit',
      x: -fp.hitR, y: fp.roofPeak - 6, width: fp.hitR * 2, height: -fp.roofPeak + fp.base + 12,
    });
    hit.addEventListener('click', () => {
      if (!flags.adjacent.has(room.id)) return;
      onRoomClick(room.id);
    });
    g.appendChild(hit);

    const label = svgEl('text', { class: 'room-label', x: 0, y: fp.base + 18 });
    label.textContent = room.name;
    g.appendChild(label);

    const badgeX = fp.halfW * 0.75;
    const badgeY = fp.roofPeak + (kind === 'courtyard' ? -14 : 6);
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
    const fp = footprintByRoom.get(roomId);
    if (!room || !fp) continue;
    list.forEach((witness, index) => {
      const wx = room.x + fp.halfW + 14;
      const wy = room.y + fp.base - index * 18;

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
    footprintByRoom,
  };
}

function movePlayerToken(view, state) {
  const room = view.roomsData.get(state.currentRoom);
  const fp = view.footprintByRoom.get(state.currentRoom);
  if (!room || !fp) return;

  // put player at bottom left so it doesnt cover the witnesses
  const tokenX = room.x - fp.halfW - 16;
  const tokenY = room.y + fp.base;

  if (view.lastRoomId === null) {
    view.playerToken.style.transition = 'none';
    view.playerToken.style.transform = `translate(${tokenX}px, ${tokenY}px)`;
    // this line makes the animation work, dont delete
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
