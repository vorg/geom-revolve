# geom-revolve

Create a simplicial complex geometry by revolving a path around Y axis.

![](screenshot.jpg)

## Installation

```bash
npm install geom-revolve
```

## Usage

```js
import revolve from "geom-revolve";

const path = new Float32Array([
  0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.2, 0.2, 0.0, 0.3, 0.5, 0.0, 0.3, 0.7, 0.0,
  0.1, 0.8, 0.0, 0.1, 1.0, 0.0, 0.0, 1.0, 0.0,
]);

const geometry = revolve(path);
// => { positions: Float32Array(384), cells: Uint32Array(672) }
```

## API

#### `revolve(path, [numSteps], [angle]): geometry`

**Parameters**

- path: `TypedArray | Array | Array<[x, y, z]>` - positions defining the path to revolve.
- numSteps: `number` (default: `16`) - rotation subdivisions.
- angle: `number` (default: `Math.PI * 2`) - angle to rotate by.

**Returns**

geometry: `{ positions: TypedArray | Array<[x, y, z]>, cells: TypedArray | Array<[x, y, z]> }` - the revolved geometry.

Returned cells will be either Array of Arrays or TypedArray depending on the path data.

## License

MIT, see [LICENSE.md](http://github.com/vorg/geom-revolve/blob/master/LICENSE.md) for details.
