import revolve from "../index.js";
import createContext from "pex-context";
import createGUI from "pex-gui";
import { mat4 } from "pex-math";
import computeEdges from "geom-edges";

const State = {
  angle: Math.PI * 2,
  steps: 16,
  pause: false,
  mode: 0,
  shadings: ["standard derivative", "uvs"],
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
]
// ].flat();

const cmdOptions = {
  attributes: {
    aPosition: ctx.vertexBuffer([]),
    aUv: ctx.vertexBuffer([]),
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

const update = () => {
  const g = revolve(path, { numSteps: State.steps, angle: State.angle });
  g.edges = computeEdges(g.cells);
  console.log(g);

  ctx.update(cmdOptions.attributes.aPosition, {
    data: g.positions,
  });
  ctx.update(cmdOptions.attributes.aUv, {
    data: g.uvs,
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
in vec2 aUv;

out vec3 vPositionWorld;
out vec2 vUv;

void main () {
  vPositionWorld = (uModelMatrix * vec4(aPosition, 1.0)).xyz;
  vUv = aUv;
  gl_Position = uProjectionMatrix * uViewMatrix * vec4(vPositionWorld, 1.0);
}`;

const drawMeshCmd = {
  pipeline: ctx.pipeline({
    vert: basicVert,
    frag: /* glsl */ `#version 300 es
precision highp float;

uniform float uMode;

in vec3 vPositionWorld;
in vec2 vUv;

out vec4 fragColor;

void main() {
  if (uMode == 0.0) {
    vec3 fdx = vec3(dFdx(vPositionWorld.x), dFdx(vPositionWorld.y), dFdx(vPositionWorld.z));
    vec3 fdy = vec3(dFdy(vPositionWorld.x), dFdy(vPositionWorld.y), dFdy(vPositionWorld.z));
    vec3 normal = normalize(cross(fdx, fdy));
    fragColor = vec4(normal * 0.5 + 0.5, 1.0);
  }

  if (uMode == 1.0) fragColor = vec4(vUv.xy, 0.0, 1.0);
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
gui.addRadioList(
  "Mode",
  State,
  "mode",
  State.shadings.map((name, value) => ({ name, value })),
);

let dt = 0;

ctx.frame(() => {
  if (!State.pause) {
    dt += 0.005;
    mat4.rotate(modelMatrix, dt % 0.02, [0, 1, 0]);
    mat4.lookAt(viewMatrix, [0, 0.5 + Math.sin(dt) * 2, 2], [0, 0.5, 0]);
  }

  ctx.submit(clearCmd);
  cmdOptions.uniforms.uMode = State.mode;
  ctx.submit(drawMeshCmd, cmdOptions);
  ctx.submit(drawMeshWireframeCmd, { ...cmdOptions, ...wireframeCmdOptions });

  gui.draw();
});
