"""Blender 4.2: editable cartoon sculpture masters, web GLBs and studio renders.
Run: blender -b -t 6 -P tools/build_studio.py -- yier bubu (or all).
Coordinates in authoring helpers are x, front, height; glTF exports Y-up.
"""
import bpy, math, os, sys, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'apps/web/public'
MASTER = ROOT / 'art/blender'
for p in [MASTER, PUBLIC/'models/studio', PUBLIC/'studio/portraits']:
    p.mkdir(parents=True, exist_ok=True)
PALETTES = {
 'yier': ('fff9f0','efabba','7b4335'), 'bubu': ('c28a66','f0cc7c','76513e'),
 'duoduo': ('dcebef','e6b2b8','779faa'), 'tangtang': ('e9b4c6','f7d4ba','a96279'),
 'asong': ('ab7a52','e5b870','5f775b'), 'yueyue': ('c2b5db','eabac9','726288'),
 'xiaoban': ('d8ab76','efc57a','657d88'), 'mimi': ('efdbaa','edaac1','ac738a'),
 'qiaoqiao': ('ecebf6','d6b7df','9a8aad'), 'tuantuan': ('f1dfc4','f1b6ab','d6ac84'),
 'huahua': ('e2c4cf','eeb2c0','749c83'), 'kaka': ('a5bac0','e9b392','b99259'),
}
ASSET_OBJECTS = []
def rgb(h):
    srgb=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in srgb)
def xyz(p): return (p[0],-p[1],p[2])
def material(name, hexcolor, rough=.55, metal=0, cloth=False):
    m=bpy.data.materials.new(name); m.diffuse_color=(*rgb(hexcolor),1); m.use_nodes=True
    n=m.node_tree.nodes; links=m.node_tree.links; p=n.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*rgb(hexcolor),1)
    p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metal
    p.inputs['Specular IOR Level'].default_value=.32
    if cloth:
        p.inputs['Sheen Weight'].default_value=.18
        noise=n.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=155
        bump=n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.13; bump.inputs['Distance'].default_value=.018
        links.new(noise.outputs['Fac'],bump.inputs['Height']); links.new(bump.outputs['Normal'],p.inputs['Normal'])
    return m
def smooth(o,m):
    o.data.materials.append(m)
    for p in o.data.polygons:p.use_smooth=True
    ASSET_OBJECTS.append(o); return o
def sp(v,e): return math.copysign(abs(v)**e,v)
def shape(name,pos,scale,mat,e1=1,e2=1,pear=0,seg=64,rings=40):
    # Deform a connected UV surface into a soft superellipsoid, never a box stack.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=xyz(pos))
    o=bpy.context.object; o.name=name
    for v in o.data.vertices:
        x,y,z=v.co; lat=math.asin(max(-1,min(1,z))); lon=math.atan2(y,x)
        taper=1-pear*z
        v.co=(scale[0]*sp(math.cos(lat),e1)*sp(math.cos(lon),e2)*taper,
              scale[1]*sp(math.cos(lat),e1)*sp(math.sin(lon),e2)*taper,
              scale[2]*sp(math.sin(lat),e1))
    return smooth(o,mat)
def curve(name,pts,radius,mat,closed=False):
    data=bpy.data.curves.new(name,'CURVE'); data.dimensions='3D'; data.resolution_u=18
    data.bevel_depth=radius; data.bevel_resolution=4
    spl=data.splines.new('BEZIER'); spl.bezier_points.add(len(pts)-1)
    for v,p in zip(spl.bezier_points,pts):
        v.co=xyz(p); v.handle_left_type=v.handle_right_type='AUTO'
    spl.use_cyclic_u=closed
    o=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(o); data.materials.append(mat); ASSET_OBJECTS.append(o); return o
def disc(name,pos,r,depth,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=depth,location=xyz(pos),rotation=(math.pi/2,0,0))
    o=bpy.context.object;o.name=name
    b=o.modifiers.new('Rounded edges','BEVEL');b.width=min(depth*.25,.025);b.segments=3
    return smooth(o,mat)
def ring(name,pos,r,t,mat):
    return curve(name,[(pos[0]+r*math.cos(i*math.tau/48),pos[1],pos[2]+r*math.sin(i*math.tau/48)) for i in range(48)],t,mat,True)
