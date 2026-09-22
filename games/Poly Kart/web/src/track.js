// Turns a short track description into the road you drive on.
//
// A track is a list of control points. A smooth centre line is drawn through them, and every metre
// of that line records where the road is, which way it faces, how wide it is and how far it is
// banked. The same samples are used for three things: building the road mesh, answering "what is
// under the car?" during physics, and measuring how far along the lap the car has travelled.

import {
  addQuad, addBox, addCylinder, emptyGeometry, shade,
  addFrustum, addTree, addRoundTree, addRock, addBuilding, addSign, addRotatedBox,
} from './mesh.js';

const SAMPLE_SPACING = 2.2;      // metres between centre-line samples
const SEARCH_WINDOW = 90;        // samples either side of the last known position to search

// ---- Building the centre line ------------------------------------------------------------------

// Catmull-Rom keeps the line passing through every control point, which makes tracks easy to author.
function catmullRom(p0, p1, p2, p3, t, key) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * ((2 * p1[key]) + (-p0[key] + p2[key]) * t
    + (2 * p0[key] - 5 * p1[key] + 4 * p2[key] - p3[key]) * t2
    + (-p0[key] + 3 * p1[key] - 3 * p2[key] + p3[key]) * t3);
}

function interpolateNumber(a, b, c, d, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
}

function controlAt(points, index) {
  return points[Math.max(0, Math.min(points.length - 1, index))];
}

// Walks the control points and produces one sample every SAMPLE_SPACING metres or so.
function buildSamples(points) {
  const raw = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = controlAt(points, i - 1), p1 = points[i], p2 = points[i + 1], p3 = controlAt(points, i + 2);
    const roughLength = Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
    const steps = Math.max(2, Math.round(roughLength / SAMPLE_SPACING));
    const lastSegment = i === points.length - 2;
    for (let step = 0; step < steps + (lastSegment ? 1 : 0); step++) {
      const t = step / steps;
      raw.push({
        x: catmullRom(p0, p1, p2, p3, t, 'x'),
        y: catmullRom(p0, p1, p2, p3, t, 'y'),
        z: catmullRom(p0, p1, p2, p3, t, 'z'),
        width: interpolateNumber(p0.width ?? 14, p1.width ?? 14, p2.width ?? 14, p3.width ?? 14, t),
        bank: interpolateNumber(p0.bank ?? 0, p1.bank ?? 0, p2.bank ?? 0, p3.bank ?? 0, t),
        wall: p1.wall || p2.wall ? 1 : 0,
      });
    }
  }
  return raw;
}

// Gives every sample a forward, right and up vector, plus how far along the track it sits.
function orient(raw) {
  const samples = [];
  let distance = 0;
  for (let i = 0; i < raw.length; i++) {
    const here = raw[i];
    const ahead = raw[Math.min(raw.length - 1, i + 1)];
    const behind = raw[Math.max(0, i - 1)];
    let fx = ahead.x - behind.x, fy = ahead.y - behind.y, fz = ahead.z - behind.z;
    const flen = Math.hypot(fx, fy, fz) || 1;
    fx /= flen; fy /= flen; fz /= flen;
    // Right is forward crossed with world up, then both are tilted by the bank angle.
    let rx = fz, ry = 0, rz = -fx;
    const rlen = Math.hypot(rx, ry, rz) || 1;
    rx /= rlen; ry /= rlen; rz /= rlen;
    const bank = here.bank * Math.PI / 180;
    const cos = Math.cos(bank), sin = Math.sin(bank);
    // Rotate the right vector about the forward axis so the road leans into the corner.
    const upX = fy * rz - fz * ry, upY = fz * rx - fx * rz, upZ = fx * ry - fy * rx;
    const bankedRightX = rx * cos + upX * sin;
    const bankedRightY = ry * cos + upY * sin;
    const bankedRightZ = rz * cos + upZ * sin;
    const nx = fy * bankedRightZ - fz * bankedRightY;
    const ny = fz * bankedRightX - fx * bankedRightZ;
    const nz = fx * bankedRightY - fy * bankedRightX;
    if (i > 0) {
      const prev = raw[i - 1];
      distance += Math.hypot(here.x - prev.x, here.y - prev.y, here.z - prev.z);
    }
    samples.push({
      position: [here.x, here.y, here.z],
      forward: [fx, fy, fz],
      right: [bankedRightX, bankedRightY, bankedRightZ],
      up: [nx, ny, nz],
      width: here.width,
      wall: here.wall,
      distance,
    });
  }
  return samples;
}

