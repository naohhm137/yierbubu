"""Build a portable GLB table scene with a continuous cyclorama."""
import bpy, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'apps/web/public/models/studio/table-scene.glb'; OUT.parent.mkdir(parents=True,exist_ok=True)
def material(name,color,rough=.7):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True; p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough; return m
def add(o,m):
 o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 o.select_set(True); return o
def cyl(name,r,d,z,m,v=96):
 bpy.ops.mesh.primitive_cylinder_add(vertices=v,radius=r,depth=d,location=(0,0,z)); o=bpy.context.object;o.name=name;return add(o,m)
def clear():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
clear(); wood=material('Cocoa wood',(0.38,.20,.11),.46); felt=material('Sage green felt',(.43,.57,.42),.93); ceramic=material('Warm ceramic',(.82,.70,.54),.62); brass=material('Soft brass',(.76,.51,.19),.32); dome=material('Seamless ivory cyclorama',(.88,.86,.80),.98); floor=material('Studio floor',(.70,.69,.61),.96)
cyl('Studio floor',32,.08,-.05,floor,128)
bpy.ops.mesh.primitive_uv_sphere_add(segments=128,ring_count=64,radius=30,location=(0,0,0)); shell=bpy.context.object;shell.name='Continuous cyclorama dome';shell.data.materials.append(dome)
for p in shell.data.polygons:p.flip();p.use_smooth=True
# The floor occludes the lower half; retaining the full inward shell keeps the
# horizon continuous when the camera tilts down.
cyl('Round cocoa table',3,.22,.86,wood);cyl('Sage felt mat',2.78,.055,.995,felt)
bpy.ops.mesh.primitive_torus_add(major_radius=2.92,minor_radius=.065,major_segments=96,minor_segments=16,location=(0,0,.97));add(bpy.context.object,wood)
cyl('Ceramic center tray',.58,.045,1.045,ceramic)
for i in range(4):
 a=i*math.tau/4+.785;x,y=2*math.cos(a),2*math.sin(a);bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.16,depth=.70,location=(x,y,.47));add(bpy.context.object,wood);bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.30,depth=.10,location=(x,y,.10));add(bpy.context.object,wood)
cyl('Lantern base',.16,.05,1.05,brass,48);bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=.23,radius2=.15,depth=.24,location=(0,0,1.19));add(bpy.context.object,ceramic)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=.07,location=(0,0,1.20));add(bpy.context.object,brass)
bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.14,depth=.16,location=(-1.75,-.45,1.10));add(bpy.context.object,ceramic)
bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_yup=True);print('TABLE_SCENE_COMPLETE',OUT)
