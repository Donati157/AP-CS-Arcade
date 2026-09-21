// The Poly Kart itself: an original low-poly buggy built from boxes and eight-sided wheels.
//
// It is drawn in three pieces so the wheels can steer and spin without rebuilding anything: the
// body, a front wheel pair and a rear wheel pair. Read from the chase camera the shape has to say
// at a glance which end is the front, so the nose is wedge-shaped and the rear carries a wing.

import { addBox, addQuad, addCylinder, emptyGeometry, colourFromHex, shade } from './mesh.js';

export const CAR_COLOURS = {
  shell: colourFromHex('#e8622c'),      // Poly Kart orange, nothing like the reference car
  shellDark: colourFromHex('#b8451a'),
  trim: colourFromHex('#f5f1e6'),
  glass: colourFromHex('#2e3f52'),
  metal: colourFromHex('#8d97a5'),
  tyre: colourFromHex('#23262c'),
  rim: colourFromHex('#d8dde4'),
};

export const WHEEL = { radius: 0.62, width: 0.42, frontZ: 1.32, rearZ: -1.28, offsetX: 0.95 };

export function buildCarBody() {
  const g = emptyGeometry();
  const c = CAR_COLOURS;
  // Floor pan, wider than it is tall, keeps the car looking planted.
  addBox(g, [0, 0.32, -0.05], [0.85, 0.16, 1.55], c.shellDark);
  // Main tub.
  addBox(g, [0, 0.66, -0.15], [0.72, 0.24, 1.15], c.shell);
  // Wedge nose: a separate low box plus a sloped top face.
  addBox(g, [0, 0.5, 1.45], [0.62, 0.12, 0.48], c.shell);
  addQuad(g, [-0.62, 0.62, 1.0], [0.62, 0.62, 1.0], [0.62, 0.62, 1.93], [-0.62, 0.62, 1.93], shade(c.shell, 1.1));
  // Cockpit surround and screen.
  addBox(g, [0, 0.92, -0.35], [0.58, 0.14, 0.62], c.shellDark);
  addQuad(g, [-0.5, 0.9, 0.3], [0.5, 0.9, 0.3], [0.42, 1.26, -0.12], [-0.42, 1.26, -0.12], c.glass);
  // A stripe down the middle, the one bit of graphic identity on the car.
  addQuad(g, [-0.17, 0.91, 1.92], [0.17, 0.91, 1.92], [0.17, 0.91, 0.32], [-0.17, 0.91, 0.32], c.trim);
  // Roll hoop.
  addBox(g, [0, 1.16, -0.92], [0.52, 0.34, 0.1], c.metal);
  // Rear wing on two stalks, the clearest "this is the back" signal from behind.
  addBox(g, [-0.5, 1.12, -1.7], [0.07, 0.3, 0.07], c.metal);
  addBox(g, [0.5, 1.12, -1.7], [0.07, 0.3, 0.07], c.metal);
  addBox(g, [0, 1.46, -1.72], [0.86, 0.06, 0.34], c.trim);
  // Side pods.
  addBox(g, [-0.88, 0.58, -0.2], [0.14, 0.22, 0.85], c.shellDark);
  addBox(g, [0.88, 0.58, -0.2], [0.14, 0.22, 0.85], c.shellDark);
  // Lights, so the front reads even in shadow.
  addBox(g, [-0.36, 0.56, 1.92], [0.16, 0.07, 0.03], c.trim);
  addBox(g, [0.36, 0.56, 1.92], [0.16, 0.07, 0.03], c.trim);
  return g;
}

// One wheel pair, centred on the axle so the pair can be rotated about Y to steer.
export function buildWheelPair() {
  const g = emptyGeometry();
  for (const side of [-1, 1]) {
    addCylinder(g, [side * WHEEL.offsetX, 0, 0], WHEEL.radius, WHEEL.width, 10, CAR_COLOURS.tyre, 'x');
    addCylinder(g, [side * (WHEEL.offsetX + WHEEL.width * 0.25), 0, 0], WHEEL.radius * 0.5, WHEEL.width * 0.55, 8, CAR_COLOURS.rim, 'x');
  }
  return g;
}

// A soft dark quad that sits under the car. Cheaper and calmer than a real shadow map, and it is
// what tells the player how high off the ground they are during a jump.
export function buildShadow() {
  const g = emptyGeometry();
  const grey = [0.10, 0.13, 0.20];
  addQuad(g, [-1.5, 0, 2.1], [1.5, 0, 2.1], [1.5, 0, -2.1], [-1.5, 0, -2.1], grey);
  return g;
}