// ---- Mesh ---------------------------------------------------------------------------------------

const edgeOf = (sample, side) => [
  sample.position[0] + sample.right[0] * side * sample.width / 2,
  sample.position[1] + sample.right[1] * side * sample.width / 2,
  sample.position[2] + sample.right[2] * side * sample.width / 2,
];

const offsetOf = (sample, lateral, lift = 0) => [
  sample.position[0] + sample.right[0] * lateral + sample.up[0] * lift,
  sample.position[1] + sample.right[1] * lateral + sample.up[1] * lift,
  sample.position[2] + sample.right[2] * lateral + sample.up[2] * lift,
];

function buildRoadGeometry(samples, palette) {
  const geometry = emptyGeometry();
  const road = palette.road;
  const roadAlt = shade(palette.road, 0.93);
  const kerbA = palette.kerbA;
  const kerbB = palette.kerbB;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    const stripe = Math.floor(a.distance / 9) % 2 === 0;
    addQuad(geometry, edgeOf(a, -1), edgeOf(b, -1), edgeOf(b, 1), edgeOf(a, 1), stripe ? road : roadAlt);
    // A centre line, slightly proud of the surface so it never z-fights.
    if (Math.floor(a.distance / 7) % 2 === 0) {
      addQuad(geometry, offsetOf(a, -0.35, 0.03), offsetOf(b, -0.35, 0.03), offsetOf(b, 0.35, 0.03), offsetOf(a, 0.35, 0.03), palette.centreLine);
    }
    // Kerbs run down both edges in alternating colours so the limits are obvious at speed.
    const kerbColour = Math.floor(a.distance / 4) % 2 === 0 ? kerbA : kerbB;
    for (const side of [-1, 1]) {
      // Wind every strip from its lower lateral edge to its higher one, the same way round as the
      // road quad above. Winding one side backwards makes back-face culling swallow it.
      const inner = a.width / 2 * side;
      const outer = (a.width / 2 + 1.1) * side;
      const lo = Math.min(inner, outer);
      const hi = Math.max(inner, outer);
      addQuad(geometry, offsetOf(a, lo, 0.05), offsetOf(b, lo, 0.05), offsetOf(b, hi, 0.05), offsetOf(a, hi, 0.05), kerbColour);
    }
    // The underside, so the road reads as a solid ribbon from below and from the side.
    addQuad(geometry, offsetOf(a, -(a.width / 2 + 1.1), -1.4), offsetOf(a, (a.width / 2 + 1.1), -1.4),
      offsetOf(b, (b.width / 2 + 1.1), -1.4), offsetOf(b, -(b.width / 2 + 1.1), -1.4), palette.underside);
    for (const side of [-1, 1]) {
      const outer = (a.width / 2 + 1.1) * side;
      const outerB = (b.width / 2 + 1.1) * side;
      const top = side < 0 ? [offsetOf(a, outer, 0.05), offsetOf(b, outerB, 0.05)] : [offsetOf(b, outerB, 0.05), offsetOf(a, outer, 0.05)];
      const low = side < 0 ? [offsetOf(b, outerB, -1.4), offsetOf(a, outer, -1.4)] : [offsetOf(a, outer, -1.4), offsetOf(b, outerB, -1.4)];
      addQuad(geometry, top[0], top[1], low[0], low[1], palette.edge);
    }
    // Barriers, only where the track asks for them.
    if (a.wall) {
      for (const side of [-1, 1]) {
        const base = (a.width / 2 + 0.9) * side;
        const baseB = (b.width / 2 + 0.9) * side;
        const inner = side < 0
          ? [offsetOf(a, base, 0.05), offsetOf(b, baseB, 0.05), offsetOf(b, baseB, 2.6), offsetOf(a, base, 2.6)]
          : [offsetOf(b, baseB, 0.05), offsetOf(a, base, 0.05), offsetOf(a, base, 2.6), offsetOf(b, baseB, 2.6)];
        addQuad(geometry, inner[0], inner[1], inner[2], inner[3], Math.floor(a.distance / 5) % 2 === 0 ? palette.wallA : palette.wallB);
      }
    }
  }
  return geometry;
}

