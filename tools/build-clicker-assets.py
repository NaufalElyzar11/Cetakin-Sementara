"""Export lightweight 2D contours from the local CAD designs (Python 3.12).

Development helper only; the website runs without Python or CAD dependencies.
Does not run the CAD builders or modify their outputs.
"""
from pathlib import Path
import importlib.util
import json
import sys
import shutil

sys.dont_write_bytecode = True
SITE = Path(__file__).resolve().parents[1]
CAD = SITE.parent / 'Model 3D/Free/Ai'
sys.path.insert(0, str(CAD / '.cad_tools'))
sys.path.insert(0, str(CAD / 'models/keycaps'))


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


engine = module('base_mesh_engine', CAD / 'models/bases/clicker_bases/mesh_engine.py')
sys.modules['mesh_engine'] = engine
symbols = module('symbol_contours', CAD / 'models/keycaps/clicker_keycaps_simbol_2_warna/glyphs.py')
bases = module('base_contours', CAD / 'models/bases/clicker_bases_2_7_huruf/base_geometry.py')
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import unary_union
import keycap_template as template_geometry
import reference_font_builder as font_builder
font_geometry = module('font_contours', CAD / 'models/keycaps/clicker_keycaps_alphanumeric_2_font/mesh_font_tools.py')

# Import contour-only entry points; none of their build/main functions run.
love = module('love_contours', CAD / 'models/bases/clicker_bases_love_bunga/build_love_bunga.py')
compact_love = module('compact_love_contours', CAD / 'models/bases/clicker_bases_love_bunga_flexi_compact_2_7/build_compact_love_bunga.py')


def path(shape):
    polygons = list(shape.geoms) if shape.geom_type == 'MultiPolygon' else [shape]
    result = []
    for polygon in polygons:
        for ring in [polygon.exterior, *polygon.interiors]:
            points = list(ring.coords)[:-1]
            result.append('M' + ' L'.join(f'{x:.3f},{-y:.3f}' for x, y in points) + ' Z')
    return ' '.join(result)


ids = ['love', 'star', 'flower', 'cloud', 'moon', 'lightning', 'paw', 'cat', 'bear', 'pumpkin', 'ghost', 'robot']
output = SITE / 'assets/clicker'
output.mkdir(parents=True, exist_ok=True)
template = template_geometry.load(engine)
cap_outline = unary_union([Polygon(triangle[:, :2]) for triangle in template['mesh'].triangles
                          if Polygon(triangle[:, :2]).area > 1e-10])
assert cap_outline.geom_type == 'Polygon' and cap_outline.is_valid
# Flattened adjacent STL triangles can leave numerical holes far below a micron.
assert sum(Polygon(ring).area for ring in cap_outline.interiors) < 1e-8
cap_outline = Polygon(cap_outline.exterior).simplify(1e-7, preserve_topology=True)
data = {'keycap': {'path': path(cap_outline), 'face': path(template['face']),
                   'bounds': [round(n, 3) for n in cap_outline.bounds],
                   'faceBounds': [round(n, 3) for n in template['face'].bounds],
                   'size': template['report']['body_size_mm'],
                   'source': template['report']['source_file']},
        'emojis': {}, 'bases': {}, 'glyphs': {}}
symbol_designs = symbols.designs()
assert len(ids) == len(symbol_designs) == 12
for name, design in zip(ids, symbol_designs):
    key, outline = f'symbol-{name}', design['shape']
    assert template['face'].buffer(-1).covers(outline), design['slug']
    item = {
        'label': design['label'], 'slug': design['slug'],
        'outline': path(outline), 'bounds': [round(n, 3) for n in outline.bounds],
    }
    data['emojis'][key] = item
    paths = f'<path d="{item["outline"]}" fill="#24292E"/>'
    (output / f'{key}.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 16 16" fill-rule="evenodd"><title>{item["label"]}</title>{paths}</svg>', encoding='utf-8')

