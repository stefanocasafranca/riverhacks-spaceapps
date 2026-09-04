/**
 * Starship model pipeline: Sketchfab glTF -> compressed, decimated GLB.
 *
 * The source is 30MB / 343k triangles with ZERO textures — every byte is
 * geometry. Two attributes were blocking decimation:
 *
 *   - TEXCOORD_0 on every vertex, referenced by no material (Sketchfab emits
 *     UVs regardless). Distinct UVs split vertices.
 *   - NORMAL, authored per-face, which splits every vertex at every triangle.
 *
 * Dropping both lets weld() merge on position alone (808k -> 189k vertices),
 * which is what finally unblocks the simplifier. Normals are omitted from the
 * output entirely and recomputed by three.js at load: because the geometry is
 * welded and indexed, computeVertexNormals() produces SMOOTH normals, which is
 * correct for a vehicle that is mostly cylinder, nosecone, fins and legs.
 *
 * Usage: node scripts/optimize-model.mjs <src.gltf> <out.glb> <ratio>
 */
import { NodeIO } from '@gltf-transform/core';
import { dedup, prune, weld, simplify, join } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

const [, , src, out, ratio = '0.2'] = process.argv;
const io = new NodeIO();
const doc = await io.read(src);

const stats = () => {
  let v = 0, t = 0;
  for (const m of doc.getRoot().listMeshes())
    for (const p of m.listPrimitives()) {
      v += p.getAttribute('POSITION').getCount();
      const i = p.getIndices();
      t += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3;
    }
  return `${v.toLocaleString()} verts / ${Math.round(t).toLocaleString()} tris`;
};
console.log('source          ', stats());

for (const mesh of doc.getRoot().listMeshes())
  for (const prim of mesh.listPrimitives())
    for (const name of prim.listSemantics())
      if (name.startsWith('TEXCOORD') || name === 'NORMAL') prim.setAttribute(name, null);

await doc.transform(dedup(), prune({ keepAttributes: false }), weld());
console.log('welded (pos-only)', stats());

await doc.transform(
  simplify({ simplifier: MeshoptSimplifier, ratio: Number(ratio), error: 0.01 }),
  join(),
  prune(),
);
console.log('simplified      ', stats());

await io.write(out, doc);
