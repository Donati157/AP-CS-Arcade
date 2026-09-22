// The Poly Kart tracks.
//
// These layouts are original. They borrow the *kinds* of challenge the reference recordings show
// (a fast opening straight, a long sweeping bend, a crest that launches the car, a banked corner,
// a narrow section with barriers, a climb and a drop) but none of the geometry, proportions,
// colours or names come from it.
//
// A control point is { x, y, z } in metres, plus optional width, bank in degrees, and wall.
// Checkpoints are fractions of the finished track length. The finish is always the far end.

import { colourFromHex } from './mesh.js';

const HARBOUR = {
  sky: colourFromHex('#8fc4ec'),
  road: colourFromHex('#5a6b7d'),
  centreLine: colourFromHex('#f2e9d8'),
  kerbA: colourFromHex('#e8622c'),
  kerbB: colourFromHex('#f5f1e6'),
  edge: colourFromHex('#3d4a58'),
  underside: colourFromHex('#2c3642'),
  wallA: colourFromHex('#eceff3'),
  wallB: colourFromHex('#3f7fb8'),
  water: colourFromHex('#3f86c4'),
  startPost: colourFromHex('#f5f1e6'),
  startBar: colourFromHex('#e9e4d6'),
  checkpointPost: colourFromHex('#f5f1e6'),
  checkpointBar: colourFromHex('#33b07a'),
  finishPost: colourFromHex('#f5f1e6'),
  finishBar: colourFromHex('#e9e4d6'),
  railPost: colourFromHex('#9aa6b4'),
  railA: colourFromHex('#eef2f6'),
  railB: colourFromHex('#e8622c'),
  signFace: colourFromHex('#1d2a38'),
  signMark: colourFromHex('#f2c53d'),
  trunk: colourFromHex('#6b4a32'),
  leaf: colourFromHex('#2f7d4f'),
  leaf2: colourFromHex('#3f9a5e'),
  rock: colourFromHex('#8e9aa6'),
  beach: colourFromHex('#e6d6a8'),
  window: colourFromHex('#7fb4e0'),
  chequerA: colourFromHex('#f5f1e6'),
  chequerB: colourFromHex('#1b222c'),
};

const DUNE = {
  ...HARBOUR,
  sky: colourFromHex('#f0c48a'),
  road: colourFromHex('#7a6a58'),
  edge: colourFromHex('#5b4d3e'),
  underside: colourFromHex('#463b2f'),
  wallA: colourFromHex('#f3e5cd'),
  wallB: colourFromHex('#c08a4a'),
  water: colourFromHex('#d9a765'),
  kerbA: colourFromHex('#2f6f8f'),
  kerbB: colourFromHex('#f3e5cd'),
  railPost: colourFromHex('#a8916c'),
  railA: colourFromHex('#f3e5cd'),
  railB: colourFromHex('#2f6f8f'),
  signFace: colourFromHex('#3a2c1d'),
  signMark: colourFromHex('#f0c48a'),
  trunk: colourFromHex('#7a5a3a'),
  leaf: colourFromHex('#6d8a45'),
  leaf2: colourFromHex('#87a055'),
  rock: colourFromHex('#b09070'),
  beach: colourFromHex('#e8d3ac'),
  window: colourFromHex('#d8a86a'),
  chequerA: colourFromHex('#f6ecd8'),
  chequerB: colourFromHex('#3a2c1d'),
};

// ---- Track one: Harbour Loop. Wide, forgiving, teaches the controls. -----------------------------

