"""Derive efficient web assets from editable high-detail Blender masters.

The .blend originals and rendered portraits retain their authored detail.
Decimation preserves UVs, painted face colors, and the four-bone rig.
"""
import bpy, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MASTER=ROOT/'art/blender'; OUT=ROOT/'apps/web/public/models/studio'
IDS=['yier','bubu','duoduo','tangtang','asong','yueyue','xiaoban','mimi','qiaoqiao','tuantuan','huahua','kaka']

for cid in IDS+['tea-garden','stool']:
    bpy.ops.wm.open_mainfile(filepath=str(MASTER/f'{cid}.blend'))
    rig=bpy.data.objects.get('BearRig')
    objects=[o for o in bpy.context.scene.objects if (o==rig or o.parent==rig)] if rig else [o for o in bpy.context.scene.objects if o.type=='MESH']
    for o in objects:
        if o.type!='MESH':continue
        for mat in o.data.materials:
            if mat and mat.use_nodes:
                for node in mat.node_tree.nodes:
                    if node.type=='NORMAL_MAP':
                        node.inputs['Strength'].default_value=.12 if 'felt' in mat.name.lower() else .35 if 'fabric' in mat.name.lower() else .3 if 'wood' in mat.name.lower() or 'walnut' in mat.name.lower() else .28
                shader=mat.node_tree.nodes.get('Principled BSDF')
                if shader and shader.inputs['Metallic'].default_value>.1:
                    shader.inputs['Metallic'].default_value=1
        if len(o.data.polygons)<450:continue
        bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
        dec=o.modifiers.new('Web silhouette reduction','DECIMATE')
        dec.ratio=.38 if rig else .22
        dec.use_collapse_triangulate=True
        bpy.ops.object.modifier_apply(modifier=dec.name)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    name='table-scene' if cid=='tea-garden' else cid
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'{name}.glb'),export_format='GLB',use_selection=True,export_apply=False,
        export_animations=bool(rig),export_nla_strips=True,export_yup=True)
    print('WEB_ASSET_COMPLETE',name,flush=True)
