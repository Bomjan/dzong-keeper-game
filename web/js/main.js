// main file, connects everything (api, map, panels)
// we only keep the last state from the server + some ui stuff
// (which tab is open, which mode etc). server does all the game logic

import * as api from './api.js';
import * as audio from './audio.js';
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
const vignette = document.getElementById('stage-vignette');
const soundToggleBtn = document.getElementById('sound-toggle');

const bannerEls = {
  banner: document.getElementById('error-banner'),
  messageEl: document.getElementById('error-banner-message'),
  retryBtn: document.getElementById('error-banner-retry'),
};

const SOUND_ON_ICON = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 8a5 5 0 0 1 0 8"/></svg><span>Sound on</span>';
const SOUND_OFF_ICON = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><line x1="16" y1="9" x2="21" y2="14"/><line x1="21" y1="9" x2="16" y2="14"/></svg><span>Sound off</span>';

function renderSoundToggle() {
  soundToggleBtn.innerHTML = audio.isMuted() ? SOUND_OFF_ICON : SOUND_ON_ICON;
}

soundToggleBtn.addEventListener('click', () => {
  audio.setMuted(!audio.isMuted());
  renderSoundToggle();
  if (!audio.isMuted()) audio.playClick();
});
renderSoundToggle();

let currentState = null;
let busy = false;
let lastEndModalPhase = null;

const uiState = {
  activeMode: null, // interview, lock, accuse or null
  activeTab: 'findings', // findings, clues or suspects
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

  const ratio = currentState.timeTotal > 0 ? currentState.timeRemaining / currentState.timeTotal : 1;
  const gameOver = currentState.phase === 'WON' || currentState.phase === 'LOST';
  vignette.classList.toggle('critical', ratio < 0.2 && !gameOver);

  maybeShowEndModal();
}

function maybeShowEndModal() {
  const phase = currentState.phase;
  if ((phase === 'WON' || phase === 'LOST') && lastEndModalPhase !== phase) {
    lastEndModalPhase = phase;
    if (phase === 'WON') audio.playAccuseCorrect(); else audio.playAccuseWrong();
    showModal(overlayRoot, {
      title: phase === 'WON' ? 'The Dzong Is Secure' : 'The Tshechu Has Ended',
      body: currentState.message || '',
      actionLabel: 'Close',
      variant: phase === 'WON' ? 'won' : 'lost',
    });
  }
}

function playActionSound(kind, prev, next) {
  switch (kind) {
    case 'move':
      audio.playMove();
      break;
    case 'inspect': {
      const room = next.rooms.find((r) => r.id === next.currentRoom);
      const prevRoom = prev.rooms.find((r) => r.id === prev.currentRoom);
      if (room.anomalyCount > prevRoom.anomalyCount) {
        audio.playInspectFound();
      } else {
        audio.playInspectEmpty();
      }
      break;
    }
    case 'interview':
      audio.playInterview();
      break;
    case 'lock':
      audio.playLock();
      break;
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

async function runAction(fn, kind) {
  if (busy) return;
  const prevState = currentState;
  setBusy(true);
  render();
  try {
    currentState = await fn();
    uiState.activeMode = null;
    uiState.hint = '';
    hideBanner(bannerEls);
    playActionSound(kind, prevState, currentState);
  } catch (err) {
    audio.playError();
    showBanner(bannerEls, err.message, () => runAction(fn, kind));
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
    // without this both modals show up at once, so this stops the end one
    lastEndModalPhase = currentState.phase;
    setBusy(false);
    render();
    if (outcome.correct) audio.playAccuseCorrect(); else audio.playAccuseWrong();
    showModal(overlayRoot, {
      title: outcome.correct ? 'Case Closed' : 'Suspect Cleared',
      body: outcome.message,
      actionLabel: 'Continue',
      variant: outcome.correct ? 'won' : null,
    });
    return;
  } catch (err) {
    console.log('accuse failed', err);
    audio.playError();
    showBanner(bannerEls, err.message, () => runAccuse(suspectId));
  }
  setBusy(false);
  render();
}

function toggleMode(mode, hintText) {
  if (busy) return;
  audio.playClick();
  closeOverlay(overlayRoot);
  uiState.activeMode = uiState.activeMode === mode ? null : mode;
  uiState.hint = uiState.activeMode ? hintText : '';
  if (uiState.activeMode === 'accuse') uiState.activeTab = 'suspects';
  render();
}

function openRegister() {
  if (busy) return;
  audio.playClick();
  uiState.activeMode = null;
  uiState.hint = '';
  render();

  const roomsById = new Map(currentState.rooms.map((r) => [r.id, r]));
  // searches can come back in the wrong order so old ones could overwrite new ones
  // and mess up the list. this only lets the newest one through
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
  onInspect: () => runAction(() => api.inspect(), 'inspect'),
  onInterview: () => toggleMode('interview', 'Click a witness marker on the map to interview them.'),
  onRegister: () => openRegister(),
  onLock: () => toggleMode('lock', 'Click a corridor on the map to lock or unlock it.'),
  onAccuse: () => toggleMode('accuse', 'Click a suspect in the panel to accuse them.'),
};

const mapHandlers = {
  onRoomClick: (roomId) => runAction(() => api.move(roomId), 'move'),
  onEdgeClick: (edgeId) => runAction(() => api.lockEdge(edgeId), 'lock'),
  onWitnessClick: (witnessId) => runAction(() => api.interview(witnessId), 'interview'),
};

const rightHandlers = {
  onTabChange: (tab) => {
    uiState.activeTab = tab;
    render();
  },
  onAccuseSuspect: (suspectId) => runAccuse(suspectId),
};

refresh();
