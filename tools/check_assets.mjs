import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve('apps/web/public/models/studio');
const characters = ['yier','bubu','duoduo','tangtang','asong','yueyue','xiaoban','mimi','qiaoqiao','tuantuan','huahua','kaka'];
const report = [];
for (const file of readdirSync(directory).filter(file => file.endsWith('.glb'))) {
  const data = readFileSync(resolve(directory, file));
  assert.equal(data.readUInt32LE(0), 0x46546c67, file);
  assert.equal(data.readUInt32LE(4), 2, file);
  assert.equal(data.readUInt32LE(8), data.length, file);
  const json = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
  let triangles = 0;
  for (const mesh of json.meshes ?? []) for (const primitive of mesh.primitives) {
    assert.ok(primitive.attributes.NORMAL !== undefined, `${file}: missing normals`);
    const material = json.materials?.[primitive.material];
    if (material?.normalTexture || material?.pbrMetallicRoughness?.metallicRoughnessTexture) {
      assert.ok(primitive.attributes.TEXCOORD_0 !== undefined, `${file}: missing textured UV`);
    }
    const accessor = json.accessors[primitive.indices ?? primitive.attributes.POSITION];
    triangles += accessor.count / 3;
  }
  const clips = (json.animations ?? []).map(clip => clip.name);
  if (characters.includes(file.slice(0, -4))) {
    assert.equal(json.skins?.length, 1, `${file}: rig`);
    assert.deepEqual([...clips].sort(), ['Blink','Celebrate','Idle'], `${file}: clips`);
    assert.ok(json.materials.some(m => m.normalTexture && m.pbrMetallicRoughness?.metallicRoughnessTexture), `${file}: PBR detail`);
    assert.ok(data.length < 8 * 1024 * 1024, `${file}: download budget`);
  }
  for (const image of json.images ?? []) assert.ok(image.bufferView !== undefined, `${file}: external texture`);
  report.push({ file, megabytes: +(data.length / 1048576).toFixed(2), triangles: Math.round(triangles), textures: json.images?.length ?? 0, clips });
}
assert.ok(characters.every(id => report.some(asset => asset.file === `${id}.glb`)));
console.log(JSON.stringify(report, null, 2));
