// Keyboard input: held keys for movement, edge-triggered actions for the rest.
// WASD / arrows move and drive, E enters or leaves a car, F punches,
// Shift runs, P pauses, M mutes, Enter / Space confirms menus.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER = 4;
export const ACTION_PUNCH = 8;
export const ACTION_MUTE = 16;

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  ' ': ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyE: ACTION_ENTER,
  KeyF: ACTION_PUNCH,
  KeyM: ACTION_MUTE,
};

export function createInput(canvas) {
  const held = new Set();
  let queued = 0;

  function onKeyDown(event) {
    if (event.repeat) return;
    held.add(event.code);
    const action = KEY_ACTIONS[event.code];
    if (action) {
      queued |= action;
      event.preventDefault();
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('mousedown', () => {
    queued |= ACTION_CONFIRM;
  });

  function axis(neg, pos) {
    return (held.has(pos) ? 1 : 0) - (held.has(neg) ? 1 : 0);
  }

  return {
    /** { x, y } in -1..1: steering / walking direction. */
    move() {
      return {
        x: axis('KeyA', 'KeyD') || axis('ArrowLeft', 'ArrowRight'),
        y: axis('KeyW', 'KeyS') || axis('ArrowUp', 'ArrowDown'),
      };
    },
    run() {
      return held.has('ShiftLeft') || held.has('ShiftRight');
    },
    takeActions() {
      const actions = queued;
      queued = 0;
      return actions;
    },
  };
}
