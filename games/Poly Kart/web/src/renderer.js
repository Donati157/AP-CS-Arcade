// A very small flat-shaded WebGL renderer.
//
// Poly Kart draws nothing but untextured triangles lit by one direction, which is all the low-poly
// look needs, so there is no reason to pull in a 3D framework. Everything here is one shader, a
// handful of 4x4 matrices and a helper that uploads a mesh once and draws it many times.

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;
uniform mat4 uViewProjection;
uniform mat4 uModel;
uniform mat3 uNormalMatrix;
varying vec3 vNormal;
varying vec3 vColor;
varying float vDepth;
void main() {
  vec4 world = uModel * vec4(aPosition, 1.0);
  gl_Position = uViewProjection * world;
  vNormal = normalize(uNormalMatrix * aNormal);
  vColor = aColor;
  vDepth = gl_Position.w;
}`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform vec3 uLightDirection;
uniform vec3 uFogColor;
uniform float uFogStart;
uniform float uFogEnd;
uniform float uTint;
uniform vec3 uTintColor;
varying vec3 vNormal;
varying vec3 vColor;
varying float vDepth;
void main() {
  // One key light plus a soft sky term, so faces pointing up stay bright and nothing goes black.
  float key = max(dot(normalize(vNormal), normalize(uLightDirection)), 0.0);
  float sky = 0.78 + 0.22 * normalize(vNormal).y;
  vec3 colour = vColor * (0.72 + 0.40 * key) * sky;
  colour = mix(colour, uTintColor, uTint);
  float fog = clamp((vDepth - uFogStart) / max(uFogEnd - uFogStart, 0.001), 0.0, 1.0);
  gl_FragColor = vec4(mix(colour, uFogColor, fog), 1.0);
}`;

// ---- Matrix helpers. Column-major, the order WebGL expects. -------------------------------------

export function identity() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

export function multiply(a, b, out = new Float32Array(16)) {
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k];
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

export function perspective(fovYRadians, aspect, near, far) {
  const f = 1 / Math.tan(fovYRadians / 2);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}

export function lookAt(eye, target, up) {
  const z = normalise([eye[0] - target[0], eye[1] - target[1], eye[2] - target[2]]);
  const x = normalise(cross(up, z));
  const y = cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
    -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
    -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
    1,
  ]);
}

// Builds a model matrix from a position, a yaw/pitch/roll triple and a uniform scale.
export function composeModel(position, yaw, pitch, roll, scale = 1) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cr = Math.cos(roll), sr = Math.sin(roll);
  // Rotation order: yaw (Y), then pitch (X), then roll (Z).
  const m00 = cy * cr + sy * sp * sr;
  const m01 = sr * cp;
  const m02 = -sy * cr + cy * sp * sr;
  const m10 = -cy * sr + sy * sp * cr;
  const m11 = cr * cp;
  const m12 = sy * sr + cy * sp * cr;
  const m20 = sy * cp;
  const m21 = -sp;
  const m22 = cy * cp;
  return new Float32Array([
    m00 * scale, m01 * scale, m02 * scale, 0,
    m10 * scale, m11 * scale, m12 * scale, 0,
    m20 * scale, m21 * scale, m22 * scale, 0,
    position[0], position[1], position[2], 1,
  ]);
}

// The upper-left 3x3 of the model matrix is enough for normals: we only ever rotate and scale
// uniformly, so no inverse-transpose is needed.
function normalMatrixFrom(model) {
  return new Float32Array([
    model[0], model[1], model[2],
    model[4], model[5], model[6],
    model[8], model[9], model[10],
  ]);
}

