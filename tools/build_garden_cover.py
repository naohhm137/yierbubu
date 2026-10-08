"""A story-led tea-garden cover with both Blender bear mothers."""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build_studio as bear
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'art/blender/tea-garden.blend'))
for o in list(bpy.context.scene.objects):
    if o.type in ('LIGHT','CAMERA') or 'cyclorama' in o.name.lower():bpy.data.objects.remove(o,do_unlink=True)
for o in list(bpy.context.scene.objects):
    if any(word in o.name.lower() for word in ['planter','soil','flower','petal','leaf','garden island','rounded sage','garden perimeter']):
        bpy.data.objects.remove(o,do_unlink=True)
# A smaller tabletop and two expressive silhouettes keep the cover readable.
for o in list(bpy.context.scene.objects):
    if 'tea table' in o.name.lower() or 'table rolled' in o.name.lower() or 'felt mat' in o.name.lower() or 'table tapered' in o.name.lower() or 'brass foot' in o.name.lower():
        bpy.data.objects.remove(o,do_unlink=True)
wood=bpy.data.materials.get('Walnut satin grain');felt=bpy.data.materials.get('Sage woven felt')
for r,z,d,mat in [(1.03,.73,.15,wood),(.95,.82,.035,felt)]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=r,depth=d,location=(0,-.7,z));o=bpy.context.object;o.data.materials.append(mat)
    b=o.modifiers.new('Rounded cover table','BEVEL');b.width=.025;b.segments=3
    for p in o.data.polygons:p.use_smooth=True
for r,z,d in [(.15,.36,.65),(.46,.045,.09)]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=d,location=(0,-.7,z));bpy.context.object.data.materials.append(wood)
for o in list(bpy.context.scene.objects):
    if o.type=='MESH' and ('cup' in o.name.lower() or 'tea surface' in o.name.lower() or 'saucer' in o.name.lower() or 'biscuit' in o.name.lower() or 'plate' in o.name.lower()):
        o.location.x*=.45;o.location.y=o.location.y*.45-.7;o.location.z-=.19
# Foreground table, bears slightly behind, angled toward each other.
for cid,x,y,angle in [('yier',-1.05,.15,-.12),('bubu',1.05,.15,.14)]:
    before=set(bpy.context.scene.objects);bear.make_character(cid)
    pose=bpy.data.objects.new(cid+' garden pose',None);bpy.context.collection.objects.link(pose)
    for o in set(bpy.context.scene.objects)-before:
        if o!=pose:o.parent=pose
    pose.location=(x,y,0);pose.rotation_euler.z=angle
    if cid=='bubu':
        for o in pose.children:
            if o.name.startswith('Paw L'):o.rotation_euler.x=-.6
# Hand-painted-looking pastel garden framing: far shrubs, little flowers.
for x,y,scale in [(-2.5,1.4,.9),(2.7,1.8,1.2),(-3.4,3,1.4),(3.2,3.3,1.1)]:
    leaf=bpy.data.materials.get('Garden leaves')
    bear.shape('Cover garden foliage',(x,-y,.65*scale),(.7*scale,.45*scale,.8*scale),leaf)
    for i in range(3):
        a=i*math.tau/3;bear.shape('Cover small bloom',(x+.45*math.cos(a),-y+.3*math.sin(a),.7),(.13,.13,.10),bear.material('Flower blush','e4b5a1'))
sc=bpy.context.scene
for name,pos,power,size,col in [('Garden window',(-3,-4,7),850,5,'fff1dc'),('Sky fill',(4,-1,5),320,5,'e7eff5'),('Golden edge',(1,4,6),600,4,'ffecd1')]:
    bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.size=size;o.data.color=bear.rgb(col)
    o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(.65,-9,4.5));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,1.05))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=5.9
sc.camera=cam;sc.cycles.samples=96;sc.cycles.use_denoising=True
sc.world.use_nodes=True;sc.world.node_tree.nodes['Background'].inputs[0].default_value=(*bear.rgb('eee9d9'),1);sc.world.node_tree.nodes['Background'].inputs[1].default_value=.45
sc.render.resolution_x=1600;sc.render.resolution_y=1600
sc.render.image_settings.file_format='WEBP';sc.render.image_settings.quality=95
sc.render.filepath=str(ROOT/'apps/web/public/studio/duo-cover.webp')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art/blender/garden-cover.blend'),compress=True)
bpy.ops.render.render(write_still=True)
print('GARDEN_COVER_COMPLETE',flush=True)
