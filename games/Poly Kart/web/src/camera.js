// The chase camera.
//
// In the reference recordings the camera sits a short way behind the car and a little above it,
// looking slightly down the road. It lags in corners and swings round to catch up, and it keeps
// following the car when it leaves the ground. That is what the smoothing below reproduces: the
// camera aims at a point behind the car and eases towards it, rather than being locked to it.

const DISTANCE = 11.5;       // metres behind the car
const HEIGHT = 4.6;          // metres above it
const LOOK_AHEAD = 9;        // how far up the road the camera looks
const LOOK_HEIGHT = 1.9;
const POSITION_EASE = 14;    // high enough that the car does not outrun the camera at speed
const HEADING_EASE = 7.5;
const SPEED_PULL = 0.035;    // the camera drifts back a little as speed rises

export function createCamera(car) {
  return {
    position: [car.position[0], car.position[1] + HEIGHT, car.position[2] - DISTANCE],
    heading: car.heading,
    target: [...car.position],
  };
}

// Snaps the camera straight behind the car with no easing. Used after a reset so the player is not
// watching the camera fly across the map.
export function snapCamera(camera, car) {
  camera.heading = car.heading;
  const back = desiredPosition(car, car.heading, 0);
  camera.position = back;
  camera.target = lookTarget(car, car.heading);
}

function desiredPosition(car, heading, speed, frame = { distance: DISTANCE, height: HEIGHT }) {
  const pull = frame.distance + Math.min(4, Math.abs(speed) * SPEED_PULL);
  return [
    car.position[0] - Math.sin(heading) * pull,
    car.position[1] + frame.height,
    car.position[2] - Math.cos(heading) * pull,
  ];
}

function lookTarget(car, heading) {
  return [
    car.position[0] + Math.sin(heading) * LOOK_AHEAD,
    car.position[1] + LOOK_HEIGHT,
    car.position[2] + Math.cos(heading) * LOOK_AHEAD,
  ];
}

// On a tall screen the camera also comes in closer, so the kart is not a speck at the bottom.
export function frameFor(aspect) {
  if (aspect >= 1.4) return { distance: DISTANCE, height: HEIGHT };
  if (aspect >= 1.0) return { distance: DISTANCE * 0.94, height: HEIGHT * 0.97 };
  return { distance: DISTANCE * 0.82, height: HEIGHT * 0.92 };
}

export function updateCamera(camera, car, dt, aspect = 1.77) {
  // Follow the heading through the short way round, so crossing north never spins the camera.
  let difference = car.heading - camera.heading;
  while (difference > Math.PI) difference -= Math.PI * 2;
  while (difference < -Math.PI) difference += Math.PI * 2;
  camera.heading += difference * Math.min(1, HEADING_EASE * dt);

  const frame = frameFor(aspect);
  const wanted = desiredPosition(car, camera.heading, car.speed, frame);
  const ease = Math.min(1, POSITION_EASE * dt);
  camera.position[0] += (wanted[0] - camera.position[0]) * ease;
  camera.position[1] += (wanted[1] - camera.position[1]) * ease;
  camera.position[2] += (wanted[2] - camera.position[2]) * ease;

  const wantedTarget = lookTarget(car, camera.heading);
  const targetEase = Math.min(1, (POSITION_EASE + 2) * dt);
  camera.target[0] += (wantedTarget[0] - camera.target[0]) * targetEase;
  camera.target[1] += (wantedTarget[1] - camera.target[1]) * targetEase;
  camera.target[2] += (wantedTarget[2] - camera.target[2]) * targetEase;
  return camera;
}
