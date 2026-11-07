import test from 'node:test';
import assert from 'node:assert/strict';
import {Geometry} from '../public/k-world/renderer.js';
import {isFree, buildGallery} from '../public/k-world/scenes.js';
import {ASCENDED_PAINTING, ASCENDED_CHAMBER_ID, addAscendedPainting, buildAscendedChamber} from '../public/k-world/ascended-scene.js';

const assets = {images: new Map(), label: () => 'label', ornament: () => 'ornament', material: () => 'material', floorTexture: () => 'floor', skyTexture: () => 'sky'};

test('The permanent painting keeps square geometry, full original UVs, and unlit white texture', () => {
  const g = new Geometry();
  addAscendedPainting(g, assets, true);
  const meshes = [...g.groups.values()];
  const art = meshes.filter(m => m.texture === ASCENDED_PAINTING.id);
  assert.equal(art.length, 1);
  assert.equal(art[0].emission, 1);
  assert.equal(art[0].transform, undefined);
  const vertices = [];
  for (let i = 0; i < art[0].data.length; i += 11) vertices.push(art[0].data.slice(i, i + 11));
  const extent = index => Math.max(...vertices.map(v => v[index])) - Math.min(...vertices.map(v => v[index]));
  assert(Math.abs(extent(0) - 3.8) < 1e-6);
  assert(Math.abs(extent(1) - 3.8) < 1e-6);
  assert.equal(extent(2), 0);
  for (const v of vertices) assert.deepEqual(v.slice(8, 11), [1, 1, 1]);
  for (const index of [6, 7]) {
    assert.equal(Math.min(...vertices.map(v => v[index])), 0);
    assert.equal(Math.max(...vertices.map(v => v[index])), 1);
  }
  assert.equal(g.colliders.length, 0);
  assert.equal(g.interactions[0].type, 'ascended-painting');
  assert.equal(g.interactions[0].unlocked, true);
});

test('The gallery threshold and return pose remain on an unobstructed route', () => {
  const gallery = buildGallery(assets, {paintingUnlocked: true});
  const {returnPosition, approach, triggerZ} = ASCENDED_PAINTING;
  for (const position of [returnPosition, approach]) assert(isFree(gallery, position[0], position[2]));
  for (let z = approach[2]; z >= triggerZ - .2; z -= .1) assert(isFree(gallery, 0, z), `Blocked before the painting at z=${z}`);
});

test('The chamber has finite static geometry and connected routes to Ascended K and the return gate', () => {
  const scene = buildAscendedChamber(assets);
  assert.equal(scene.id, ASCENDED_CHAMBER_ID);
  assert(scene.meshes.length < 50);
  assert.equal(scene.lights.length, 4);
  for (const mesh of scene.meshes) {
    assert(mesh.data.every(Number.isFinite));
    assert.equal(mesh.transform, undefined);
  }
  assert(isFree(scene, scene.spawn[0], scene.spawn[2]));
  assert(scene.interactions.some(i => i.type === 'ascended-k' && i.id === 'ascended-k'));
  assert(scene.interactions.some(i => i.type === 'ascended-return' && i.to === 'gallery'));
  const step = .25, key = (x, z) => `${x}:${z}`;
  const queue = [[scene.spawn[0], scene.spawn[2]]], seen = new Set([key(...queue[0])]);
  for (let i = 0; i < queue.length; i++) {
    const [x, z] = queue[i];
    for (const [dx, dz] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const nx = x + dx, nz = z + dz, id = key(nx, nz);
      if (seen.has(id) || !isFree(scene, nx, nz, .29)) continue;
      seen.add(id);
      queue.push([nx, nz]);
    }
  }
  for (const interaction of scene.interactions) {
    assert(isFree(scene, interaction.position[0], interaction.position[2], .29), `${interaction.id} approach is obstructed`);
    assert(queue.some(([x, z]) => Math.hypot(x - interaction.position[0], z - interaction.position[2]) < .4), `${interaction.id} has no walkable route`);
  }
});
