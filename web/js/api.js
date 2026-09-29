// all the fetch stuff is in here
// to use the real java backend delete the import below (it just turns on the fake one)
import './mock/server.js';

const FORM = { 'Content-Type': 'application/x-www-form-urlencoded' };

async function handle(response) {
  if (!response.ok) {
    let msg = 'Request failed (' + response.status + ')';
    try {
      const body = await response.json();
      if (body.message) msg = body.message;
    } catch (e) {
      // not json, whatever
    }
    throw new Error(msg);
  }
  return response.json();
}

export async function getState() {
  const res = await fetch('/api/state');
  return handle(res);
}

export async function move(roomId) {
  const res = await fetch('/api/move', {
    method: 'POST',
    headers: FORM,
    body: new URLSearchParams({ roomId: roomId }),
  });
  return handle(res);
}

export async function inspect() {
  const res = await fetch('/api/inspect', { method: 'POST' });
  return handle(res);
}

export async function interview(witnessId) {
  const res = await fetch('/api/interview', {
    method: 'POST',
    headers: FORM,
    body: new URLSearchParams({ witnessId: witnessId }),
  });
  return handle(res);
}

export async function searchRegister(query) {
  const res = await fetch('/api/register?q=' + encodeURIComponent(query));
  return handle(res);
}

// TODO: nothing calls this yet, patrol thing isnt in the ui
export async function getPatrol(fromId, toId) {
  const res = await fetch('/api/patrol?from=' + encodeURIComponent(fromId) + '&to=' + encodeURIComponent(toId));
  return handle(res);
}

export async function lockEdge(edgeId) {
  const res = await fetch('/api/lock', {
    method: 'POST',
    headers: FORM,
    body: new URLSearchParams({ edgeId: edgeId }),
  });
  return handle(res);
}

export async function accuse(suspectId) {
  const res = await fetch('/api/accuse', {
    method: 'POST',
    headers: FORM,
    body: new URLSearchParams({ suspectId: suspectId }),
  });
  return handle(res);
}
