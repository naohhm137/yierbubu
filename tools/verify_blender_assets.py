"""Round-trip every shipped GLB and make editable masters self-contained."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'art/verification/2026-10-08';OUT.mkdir(parents=True,exist_ok=True)
report=[]
for path in sorted((ROOT/'apps/web/public/models/studio').glob('*.glb')):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.view_layer.update()
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];assert meshes,path
    points=[o.matrix_world@Vector(corner) for o in meshes for corner in o.bound_box]
    assert all(math.isfinite(v) for p in points for v in p),path
    bounds=[max(p[i] for p in points)-min(p[i] for p in points) for i in range(3)]
    assert min(bounds)>.1,(path,bounds)
    if path.stem not in ('table-scene','stool'):
        assert any(o.type=='ARMATURE' for o in bpy.context.scene.objects),path
        assert 2<bounds[2]<4,(path,bounds)
    report.append({'asset':path.name,'meshes':len(meshes),'bounds':bounds,'reimport':'pass'})
for path in sorted((ROOT/'art/blender').glob('*.blend')):
    bpy.ops.wm.open_mainfile(filepath=str(path));bpy.ops.file.pack_all()
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)
    print('PORTABLE_MASTER',path.name,flush=True)
(OUT/'blender-roundtrip.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('BLENDER_ROUNDTRIP_PASS',len(report),flush=True)
