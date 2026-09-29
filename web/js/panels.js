// all the ui panels: left side, right side, register drawer, error banner, popups
// these just put stuff on the page, no fetching in here

const PHASE_LABELS = { FORENSIC: 'Forensic', PURSUIT: 'Pursuit', WON: 'Resolved', LOST: 'Failed' };

const FINDING_TYPE_LABELS = {
  MISSING: 'Missing',
  EXTRA: 'Extra',
  MOVED: 'Moved',
  SUBSTITUTED: 'Substituted',
  EXPLAINED: 'Explained',
};

const TABS = ['findings', 'clues', 'suspects'];
const TAB_LABELS = { findings: 'Findings', clues: 'Clues', suspects: 'Suspects' };

const ACTION_ICONS = {
  Move: '<svg viewBox="0 0 24 24"><path d="M4 12h13M13 6l6 6-6 6"/></svg>',
  Inspect: '<svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6"/><path d="M15 15l5 5"/></svg>',
  Interview: '<svg viewBox="0 0 24 24"><path d="M4 5h16v10H9l-4 4v-4H4z"/></svg>',
  Register: '<svg viewBox="0 0 24 24"><path d="M4 5.5c2-1 5-1 8 0v13c-3-1-6-1-8 0v-13z"/><path d="M20 5.5c-2-1-5-1-8 0v13c3-1 6-1 8 0v-13z"/></svg>',
  Lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  Accuse: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none"/></svg>',
};

let lastMessage = null;
let oldTab = null; // was for animating tabs, not used anymore

function emptyNote(text) {
  const p = document.createElement('p');
  p.className = 'empty-note';
  p.textContent = text;
  return p;
}

function makeActionButton(label, enabled, active, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `action-btn${active ? ' active' : ''}`;
  if (ACTION_ICONS[label]) btn.insertAdjacentHTML('afterbegin', ACTION_ICONS[label]);
  const span = document.createElement('span');
  span.className = 'btn-label';
  span.textContent = label;
  btn.appendChild(span);
  btn.disabled = !enabled;
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}

// ---- left side ----

export function renderLeftRail(container, state, uiState, handlers) {
  container.replaceChildren();

  const gameOver = state.phase === 'WON' || state.phase === 'LOST';
  const room = state.rooms.find((r) => r.id === state.currentRoom);
  const ratio = state.timeTotal > 0 ? state.timeRemaining / state.timeTotal : 0;
  const critical = ratio < 0.2;

  const heading = document.createElement('div');
  heading.className = 'room-heading';
  const h2 = document.createElement('h2');
  h2.textContent = room ? room.name : 'Unknown room';
  heading.appendChild(h2);
  const badge = document.createElement('span');
  badge.className = `badge badge-${state.phase.toLowerCase()}`;
  badge.textContent = PHASE_LABELS[state.phase] || state.phase;
  heading.appendChild(badge);
  container.appendChild(heading);

  const timeBlock = document.createElement('div');
  timeBlock.className = 'time-block';
  const timeLabel = document.createElement('div');
  timeLabel.className = 'time-label';
  timeLabel.textContent = 'Time remaining';
  timeBlock.appendChild(timeLabel);
  const track = document.createElement('div');
  track.className = 'time-bar-track';
  const fill = document.createElement('div');
  fill.className = `time-bar-fill${critical ? ' critical' : ''}`;
  fill.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
  track.appendChild(fill);
  timeBlock.appendChild(track);
  const number = document.createElement('div');
  number.className = 'time-number';
  number.textContent = `${state.timeRemaining} / ${state.timeTotal} min`;
  timeBlock.appendChild(number);
  container.appendChild(timeBlock);

  const actions = document.createElement('div');
  actions.className = 'actions';

  const hasAdjacent = (state.adjacent || []).length > 0;
  const hasWitnesses = (state.witnesses || []).length > 0;
  const hasUneliminatedSuspect = (state.suspects || []).some((s) => !s.eliminated);

  const notBusy = !uiState.busy;

  actions.appendChild(makeActionButton('Move', notBusy && !gameOver && hasAdjacent, false, handlers.onMove));
  actions.appendChild(makeActionButton('Inspect', notBusy && !gameOver, false, handlers.onInspect));
  actions.appendChild(makeActionButton('Interview', notBusy && !gameOver && hasWitnesses, uiState.activeMode === 'interview', handlers.onInterview));
  actions.appendChild(makeActionButton('Register', notBusy, false, handlers.onRegister));
  actions.appendChild(makeActionButton('Lock', notBusy && !gameOver && state.edges.length > 0, uiState.activeMode === 'lock', handlers.onLock));
  actions.appendChild(makeActionButton('Accuse', notBusy && !gameOver && hasUneliminatedSuspect, uiState.activeMode === 'accuse', handlers.onAccuse));

  container.appendChild(actions);

  const hint = document.createElement('p');
  hint.className = 'mode-hint';
  hint.textContent = uiState.hint || '';
  container.appendChild(hint);

  const message = document.createElement('p');
  const messageChanged = state.message !== lastMessage;
  message.className = messageChanged ? 'message-line message-enter' : 'message-line';
  message.textContent = state.message || '';
  container.appendChild(message);
  if (messageChanged) {
    lastMessage = state.message;
    requestAnimationFrame(() => message.classList.remove('message-enter'));
  }
}