def star(name,pos,size,mat):
    verts=[]
    for y in (-.035,.035):
        for i in range(10):
            a=i*math.pi/5; r=size if i%2==0 else size*.48
            verts.append(xyz((pos[0]+math.sin(a)*r,pos[1]+y,pos[2]+math.cos(a)*r)))
    faces=[tuple(range(9,-1,-1)),tuple(range(10,20))]+[(i,(i+1)%10,(i+1)%10+10,i+10) for i in range(10)]
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o)
    b=o.modifiers.new('Soft enamel edge','BEVEL');b.width=.018;b.segments=3
    return smooth(o,mat)
def union_body(objects,mat):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name='Sculpted seamless body'
    rem=o.modifiers.new('Voxel sculpt union','REMESH');rem.mode='VOXEL';rem.voxel_size=.024;rem.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=rem.name)
    sm=o.modifiers.new('Relax surface','SMOOTH');sm.factor=.75;sm.iterations=5;bpy.ops.object.modifier_apply(modifier=sm.name)
    dec=o.modifiers.new('Web topology','DECIMATE');dec.ratio=.6;bpy.ops.object.modifier_apply(modifier=dec.name)
    for p in o.data.polygons:p.use_smooth=True
    return o
def cap(name,pos,width,mat,stitch,chef=False):
    x,y,z=pos
    shape(name+' crown',(x,y,z),(width,width*.80,.16),mat,.78,.92)
    shape(name+' brim',(x,y+.10,z-.08),(width*1.06,width*.9,.047),mat,.72,.8)
    shape(name+' button',(x+.045,y,z+.16),(.035,.035,.044),mat)
    if chef:
        for dx,dz in [(-.24,.2),(0,.29),(.24,.2)]:shape('Chef pleat',(x+dx,y,z+dz),(.2,.24,.21),mat)
    else:
        curve('Cap seam',[(x-width*.65,y+.02,z+.08),(x,y+.12,z+.156),(x+width*.65,y+.02,z+.08)],.008,stitch)
def bib(mat,thread,gold):
    shape('Cotton overalls',(0,0,.49),(.54,.40,.40),mat,.77,.83)
    shape('Bib panel',(0,.386,.84),(.29,.065,.30),mat,.62,.7)
    for s in (-1,1):
        curve('Shoulder strap',[(s*.24,.34,.85),(s*.29,.34,1.12),(s*.36,0,1.17),(s*.29,-.34,.8)],.055,mat)
        disc('Button',(s*.23,.46,.99),.043,.025,gold)
    curve('Pocket stitching',[(-.16,.462,.76),(-.15,.47,.58),(0,.474,.54),(.15,.47,.58),(.16,.462,.76)],.008,thread)
    curve('Bib top stitch',[(-.2,.46,1.06),(0,.47,1.075),(.2,.46,1.06)],.007,thread)