def profile(outline, pitch, spine_width=22):
    # Same centerline placement and dimensions as rear_eyelet()/eyelet() in CAD.
    # Union the ear with the housing so the preview cannot leave a floating gap.
    axis_top = outline.intersection(LineString([(0, 0), (0, 100)])).bounds[3]
    eye_y = axis_top + 2.5
    ear = Point(0, eye_y).buffer(5.2, quad_segs=32)
    hole = Point(0, eye_y).buffer(2.15, quad_segs=32)
    head = outline.union(ear).difference(hole)
    assert head.geom_type == 'Polygon' and head.is_valid
    assert outline.intersection(ear).area > 0 and not head.covers(Point(0, eye_y))
    return {'path': path(outline), 'head': path(head), 'pitch': pitch,
            'spineWidth': spine_width, 'bounds': [round(n, 3) for n in outline.bounds],
            'headBounds': [round(n, 3) for n in head.bounds], 'eyelet': [0, round(-eye_y, 3)],
            'eyeletOverlap': round(outline.intersection(ear).area, 3), 'headComponents': 1}


def export_base(key, design, profiles):
    item = {'label': design['label'], 'slug': design['slug'],
            'path': profiles['solid']['path'], 'flexi': profiles['flexi']['path'],
            'compact': profiles['compact']['path'], 'profiles': profiles}
    data['bases'][key] = item
    xmin, ymin, xmax, ymax = design['outline'].bounds
    padding = 3
    view_box = f'{xmin-padding:.3f} {-ymax-padding:.3f} {xmax-xmin+2*padding:.3f} {ymax-ymin+2*padding:.3f}'
    (output / f'base-{key}.svg').write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}"><title>{design["label"]}</title><path d="{item["path"]}" fill="#83CBE7" stroke="#24292E" stroke-width=".6"/></svg>', encoding='utf-8')


for key, design in zip(['round', 'hex', 'gear', 'feet'], bases.selections()):
    # Use the actual flattened/tapered end profiles of the articulated models.
    taper = Polygon([(-25,-6.5),(-10.5,-10.5),(-3.5,-12.75),(3.5,-12.75),
                     (10.5,-10.5),(25,-6.5),(25,6.5),(10.5,10.5),(3.5,12.75),
                     (-3.5,12.75),(-10.5,10.5),(-25,6.5)])
    export_base(key, design, {
        'solid': profile(design['outline'], 24),
        'flexi': profile(design['outline'].intersection(box(-50,-12.75,50,12.75)), 33),
        'compact': profile(design['outline'].intersection(taper), 26.5),
    })

# Single Love now uses a smaller contour; repeated solid/flexi Love stays regular.
for key, single, design, compact in zip(['love', 'flower'], love.designs(), love.designs(compact_love=False), compact_love.outlines()):
    export_base(key, design, {
        'single': profile(single['outline'], 44, 8),
        'solid': profile(design['outline'], 44, 8),
        'flexi': profile(design['outline'], 44),
        'compact': profile(compact['outline'], 32.5),
    })

# Convert the actual fonts to paths, so exported PNGs use the same lettering
# even when the browser cannot load font resources inside an SVG image.
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

font_specs = [
    ('nunito', 'clicker_keycaps_soft_round_2_warna', 'Nunito-VF.ttf', 'Nunito-OFL.txt', 800),
    ('bungee', 'clicker_keycaps_soft_round_2_warna', 'Bungee-Regular.ttf', 'Bungee-OFL.txt', None),
    ('dynapuff', 'clicker_keycaps_cute_dynapuff_2_warna', 'DynaPuff-VF.ttf', 'DynaPuff-OFL.txt', 700),
]
for key, package, filename, license_name, weight in font_specs:
    folder = CAD / 'models/keycaps' / package / 'FONTS'
    font = TTFont(folder / filename)
    if weight:
        font = instantiateVariableFont(font, {'wght': weight})
    data['glyphs'][key] = {}
    for character in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789':
        shape, info = font_builder.fit_glyph(font_geometry, font, character, template['face'])
        data['glyphs'][key][character] = {'path': path(shape), 'bounds': [round(n, 3) for n in shape.bounds]}
    shutil.copy2(folder / filename, output / filename)
    shutil.copy2(folder / license_name, output / license_name)

(SITE / 'clicker-assets.js').write_text(
    '/* Contours exported from local CAD generators. See tools/build-clicker-assets.py. */\n'
    '(function(root){const data=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) +
    ';if(typeof module==="object"&&module.exports)module.exports=data;else root.CetakinClickerAssets=data;})(typeof window!=="undefined"?window:globalThis);\n', encoding='utf-8')
print(f'Exported {len(data["emojis"])} two-colour symbol contours and {len(data["bases"])} base contours; CAD files unchanged.')