// A gantry: two legs, a deep banner beam and a painted stripe on the road underneath. The start,
// each checkpoint and the finish all use it, in their own colours, so the three read as one family.
function addGate(geometry, sample, colour, barColour, withBanner = false, palette0 = [1, 1, 1], palette1 = [0.08, 0.1, 0.13]) {
  const half = sample.width / 2 + 1.6;
  for (const side of [-1, 1]) {
    const foot = offsetOf(sample, half * side, 0);
    addCylinder(geometry, [foot[0], foot[1] + 4.4, foot[2]], 0.36, 4.4, 8, colour);
    // A wider base so the legs look planted rather than stuck through the ground.
    addCylinder(geometry, [foot[0], foot[1] + 0.35, foot[2]], 0.72, 0.35, 8, shade(colour, 0.8));
  }
  const left = offsetOf(sample, -half, 8.8);
  const right = offsetOf(sample, half, 8.8);
  const midpoint = [(left[0] + right[0]) / 2, (left[1] + right[1]) / 2, (left[2] + right[2]) / 2];
  const spanX = Math.abs(right[0] - left[0]) / 2 + 0.6;
  const spanZ = Math.abs(right[2] - left[2]) / 2 + 0.6;
  addBox(geometry, midpoint, [spanX, 0.32, spanZ], barColour);
  if (withBanner) {
    // A chequered board. Nothing else says "this is the line" as immediately, and unlike a plain
    // slab it still reads as a start gantry when you are looking at its underside from the grid.
    const squares = 14;
    for (let i = 0; i < squares; i++) {
      const t = (i + 0.5) / squares - 0.5;
      const centre = [
        midpoint[0] + (right[0] - left[0]) * t,
        midpoint[1] + 0.95,
        midpoint[2] + (right[2] - left[2]) * t,
      ];
      const halfSpanX = Math.abs(right[0] - left[0]) / (squares * 2) + 0.02;
      const halfSpanZ = Math.abs(right[2] - left[2]) / (squares * 2) + 0.02;
      addBox(geometry, centre, [Math.max(halfSpanX, 0.05), 0.62, Math.max(halfSpanZ, 0.05)],
        i % 2 === 0 ? palette0 : palette1);
    }
  }
  const ahead = {
    ...sample,
    position: [
      sample.position[0] + sample.forward[0] * 1.8,
      sample.position[1] + sample.forward[1] * 1.8,
      sample.position[2] + sample.forward[2] * 1.8,
    ],
  };
  if (withBanner) {
    const squares = 12;
    for (let i = 0; i < squares; i++) {
      const a0 = -half + (2 * half * i) / squares;
      const a1 = -half + (2 * half * (i + 1)) / squares;
      addQuad(geometry, offsetOf(sample, a0, 0.06), offsetOf(sample, a1, 0.06),
        offsetOf(ahead, a1, 0.06), offsetOf(ahead, a0, 0.06), i % 2 === 0 ? palette0 : palette1);
    }
  } else {
    addQuad(geometry, offsetOf(sample, -half, 0.06), offsetOf(sample, half, 0.06),
      offsetOf(ahead, half, 0.06), offsetOf(ahead, -half, 0.06), barColour);
  }
}