def make_character(cid):
    ASSET_OBJECTS.clear()
    fur,blush,accent=PALETTES[cid]
    skin=material(cid+' soft vinyl',fur,.56)
    ear=material('Chocolate ear','6b392b' if cid=='yier' else accent,.65)
    detail=material('Dark cocoa face','41251e',.40)
    cloth=material(cid+' woven fabric',accent,.76,cloth=True)
    thread=material('Ivory stitching','ebdfc9',.83)
    gold=material('Satin brass','d9b66b',.32,.63)
    pink=material('Rosy tongue','da7f8c',.6)
    white=material('Cream accent','fff8e9',.67)
    body=[]
    body.append(shape('Pear torso',(0,0,.68),(.53,.41,.60),skin,.9,1,pear=.15))
    for s in (-1,1):
        arm=shape('Short paw',(s*.52,.05,.72),(.18,.215,.315),skin)
        arm.rotation_euler[1]=s*.23;body.append(arm)
        body.append(shape('Rounded foot',(s*.27,.16,.14),(.26,.31,.14),skin,.9,.94))
    union_body(body,skin)
    if cid!='qiaoqiao':shape('Tiny tail',(0,-.42,.46),(.145,.14,.145),skin)
    # Broad, softly squared bear head with a flattened lower jaw.
    a,b,c=.84,.58,.70; zc=1.63; exponent=.78
    head=shape('Sculpted rounded head',(0,0,zc),(a,b,c),skin,exponent,.85,seg=96,rings=64)
    # Blush is vertex paint on the head surface, no floating cheek discs.
    cm=skin.copy();cm.name=cid+' painted face';head.data.materials.clear();head.data.materials.append(cm)
    col=head.data.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='POINT')
    base=rgb(fur); rosy=rgb(blush)
    for v in head.data.vertices:
        x,y,z=v.co; front=max(0,min(1,(-y-.25)/.18))
        d=min(((x-.49)/.15)**2+((z+.17)/.115)**2,((x+.49)/.15)**2+((z+.17)/.115)**2)
        w=math.exp(-d*1.25)*.88*front
        col.data[v.index].color=tuple(base[i]*(1-w)+rosy[i]*w for i in range(3))+(1,)
    node=cm.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='Col'
    cm.node_tree.links.new(node.outputs['Color'],cm.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    def depth(x,z):
        t=max(0,1-abs((z-zc)/c)**(2/exponent))**(exponent/.85)-abs(x/a)**(2/.85)
        return b*max(t,0)**(.85/2)
    for s in (-1,1):
        if cid not in ('qiaoqiao','tuantuan','duoduo','kaka'):
            em=ear if cid=='yier' else skin
            shape('Rounded ear',(s*.59,-.035,2.16),(.20,.15,.22),em)
            if cid!='yier':shape('Inset inner ear',(s*.59,.107,2.17),(.102,.022,.115),ear)
        x=s*.28;z=1.57
        shape('Small glossy eye',(x,depth(x,z)+.018,z),(.051,.026,.058),detail,seg=40,rings=24)
        shape('Eye soft catchlight',(x-.013,depth(x,z)+.04,z+.018),(.009,.007,.011),white,seg=20,rings=12)
    # Curved W mouth conforming to the face, shallow embossed curves.
    pts=[(-.106,1.448),(-.088,1.392),(-.040,1.395),(0,1.438),(.04,1.395),(.088,1.392),(.106,1.448)]
    curve('Embossed smile',[(x,depth(x,z)+.014,z) for x,z in pts],.015,detail)
    if cid=='yier':shape('Little tongue',(.008,depth(0,1.365)+.025,1.369),(.03,.018,.033),pink)
    if cid=='bubu':
        # Familiar forehead curl and chocolate bow, no oversized muzzle.
        curve('Forehead curl',[(-.02,depth(-.02,2.12)+.01,2.12),(.035,depth(.035,2.09)+.015,2.09),(.053,depth(.053,2.04)+.01,2.04)],.016,ear)
    if cid in ('yier','bubu'):
        for s in (-1,1):
            bow=shape('Chocolate ribbon',(s*.095,.355,1.05),(.11,.068,.087),ear,.8,.85);bow.rotation_euler[1]=s*.3
        shape('Bow knot',(0,.40,1.05),(.044,.047,.045),ear)
    elif cid in ('xiaoban','huahua','asong','duoduo'):
        bib(cloth,thread,gold)
    if cid=='tangtang':
        cap('Chef hat',(0,0,2.29),.43,white,thread,True)
        shape('Apron',(0,.40,.66),(.38,.04,.37),white,.68,.8)
        curve('Apron neck',[(-.2,.41,.97),(0,.35,1.13),(.2,.41,.97)],.027,cloth)
        for x in (-.1,.1):disc('Apron button',(x,.452,.85),.025,.015,cloth)
    elif cid=='asong':
        cap('Detective cap',(0,0,2.31),.48,cloth,thread)
        tail=shape('Curled squirrel tail',(.36,-.44,.69),(.32,.29,.64),ear);tail.rotation_euler[1]=-.24
        ring('Magnifying glass',(.68,.3,.86),.13,.022,gold)
        curve('Magnifier handle',[(.67,.3,.73),(.65,.3,.5)],.034,ear)
    elif cid=='yueyue':
        cap('Magic brim',(0,0,2.27),.47,cloth,thread)
        # Bent cone made from a sequence of soft circular profiles.
        verts=[];faces=[]
        for j in range(17):
            t=j/16;rad=.33*(1-t)+.009
            for i in range(48):
                ang=i*math.tau/48;verts.append(xyz((rad*math.cos(ang)+.17*t*t,rad*math.sin(ang),2.3+t*.63)))
        for j in range(16):
            for i in range(48):faces.append((j*48+i,j*48+(i+1)%48,(j+1)*48+(i+1)%48,(j+1)*48+i))
        mesh=bpy.data.meshes.new('Bent wizard hat');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Bent wizard hat',mesh);bpy.context.collection.objects.link(o);smooth(o,cloth)
        star('Golden star',(0,.30,2.48),.13,gold)
        shape('Cape',(0,-.20,.81),(.59,.28,.44),cloth,.75,.9)
    elif cid=='xiaoban':
        cap('Workwear cap',(0,0,2.31),.46,cloth,thread)
        for s in (-1,1):ring('Brass goggles',(s*.18,.38,2.32),.115,.031,gold)
        curve('Goggle bridge',[(-.05,.40,2.32),(.05,.40,2.32)],.023,ear)
        curve('Tool handle',[(.63,.28,.42),(.67,.28,.85)],.039,gold)
        ring('Spanner jaw',(.67,.28,.92),.1,.025,gold)
    elif cid=='mimi':
        star('Star hairclip',(.49,.2,2.26),.19,gold)
        curve('Headphone band',[(-.77,0,1.67),(-.66,-.10,2.16),(0,-.12,2.36),(.66,-.10,2.16),(.77,0,1.67)],.04,cloth)
        for s in (-1,1):shape('Headphone cup',(s*.80,0,1.69),(.11,.20,.19),cloth)
        shape('Microphone',(.63,.30,.95),(.083,.083,.095),gold)
        curve('Mic grip',[(.63,.3,.86),(.58,.28,.52)],.034,ear)
    elif cid=='duoduo':
        for x,z in [(-.49,2.18),(-.24,2.34),(0,2.39),(.27,2.3),(.49,2.14)]:shape('Cloud crown',(x,-.02,z),(.26,.24,.24),white)
        shape('Post satchel',(.42,.44,.52),(.24,.09,.22),cloth,.6,.7)
        curve('Envelope fold',[(.23,.542,.64),(.42,.546,.52),(.61,.542,.64)],.009,thread)
    elif cid=='qiaoqiao':
        for x in (-.39,-.2,0,.2,.39):shape('Ghost scallop',(x,.01,.22),(.18,.36,.18),skin)
        star('Moon pearl',(.5,.43,2.02),.105,gold)
        curve('Sleep cap fold',[(-.3,0,2.25),(0,0,2.49),(.36,0,2.30)],.13,cloth)
        shape('Sleep pompom',(.37,0,2.25),(.11,.11,.11),white)
    elif cid=='tuantuan':
        for i in range(7):
            ang=(i-3)*.30;curve('Dumpling pleat',[(math.sin(ang)*.50,-.03,2.18),(math.sin(ang)*.25,.0,2.42),(math.sin(ang)*.06,.0,2.43)],.047,material('Dough fold'+str(i),'dfc6a3',.8))
    elif cid=='huahua':
        cap('Artist beret',(-.07,0,2.32),.48,cloth,thread)
        curve('Paintbrush shaft',[(.67,.28,.42),(.66,.28,1.05)],.026,ear)
        disc('Paint ferrule',(.66,.28,1.06),.043,.09,gold)
        shape('Brush bristles',(.66,.28,1.17),(.046,.043,.11),pink)
        for i,col in enumerate(('edbd70','c77187','92b2ac')):disc('Paint dab',(-.2+i*.2,.456,.68),.039,.015,material('Paint'+str(i),col))
    elif cid=='kaka':
        for s in (-1,1):shape('Robot ear',(s*.84,0,1.68),(.13,.20,.20),gold,.7,.8)
        curve('Antenna',[(0,0,2.27),(0,0,2.56)],.03,gold)
        shape('Antenna lamp',(0,0,2.58),(.077,.077,.077),pink)
        shape('Robot chest',(0,.37,.73),(.32,.065,.26),cloth,.6,.6)
        for x in (-.12,0,.12):disc('Chest controls',(x,.451,.78),.031,.012,gold)
        ring('Winding key',(.0,-.56,.90),.13,.03,gold)
    return [o for o in bpy.context.scene.objects if o.type in ('MESH','CURVE')]

def clean_scene():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.meshes):
        if not m.users:bpy.data.meshes.remove(m)
    for m in list(bpy.data.materials):
        if not m.users:bpy.data.materials.remove(m)
