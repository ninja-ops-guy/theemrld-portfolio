import {Geometry, hex, TAU} from './renderer.js';

export const ASCENDED_CHAMBER_ID = 'ascended-k';
export const ASCENDED_PAINTING = Object.freeze({
  id: 'ascended-k-painting',
  center: Object.freeze([0, 2, -16.45]),
  size: 3.8,
  triggerZ: -15.65,
  halfWidth: 1.6,
  approach: Object.freeze([0, 1.7, -12.8]),
  returnPosition: Object.freeze([0, 1.7, -13.8]),
  returnYaw: Math.PI,
});

function caption(g, a, lines, x, y, z, width, height, color, yaw = 0) {
  g.plane(x, y, z, width, height, yaw, '#ffffff', {
    texture: a.label(lines, color, {width: 1024, height: 192, fontSize: 43, border: false, background: '#080b16'}),
    emission: 1,
  });
}

// This dedicated slot always uses the complete original image and fixed UVs.
// Neither its geometry nor its texture participates in the rotating archive.
export function addAscendedPainting(g, a, unlocked = false) {
  const {center: [x, y, z], size} = ASCENDED_PAINTING;
  const title = unlocked ? 'ASCENDED K' : 'STAIR / CATHEDRAL';
  const rim = unlocked ? '#65c5cf' : '#6b6986';
  g.plane(x, y, z - .025, size + .24, size + .24, 0, '#090b13');
  g.plane(x, y, z, size, size, 0, '#ffffff', {texture: ASCENDED_PAINTING.id, emission: 1});
  for (const side of [-1, 1]) {
    g.box(x + side * (size / 2 + .07), y, z + .035, .12, size + .26, .12, '#756049');
    g.box(x + side * (size / 2 + .005), y, z + .105, .018, size, .018, rim, {emission: unlocked ? 1 : .3});
  }
  for (const side of [-1, 1]) g.box(x, y + side * (size / 2 + .07), z + .035, size + .26, .12, .12, '#756049');
  caption(g, a, [title, unlocked ? 'WALK INTO THE PAINTING' : 'STORY PROGRESS REQUIRED'], x, 4.48, z + .05, 3.9, .58, rim);
  g.interactions.push({
    id: ASCENDED_PAINTING.id, type: 'ascended-painting', title,
    position: [x, 1.7, z + .55], radius: 4.4, unlocked,
  });
}

function curvedStair(g, side) {
  const cx = side * 9.1, cz = -2.8;
  const inner = 1.5, outer = 3.05, count = 20;
  const point = (angle, radius, y) => [cx + side * Math.cos(angle) * radius, y, cz + Math.sin(angle) * radius];
  // Sculptural upper stairs remain outside the flat central walking route.
  for (let i = 0; i < count; i++) {
    const t0 = -.9 + i * 4.25 / count, t1 = -.9 + (i + 1) * 4.25 / count;
    const y = .35 + i * .27;
    const p0 = point(t0, inner, y), p1 = point(t0, outer, y), p2 = point(t1, outer, y), p3 = point(t1, inner, y);
    g.face([p0, p1, p2, p3], i % 2 ? '#292c53' : '#303557');
    g.face([p0, p1, [p1[0], y - .32, p1[2]], [p0[0], y - .32, p0[2]]], '#1e213f');
    for (const radius of [inner, outer]) {
      const a = point(t0, radius, y + 1.02), b = point(t1, radius, y + 1.29);
      g.beam(a, b, .055, '#877551');
      g.beam(point(t0, radius, y), a, .037, '#554c64');
    }
  }
  // A continuous low skirt makes the decorative stair footprint legible.
  g.box(side * 9, .27, -2.8, 5.8, .54, 6.7, '#171a31');
  g.colliders.push({minX: side < 0 ? -11.9 : 6.05, maxX: side < 0 ? -6.05 : 11.9, minZ: -6.25, maxZ: .65, minY: 0, maxY: 6.8});
}

