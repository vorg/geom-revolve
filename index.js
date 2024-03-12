import { avec3 } from "pex-math";

function revolve(path, numSteps = 16, angle = 2 * Math.PI) {
  const isFlatArray = !path[0]?.length;

  let loop = false;
  if (Math.abs(angle - 2 * Math.PI) < Number.EPSILON) {
    angle = 2 * Math.PI;
    loop = true;
  }

  const numPoints = path.length / (isFlatArray ? 3 : 1);
  const positionCount = numSteps * numPoints;
  const cellCount = 2 * (numSteps - (loop ? 0 : 1)) * (numPoints - 1);

  const positions = isFlatArray ? new path.constructor(positionCount * 3) : [];
  const cells = isFlatArray ? new Uint32Array(cellCount * 3) : [];

  const n = loop ? numSteps : numSteps > 1 ? numSteps - 1 : 1;

  for (let i = 0; i < numSteps; i++) {
    const t = (angle * i) / n;
    const sina = Math.sin(t);
    const cosa = Math.cos(t);

    if (isFlatArray) {
      for (let j = 0; j < numPoints; j++) {
        const x = path[j * 3];
        const y = path[j * 3 + 1];

        avec3.set3(positions, i * numPoints + j, cosa * x, y, sina * x);

        if (j === numPoints - 1) continue;

        const a = i * numPoints + j;
        const k = 2 * i * (numPoints - 1) + j * 2;

        if (loop) {
          if (i < numSteps) {
            const b = ((i + 1) % numSteps) * numPoints + j;
            const c = b + 1;
            avec3.set3(cells, k, a, b, c);
            avec3.set3(cells, k + 1, a, c, a + 1);
          }
        } else {
          if (i < numSteps - 1) {
            const b = (i + 1) * numPoints + j;
            const c = b + 1;

            avec3.set3(cells, k, a, b, c);
            avec3.set3(cells, k + 1, a, c, a + 1);
          }
        }
      }
    } else {
      for (let j = 0; j < numPoints; j++) {
        const [x, y] = path[j];

        positions.push([cosa * x, y, sina * x]);

        if (j === numPoints - 1) continue;

        const a = i * numPoints + j;

        if (loop) {
          if (i < numSteps) {
            const b = ((i + 1) % numSteps) * numPoints + j;
            const c = b + 1;

            cells.push([a, b, c]);
            cells.push([a, c, a + 1]);
          }
        } else {
          if (i < numSteps - 1) {
            const b = (i + 1) * numPoints + j;
            const c = b + 1;

            cells.push([a, b, c]);
            cells.push([a, c, a + 1]);
          }
        }
      }
    }
  }

  return { positions, cells };
}

export default revolve;
