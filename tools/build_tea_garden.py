"""Textured Blender tea garden. Browser TABLE_SURFACE is 1.0225."""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0, str(Path(__file__).resolve().parent))
from studio_materials import finish_material
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'apps/web/public/models/studio';MASTER=ROOT/'art/blender'
SURFACE=1.0225

def rgb(h):
    v=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in v)

def material(name,color,rough=.7,kind=None,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*rgb(color),1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
    return finish_material(m,kind) if kind else m

def finish(o,name,mat,bevel=0):
    o.name=name;o.data.materials.append(mat)
    if bevel:
        b=o.modifiers.new('Soft crafted edge','BEVEL');b.width=bevel;b.segments=3
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
    for p in o.data.polygons:p.use_smooth=True
    if not o.data.uv_layers:
        bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
        bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=.02);bpy.ops.object.mode_set(mode='OBJECT')
    return o

def cyl(name,r,d,pos,mat,bevel=.015,v=64):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v,radius=r,depth=d,location=pos)
    return finish(bpy.context.object,name,mat,bevel)

def ball(name,pos,scale,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=pos);o=bpy.context.object;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return finish(o,name,mat)

def ring(name,pos,r,t,mat,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=t,major_segments=64,minor_segments=12,location=pos,rotation=rotation)
    return finish(bpy.context.object,name,mat)

def revolve(name,profile,pos,mat):
    verts=[];faces=[];n=64
    for r,z in profile:
        for i in range(n):
            a=i*math.tau/n;verts.append((r*math.cos(a),r*math.sin(a),z))
    for j in range(len(profile)-1):
        for i in range(n):faces.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.location=pos;return finish(o,name,mat)

def stem(name,start,end,r,mat):
    v=Vector(end)-Vector(start);o=cyl(name,r,v.length,(Vector(start)+Vector(end))*.5,mat,0,16)
    o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return o

def mug(x,y,glaze):
    z=SURFACE;cyl('Saucer foot',.19,.025,(x,y,z+.015),glaze);ring('Saucer edge',(x,y,z+.035),.19,.014,glaze)
    revolve('Hollow tea cup',[(0,.018),(.095,.018),(.115,.04),(.125,.23),(.113,.238),(.098,.053),(0,.053)],(x,y,z+.03),glaze)
    ring('Cup handle',(x+.15,y,z+.17),.069,.02,glaze,(math.pi/2,0,0));cyl('Tea surface',.104,.004,(x,y,z+.235),tea,0)

def flower_pot(x,y,z):
    revolve('Terracotta planter',[(0,0),(.15,0),(.22,.25),(.205,.265),(.18,.08),(0,.08)],(x,y,z),clay)
    cyl('Soil',.18,.015,(x,y,z+.23),soil,0)
    for i in range(5):
        a=i*math.tau/5;tip=(x+math.cos(a)*.18,y+math.sin(a)*.18,z+.5+(i%2)*.1)
        stem('Flower stem',(x,y,z+.22),tip,.012,leaf);ball('Flower center',tip,(.035,.035,.03),brass)
        for j in range(5):
            b=j*math.tau/5;ball('Ivory petal',(tip[0]+math.cos(b)*.045,tip[1]+math.sin(b)*.045,tip[2]),(.033,.022,.014),ivory)
        o=ball('Leaf',(x+math.cos(a)*.1,y+math.sin(a)*.1,z+.38),(.09,.028,.012),leaf);o.rotation_euler.z=a

bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
wood=material('Walnut satin grain','986b48',kind='wood');felt=material('Sage woven felt','829a79',kind='felt')
ivory=material('Ivory porcelain glaze','f4e8d5',kind='ceramic');sage=material('Sage porcelain glaze','9fb5a0',kind='ceramic');pink=material('Rose porcelain glaze','dab1a1',kind='ceramic')
brass=material('Brushed honey brass','c8a362',.36,metal=.7);tea=material('Amber tea','824c20',.18)
clay=material('Terracotta','bd8060',.83);soil=material('Potting soil','554034',.98);leaf=material('Garden leaves','6c8963',.81)
paper=material('Cream paper','efe4d1',.84);pastry=material('Baked biscuit','d3a875',.73)
floor=material('Warm stone floor','d6d5bd',.92);backdrop=material('Seamless ivory cyclorama','e8e4d8',1)