function window(g) {
  const z = -13.66;
  g.plane(0, 4.85, z, 4.7, 5.7, 0, '#69afe6', {emission: .92});
  // The pointed upper light is made of glass triangles, not a rectangular poster.
  for (let i = 0; i < 20; i++) {
    const a = Math.PI * i / 20, b = Math.PI * (i + 1) / 20;
    g.face([[0, 7.7, z], [Math.cos(a) * 2.35, 7.7 + Math.sin(a) ** .7 * 3.1, z], [Math.cos(b) * 2.35, 7.7 + Math.sin(b) ** .7 * 3.1, z]], i % 3 ? '#609bd3' : '#91c1e9', {emission: .88});
  }
  for (const x of [-2.4, -1.2, 0, 1.2, 2.4]) g.beam([x, 2, z + .04], [x, x === 0 ? 9.5 : 7.72, z + .04], x % 2.4 === 0 ? .075 : .045, '#293b64');
  for (const y of [2, 4.2, 6.3, 7.7]) g.beam([-2.4, y, z + .06], [2.4, y, z + .06], .045, '#2d456a');
  g.arch(0, 7.7, z + .06, 4.8, 3.1, '#354969');
  for (const x of [-1.8, -.6, .6, 1.8]) g.arch(x, 6.6, z + .09, 1.1, 1.05, '#476b96');
  g.ring(0, 9.05, z + .08, .63, .055, '#385784', {}, 'z', 24);
  for (let i = 0; i < 6; i++) {
    const angle = TAU * i / 6;
    g.ring(Math.cos(angle) * .91, 9.05 + Math.sin(angle) * .91, z + .085, .31, .035, '#527fa7', {}, 'z', 12);
  }
  g.box(0, 1.92, z + .04, 5.2, .2, .32, '#4b526a');
}

function ascendedK(g) {
  const x = 4.15, z = -4.2;
  // A hidden-face silhouette follows the uploaded artwork without inventing a face or mask.
  const base = [[x - .81, .06, z + .49], [x + .81, .06, z + .49], [x + .64, .06, z - .49], [x - .64, .06, z - .49]];
  const shoulders = [[x - .5, 1.63, z + .26], [x + .5, 1.63, z + .26], [x + .37, 1.63, z - .3], [x - .37, 1.63, z - .3]];
  for (let i = 0; i < 4; i++) g.face([base[i], base[(i + 1) % 4], shoulders[(i + 1) % 4], shoulders[i]], i === 0 ? '#102b24' : '#0b201e');
  g.sphere(x, 1.98, z - .03, .48, '#0c2420', {}, 6, 10);
  g.plane(x, 1.99, z + .43, .48, .56, 0, '#010606', {emission: .15});
  g.beam([x - .28, 2.26, z + .39], [x - .32, 1.67, z + .43], .07, '#172e25');
  g.beam([x + .28, 2.26, z + .39], [x + .32, 1.67, z + .43], .07, '#172e25');
  g.beam([x - .28, 2.26, z + .39], [x, 2.4, z + .28], .09, '#142a24');
  g.beam([x, 2.4, z + .28], [x + .28, 2.26, z + .39], .09, '#142a24');
  // Restrained emerald seam detail stays on the robe, away from the concealed face.
  for (const side of [-1, 1]) g.beam([x + side * .26, 1.58, z + .3], [x + side * .53, .15, z + .5], .022, '#346944', {emission: .2});
  for (let i = 0; i < 6; i++) {
    const y = .37 + i * .18, dx = .17 + (i % 2) * .08;
    g.face([[x - dx, y, z + .505], [x, y + .1, z + .51], [x + dx, y, z + .505]], '#315537', {emission: .15});
  }
  g.beam([x - .43, 1.52, z], [x - .84, 1.92, z + .06], .17, '#0b211c');
  g.beam([x - .84, 1.92, z + .06], [x - .88, 2.4, z + .07], .13, '#0a1b16');
  g.sphere(x - .88, 2.47, z + .08, .145, '#10271e', {}, 5, 7);
  g.colliders.push({minX: x - .95, maxX: x + .85, minZ: z - .55, maxZ: z + .6, minY: 0, maxY: 2.65});
  g.interactions.push({id: 'ascended-k', type: 'ascended-k', title: 'APPROACH ASCENDED K', position: [x, 1.7, z + 1.1], radius: 3.2});
}

