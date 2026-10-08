"""Portable PBR tiles: the same image nodes render in Cycles and glTF.

No shader-only noise: exportable tangent normal and roughness tiles are
generated deterministically and saved beside the editable Blender masters.
"""
import bpy
import numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TILES = ROOT / 'art/blender/textures'
TILES.mkdir(parents=True, exist_ok=True)


def tile_image(kind, channel, values):
    name = f'{kind}-{channel}'
    existing = bpy.data.images.get(name)
    if existing:
        return existing
    size = values.shape[0]
    rgba = np.ones((size, size, 4), dtype=np.float32)
    if values.ndim == 2:
        rgba[:, :, :3] = values[:, :, None]
    else:
        rgba[:, :, :3] = values
    im = bpy.data.images.new(name, size, size, alpha=False)
    im.colorspace_settings.name = 'Non-Color'
    im.pixels.foreach_set(rgba.ravel())
    im.filepath_raw = str(TILES / (name + '.png'))
    im.file_format = 'PNG'
    im.save()
    return im


def pbr_tiles(kind):
    cached = bpy.data.images.get(f'{kind}-normal')
    if cached:
        return cached, bpy.data.images[f'{kind}-roughness']
    size = 512
    rng = np.random.default_rng({'vinyl': 23, 'cloth': 51, 'wood': 97, 'ceramic': 13, 'felt': 71}[kind])
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32) / size
    grain = rng.random((size, size), dtype=np.float32)
    if kind == 'cloth':
        height = .40*np.sin(xx*np.pi*128)*np.sin(yy*np.pi*128) + .10*grain
        rough = .78 + .16*grain
        strength = 2.2
    elif kind == 'wood':
        height = np.sin(yy*np.pi*42 + 1.8*np.sin(xx*np.pi*4))*.45 + .07*grain
        rough = .43 + .16*(height*.5+.5)
        strength = 1.8
    elif kind == 'felt':
        height = grain*.65 + .16*np.sin(xx*np.pi*210 + yy*np.pi*106)
        rough = .86 + .12*grain
        strength = .8
    elif kind == 'ceramic':
        height = .16*grain
        rough = .22 + .07*grain
        strength = .35
    else:
        height = .35*grain
        rough = .47 + .11*grain
        strength = .45
    dx = (np.roll(height, -1, 1)-np.roll(height, 1, 1))*strength
    dy = (np.roll(height, -1, 0)-np.roll(height, 1, 0))*strength
    normal = np.stack((-dx, -dy, np.ones_like(dx)), axis=-1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
    return tile_image(kind, 'normal', normal*.5+.5), tile_image(kind, 'roughness', rough)


def finish_material(mat, kind):
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    normal, rough = pbr_tiles(kind)
    nm = nodes.new('ShaderNodeTexImage'); nm.image = normal; nm.label = f'{kind} tangent detail'
    rm = nodes.new('ShaderNodeTexImage'); rm.image = rough; rm.label = f'{kind} gloss variation'
    converter = nodes.new('ShaderNodeNormalMap')
    converter.inputs['Strength'].default_value = {'vinyl': .28, 'felt': .12, 'cloth': .35, 'wood': .3, 'ceramic': .2}[kind]
    links.new(nm.outputs['Color'], converter.inputs['Color'])
    links.new(converter.outputs['Normal'], bsdf.inputs['Normal'])
    links.new(rm.outputs['Color'], bsdf.inputs['Roughness'])
    if kind in ('cloth', 'felt'):
        bsdf.inputs['Sheen Weight'].default_value = .28
        bsdf.inputs['Sheen Roughness'].default_value = .8
    elif kind == 'vinyl':
        bsdf.inputs['Coat Weight'].default_value = .12
        bsdf.inputs['Coat Roughness'].default_value = .5
    elif kind == 'ceramic':
        bsdf.inputs['Coat Weight'].default_value = .35
        bsdf.inputs['Coat Roughness'].default_value = .22
    return mat
