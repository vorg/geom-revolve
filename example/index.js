const regl = require('regl')()
const Mat4 = require('pex-math/Mat4')
const computeNormals = require('angle-normals')
const computeEdges = require('geom-edges')
const projection = Mat4.perspective([], 60, window.innerWidth / window.innerHeight, 0.1, 100)
const view = Mat4.lookAt([], [0, 1.5, 2], [0, 0.5, 0], [0, 1, 0])

const revolve = require('../index.js')

// vase profile
// _
//  |
//   \
//    |
//   /
// _/
//
const path = [
  [0.0, 0.0, 0.0], [0.1, 0.0, 0.0], [0.2, 0.2, 0.0],
  [0.3, 0.5, 0.0], [0.3, 0.7, 0.0], [0.1, 0.8, 0.0],
  [0.1, 1.0, 0.0], [0.0, 1.0, 0.0]
]

const g = revolve(path, 16)
g.normals = computeNormals(g.cells, g.positions)
g.edges = computeEdges(g.cells)

const drawMeshWireframe = regl({
  attributes: {
    position: g.positions,
    normals: g.normals,
  },
  elements: g.edges,
  vert: `
  attribute vec3 position;
  uniform mat4 projection;
  uniform mat4 view;
  void main() {
    gl_Position = projection * view * vec4(position, 1.0);
  }
  `,
  frag: `
  precision highp float;
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }`,
  uniforms: {
    projection: projection,
    view: view
  }
})

const drawMesh = regl({
  attributes: {
    position: g.positions,
    normal: g.normals
  },
  elements: g.cells,
  vert: `
  attribute vec3 position;
  attribute vec3 normal;
  uniform mat4 projection;
  uniform mat4 view;
  varying vec3 vNormal;
  void main() {
    vNormal = normal;
    gl_Position = projection * view * vec4(position, 1.0);
  }
  `,
  frag: `
  precision highp float;
  varying vec3 vNormal;
  void main() {
    gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);
  }`,
  uniforms: {
    projection: projection,
    view: view
  }
})

regl.frame(() => {
  regl.clear({
    color: [0.2, 0.2, 0.2, 1.0],
    depth: 1
  })
  drawMesh()
  drawMeshWireframe()
})
