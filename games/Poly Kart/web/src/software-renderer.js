// A software renderer, used only when the browser will not give us WebGL at all.
//
// Some machines have 3D switched off completely: hardware acceleration disabled with no software
// rasteriser behind it, a blocklisted driver, or an enterprise policy. Telling those players to go
// and find another browser is not a fix, so Poly Kart falls back to drawing the same 3D world with
// a 2D canvas: the same track, the same car, the same physics and the same chase camera, with the
// triangles projected and filled here instead of on the GPU.
//
// It is the same scene, drawn a slower way. It is not a picture of the game.
//
// The scene is flat-shaded low-poly, which is exactly what this approach can afford: no textures,
// no per-pixel lighting, one flat colour per triangle, painter's algorithm for depth.

const NEAR = 0.6;                 // triangles crossing this plane are dropped rather than clipped
const DRAW_DISTANCE = 260;        // metres; beyond this the fog has swallowed everything anyway
const MAX_TRIANGLES = 2600;       // a hard ceiling on the work done per frame

export class SoftwareRenderer {
  constructor(canvas) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser gives neither a 3D nor a 2D canvas.');
    this.canvas = canvas;
    this.ctx = context;
    this.meshes = [];
    this.lost = false;
    this.contextId = '2d-software';
    this.contextOptions = {};
    this.contextAttempts = ['WebGL was unavailable, so the software renderer is drawing instead'];
    this.onContextLost = null;
    this.onContextRestored = null;
    this.light = normalise([0.45, 0.85, 0.3]);
    this.buffer = [];
  }

  // Takes the same geometry the GPU path takes and keeps it as ready-to-transform triangles.
  upload(geometry) {
    const triangles = [];
    const { positions, normals, colours } = geometry;
    for (let i = 0; i < positions.length; i += 9) {
      const ax = positions[i], ay = positions[i + 1], az = positions[i + 2];
      const bx = positions[i + 3], by = positions[i + 4], bz = positions[i + 5];
      const cx = positions[i + 6], cy = positions[i + 7], cz = positions[i + 8];
      triangles.push({
        ax, ay, az, bx, by, bz, cx, cy, cz,
        nx: normals[i], ny: normals[i + 1], nz: normals[i + 2],
        r: colours[i], g: colours[i + 1], b: colours[i + 2],
        mx: (ax + bx + cx) / 3, my: (ay + by + cy) / 3, mz: (az + bz + cz) / 3,
      });
    }
    const handle = { triangles, count: triangles.length };
    this.meshes.push(handle);
    return handle;
  }

  disposeMeshes() {
    this.meshes = [];
  }

  // Software rasterising costs real time per pixel, so this path always draws at one device pixel
  // per CSS pixel and never at a retina multiple.
  resize() {
    const width = Math.max(1, Math.round(this.canvas.clientWidth));
    const height = Math.max(1, Math.round(this.canvas.clientHeight));
    if (this.canvas.width === width && this.canvas.height === height) return false;
    this.canvas.width = width;
    this.canvas.height = height;
    return true;
  }

  get aspect() {
    return this.canvas.width / Math.max(1, this.canvas.height);
  }

  beginFrame(viewProjection, sky, camera = [0, 0, 0]) {
    this.viewProjection = viewProjection;
    this.camera = camera;
    this.sky = sky;
    this.buffer.length = 0;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.fillStyle = `rgb(${to255(sky[0])},${to255(sky[1])},${to255(sky[2])})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Collects triangles instead of drawing immediately: they all have to be sorted together before
  // anything is filled, or near things end up behind far ones.
  draw(mesh, model, tint = 0, tintColour = [1, 1, 1]) {
    if (!mesh) return;
    const identityModel = model[0] === 1 && model[5] === 1 && model[10] === 1
      && model[1] === 0 && model[2] === 0 && model[4] === 0
      && model[6] === 0 && model[8] === 0 && model[9] === 0
      && model[12] === 0 && model[13] === 0 && model[14] === 0;
    const [ex, ey, ez] = this.camera;
    for (const t of mesh.triangles) {
      let ax, ay, az, bx, by, bz, cx, cy, cz, nx, ny, nz, mx, my, mz;
      if (identityModel) {
        ({ ax, ay, az, bx, by, bz, cx, cy, cz, nx, ny, nz, mx, my, mz } = t);
      } else {
        [ax, ay, az] = applyModel(model, t.ax, t.ay, t.az);
        [bx, by, bz] = applyModel(model, t.bx, t.by, t.bz);
        [cx, cy, cz] = applyModel(model, t.cx, t.cy, t.cz);
        [nx, ny, nz] = rotateByModel(model, t.nx, t.ny, t.nz);
        mx = (ax + bx + cx) / 3; my = (ay + by + cy) / 3; mz = (az + bz + cz) / 3;
      }
      // Too far to matter.
      const dx = mx - ex, dy = my - ey, dz = mz - ez;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance > DRAW_DISTANCE) continue;
      // Facing away from the camera.
      if (nx * dx + ny * dy + nz * dz > 0) continue;

      const pa = project(this.viewProjection, ax, ay, az);
      if (!pa) continue;
      const pb = project(this.viewProjection, bx, by, bz);
      if (!pb) continue;
      const pc = project(this.viewProjection, cx, cy, cz);
      if (!pc) continue;

      this.buffer.push({
        pa, pb, pc, distance,
        colour: this.shade(t, nx, ny, nz, distance, tint, tintColour),
      });
    }
  }

  // The same lighting the shader does: one key light, a sky term, then fog towards the horizon.
  shade(t, nx, ny, nz, distance, tint, tintColour) {
    const key = Math.max(0, nx * this.light[0] + ny * this.light[1] + nz * this.light[2]);
    const sky = 0.78 + 0.22 * ny;
    let r = t.r * (0.72 + 0.40 * key) * sky;
    let g = t.g * (0.72 + 0.40 * key) * sky;
    let b = t.b * (0.72 + 0.40 * key) * sky;
    if (tint > 0) {
      r = r + (tintColour[0] - r) * tint;
      g = g + (tintColour[1] - g) * tint;
      b = b + (tintColour[2] - b) * tint;
    }
    const fog = Math.min(1, Math.max(0, (distance - 220) / 680));
    r = r + (this.sky[0] - r) * fog;
    g = g + (this.sky[1] - g) * fog;
    b = b + (this.sky[2] - b) * fog;
    return `rgb(${to255(r)},${to255(g)},${to255(b)})`;
  }

  // Called once per frame after every draw(): sorts far-to-near and fills.
  present() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const halfW = width / 2;
    const halfH = height / 2;
    let list = this.buffer;
    list.sort((a, b) => b.distance - a.distance);
    if (list.length > MAX_TRIANGLES) list = list.slice(list.length - MAX_TRIANGLES);
    for (const item of list) {
      const { pa, pb, pc } = item;
      const ax = halfW + pa[0] * halfW, ay = halfH - pa[1] * halfH;
      const bx = halfW + pb[0] * halfW, by = halfH - pb[1] * halfH;
      const cx = halfW + pc[0] * halfW, cy = halfH - pc[1] * halfH;
      // Anything entirely off the side of the screen costs nothing to skip.
      if ((ax < 0 && bx < 0 && cx < 0) || (ax > width && bx > width && cx > width)) continue;
      if ((ay < 0 && by < 0 && cy < 0) || (ay > height && by > height && cy > height)) continue;
      // Filling alone leaves hairline gaps between neighbouring triangles, because the canvas
      // antialiases both edges and the two half-covered pixels do not add up to full cover.
      // Stroking the same path in the same colour closes the seam for almost nothing.
      ctx.fillStyle = item.colour;
      ctx.strokeStyle = item.colour;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    this.buffer.length = 0;
  }

  diagnostics() {
    return {
      context: this.contextId,
      attributes: {},
      attempts: this.contextAttempts,
      version: 'software (2D canvas)',
      glsl: 'not applicable',
      vendor: 'Poly Kart software renderer',
      renderer: 'Poly Kart software renderer',
      maxTextureSize: 0,
      antialiasing: false,
      contextLost: false,
      programLinked: true,
      drawingBuffer: [this.canvas.width, this.canvas.height],
      softwareRendering: true,
    };
  }

  looksSoftware() {
    return true;
  }
}

function applyModel(m, x, y, z) {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ];
}

function rotateByModel(m, x, y, z) {
  return [
    m[0] * x + m[4] * y + m[8] * z,
    m[1] * x + m[5] * y + m[9] * z,
    m[2] * x + m[6] * y + m[10] * z,
  ];
}

// Returns normalised device coordinates, or null when the point sits behind the camera.
function project(vp, x, y, z) {
  const w = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
  if (w < NEAR) return null;
  const cx = vp[0] * x + vp[4] * y + vp[8] * z + vp[12];
  const cy = vp[1] * x + vp[5] * y + vp[9] * z + vp[13];
  return [cx / w, cy / w];
}

function normalise(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

const to255 = (value) => Math.max(0, Math.min(255, Math.round(value * 255)));
