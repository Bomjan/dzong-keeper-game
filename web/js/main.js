// Entry point: wires the DOM to api.js, map.js and panels.js.
//
// This module holds only the last state the server sent, plus purely
// interface-level state (which tab is open, which arm-mode is active,
// whether a request is in flight). It never computes a path, a diff, or a
// time cost — every state-changing call re-fetches the full picture from
// the server and re-renders from that alone.

import * as api from './api.js';
import { renderMap } from './map.js';
import {
  renderLeftRail,
  renderRightRail,
  showBanner,
  hideBanner,
  openRegisterDrawer,
  closeOverlay,
  renderRegisterResults,
  showModal,
} from './panels.js';

const leftRail = document.getElementById('left-rail');
const rightRail = document.getElementById('right-rail');
const mapWrap = document.getElementById('map-wrap');
const overlayRoot = document.getElementById('overlay-root');

const bannerEls = {
  banner: document.getElementById('error-banner'),
  messageEl: document.getElementById('error-banner-message'),
  retryBtn: document.getElementById('error-banner-retry'),
};

let currentState = null;
let busy = false;
let lastEndModalPhase = null;

const uiState = {
  activeMode: null, // 'interview' | 'lock' | 'accuse' | null
  activeTab: 'findings', // 'findings' | 'clues' | 'suspects'
  hint: '',
  busy: false,
};

function setBusy(value) {
  busy = value;
  uiState.busy = value;
}

function render() {
  if (!currentState) return;
  renderLeftRail(leftRail, currentState, uiState, leftHandlers);
  renderMap(mapWrap, currentState, {
    lockModeActive: uiState.activeMode === 'lock',
    interviewModeActive: uiState.activeMode === 'interview',
  }, mapHandlers);
  renderRightRail(rightRail, currentState, uiState, rightHandlers);
  maybeShowEndModal();
}

function maybeShowEndModal() {
  const phase = currentState.phase;
  if ((phase === 'WON' || phase === 'LOST') && lastEndModalPhase !== phase) {
    lastEndModalPhase = phase;
    showModal(overlayRoot, {
      title: phase === 'WON' ? 'The Dzong Is Secure' : 'The Tshechu Has Ended',
      body: currentState.message || '',
      actionLabel: 'Close',
    });
  }
}

async function refresh() {
  setBusy(true);
  render();
  try {
    currentState = await api.getState();
    hideBanner(bannerEls);
  } catch (err) {
    showBanner(bannerEls, err.message, refresh);
  } finally {
    setBusy(false);
    render();
  }
}

async function runAction(fn) {
  if (busy) return;
  setBusy(true);
  render();
  try {
    currentState = await fn();
    uiState.activeMode = null;
    uiState.hint = '';
    hideBanner(bannerEls);
  } catch (err) {
    showBanner(bannerEls, err.message, () => runAction(fn));
  } finally {
    setBusy(false);
    render();
  }
}

async function runAccuse(suspectId) {
  if (busy) return;
  setBusy(true);
  render();
  try {
    const outcome = await api.accuse(suspectId);
    currentState = await api.getState();
    uiState.activeMode = null;
    uiState.hint = '';
    hideBanner(bannerEls);
    // The end-of-game modal (if any) and the accuse outcome modal would
    // otherwise both fire on this render; let the outcome modal win.
    lastEndModalPhase = currentState.phase;
    setBusy(false);
    render();
    showModal(overlayRoot, {
      title: outcome.correct ? 'Case Closed' : 'Suspect Cleared',
      body: outcome.message,
      actionLabel: 'Continue',
    });
    return;
  } catch (err) {
    showBanner(bannerEls, err.message, () => runAccuse(suspectId));
  }
  setBusy(false);
  render();
}

function toggleMode(mode, hintText) {
  if (busy) return;
  closeOverlay(overlayRoot);
  uiState.activeMode = uiState.activeMode === mode ? null : mode;
  uiState.hint = uiState.activeMode ? hintText : '';
  if (uiState.activeMode === 'accuse') uiState.activeTab = 'suspects';
  render();
}

function openRegister() {
  if (busy) return;
  uiState.activeMode = null;
  uiState.hint = '';
  render();

  const roomsById = new Map(currentState.rooms.map((r) => [r.id, r]));
  // Two searches (e.g. the initial empty-query load and the first debounced
  // keystroke) can resolve out of order given the mock's randomised network
  // delay. Only the response to the most recently issued query may render.
  let latestRequestId = 0;
  openRegisterDrawer(overlayRoot, {
    onClose: () => closeOverlay(overlayRoot),
    onSearch: async (query, list) => {
      const requestId = ++latestRequestId;
      try {
        const results = await api.searchRegister(query);
        if (requestId !== latestRequestId) return;
        renderRegisterResults(list, results, roomsById);
      } catch (err) {
        if (requestId !== latestRequestId) return;
        list.replaceChildren();
        const li = document.createElement('li');
        li.className = 'empty-note';
        li.textContent = `Could not search the register: ${err.message}`;
        list.appendChild(li);
      }
    },
  });
}

const leftHandlers = {
  onMove: () => {
    if (busy) return;
    uiState.activeMode = null;
    uiState.hint = (currentState.adjacent || []).length
      ? 'Click a lit room on the map to move there.'
      : 'There is nowhere to move from here.';
    render();
  },
  onInspect: () => runAction(() => api.inspect()),
  onInterview: () => toggleMode('interview', 'Click a witness marker on the map to interview them.'),
  onRegister: () => openRegister(),
  onLock: () => toggleMode('lock', 'Click a corridor on the map to lock or unlock it.'),
  onAccuse: () => toggleMode('accuse', 'Click a suspect in the panel to accuse them.'),
};

const mapHandlers = {
  onRoomClick: (roomId) => runAction(() => api.move(roomId)),
  onEdgeClick: (edgeId) => runAction(() => api.lockEdge(edgeId)),
  onWitnessClick: (witnessId) => runAction(() => api.interview(witnessId)),
};

const rightHandlers = {
  onTabChange: (tab) => {
    uiState.activeTab = tab;
    render();
  },
  onAccuseSuspect: (suspectId) => runAccuse(suspectId),
};

refresh();
