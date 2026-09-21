// Keyboard and touch, gathered into one small object the physics can read.
//
// Everything registered here is handed back by `dispose()`. Poly Kart opens and closes tracks over
// and over inside the arcade, and a listener left behind would quietly double up every time.

const ACCELERATE = new Set(['KeyW', 'ArrowUp']);
const BRAKE = new Set(['KeyS', 'ArrowDown']);
const LEFT = new Set(['KeyA', 'ArrowLeft']);
const RIGHT = new Set(['KeyD', 'ArrowRight']);
const RESET_CHECKPOINT = new Set(['KeyR', 'Enter']);
const RESET_START = new Set(['KeyT', 'Backspace']);
// Keys the page must not act on while racing, or the arcade scrolls under the car.
const SWALLOW = new Set([...ACCELERATE, ...BRAKE, ...LEFT, ...RIGHT, ...RESET_START, 'Space']);

export function createInput(target = window) {
  const state = {
    throttle: 0,
    brake: 0,
    steer: 0,
    steerLeftHeld: false,
    steerRightHeld: false,
    resetToCheckpoint: false,
    resetToStart: false,
    paused: false,
  };
  const held = new Set();

  const refresh = () => {
    state.throttle = [...ACCELERATE].some((code) => held.has(code)) ? 1 : 0;
    state.brake = [...BRAKE].some((code) => held.has(code)) ? 1 : 0;
    const left = [...LEFT].some((code) => held.has(code)) || state.steerLeftHeld;
    const right = [...RIGHT].some((code) => held.has(code)) || state.steerRightHeld;
    state.steer = (right ? 1 : 0) - (left ? 1 : 0);
  };

  const onKeyDown = (event) => {
    if (event.repeat) {
      if (SWALLOW.has(event.code)) event.preventDefault();
      return;
    }
    if (SWALLOW.has(event.code)) event.preventDefault();
    held.add(event.code);
    if (RESET_CHECKPOINT.has(event.code)) state.resetToCheckpoint = true;
    if (RESET_START.has(event.code)) state.resetToStart = true;
    refresh();
  };
  const onKeyUp = (event) => {
    held.delete(event.code);
    refresh();
  };
  const onBlur = () => { held.clear(); refresh(); };

  target.addEventListener('keydown', onKeyDown, { passive: false });
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onBlur);

  return {
    state,
    // Touch buttons call these; the HUD wires them up on phones.
    setTouch(control, pressed) {
      if (control === 'throttle') held[pressed ? 'add' : 'delete']('KeyW');
      if (control === 'brake') held[pressed ? 'add' : 'delete']('KeyS');
      if (control === 'left') state.steerLeftHeld = pressed;
      if (control === 'right') state.steerRightHeld = pressed;
      refresh();
    },
    // The game reads a reset request once and it clears, so holding the key does not loop.
    takeResetRequest() {
      if (state.resetToStart) { state.resetToStart = false; state.resetToCheckpoint = false; return 'start'; }
      if (state.resetToCheckpoint) { state.resetToCheckpoint = false; return 'checkpoint'; }
      return null;
    },
    releaseAll() { held.clear(); state.steerLeftHeld = false; state.steerRightHeld = false; refresh(); },
    dispose() {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', onBlur);
      held.clear();
    },
  };
}