def aim(o,target):o.rotation_euler=(Vector(xyz(target))-o.location).to_track_quat('-Z','Y').to_euler()
def stage(duo=False):
    ground=material('Seamless ivory','e5e1d7',.93)
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.015));bpy.context.object.data.materials.append(ground)
    for name,pos,power,size,col in [('Softbox',( -3,4,6),500,5,'fff3e6'),('Window',(4,2,4),420,4,'e5eef6'),('Rim',(1,-3,4.5),700,3,'fff4da')]:
        bpy.ops.object.light_add(type='AREA',location=xyz(pos));o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.data.color=rgb(col);aim(o,(0,0,1.1))
    bpy.ops.object.camera_add(location=xyz((3.8 if duo else 3.3,8.7 if duo else 8.0,4.0 if duo else 3.0)))
    cam=bpy.context.object;cam.name='Studio camera';aim(cam,(0,0,1.2));cam.data.type='ORTHO';cam.data.ortho_scale=5.9 if duo else 3.35
    sc=bpy.context.scene;sc.camera=cam;sc.render.engine='CYCLES';sc.cycles.samples=48;sc.cycles.use_denoising=True
    try:
        prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
        for device in prefs.devices:device.use=device.type=='OPTIX'
        sc.cycles.device='GPU'
    except Exception:sc.cycles.device='CPU'
    sc.world.use_nodes=True;sc.world.node_tree.nodes.get('Background').inputs[0].default_value=(*rgb('e7eff6'),1);sc.world.node_tree.nodes.get('Background').inputs[1].default_value=.35
    sc.view_settings.view_transform='AgX';sc.render.resolution_x=1600 if duo else 768;sc.render.resolution_y=1200 if duo else 768;sc.render.resolution_percentage=100
    sc.render.image_settings.file_format='WEBP';sc.render.image_settings.quality=93
    sc.render.film_transparent=False
    return sc