const HARBOUR_LOOP = {
  id: 'harbour-loop',
  name: 'Harbour Loop',
  blurb: 'A wide opening straight, one big sweeper and a crest that gets the wheels off the ground.',
  palette: HARBOUR,
  waterLevel: -18,
  checkpoints: [0.26, 0.52, 0.78],
  points: [
    { x: 0, y: 0, z: 0, width: 17 },
    { x: 0, y: 0, z: 90, width: 17 },
    { x: 0, y: 0, z: 170, width: 16 },
    // Right-hand sweeper, banked into the turn.
    { x: 22, y: 1, z: 232, width: 15, bank: 10 },
    { x: 66, y: 2, z: 262, width: 15, bank: 16 },
    { x: 116, y: 2, z: 258, width: 15, bank: 14 },
    { x: 150, y: 1, z: 228, width: 16, bank: 6 },
    // A climb to a crest you can take flat out. It was steep enough to throw the kart clean off
    // the far side, so the rise is gentler now and the landing is straight.
    { x: 168, y: 5, z: 176, width: 16 },
    { x: 172, y: 8, z: 120, width: 15 },
    { x: 168, y: 7, z: 66, width: 15 },
    // Drop and a narrow walled section.
    { x: 148, y: 3, z: 14, width: 12, wall: true },
    { x: 108, y: 1, z: -18, width: 11, wall: true },
    { x: 62, y: 0, z: -24, width: 11, wall: true },
    // Left hairpin onto a return leg. It runs well clear of the opening straight: two ribbons of
    // road overlapping would both look wrong and confuse the surface lookup under the car.
    { x: 16, y: 0, z: -46, width: 13, bank: -14 },
    { x: -26, y: 0, z: -44, width: 14, bank: -18 },
    { x: -58, y: 1, z: -6, width: 15, bank: -10 },
    { x: -64, y: 1, z: 58, width: 16 },
    { x: -60, y: 0, z: 130, width: 17 },
    { x: -52, y: 0, z: 205, width: 18 },
  ],
  scenery: [
    // Two headlands the circuit threads between, each with a beach, a wood and a scatter of rock.
    { kind: 'island', x: -150, z: 120, size: 78, height: 9, y: -18, colour: colourFromHex('#4e8f5a') },
    { kind: 'grove', x: -150, z: 120, spread: 52, count: 16, scale: 1.25, y: -9 },
    { kind: 'rocks', x: -196, z: 64, spread: 18, count: 6, scale: 2.4, y: -9 },
    { kind: 'island', x: 268, z: 120, size: 86, height: 11, y: -18, colour: colourFromHex('#4e8f5a') },
    { kind: 'grove', x: 268, z: 120, spread: 58, count: 18, scale: 1.3, y: -7 },
    { kind: 'island', x: 60, z: 400, size: 120, height: 8, y: -18, colour: colourFromHex('#55975f') },
    { kind: 'grove', x: 20, z: 396, spread: 70, count: 20, scale: 1.35, y: -10 },

    // The harbour town on the far shore, which is what gives the horizon a shape to read against.
    { kind: 'building', x: 30, z: 372, y: -10, width: 11, depth: 11, height: 34, colour: colourFromHex('#e3e9ef'), roofColour: colourFromHex('#bf5a3c') },
    { kind: 'building', x: 62, z: 384, y: -10, width: 9, depth: 9, height: 46, colour: colourFromHex('#d3dde8'), roofColour: colourFromHex('#3f7fb8') },
    { kind: 'building', x: 92, z: 366, y: -10, width: 13, depth: 10, height: 26, colour: colourFromHex('#eef2f6'), roofColour: colourFromHex('#bf5a3c') },
    { kind: 'building', x: 120, z: 388, y: -10, width: 8, depth: 8, height: 38, colour: colourFromHex('#dbe4ec'), roofColour: colourFromHex('#3f7fb8') },
    { kind: 'building', x: 248, z: 80, y: -7, width: 10, depth: 10, height: 30, colour: colourFromHex('#e3e9ef'), roofColour: colourFromHex('#bf5a3c') },
    { kind: 'building', x: 276, z: 46, y: -7, width: 12, depth: 9, height: 22, colour: colourFromHex('#d3dde8'), roofColour: colourFromHex('#3f7fb8') },
    { kind: 'building', x: -176, z: 176, y: -9, width: 9, depth: 12, height: 28, colour: colourFromHex('#eef2f6'), roofColour: colourFromHex('#bf5a3c') },

    // Distant hills, ringing the horizon so the world closes instead of running out.
    { kind: 'hill', x: -330, z: 330, size: 92, height: 74, y: -18, colour: colourFromHex('#7fa8b8'), capColour: colourFromHex('#f4f8fb') },
    { kind: 'hill', x: 420, z: 300, size: 110, height: 96, y: -18, colour: colourFromHex('#6f9aac'), capColour: colourFromHex('#f4f8fb') },
    { kind: 'hill', x: 470, z: -160, size: 84, height: 62, y: -18, colour: colourFromHex('#7fa8b8'), capColour: colourFromHex('#f4f8fb') },
    { kind: 'hill', x: -300, z: -230, size: 96, height: 70, y: -18, colour: colourFromHex('#74a0b2'), capColour: colourFromHex('#f4f8fb') },
    { kind: 'hill', x: 90, z: 560, size: 140, height: 110, y: -18, colour: colourFromHex('#6b95a8'), capColour: colourFromHex('#f4f8fb') },
  ],
};

