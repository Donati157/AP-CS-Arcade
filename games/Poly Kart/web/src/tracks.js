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
  startBar: colourFromHex('#e8622c'),
  checkpointPost: colourFromHex('#f5f1e6'),
  checkpointBar: colourFromHex('#33b07a'),
  finishPost: colourFromHex('#f5f1e6'),
  finishBar: colourFromHex('#f2c53d'),
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
    // Climb to a crest. Carrying speed here launches the car.
    { x: 168, y: 6, z: 176, width: 16 },
    { x: 172, y: 13, z: 120, width: 15 },
    { x: 168, y: 13, z: 66, width: 15 },
    // Drop and a narrow walled section.
    { x: 148, y: 4, z: 14, width: 12, wall: true },
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
    { kind: 'tower', x: -70, z: 60, size: 12, height: 64, colour: colourFromHex('#dbe4ec') },
    { kind: 'tower', x: -92, z: 130, size: 9, height: 42, colour: colourFromHex('#c3d2e0') },
    { kind: 'slab', x: 90, z: 340, width: 60, depth: 16, height: 28, colour: colourFromHex('#cfdae6') },
    { kind: 'tower', x: 220, z: 150, size: 14, height: 52, colour: colourFromHex('#d4dfea') },
    { kind: 'tower', x: 210, z: 40, size: 10, height: 36, colour: colourFromHex('#bccbdc') },
    { kind: 'peak', x: -160, z: 300, size: 46, height: 70, colour: colourFromHex('#b9cad9'), capColour: colourFromHex('#f4f8fb') },
    { kind: 'peak', x: 300, z: 330, size: 54, height: 92, colour: colourFromHex('#aec0d2'), capColour: colourFromHex('#f4f8fb') },
    { kind: 'peak', x: 340, z: -120, size: 40, height: 58, colour: colourFromHex('#b9cad9'), capColour: colourFromHex('#f4f8fb') },
    { kind: 'slab', x: -120, z: -80, width: 40, depth: 12, height: 20, colour: colourFromHex('#cfdae6') },
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
    { kind: 'peak', x: -260, z: 60, size: 50, height: 74, colour: colourFromHex('#c9a06a'), capColour: colourFromHex('#e8d3ac') },
    { kind: 'peak', x: 180, z: 220, size: 44, height: 62, colour: colourFromHex('#c9a06a'), capColour: colourFromHex('#e8d3ac') },
    { kind: 'peak', x: 160, z: -200, size: 58, height: 86, colour: colourFromHex('#bb9159'), capColour: colourFromHex('#e8d3ac') },
    { kind: 'tower', x: -200, z: -140, size: 10, height: 44, colour: colourFromHex('#e3cda6') },
    { kind: 'slab', x: 130, z: 120, width: 34, depth: 12, height: 22, colour: colourFromHex('#dcc49c') },
    { kind: 'tower', x: 40, z: 230, size: 12, height: 38, colour: colourFromHex('#e3cda6') },
  ],
};

export const TRACKS = [HARBOUR_LOOP, DUNE_RUN];

export const trackById = (id) => TRACKS.find((track) => track.id === id) || TRACKS[0];