def export_character(cid):
    clean_scene();objects=make_character(cid)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(PUBLIC/'models/studio'/f'{cid}.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_yup=True)
    sc=stage();sc.render.filepath=str(PUBLIC/'studio/portraits'/f'{cid}.webp')
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER/f'{cid}.blend'),compress=True)
    bpy.ops.render.render(write_still=True)
    print('STUDIO_ASSET_COMPLETE',cid,flush=True)
def cover():
    clean_scene()
    for cid,offset,angle in [('bubu',.88,-.15),('yier',-.9,.17)]:
        before=set(bpy.context.scene.objects);make_character(cid)
        root=bpy.data.objects.new(cid+' pose',None);bpy.context.collection.objects.link(root)
        for o in set(bpy.context.scene.objects)-before:
            if o!=root:o.parent=root
        root.location.x=offset;root.rotation_euler.z=angle
    # A crafted small dais makes contact shadows and the full silhouette legible.
    bpy.ops.mesh.primitive_cylinder_add(vertices=128,radius=2.27,depth=.13,location=(0,0,-.10));o=bpy.context.object;o.data.materials.append(material('Ceramic podium','d6d8c4',.68))
    mod=o.modifiers.new('Podium bevel','BEVEL');mod.width=.065;mod.segments=5
    sc=stage(True);sc.render.filepath=str(PUBLIC/'studio/duo-cover.webp');sc.cycles.samples=80
    bpy.ops.wm.save_as_mainfile(filepath=str(MASTER/'duo-studio.blend'),compress=True);bpy.ops.render.render(write_still=True)
    print('STUDIO_COVER_COMPLETE',flush=True)
if __name__=='__main__':
    requested=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else ['all']
    ids=list(PALETTES) if 'all' in requested else [i for i in requested if i in PALETTES]
    for cid in ids:export_character(cid)
    if 'all' in requested or 'cover' in requested:cover()