// ---- Track two: Dune Run. Tighter, hillier, less room for error. ---------------------------------

const DUNE_RUN = {
  id: 'dune-run',
  name: 'Dune Run',
  blurb: 'Narrower, hillier and walled in the fast part. Braking earlier is quicker here.',
  palette: DUNE,
  waterLevel: -22,
  checkpoints: [0.22, 0.44, 0.66, 0.86],
  points: [
    { x: 0, y: 0, z: 0, width: 15 },
    { x: 0, y: 0, z: 70, width: 14 },
    { x: -10, y: 3, z: 128, width: 13, bank: -10 },
    { x: -48, y: 7, z: 168, width: 12, bank: -18 },
    { x: -100, y: 9, z: 176, width: 12, bank: -12 },
    { x: -146, y: 6, z: 148, width: 13 },
    { x: -168, y: 2, z: 96, width: 14 },
    // A hump straight: two crests in a row.
    { x: -166, y: 10, z: 42, width: 14 },
    { x: -150, y: 2, z: -8, width: 14 },
    { x: -120, y: 9, z: -52, width: 13 },
    { x: -78, y: 2, z: -76, width: 13, wall: true },
    { x: -28, y: 1, z: -82, width: 11, wall: true },
    { x: 22, y: 1, z: -70, width: 11, wall: true },
    { x: 62, y: 3, z: -38, width: 12, bank: 14 },
    { x: 82, y: 6, z: 12, width: 13, bank: 18 },
    { x: 78, y: 6, z: 66, width: 13, bank: 10 },
    { x: 54, y: 3, z: 112, width: 14 },
    { x: 46, y: 1, z: 168, width: 15 },
    { x: 40, y: 0, z: 228, width: 16 },
  ],
  scenery: [
    { kind: 'island', x: -250, z: 90, size: 82, height: 10, y: -22, colour: colourFromHex('#c9a06a'), beachColour: colourFromHex('#e8d3ac') },
    { kind: 'rocks', x: -250, z: 90, spread: 48, count: 9, scale: 3.4, y: -12 },
    { kind: 'grove', x: -232, z: 140, spread: 26, count: 7, scale: 1.05, y: -12 },
    { kind: 'island', x: 170, z: -170, size: 96, height: 12, y: -22, colour: colourFromHex('#c9a06a'), beachColour: colourFromHex('#e8d3ac') },
    { kind: 'rocks', x: 170, z: -170, spread: 56, count: 11, scale: 3.8, y: -10 },
    { kind: 'island', x: 150, z: 230, size: 74, height: 9, y: -22, colour: colourFromHex('#bb9159'), beachColour: colourFromHex('#e8d3ac') },
    { kind: 'grove', x: 150, z: 230, spread: 44, count: 10, scale: 1.1, y: -13 },

    { kind: 'building', x: -214, z: -128, y: -12, width: 8, depth: 8, height: 26, colour: colourFromHex('#e3cda6'), roofColour: colourFromHex('#a8703c') },
    { kind: 'building', x: -190, z: -150, y: -12, width: 11, depth: 9, height: 17, colour: colourFromHex('#efdcba'), roofColour: colourFromHex('#a8703c') },
    { kind: 'building', x: 128, z: 122, y: -13, width: 12, depth: 10, height: 21, colour: colourFromHex('#e3cda6'), roofColour: colourFromHex('#8f5f34') },

    { kind: 'hill', x: -360, z: -40, size: 104, height: 84, y: -22, colour: colourFromHex('#c08a4a'), capColour: colourFromHex('#e8d3ac') },
    { kind: 'hill', x: 300, z: 300, size: 96, height: 72, y: -22, colour: colourFromHex('#b8863f'), capColour: colourFromHex('#e8d3ac') },
    { kind: 'hill', x: 330, z: -300, size: 126, height: 104, y: -22, colour: colourFromHex('#ab7f45'), capColour: colourFromHex('#e8d3ac') },
    { kind: 'hill', x: -120, z: 340, size: 110, height: 78, y: -22, colour: colourFromHex('#c08a4a'), capColour: colourFromHex('#e8d3ac') },
  ],
};

export const TRACKS = [HARBOUR_LOOP, DUNE_RUN];

export const trackById = (id) => TRACKS.find((track) => track.id === id) || TRACKS[0];
