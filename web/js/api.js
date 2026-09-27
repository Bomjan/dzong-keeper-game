// The only file that talks to the server.
//
// To develop against the real Java backend instead of the fake one,
// delete or comment out the import below — every function here already
// calls the same-origin /api/* paths the backend will serve.
import './mock/server.js';

const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' };

async function unwrap(response) {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body && body.message) message = body.message;
    } catch {
      // Body wasn't JSON; keep the generic message.
    }
    throw new Error(message);
  }
  return response.json();
}

export async function getState() {
  return unwrap(await fetch('/api/state'));
}

export async function move(roomId) {
  return unwrap(await fetch('/api/move', {
    method: 'POST',
    headers: FORM_HEADERS,
    body: new URLSearchParams({ roomId }),
  }));
}

export async function inspect() {
  return unwrap(await fetch('/api/inspect', { method: 'POST' }));
}

export async function interview(witnessId) {
  return unwrap(await fetch('/api/interview', {
    method: 'POST',
    headers: FORM_HEADERS,
    body: new URLSearchParams({ witnessId }),
  }));
}

export async function searchRegister(query) {
  return unwrap(await fetch(`/api/register?q=${encodeURIComponent(query)}`));
}

export async function getPatrol(fromId, toId) {
  return unwrap(await fetch(`/api/patrol?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}`));
}

export async function lockEdge(edgeId) {
  return unwrap(await fetch('/api/lock', {
    method: 'POST',
    headers: FORM_HEADERS,
    body: new URLSearchParams({ edgeId }),
  }));
}

export async function accuse(suspectId) {
  return unwrap(await fetch('/api/accuse', {
    method: 'POST',
    headers: FORM_HEADERS,
    body: new URLSearchParams({ suspectId }),
  }));
}