// ---- right side ----

function roomName(rooms, roomId) {
  const room = rooms.find((r) => r.id === roomId);
  return room ? room.name : roomId;
}

function renderFindings(panel, findings, rooms) {
  if (findings.length === 0) {
    panel.appendChild(emptyNote('No findings recorded yet.'));
    return;
  }
  for (const finding of findings) {
    const item = document.createElement('div');
    item.className = 'finding-item';
    item.dataset.type = finding.type;

    let html = '<div class="finding-title-row"><span>' + finding.itemName + '</span>' +
      '<span class="finding-type-tag">' + (FINDING_TYPE_LABELS[finding.type] || finding.type) + '</span></div>';
    if (finding.note) {
      html += '<div class="finding-note">' + finding.note + '</div>';
    }
    html += '<div class="finding-meta"><span>' + roomName(rooms, finding.roomId) + '</span>' +
      '<span>' + finding.estimatedTime + ' min</span></div>';
    item.innerHTML = html;

    panel.appendChild(item);
  }
}

function renderClues(panel, clues) {
  if (clues.length === 0) {
    panel.appendChild(emptyNote('No clues gathered yet.'));
    return;
  }
  for (const clue of clues) {
    const item = document.createElement('div');
    item.className = 'clue-item';

    const pct = Math.round((clue.reliability || 0) * 100);
    item.innerHTML = '<div class="clue-text">“' + clue.text + '”</div>' +
      '<div class="clue-meta"><span>' + clue.source + '</span>' +
      '<div class="reliability-track"><div class="reliability-fill" style="width:' + pct + '%"></div></div>' +
      '<span>' + pct + '%</span></div>';

    panel.appendChild(item);
  }
}

function renderSuspects(panel, suspects, uiState, handlers) {
  if (suspects.length === 0) {
    panel.appendChild(emptyNote('No suspects identified yet.'));
    return;
  }
  const accuseMode = uiState.activeMode === 'accuse';
  for (const suspect of suspects) {
    const targetable = accuseMode && !suspect.eliminated;
    const item = document.createElement('div');
    item.className = `suspect-item${suspect.eliminated ? ' eliminated' : ''}${targetable ? ' targetable' : ''}`;

    const label = document.createElement('span');
    label.textContent = suspect.label;
    item.appendChild(label);

    if (targetable) {
      const hint = document.createElement('span');
      hint.className = 'suspect-hint';
      hint.textContent = 'Accuse';
      item.appendChild(hint);
      item.addEventListener('click', () => handlers.onAccuseSuspect(suspect.id));
    }

    panel.appendChild(item);
  }
}

