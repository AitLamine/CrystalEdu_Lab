// Single source of truth for symmetry-operation transforms, shared by the 3D
// cylinder view (AppShell.jsx) and the 2D stereographic projection
// (SymmetryControls.jsx). `order` is the group-theoretic order of the
// operation (how many applications of `transform` return to the start) and
// is also the exact number of orbit points a generic starting point produces.
export const SYMMETRY_OPERATIONS = {
  // PROPER ROTATIONS
  '1': {
    name: 'Identity (1)',
    type: 'proper',
    axis: null,
    order: 1,
    transform: (x, y, z) => [x, y, z],
    description: 'No transformation - identity operation',
  },
  '2//Oz': {
    name: '2-fold rotation // Oz',
    type: 'proper',
    axis: 'c',
    order: 2,
    transform: (x, y, z) => [-x, -y, z],
    description: '180° rotation around z-axis',
  },
  '2//Oy': {
    name: '2-fold rotation // Oy',
    type: 'proper',
    axis: 'b',
    order: 2,
    transform: (x, y, z) => [-x, y, -z],
    description: '180° rotation around y-axis',
  },
  '3': {
    name: '3-fold rotation (C3)',
    type: 'proper',
    axis: 'c',
    order: 3,
    transform: (x, y, z) => {
      const cos = Math.cos(2 * Math.PI / 3);
      const sin = Math.sin(2 * Math.PI / 3);
      return [x * cos - y * sin, x * sin + y * cos, z];
    },
    description: '120° rotation around z-axis',
  },
  '4': {
    name: '4-fold rotation (C4)',
    type: 'proper',
    axis: 'c',
    order: 4,
    transform: (x, y, z) => [-y, x, z],
    description: '90° rotation around z-axis',
  },
  '6': {
    name: '6-fold rotation (C6)',
    type: 'proper',
    axis: 'c',
    order: 6,
    transform: (x, y, z) => {
      const cos = Math.cos(Math.PI / 3);
      const sin = Math.sin(Math.PI / 3);
      return [x * cos - y * sin, x * sin + y * cos, z];
    },
    description: '60° rotation around z-axis',
  },

  // IMPROPER ROTATIONS
  '1̄': {
    name: 'Inversion (1̄)',
    type: 'improper',
    axis: null,
    order: 2, // p -> -p -> p
    transform: (x, y, z) => [-x, -y, -z],
    description: 'Inversion through origin',
  },
  '2̄//Oz': {
    name: 'Mirror ⊥ Oz (2̄ // Oz)',
    type: 'improper',
    axis: 'c',
    order: 2,
    transform: (x, y, z) => [x, y, -z],
    description: 'Reflection across xy-plane',
  },
  '2̄//Oy': {
    name: 'Mirror ⊥ Oy (2̄ // Oy)',
    type: 'improper',
    axis: 'b',
    order: 2,
    transform: (x, y, z) => [x, -y, z],
    description: 'Reflection across xz-plane',
  },
  '3̄': {
    name: '3-fold improper (3̄)',
    type: 'improper',
    axis: 'c',
    order: 6, // S6 = C3 + inversion; S6^3 = inversion, S6^6 = identity
    transform: (x, y, z) => {
      const cos = Math.cos(2 * Math.PI / 3);
      const sin = Math.sin(2 * Math.PI / 3);
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      return [-rx, -ry, -z];
    },
    description: 'C3 rotation + inversion',
    compound: true,
  },
  '4̄': {
    name: '4-fold improper (4̄)',
    type: 'improper',
    axis: 'c',
    order: 4, // 4̄^2 = 2//Oz (proper), 4̄^4 = identity
    transform: (x, y, z) => [-y, x, -z],
    description: 'C4 rotation + inversion',
    compound: true,
  },
  '6̄': {
    name: '6-fold improper (6̄)',
    type: 'improper',
    axis: 'c',
    order: 6, // S6-type here: ^2 = C3, ^3 = mirror ⊥ Oz, ^6 = identity
    transform: (x, y, z) => {
      const cos = Math.cos(Math.PI / 3);
      const sin = Math.sin(Math.PI / 3);
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      return [-rx, -ry, -z];
    },
    description: 'C6 rotation + inversion',
    compound: true,
  },
};

// Rotate a point by 2π/n around one of the three principal axes (a=x, b=y,
// c=z), using the same rotation sense already used throughout the table
// above (verified to reproduce every existing transform exactly when axis
// matches each operation's own default).
function rotateAroundAxis(axis, n, x, y, z) {
  const theta = (2 * Math.PI) / n;
  const cos = Math.cos(theta), sin = Math.sin(theta);
  if (axis === 'a') return [x, y * cos - z * sin, y * sin + z * cos];
  if (axis === 'b') return [x * cos + z * sin, y, -x * sin + z * cos];
  return [x * cos - y * sin, x * sin + y * cos, z]; // axis === 'c'
}

// Builds the transform for `operationKey`'s rotation fold (its leading
// digit — 2, 3, 4, or 6; identity/inversion are handled directly) about an
// arbitrary chosen axis, instead of the fixed axis baked into the table
// above. Improper operations apply full point inversion after the rotation
// (the standard rotoinversion definition, matching this table's own 1̄, 2̄,
// 3̄ and 6̄ entries) — the one exception is 4̄, whose own default-axis entry
// above uses a non-standard z-only-negation formula inherited unchanged
// from the original app; that exact formula is preserved whenever 4̄ is
// used at its own default axis ('c'), and only falls back to the standard
// rotoinversion convention if the user explicitly re-targets 4̄ onto a
// different axis via the picker.
export function applyGenericRotation(operationKey, axis, x, y, z) {
  const op = SYMMETRY_OPERATIONS[operationKey];
  if (!op) return [x, y, z];
  if (operationKey === '1') return [x, y, z];
  if (operationKey === '1̄') return [-x, -y, -z];
  const n = parseInt(operationKey, 10);
  const [rx, ry, rz] = rotateAroundAxis(axis, n, x, y, z);
  return op.type === 'improper' ? [-rx, -ry, -rz] : [rx, ry, rz];
}

// Returns the operation to actually use for a given axis choice: the table
// entry unchanged when `axis` matches its own default (or the operation has
// no fixed axis, like identity/inversion), otherwise a copy with `transform`
// re-derived generically for the chosen axis.
export function getEffectiveOperation(operationKey, axis) {
  const op = SYMMETRY_OPERATIONS[operationKey];
  if (!op || !axis || axis === op.axis || op.axis === null) return op;
  return { ...op, axis, transform: (x, y, z) => applyGenericRotation(operationKey, axis, x, y, z) };
}
