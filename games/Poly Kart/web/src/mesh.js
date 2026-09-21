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
