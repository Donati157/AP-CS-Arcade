// Geometry helpers. Everything Poly Kart draws is built here out of flat-shaded triangles.
//
// A "geometry" is three plain arrays of numbers: positions, normals and colours, three values per
// vertex, three vertices per triangle. Flat shading just means every vertex of a triangle gets the
// same normal, which is why the faces read as crisp facets.

export function emptyGeometry() {
  return { positions: [], normals: [], colours: [] };
}

// Adds one triangle. The normal is worked out from the winding, so callers only supply corners.
export function addTriangle(geometry, a, b, c, colour) {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy * vz - uz * vy;
  let ny = uz * vx - ux * vz;
  let nz = ux * vy - uy * vx;
  const length = Math.hypot(nx, ny, nz) || 1;
  nx /= length; ny /= length; nz /= length;
  for (const corner of [a, b, c]) {
    geometry.positions.push(corner[0], corner[1], corner[2]);
    geometry.normals.push(nx, ny, nz);
    geometry.colours.push(colour[0], colour[1], colour[2]);
  }
}

// A four-corner face, wound a-b-c-d.
export function addQuad(geometry, a, b, c, d, colour) {
  addTriangle(geometry, a, b, c, colour);
  addTriangle(geometry, a, c, d, colour);
}

// An axis-aligned box given its centre and half-extents. Used for scenery, kerbs and car parts.
export function addBox(geometry, centre, half, colour, shadeSides = true) {
  const [x, y, z] = centre;
  const [hx, hy, hz] = half;
  const x0 = x - hx, x1 = x + hx, y0 = y - hy, y1 = y + hy, z0 = z - hz, z1 = z + hz;
  const side = shadeSides ? shade(colour, 0.82) : colour;
  const bottom = shadeSides ? shade(colour, 0.6) : colour;
  addQuad(geometry, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], colour);        // top
  addQuad(geometry, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], bottom);        // bottom
  addQuad(geometry, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], side);          // front
  addQuad(geometry, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], side);          // back
  addQuad(geometry, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], shade(side, 0.94));
  addQuad(geometry, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], shade(side, 0.94));
}

// A box that has been rotated about the vertical axis. Handy for angled scenery.
export function addRotatedBox(geometry, centre, half, yaw, colour) {
  const local = emptyGeometry();
  addBox(local, [0, 0, 0], half, colour);
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  for (let i = 0; i < local.positions.length; i += 3) {
    const x = local.positions[i], y = local.positions[i + 1], z = local.positions[i + 2];
    geometry.positions.push(centre[0] + x * cos + z * sin, centre[1] + y, centre[2] + z * cos - x * sin);
    const nx = local.normals[i], ny = local.normals[i + 1], nz = local.normals[i + 2];
    geometry.normals.push(nx * cos + nz * sin, ny, nz * cos - nx * sin);
    geometry.colours.push(local.colours[i], local.colours[i + 1], local.colours[i + 2]);
  }
}

// A flat horizontal plane, used for the water the tracks float above.
export function addGroundPlane(geometry, y, size, colour) {
  addQuad(geometry, [-size, y, size], [size, y, size], [size, y, -size], [-size, y, -size], colour);
}

// A cylinder standing on the Y axis, for wheels once rotated into place and for pillars.
export function addCylinder(geometry, centre, radius, halfHeight, sides, colour, axis = 'y') {
  const top = shade(colour, 1.08);
  const bottom = shade(colour, 0.6);
  const at = (angle, end) => {
    const c = Math.cos(angle) * radius, s = Math.sin(angle) * radius;
    if (axis === 'x') return [centre[0] + end * halfHeight, centre[1] + c, centre[2] + s];
    if (axis === 'z') return [centre[0] + c, centre[1] + s, centre[2] + end * halfHeight];
    return [centre[0] + c, centre[1] + end * halfHeight, centre[2] + s];
  };
  const capCentre = (end) => {
    if (axis === 'x') return [centre[0] + end * halfHeight, centre[1], centre[2]];
    if (axis === 'z') return [centre[0], centre[1], centre[2] + end * halfHeight];
    return [centre[0], centre[1] + end * halfHeight, centre[2]];
  };
  for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2;
    const a1 = ((i + 1) / sides) * Math.PI * 2;
    addQuad(geometry, at(a0, -1), at(a1, -1), at(a1, 1), at(a0, 1), shade(colour, 0.9 + 0.2 * Math.cos(a0)));
    addTriangle(geometry, capCentre(1), at(a0, 1), at(a1, 1), top);
    addTriangle(geometry, capCentre(-1), at(a1, -1), at(a0, -1), bottom);
  }
}

