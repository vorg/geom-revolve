import revolve from "../index.js";
import createContext from "pex-context";
import createGUI from "pex-gui";
import { mat4 } from "pex-math";
// import computeEdges from "geom-edges";

const State = {
  angle: Math.PI * 2,
  steps: 16,
  pause: false,
};

const W = 1280;
const H = 720;
const ctx = createContext({
  width: W,
  height: H,
  element: document.querySelector("main"),
  pixelRatio: devicePixelRatio,
});

const projectionMatrix = mat4.create();
const viewMatrix = mat4.create();
const modelMatrix = mat4.create();
mat4.perspective(projectionMatrix, Math.PI / 4, W / H, 0.1, 100);
mat4.lookAt(viewMatrix, [0, 0.5, 2], [0, 0.5, 0]);

// vase profile
// _
//  |
//   \
//    |
//   /
// _/
//

// prettier-ignore
const path = [
  [0.0, 0.0, 0.0],
  [0.1, 0.0, 0.0],
  [0.2, 0.2, 0.0],
  [0.3, 0.5, 0.0],
  [0.3, 0.7, 0.0],
  [0.1, 0.8, 0.0],
  [0.1, 1.0, 0.0],
  [0.0, 1.0, 0.0],
].flat();

const cmdOptions = {
  attributes: {
    aPosition: ctx.vertexBuffer([]),
  },
  indices: ctx.indexBuffer([]),
  uniforms: {
    uProjectionMatrix: projectionMatrix,
    uViewMatrix: viewMatrix,
    uModelMatrix: modelMatrix,
  },
};

const wireframeCmdOptions = {
  indices: ctx.indexBuffer([]),
};

function computeEdges(cells, stride = 3) {
  const edges = new Uint32Array(cells.length * 2);

  let cellIndex = 0;

  for (let i = 0; i < cells.length; i += stride) {
    for (let j = 0; j < stride; j++) {
      const a = cells[i + j];
      const b = cells[i + ((j + 1) % stride)];
      edges[cellIndex] = Math.min(a, b);
      edges[cellIndex + 1] = Math.max(a, b);
      cellIndex += 2;
    }
  }
  return edges;
}

const update = () => {
  const g = revolve(path, State.steps, State.angle);
  g.edges = computeEdges(g.cells);
  console.log(g);

  ctx.update(cmdOptions.attributes.aPosition, {
    data: g.positions,
  });
  ctx.update(cmdOptions.indices, {
    data: g.cells,
  });
  ctx.update(wireframeCmdOptions.indices, {
    data: g.edges,
  });
};
update();

const clearCmd = {
  pass: ctx.pass({
    clearColor: [0.2, 0.2, 0.2, 1],
    clearDepth: 1,
  }),
};

const basicVert = /* glsl */ `#version 300 es
uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;

in vec3 aPosition;

out vec4 vColor;
out vec3 vPositionWorld;

void main () {
  vColor = vec4(1.0, 0.0, 0.0, 1.0);

  vPositionWorld = (uModelMatrix * vec4(aPosition, 1.0)).xyz;

  gl_Position = uProjectionMatrix * uViewMatrix * vec4(vPositionWorld, 1.0);
}`;

const drawMeshCmd = {
  pipeline: ctx.pipeline({
    vert: basicVert,
    frag: /* glsl */ `#version 300 es
precision highp float;

in vec4 vColor;
in vec3 vPositionWorld;
out vec4 fragColor;

void main() {
  vec3 fdx = vec3(dFdx(vPositionWorld.x), dFdx(vPositionWorld.y), dFdx(vPositionWorld.z));
  vec3 fdy = vec3(dFdy(vPositionWorld.x), dFdy(vPositionWorld.y), dFdy(vPositionWorld.z));
  vec3 normal = normalize(cross(fdx, fdy));
  fragColor = vec4(normal * 0.5 + 0.5, 1.0);
}
`,
    depthTest: true,
  }),
};

const drawMeshWireframeCmd = {
  pipeline: ctx.pipeline({
    vert: basicVert,
    frag: /* glsl */ `#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`,
    depthTest: true,
    primitive: ctx.Primitive.Lines,
  }),
};

const gui = createGUI(ctx);

gui.addParam("Angle", State, "angle", { min: 0, max: Math.PI * 2 }, update);
gui.addParam("Steps", State, "steps", { min: 0, max: 64, step: 1 }, update);
gui.addParam("Pause", State, "pause");

let dt = 0;

ctx.frame(() => {
  if (!State.pause) {
    dt += 0.005;
    mat4.rotate(modelMatrix, dt % 0.02, [0, 1, 0]);
    mat4.lookAt(viewMatrix, [0, 0.5 + Math.sin(dt) * 2, 2], [0, 0.5, 0]);
  }

  ctx.submit(clearCmd);
  ctx.submit(drawMeshCmd, cmdOptions);
  ctx.submit(drawMeshWireframeCmd, { ...cmdOptions, ...wireframeCmdOptions });

  gui.draw();
});