export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export function normalise(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

// ---- Getting a drawing context -------------------------------------------------------------------

// Failures are reported by stage so the game can say what actually went wrong instead of blaming
// the browser for something that is our fault.
export class RendererError extends Error {
  constructor(stage, message, detail = null) {
    super(message);
    this.name = 'RendererError';
    this.stage = stage;          // 'context' | 'shader' | 'link'
    this.detail = detail;
  }
}

// Tried in order, best first, then progressively less demanding. Nothing here asks for a fast GPU:
// a slow context still runs this game, and refusing one would just lock players out.
//
// The shaders are GLSL ES 1.00, which a WebGL 2 context accepts unchanged, so there is no second
// set of shaders to keep in step and no reason to insist on either version.
const CONTEXT_ATTEMPTS = [
  ['webgl2', { antialias: true, alpha: false, depth: true, stencil: false }],
  ['webgl2', { antialias: false, alpha: false, depth: true, stencil: false }],
  ['webgl', { antialias: true, alpha: false, depth: true, stencil: false }],
  ['webgl', { antialias: false, alpha: false, depth: true, stencil: false }],
  ['webgl', {}],
  ['experimental-webgl', {}],
];

export function acquireContext(canvas) {
  const tried = [];
  for (const [id, options] of CONTEXT_ATTEMPTS) {
    let gl = null;
    try {
      gl = canvas.getContext(id, options);
    } catch (error) {
      tried.push(`${id} ${JSON.stringify(options)} threw ${error.message}`);
      continue;
    }
    if (gl) return { gl, id, options, tried };
    tried.push(`${id} ${JSON.stringify(options)} returned null`);
  }
  throw new RendererError('context', 'No WebGL context of any kind could be created.', tried);
}

// ---- The renderer ------------------------------------------------------------------------------

export class Renderer {
  constructor(canvas) {
    const acquired = acquireContext(canvas);
    const gl = acquired.gl;
    this.canvas = canvas;
    this.gl = gl;
    this.contextId = acquired.id;
    this.contextOptions = acquired.options;
    this.contextAttempts = acquired.tried;
    this.lost = false;
    this.onContextLost = null;
    this.onContextRestored = null;
    // A lost context is recoverable, but only if the default is prevented; without this the browser
    // never fires the restore event and the game would stay dead until a reload.
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.lost = true;
      this.meshes = [];
      if (this.onContextLost) this.onContextLost();
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.lost = false;
      this.program = buildProgram(this.gl, VERTEX_SHADER, FRAGMENT_SHADER);
      this.cacheLocations();
      this.setDefaults();
      if (this.onContextRestored) this.onContextRestored();
    });
    this.program = buildProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    this.meshes = [];
    this.cacheLocations();
    this.setDefaults();
  }

  cacheLocations() {
    const gl = this.gl;
    this.attributes = {
      position: gl.getAttribLocation(this.program, 'aPosition'),
      normal: gl.getAttribLocation(this.program, 'aNormal'),
      colour: gl.getAttribLocation(this.program, 'aColor'),
    };
    this.uniforms = {
      viewProjection: gl.getUniformLocation(this.program, 'uViewProjection'),
      model: gl.getUniformLocation(this.program, 'uModel'),
      normalMatrix: gl.getUniformLocation(this.program, 'uNormalMatrix'),
      lightDirection: gl.getUniformLocation(this.program, 'uLightDirection'),
      fogColour: gl.getUniformLocation(this.program, 'uFogColor'),
      fogStart: gl.getUniformLocation(this.program, 'uFogStart'),
      fogEnd: gl.getUniformLocation(this.program, 'uFogEnd'),
      tint: gl.getUniformLocation(this.program, 'uTint'),
      tintColour: gl.getUniformLocation(this.program, 'uTintColor'),
    };
  }

  setDefaults() {
    const gl = this.gl;
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
  }

  // Everything a bug report needs, and what the debug overlay shows.
  diagnostics() {
    const gl = this.gl;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const safe = (fn, fallback = 'unavailable') => { try { return fn(); } catch { return fallback; } };
    return {
      context: this.contextId,
      attributes: this.contextOptions,
      attempts: this.contextAttempts,
      version: safe(() => gl.getParameter(gl.VERSION)),
      glsl: safe(() => gl.getParameter(gl.SHADING_LANGUAGE_VERSION)),
      vendor: safe(() => (info ? gl.getParameter(info.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR))),
      renderer: safe(() => (info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))),
      maxTextureSize: safe(() => gl.getParameter(gl.MAX_TEXTURE_SIZE)),
      antialiasing: safe(() => gl.getContextAttributes().antialias),
      contextLost: this.lost || safe(() => gl.isContextLost(), false),
      programLinked: safe(() => gl.getProgramParameter(this.program, gl.LINK_STATUS), false),
      drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
      softwareRendering: this.looksSoftware(),
    };
  }

  // Software rasterisers run this game, just not at full resolution, so the pixel ratio is capped
  // for them rather than refusing to draw.
  looksSoftware() {
    const gl = this.gl;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    let name = '';
    try {
      name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    } catch { return false; }
    return /swiftshader|software|llvmpipe|basic render|microsoft basic/i.test(name);
  }

  // Uploads a mesh built by mesh.js and returns a handle to draw with.
  upload(geometry) {
    const gl = this.gl;
    const handle = {
      position: gl.createBuffer(),
      normal: gl.createBuffer(),
      colour: gl.createBuffer(),
      count: geometry.positions.length / 3,
    };
    gl.bindBuffer(gl.ARRAY_BUFFER, handle.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.positions), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, handle.normal);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.normals), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, handle.colour);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.colours), gl.STATIC_DRAW);
    this.meshes.push(handle);
    return handle;
  }

  // Frees every buffer. Called when a track is torn down so repeated races do not leak.
  disposeMeshes() {
    const gl = this.gl;
    for (const mesh of this.meshes) {
      gl.deleteBuffer(mesh.position);
      gl.deleteBuffer(mesh.normal);
      gl.deleteBuffer(mesh.colour);
    }
    this.meshes = [];
  }

  // Matches the drawing buffer to the element size. Returns true when the size changed.
  resize(pixelRatioCap = 2) {
    const cap = this.looksSoftware() ? 1 : pixelRatioCap;
    const ratio = Math.min(window.devicePixelRatio || 1, cap);
    const width = Math.max(1, Math.round(this.canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * ratio));
    if (this.canvas.width === width && this.canvas.height === height) return false;
    this.canvas.width = width;
    this.canvas.height = height;
    return true;
  }

  get aspect() {
    return this.canvas.width / Math.max(1, this.canvas.height);
  }

  beginFrame(viewProjection, sky, _cameraPosition) {
    if (this.lost) return;
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(sky[0], sky[1], sky[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.uniforms.viewProjection, false, viewProjection);
    gl.uniform3fv(this.uniforms.lightDirection, normalise([0.45, 0.85, 0.3]));
    gl.uniform3fv(this.uniforms.fogColour, sky);
    gl.uniform1f(this.uniforms.fogStart, 220);
    gl.uniform1f(this.uniforms.fogEnd, 900);
  }

  draw(mesh, model, tint = 0, tintColour = [1, 1, 1]) {
    if (this.lost || !mesh) return;
    const gl = this.gl;
    gl.uniformMatrix4fv(this.uniforms.model, false, model);
    gl.uniformMatrix3fv(this.uniforms.normalMatrix, false, normalMatrixFrom(model));
    gl.uniform1f(this.uniforms.tint, tint);
    gl.uniform3fv(this.uniforms.tintColour, tintColour);
    bindAttribute(gl, mesh.position, this.attributes.position);
    bindAttribute(gl, mesh.normal, this.attributes.normal);
    bindAttribute(gl, mesh.colour, this.attributes.colour);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  }
}

function bindAttribute(gl, buffer, location) {
  if (location < 0) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
}

function buildProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new RendererError('link', 'The shader program would not link.', gl.getProgramInfoLog(program));
  }
  return program;
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const kind = type === gl.VERTEX_SHADER ? 'vertex' : 'fragment';
    throw new RendererError('shader', `The ${kind} shader would not compile.`, gl.getShaderInfoLog(shader));
  }
  return shader;
}
