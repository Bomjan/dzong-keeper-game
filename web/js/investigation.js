import { getState, previewRoute, travel, lockEdge, isPreview } from './api.js';
import { renderMap } from './map.js';

const map = document.getElementById('map');
const destination = document.getElementById('destination');
const details = document.getElementById('route-details');
const travelButton = document.getElementById('travel');
const lockButton = document.getElementById('lock-mode');
const message = document.getElementById('message');
const timeRemaining = document.getElementById('time-remaining');

let state;
let route;
let routeError = '';
let busy = false;
let lockMode = false;
let previewVersion = 0;

function roomName(id) {
  return state.rooms.find((room) => room.id === id)?.name || id;
}

function draw() {
  if (!state) return;
  const routeRooms = route?.reachable ? route.rooms : [];
  renderMap(map, state, {
    lockModeActive: lockMode,
    routeSelectionActive: true,
    destinationId: destination.value,
    routeRooms,
  }, {
    onRoomClick: (roomId) => { destination.value = roomId; void loadRoute(); },
    onEdgeClick: (edgeId) => { void toggleCorridor(edgeId); },
  });

  timeRemaining.textContent = `${state.timeRemaining} min remaining`;
  lockButton.setAttribute('aria-pressed', String(lockMode));
  lockButton.textContent = lockMode ? 'Done changing locks' : 'Change corridor locks';
  const canTravel = !busy && state.phase === 'FORENSIC' && route?.reachable &&
    route.rooms.length > 1 && route.cost <= state.timeRemaining;
  travelButton.disabled = !canTravel;

  if (!destination.value) {
    details.textContent = 'Choose a destination to see the route.';
  } else if (!route) {
    details.textContent = routeError || 'Finding the shortest route…';
  } else if (!route.reachable) {
    details.textContent = 'No unlocked route reaches this room.';
  } else {
    details.replaceChildren();
    const path = document.createElement('p');
    path.textContent = route.rooms.map(roomName).join(' → ');
    const cost = document.createElement('strong');
    cost.textContent = `Estimated movement cost: ${route.cost} min`;
    details.append(path, cost);
  }
}

async function loadRoute() {
  const version = ++previewVersion;
  route = null;
  routeError = '';
  message.textContent = '';
  draw();
  if (!destination.value || isPreview) {
    if (isPreview) message.textContent = 'Route planning requires the Spring Boot server.';
    return;
  }
  try {
    const result = await previewRoute(destination.value);
    if (version !== previewVersion) return;
    route = result;
  } catch (error) {
    if (version !== previewVersion) return;
    routeError = error.message;
    message.textContent = error.message;
  }
  draw();
}

async function toggleCorridor(edgeId) {
  if (!lockMode || busy || isPreview) return;
  busy = true;
  draw();
  try {
    state = await lockEdge(edgeId);
    busy = false;
    await loadRoute();
  } catch (error) {
    busy = false;
    message.textContent = error.message;
    draw();
  }
}

travelButton.addEventListener('click', async () => {
  if (travelButton.disabled || busy) return;
  busy = true;
  draw();
  try {
    state = await travel(destination.value);
    destination.value = '';
    route = null;
    message.textContent = state.message || '';
  } catch (error) {
    const travelError = error.message;
    route = null;
    await loadRoute();
    message.textContent = travelError;
  } finally {
    busy = false;
    draw();
  }
});

destination.addEventListener('change', () => { void loadRoute(); });
lockButton.addEventListener('click', () => { lockMode = !lockMode; draw(); });

try {
  state = await getState();
  for (const room of state.rooms) {
    const option = document.createElement('option');
    option.value = room.id;
    option.textContent = room.name;
    destination.appendChild(option);
  }
  if (isPreview) message.textContent = 'Route planning requires the Spring Boot server.';
  draw();
} catch (error) {
  message.textContent = error.message;
}