export function renderRightRail(container, state, uiState, handlers) {
  container.replaceChildren();

  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  for (const tab of TABS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tab-btn${uiState.activeTab === tab ? ' active' : ''}`;
    btn.textContent = TAB_LABELS[tab];
    btn.addEventListener('click', () => handlers.onTabChange(tab));
    tabs.appendChild(btn);
  }
  container.appendChild(tabs);

  const panel = document.createElement('div');
  panel.className = 'tab-panel';

  if (uiState.activeTab === 'findings') {
    renderFindings(panel, state.findings || [], state.rooms);
  } else if (uiState.activeTab === 'clues') {
    renderClues(panel, state.clues || []);
  } else {
    renderSuspects(panel, state.suspects || [], uiState, handlers);
  }

  container.appendChild(panel);
}

// ---- error banner ----

export function showBanner(elements, message, onRetry) {
  const { banner, messageEl, retryBtn } = elements;
  messageEl.textContent = message;
  banner.hidden = false;
  retryBtn.onclick = onRetry;
}

export function hideBanner(elements) {
  elements.banner.hidden = true;
  elements.retryBtn.onclick = null;
}

// ---- register ----

export function openRegisterDrawer(overlayRoot, handlers) {
  const backdrop = document.createElement('div');
  backdrop.className = 'drawer-backdrop';
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) handlers.onClose();
  });

  const drawer = document.createElement('div');
  drawer.className = 'drawer';

  const header = document.createElement('div');
  header.className = 'drawer-header';
  const h3 = document.createElement('h3');
  h3.textContent = 'Temple Register';
  header.appendChild(h3);
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'drawer-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Close register');
  closeBtn.addEventListener('click', () => handlers.onClose());
  header.appendChild(closeBtn);
  drawer.appendChild(header);

  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = 'Search the register…';
  input.setAttribute('aria-label', 'Search the register');
  drawer.appendChild(input);

  const list = document.createElement('ul');
  list.className = 'register-list';
  drawer.appendChild(list);

  backdrop.appendChild(drawer);
  overlayRoot.replaceChildren(backdrop);

  let debounceTimer = null;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value;
    debounceTimer = setTimeout(() => handlers.onSearch(query, list), 300);
  });

  input.focus();
  handlers.onSearch('', list);

  return { input, list };
}

export function closeOverlay(overlayRoot) {
  overlayRoot.replaceChildren();
}

export function renderRegisterResults(list, results, roomsById) {
  list.replaceChildren();
  if (results.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-note';
    li.textContent = 'No matching entries.';
    list.appendChild(li);
    return;
  }
  for (const entry of results) {
    const li = document.createElement('li');
    li.className = 'register-item';
    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = entry.itemName;
    li.appendChild(name);
    const meta = document.createElement('div');
    meta.className = 'item-meta';
    const room = roomsById.get(entry.roomId);
    meta.textContent = `${entry.category} · ${room ? room.name : entry.roomId} · ${entry.custodian}`;
    li.appendChild(meta);
    list.appendChild(li);
  }
}

// ---- intro popup + normal popup ----

export function showIntro(overlayRoot, onStart) {
  const backdrop = document.createElement('div');
  backdrop.className = 'intro-backdrop';

  const card = document.createElement('div');
  card.className = 'intro-card';

  const eyebrow = document.createElement('div');
  eyebrow.className = 'intro-eyebrow';
  eyebrow.textContent = 'Tshechu Festival — Third Day';
  card.appendChild(eyebrow);

  const h2 = document.createElement('h2');
  h2.textContent = 'The Last Dzong Keeper';
  card.appendChild(h2);

  const p1 = document.createElement('p');
  p1.textContent = 'You are the kunyer, caretaker of this dzong. While the tshechu draws pilgrims through its courtyards, something has been slipping out of its stores, unnoticed. Walk its rooms, question those who saw something, and work out where the intruder has been — before the festival ends and the trail goes cold.';
  card.appendChild(p1);

  const legend = document.createElement('div');
  legend.className = 'intro-legend';
  const entries = [
    ['Move', 'Step into a lit, adjacent room'],
    ['Inspect', 'Search the room you stand in'],
    ['Interview', 'Question a witness where you stand'],
    ['Register', 'Search the temple’s inventory'],
    ['Lock', 'Bar a corridor shut'],
    ['Accuse', 'Name the intruder — choose with care'],
  ];
  for (const [label, desc] of entries) {
    const div = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    div.appendChild(strong);
    div.appendChild(document.createTextNode(desc));
    legend.appendChild(div);
  }
  card.appendChild(legend);

  const p2 = document.createElement('p');
  p2.textContent = 'Every step, search and question costs precious minutes before the tshechu ends. Spend them wisely.';
  card.appendChild(p2);

  const startBtn = document.createElement('button');
  startBtn.type = 'button';
  startBtn.className = 'intro-start-btn';
  startBtn.textContent = 'Enter the Dzong';
  startBtn.addEventListener('click', () => {
    overlayRoot.replaceChildren();
    onStart();
  });
  card.appendChild(startBtn);

  backdrop.appendChild(card);
  overlayRoot.replaceChildren(backdrop);
}

export function showModal(overlayRoot, { title, body, actionLabel = 'Close', onAction, variant = null }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const modal = document.createElement('div');
  modal.className = variant ? `modal modal-${variant}` : 'modal';

  const h2 = document.createElement('h2');
  h2.textContent = title;
  modal.appendChild(h2);

  const p = document.createElement('p');
  p.textContent = body;
  modal.appendChild(p);

  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = actionLabel;
  btn.addEventListener('click', () => {
    overlayRoot.replaceChildren();
    if (onAction) onAction();
  });
  actions.appendChild(btn);
  modal.appendChild(actions);

  backdrop.appendChild(modal);
  overlayRoot.replaceChildren(backdrop);
}