// Everything that lives beside the road and is generated from the road itself: a guard rail where
// the drop is unfair, marker posts so speed reads, and chevron boards on the tighter corners.
function buildTracksideFurniture(samples, palette) {
  const geometry = emptyGeometry();
  for (let i = 0; i < samples.length - 1; i += 1) {
    const a = samples[i], b = samples[i + 1];
    // How sharply the road is turning here, measured from the heading change between samples.
    const turn = Math.abs(Math.atan2(b.forward[0], b.forward[2]) - Math.atan2(a.forward[0], a.forward[2]));
    const curvature = Math.min(turn, Math.PI * 2 - turn);

    // Guard rails: posts and a continuous beam down both edges wherever the track is not walled.
    // The beam is a solid box rather than a single quad, because a quad is only visible from one
    // side and this one has to read both from the road and from outside it.
    if (!a.wall && i % 2 === 0) {
      // Each beam spans the whole two-sample step it stands in for, or the rail comes out dashed.
      const far = samples[Math.min(samples.length - 1, i + 2)];
      for (const side of [-1, 1]) {
        const outer = (a.width / 2 + 1.5) * side;
        const outerB = (far.width / 2 + 1.5) * side;
        if (i % 8 === 0) {
          const postFoot = offsetOf(a, outer, 0);
          addBox(geometry, [postFoot[0], postFoot[1] + 0.6, postFoot[2]], [0.13, 0.6, 0.13], palette.railPost);
        }
        const from = offsetOf(a, outer, 1.15);
        const to = offsetOf(far, outerB, 1.15);
        const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
        const run = Math.hypot(to[0] - from[0], to[2] - from[2]);
        addRotatedBox(geometry, mid, [0.1, 0.24, run / 2 + 0.06],
          Math.atan2(to[0] - from[0], to[2] - from[2]),
          Math.floor(a.distance / 6) % 2 === 0 ? palette.railA : palette.railB);
      }
    }

    // Chevron boards on the outside of a real corner, pointing the way it goes.
    if (curvature > 0.028 && i % 18 === 0) {
      const outside = Math.sign(a.right[0] * b.forward[2] - a.right[2] * b.forward[0]) || 1;
      const at = offsetOf(a, (a.width / 2 + 4.2) * outside, 0);
      addSign(geometry, at, a.right, a.up, a.forward, 1.5, 1.0, palette.railPost, palette.signFace, palette.signMark);
    }
  }
  return geometry;
}

// ---- Public API ---------------------------------------------------------------------------------

export function buildTrack(definition) {
  const samples = orient(buildSamples(definition.points));
  const length = samples[samples.length - 1].distance;
  const palette = definition.palette;

  // Checkpoints are given as fractions of the track length; the finish is always the end.
  const gates = (definition.checkpoints || []).map((fraction) => {
    const target = fraction * length;
    const index = nearestByDistance(samples, target);
    return { index, distance: samples[index].distance };
  });
  const finish = { index: samples.length - 1, distance: length };

  const road = buildRoadGeometry(samples, palette);
  const furniture = buildTracksideFurniture(samples, palette);
  addGate(furniture, samples[0], palette.startPost, palette.startBar, true, palette.chequerA, palette.chequerB);
  for (const gate of gates) addGate(furniture, samples[gate.index], palette.checkpointPost, palette.checkpointBar);
  addGate(furniture, samples[finish.index], palette.finishPost, palette.finishBar, true, palette.chequerA, palette.chequerB);

  const scenery = emptyGeometry();
  for (const piece of definition.scenery || []) {
    const ground = piece.y ?? 0;
    if (piece.kind === 'building') {
      addBuilding(scenery, piece.x, piece.z, ground, piece.width, piece.depth, piece.height,
        piece.colour, piece.roofColour || shade(piece.colour, 0.7), piece.windowColour || palette.window);
    } else if (piece.kind === 'hill') {
      addFrustum(scenery, [piece.x, ground, piece.z], piece.size, piece.size * (piece.taper ?? 0.25), piece.height,
        piece.colour, piece.capColour || null);
    } else if (piece.kind === 'island') {
      // A landmass with a beach ring, so the track has something to sit beside instead of open water.
      addFrustum(scenery, [piece.x, piece.y ?? -6, piece.z], piece.size * 1.16, piece.size, (piece.height ?? 7), piece.beachColour || palette.beach);
      addFrustum(scenery, [piece.x, (piece.y ?? -6) + (piece.height ?? 7), piece.z], piece.size, piece.size * 0.92, 0.7, piece.colour);
    } else if (piece.kind === 'tree') {
      addTree(scenery, piece.x, piece.z, ground, piece.scale ?? 1, palette.trunk, piece.colour || palette.leaf);
    } else if (piece.kind === 'roundTree') {
      addRoundTree(scenery, piece.x, piece.z, ground, piece.scale ?? 1, palette.trunk, piece.colour || palette.leaf);
    } else if (piece.kind === 'rock') {
      addRock(scenery, piece.x, piece.z, ground, piece.scale ?? 1, piece.colour || palette.rock);
    } else if (piece.kind === 'grove') {
      // A cluster, placed by a small fixed pattern rather than at random so it rebuilds identically.
      const count = piece.count ?? 7;
      for (let i = 0; i < count; i++) {
        const angle = i * 2.399963;                       // the golden angle: an even, unpatterned spread
        const radius = piece.spread * Math.sqrt((i + 0.5) / count);
        const x = piece.x + Math.cos(angle) * radius;
        const z = piece.z + Math.sin(angle) * radius;
        const scale = (piece.scale ?? 1) * (0.75 + ((i * 37) % 11) / 22);
        if (i % 3 === 0) addRoundTree(scenery, x, z, ground, scale, palette.trunk, palette.leaf2 || palette.leaf);
        else addTree(scenery, x, z, ground, scale, palette.trunk, palette.leaf);
      }
    } else if (piece.kind === 'rocks') {
      const count = piece.count ?? 5;
      for (let i = 0; i < count; i++) {
        const angle = i * 2.399963;
        const radius = piece.spread * Math.sqrt((i + 0.5) / count);
        addRock(scenery, piece.x + Math.cos(angle) * radius, piece.z + Math.sin(angle) * radius, ground,
          (piece.scale ?? 1) * (0.7 + ((i * 53) % 9) / 15), piece.colour || palette.rock);
      }
    }
  }

  return {
    id: definition.id,
    name: definition.name,
    palette,
    sky: palette.sky,
    samples,
    length,
    gates,
    finish,
    checkpointCount: gates.length + 1,
    geometry: { road, furniture, scenery },
    start: startPose(samples),
  };
}