export function buildAscendedChamber(a) {
  const g = new Geometry();
  g.floor(0, 0, 24, 28, '#252a4d', {kind: 1});
  g.box(-12, 6.5, 0, .4, 13, 28, '#151c35', {solid: true});
  g.box(12, 6.5, 0, .4, 13, 28, '#252040', {solid: true});
  g.box(0, 6.5, -14, 24, 13, .4, '#20233e', {solid: true});
  g.box(0, 6.5, 14, 24, 13, .4, '#12182f', {solid: true});
  g.floor(0, 0, 24, 28, '#080e23', {y: 13});
  for (const x of [-5.8, 5.8]) g.box(x, .018, 1, .04, .025, 24, '#5e6188', {emission: .35});
  for (const z of [-10, -3, 4, 11]) {
    g.arch(0, 8, z, 23, 4.6, '#3c4265');
    for (const x of [-11.1, 11.1]) g.cylinder(x, 4, z, .25, 8, '#30354f', 10);
  }
  let seed = 18271;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 155; i++) {
    const x = (random() - .5) * 23.2, y = 9.5 + random() * 3.1, z = (random() - .5) * 27;
    const r = .015 + random() * .026;
    g.box(x, y, z, r, r, r, i % 5 ? '#679bd1' : '#b7d6f3', {emission: 1});
  }
  window(g);
  curvedStair(g, -1);
  curvedStair(g, 1);
  // Upper galleries receive the curled stairs instead of leaving their last
  // treads suspended in space. The encounter route stays on the ground floor.
  for (const side of [-1, 1]) {
    g.box(side * 7.15, 5.40, -8.5, 2.1, .16, 10.1, '#20273f');
    g.beam([side * 6.1, 6.5, -3.55], [side * 6.1, 6.5, -13.45], .045, '#877551');
    for (let z = -4; z >= -13; z -= .65) g.beam([side * 6.1, 5.48, z], [side * 6.1, 6.5, z], .027, '#554c64');
  }
  // The painting's starlight continues down the left wall and across the vault.
  for (let i = 0; i < 150; i++) {
    const z = -13 + random() * 25, y = 2.7 + random() * 9.9, r = .012 + random() * .025;
    g.box(-11.75, y, z, r, r, r, i % 4 ? '#5682bb' : '#9dc4ed', {emission: .85});
  }
  // The altar details repeat only the small objects already present in the artwork.
  g.box(0, .12, -10.6, 4.8, .24, 2.4, '#38364f', {solid: true});
  g.box(0, .74, -10.9, 3.5, 1.12, 1.05, '#272b42', {solid: true});
  g.box(0, 1.35, -10.9, 3.75, .15, 1.2, '#605776');
  g.box(0, 1.88, -11, .10, .96, .10, '#4f4255');
  g.box(0, 2.08, -11, .55, .10, .10, '#4f4255');
  for (const x of [-1.28, 1.28]) {
    g.cylinder(x, 1.53, -10.85, .055, .23, '#c0a080', 6);
    g.crystal(x, 1.75, -10.85, .055, .16, '#ffc67c', {emission: 1});
  }
  ascendedK(g);
  // A clearly framed return passage faces into the room and is reachable on the flat floor.
  g.plane(0, 1.65, 13.55, 2.8, 3.3, Math.PI, '#0c1822', {emission: .5});
  for (const x of [-1.5, 1.5]) {
    g.box(x, 1.7, 13.48, .15, 3.4, .25, '#7d6b55');
    g.box(x, 1.7, 13.32, .035, 3.4, .035, '#71bbba', {emission: 1});
  }
  g.box(0, 3.42, 13.48, 3.15, .16, .25, '#7d6b55');
  caption(g, a, ['RETURN TO THE GALLERY'], 0, 3.99, 13.4, 3.8, .48, '#92cbd4', Math.PI);
  caption(g, a, ['[ E ]', 'RETURN'], 0, 1.7, 13.3, 1.7, .8, '#92cbd4', Math.PI);
  g.interactions.push({id: 'ascended-return', type: 'ascended-return', to: 'gallery', title: 'RETURN TO THE GALLERY', position: [0, 1.7, 11.85], radius: 2.8});
  return g.finish({
    id: ASCENDED_CHAMBER_ID, name: 'ASCENDED K', title: 'ASCENDED K', subtitle: 'Beyond the painting · K campaign reward',
    background: hex('#090d20'), ambient: [.57, .61, .76], fog: .008,
    bounds: [-11.5, 11.5, -13.5, 13.5], spawn: [0, 1.7, 9.5], yaw: 0, pitch: 0,
    ground: () => 0,
    lights: [
      {position: [0, 7, -11.5], color: [.24, .48, .86]},
      {position: [-7, 5, -2], color: [.14, .22, .45]},
      {position: [7, 5, -1], color: [.34, .18, .49]},
      {position: [3.5, 3.5, -1.5], color: [.12, .31, .23]},
    ],
  });
}