// Multiplies a colour, keeping it in range. Used so box sides read darker than tops.
export function shade(colour, amount) {
  return [
    Math.min(1, colour[0] * amount),
    Math.min(1, colour[1] * amount),
    Math.min(1, colour[2] * amount),
  ];
}

// Converts "#4d7fe0" into the 0..1 triple the shader wants.
export function colourFromHex(hex) {
  const value = parseInt(hex.replace('#', ''), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

// ---- Scenery pieces -----------------------------------------------------------------------------
//
// The world around the track is built from these. They exist so the environment reads as an
// authored place rather than a field of grey boxes: everything has a top colour and a darker side,
// a deliberate silhouette, and enough variation that no two look stamped from the same mould.

// A pyramid with a flat top, which is the shape most of this world is made of: hills, islands,
// rocks and roofs are all this with different proportions.
export function addFrustum(geometry, centre, baseHalf, topHalf, height, colour, topColour = null) {
  const [x, y, z] = centre;
  const top = topColour || shade(colour, 1.12);
  const b = baseHalf, t = topHalf;
  const corners = [
    [[x - b, y, z + b], [x + b, y, z + b], [x + t, y + height, z + t], [x - t, y + height, z + t]],
    [[x + b, y, z - b], [x - b, y, z - b], [x - t, y + height, z - t], [x + t, y + height, z - t]],
    [[x + b, y, z + b], [x + b, y, z - b], [x + t, y + height, z - t], [x + t, y + height, z + t]],
    [[x - b, y, z - b], [x - b, y, z + b], [x - t, y + height, z + t], [x - t, y + height, z - t]],
  ];
  const sides = [shade(colour, 0.9), shade(colour, 0.78), shade(colour, 0.84), shade(colour, 0.84)];
  corners.forEach((face, i) => addQuad(geometry, face[0], face[1], face[2], face[3], sides[i]));
  if (t > 0.01) {
    addQuad(geometry, [x - t, y + height, z + t], [x + t, y + height, z + t], [x + t, y + height, z - t], [x - t, y + height, z - t], top);
  }
}

// A conifer: a bare trunk with two or three stacked skirts. Cheap, and unmistakably a tree even as
// a silhouette at the edge of the draw distance.
export function addTree(geometry, x, z, groundY, scale, trunkColour, leafColour) {
  const trunkHeight = 1.6 * scale;
  addBox(geometry, [x, groundY + trunkHeight / 2, z], [0.28 * scale, trunkHeight / 2, 0.28 * scale], trunkColour);
  let base = groundY + trunkHeight * 0.7;
  let width = 2.0 * scale;
  for (let tier = 0; tier < 3; tier++) {
    addFrustum(geometry, [x, base, z], width, width * 0.18, 2.1 * scale, leafColour, shade(leafColour, 1.15));
    base += 1.45 * scale;
    width *= 0.72;
  }
}

// A rounder tree, so the planting is not all the same species.
export function addRoundTree(geometry, x, z, groundY, scale, trunkColour, leafColour) {
  const trunkHeight = 2.0 * scale;
  addBox(geometry, [x, groundY + trunkHeight / 2, z], [0.3 * scale, trunkHeight / 2, 0.3 * scale], trunkColour);
  const crown = groundY + trunkHeight;
  addFrustum(geometry, [x, crown, z], 1.5 * scale, 1.9 * scale, 1.3 * scale, leafColour);
  addFrustum(geometry, [x, crown + 1.3 * scale, z], 1.9 * scale, 0.5 * scale, 1.9 * scale, shade(leafColour, 1.08));
}

// A boulder: a squat frustum turned off-axis so it does not line up with anything else.
export function addRock(geometry, x, z, groundY, scale, colour) {
  const local = emptyGeometry();
  addFrustum(local, [0, 0, 0], 1.0 * scale, 0.55 * scale, 0.9 * scale, colour);
  const yaw = (x * 0.37 + z * 0.13) % Math.PI;
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  for (let i = 0; i < local.positions.length; i += 3) {
    const px = local.positions[i], py = local.positions[i + 1], pz = local.positions[i + 2];
    geometry.positions.push(x + px * cos + pz * sin, groundY + py, z + pz * cos - px * sin);
    const nx = local.normals[i], ny = local.normals[i + 1], nz = local.normals[i + 2];
    geometry.normals.push(nx * cos + nz * sin, ny, nz * cos - nx * sin);
    geometry.colours.push(local.colours[i], local.colours[i + 1], local.colours[i + 2]);
  }
}

// A building with a roof slab and a band of windows, so the skyline is not a row of blank prisms.
export function addBuilding(geometry, x, z, groundY, width, depth, height, wallColour, roofColour, windowColour) {
  addBox(geometry, [x, groundY + height / 2, z], [width, height / 2, depth], wallColour);
  addBox(geometry, [x, groundY + height + 0.5, z], [width * 1.1, 0.5, depth * 1.1], roofColour);
  // Two window bands, stood just proud of the wall so they never fight with it for depth.
  for (const level of [0.45, 0.72]) {
    const y = groundY + height * level;
    addBox(geometry, [x, y, z + depth + 0.06], [width * 0.82, height * 0.075, 0.06], windowColour);
    addBox(geometry, [x, y, z - depth - 0.06], [width * 0.82, height * 0.075, 0.06], windowColour);
    addBox(geometry, [x + width + 0.06, y, z], [0.06, height * 0.075, depth * 0.82], windowColour);
    addBox(geometry, [x - width - 0.06, y, z], [0.06, height * 0.075, depth * 0.82], windowColour);
  }
}

// A trackside board on two legs: used for the corner chevrons and the distance markers.
export function addSign(geometry, position, right, up, forward, width, height, postColour, faceColour, markColour) {
  const legHeight = 1.5;
  for (const side of [-1, 1]) {
    const foot = [
      position[0] + right[0] * side * width * 0.7,
      position[1] + right[1] * side * width * 0.7,
      position[2] + right[2] * side * width * 0.7,
    ];
    addBox(geometry, [foot[0], foot[1] + legHeight / 2, foot[2]], [0.12, legHeight / 2, 0.12], postColour);
  }
  const centre = [
    position[0] + up[0] * (legHeight + height / 2),
    position[1] + up[1] * (legHeight + height / 2) + legHeight,
    position[2] + up[2] * (legHeight + height / 2),
  ];
  const board = emptyGeometry();
  addBox(board, [0, 0, 0], [width, height / 2, 0.12], faceColour);
  // Three chevrons across the face, pointing the way the corner goes.
  for (let i = -1; i <= 1; i++) {
    addBox(board, [i * width * 0.55, 0, -0.14], [width * 0.2, height * 0.3, 0.06], markColour);
  }
  const yaw = Math.atan2(forward[0], forward[2]);
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  for (let i = 0; i < board.positions.length; i += 3) {
    const px = board.positions[i], py = board.positions[i + 1], pz = board.positions[i + 2];
    geometry.positions.push(centre[0] + px * cos + pz * sin, centre[1] + py, centre[2] + pz * cos - px * sin);
    const nx = board.normals[i], ny = board.normals[i + 1], nz = board.normals[i + 2];
    geometry.normals.push(nx * cos + nz * sin, ny, nz * cos - nx * sin);
    geometry.colours.push(board.colours[i], board.colours[i + 1], board.colours[i + 2]);
  }
}