function startPose(samples) {
  const first = samples[0];
  return {
    position: [first.position[0], first.position[1] + 1.2, first.position[2]],
    heading: Math.atan2(first.forward[0], first.forward[2]),
    index: 0,
  };
}

function nearestByDistance(samples, target) {
  let best = 0;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i].distance - target) < Math.abs(samples[best].distance - target)) best = i;
  }
  return best;
}

// Answers "what is the road doing under this point?". The hint keeps the search local, which both
// costs less and stops the answer jumping across a switchback that happens to pass nearby.
export function queryTrack(track, position, hintIndex = 0) {
  const samples = track.samples;
  const from = Math.max(0, hintIndex - SEARCH_WINDOW);
  const to = Math.min(samples.length - 1, hintIndex + SEARCH_WINDOW);
  let bestIndex = from;
  let bestDistance = Infinity;
  for (let i = from; i <= to; i++) {
    const p = samples[i].position;
    const d = (p[0] - position[0]) ** 2 + (p[1] - position[1]) ** 2 + (p[2] - position[2]) ** 2;
    if (d < bestDistance) { bestDistance = d; bestIndex = i; }
  }
  const sample = samples[bestIndex];
  const dx = position[0] - sample.position[0];
  const dy = position[1] - sample.position[1];
  const dz = position[2] - sample.position[2];
  const lateral = dx * sample.right[0] + dy * sample.right[1] + dz * sample.right[2];
  const along = dx * sample.forward[0] + dy * sample.forward[1] + dz * sample.forward[2];
  const surface = [
    sample.position[0] + sample.right[0] * lateral + sample.forward[0] * along,
    sample.position[1] + sample.right[1] * lateral + sample.forward[1] * along,
    sample.position[2] + sample.right[2] * lateral + sample.forward[2] * along,
  ];
  const halfWidth = sample.width / 2;
  return {
    index: bestIndex,
    sample,
    lateral,
    halfWidth,
    surfaceY: surface[1],
    normal: sample.up,
    forward: sample.forward,
    right: sample.right,
    onRoad: Math.abs(lateral) <= halfWidth + 0.6,
    hasWall: sample.wall === 1,
    distanceAlong: sample.distance + along,
  };
}

// Where to put the car when it respawns at a checkpoint (or at the start).
export function poseAtGate(track, gateIndex) {
  const index = gateIndex < 0 ? 0 : track.gates[gateIndex].index;
  const sample = track.samples[index];
  return {
    position: [sample.position[0] + sample.up[0] * 1.2, sample.position[1] + sample.up[1] * 1.2, sample.position[2] + sample.up[2] * 1.2],
    heading: Math.atan2(sample.forward[0], sample.forward[2]),
    index,
  };
}