# Instanced at player count by the web scene; top is .48.
cyl('Stool cushion',.43,.09,(0,0,.435),felt,.03);cyl('Stool wooden rim',.43,.065,(0,0,.37),wood)
for i in range(3):
    a=i*math.tau/3;stem('Stool leg',(.32*math.cos(a),.32*math.sin(a),.06),(.24*math.cos(a),.24*math.sin(a),.35),.045,wood)
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(OUT/'stool.glb'),export_format='GLB',use_selection=True,export_apply=True)
bpy.ops.wm.save_as_mainfile(filepath=str(MASTER/'stool.blend'),compress=True);bpy.ops.object.delete(use_global=False)

cyl('Studio floor',32,.08,(0,0,-.05),floor,0,128)
bpy.ops.mesh.primitive_uv_sphere_add(segments=96,ring_count=48,radius=30);shell=bpy.context.object;shell.name='Continuous cyclorama dome';shell.data.materials.append(backdrop)
for p in shell.data.polygons:p.flip();p.use_smooth=True
cyl('Tea table walnut edge',3,.22,(0,0,.86),wood,.045,128);cyl('Sage felt mat',2.78,.055,(0,0,.995),felt,.008,128)
ring('Table rolled lip',(0,0,.97),2.92,.052,wood)
for i in range(4):
    a=i*math.tau/4+.785;stem('Table tapered leg',(2.25*math.cos(a),2.25*math.sin(a),.12),(1.88*math.cos(a),1.88*math.sin(a),.76),.12,wood)
    cyl('Brass foot',.13,.08,(2.25*math.cos(a),2.25*math.sin(a),.07),brass)
mug(-1.33,.72,ivory);mug(1.37,.72,sage)
cyl('Biscuit plate',.30,.028,(1.3,-.72,SURFACE+.016),pink);ring('Plate rim',(1.3,-.72,SURFACE+.044),.28,.015,pink)
for i in range(3):
    x=1.18+i*.10;y=-.73+(i%2)*.075;ball('Tea biscuit',(x,y,SURFACE+.07),(.09,.055,.026),pastry)
    for j in range(3):ball('Biscuit sugar',(x+(j-1)*.024,y,SURFACE+.092),(.008,.008,.004),paper)
flower_pot(-1.35,-.78,SURFACE)
for i in range(8):
    a=i*math.tau/8;x=6.8*math.cos(a);y=6.8*math.sin(a);cyl('Garden island',.66,.13,(x,y,.015),wood,.035)
    for j in range(3):ball('Rounded sage shrub',(x+(j-1)*.27,y,.48+j*.09),(.30,.35,.46),leaf)
    flower_pot(x-.48,y-.16,.08)
ring('Garden perimeter',(0,0,.10),8.3,.11,wood)
objects=[o for o in bpy.context.scene.objects if o.type=='MESH'];bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'table-scene.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False)
for pos,power,size in [((4,-5,8),1600,6),((-5,-2,5),750,5),((2,5,6),1000,4)]:
    bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.data.energy=power;o.data.size=size
    o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(7,-9,7));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.6))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=13
sc=bpy.context.scene;sc.camera=cam;sc.render.engine='CYCLES';sc.cycles.samples=32;sc.cycles.use_denoising=True
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
    for d in prefs.devices:d.use=d.type=='OPTIX'
    sc.cycles.device='GPU'
except Exception:pass
sc.world.color=(.45,.45,.45);sc.view_settings.view_transform='AgX';sc.render.resolution_x=1200;sc.render.resolution_y=900;sc.render.resolution_percentage=100
sc.render.image_settings.file_format='WEBP';sc.render.filepath=str(ROOT/'apps/web/public/studio/table-preview.webp')
bpy.ops.wm.save_as_mainfile(filepath=str(MASTER/'tea-garden.blend'),compress=True);bpy.ops.render.render(write_still=True)
print('TABLE_SCENE_COMPLETE',OUT/'table-scene.glb')
