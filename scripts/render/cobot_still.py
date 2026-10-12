import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

parser = argparse.ArgumentParser()
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--frames", type=int, default=300)
parser.add_argument("--only", type=str, default="")
parser.add_argument("--scale", type=int, default=100)
parser.add_argument("--samples", type=int, default=64)
parser.add_argument("--start", type=int, default=0)
parser.add_argument("--t", type=float, default=.5)
parser.add_argument("--shot", type=str, default="wide")
parser.add_argument("--res", type=str, default="1920x1080")
parser.add_argument("--name", type=str, default="still")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
args.output.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def material(name, color, metallic=0.0, roughness=.35, coat=0.0, emission=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    p = mat.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Metallic"].default_value = metallic
    p.inputs["Roughness"].default_value = roughness
    if coat:
        p.inputs["Coat Weight"].default_value = coat
        p.inputs["Coat Roughness"].default_value = .18
    if emission:
        p.inputs["Emission Color"].default_value = (*emission[0], 1)
        p.inputs["Emission Strength"].default_value = emission[1]
    return mat


paint = material("Robot satin white", (.80, .79, .76), 0, .34, coat=.35)
graphite = material("Graphite anodized", (.028, .031, .035), .65, .33)
black = material("Black oxide", (.012, .014, .016), .5, .3)
rubber = material("Cable jacket", (.016, .017, .018), 0, .55)
alu = material("Bead-blasted aluminium", (.55, .56, .57), .9, .32)
plate = material("Black anodized plate", (.045, .047, .05), .8, .36)
steel = material("Brushed steel", (.70, .71, .72), .95, .2)
orange = material("Defex orange", (.90, .12, .02), .1, .3)
ivory = material("Ivory connector", (.80, .78, .70), 0, .3)
gold = material("Gold contacts", (.85, .55, .2), 1, .22)
pcb = material("Green solder mask", (.006, .05, .022), 0, .3, coat=.6)
silk = material("Silkscreen", (.75, .74, .70), 0, .5)
chip = material("Chip package", (.02, .02, .022), 0, .45)
glass = material("Instrument glass", (.006, .012, .014), .2, .08)
lamp = material("Test lamp", (.2, .2, .2), 0, .3, emission=((.2, .2, .2), .2))
lamp_bsdf = lamp.node_tree.nodes.get("Principled BSDF")
cyc = material("Studio cyclorama", (.52, .49, .44), 0, .92)


def finish(obj, mat, bevel=0.0, segments=3):
    obj.data.materials.append(mat)
    if bevel:
        m = obj.modifiers.new("bevel", "BEVEL")
        m.width = bevel
        m.segments = segments
        m.limit_method = "ANGLE"
    for f in obj.data.polygons:
        f.use_smooth = True
    m = obj.modifiers.new("wn", "WEIGHTED_NORMAL")
    m.keep_sharp = True
    return obj


def box(name, pos, size, mat, bevel=.012, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(o, mat, bevel)
    if parent:
        o.parent = parent
    return o


def cyl(name, pos, r, depth, mat, axis="Z", bevel=.008, parent=None, verts=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=pos)
    o = bpy.context.object
    o.name = name
    if axis == "Y":
        o.rotation_euler.x = math.pi / 2
    elif axis == "X":
        o.rotation_euler.y = math.pi / 2
    finish(o, mat, bevel)
    if parent:
        o.parent = parent
    return o


def ring(name, pos, r, tube, mat, axis="Z", parent=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=tube, major_segments=96, minor_segments=12, location=pos)
    o = bpy.context.object
    o.name = name
    if axis == "Y":
        o.rotation_euler.x = math.pi / 2
    elif axis == "X":
        o.rotation_euler.y = math.pi / 2
    finish(o, mat)
    if parent:
        o.parent = parent
    return o


def empty(name, parent=None):
    o = bpy.data.objects.new(name, None)
    scene.collection.objects.link(o)
    if parent:
        o.parent = parent
    return o


def curve(name, mat, radius, n):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.bevel_depth = radius
    data.bevel_resolution = 6
    data.resolution_u = 24
    data.use_fill_caps = True
    sp = data.splines.new("BEZIER")
    sp.bezier_points.add(n - 1)
    o = bpy.data.objects.new(name, data)
    scene.collection.objects.link(o)
    data.materials.append(mat)
    return o


def set_curve(o, pts):
    sp = o.data.splines[0]
    for k, p in zip(sp.bezier_points, pts):
        k.co = p
        k.handle_left_type = k.handle_right_type = "AUTO"


Z0 = .34

# PCB on its fixture
PX, PY = -.42, -.12
box("Fixture block", (PX, PY, Z0 + .045), (1.06, .78, .09), graphite, .018)
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl("Locating pin", (PX + sx * .46, PY + sy * .32, Z0 + .11), .018, .05, steel, bevel=.004, verts=32)
PT = Z0 + .09 + .022
box("Circuit board", (PX, PY, Z0 + .09 + .011), (.92, .64, .022), pcb, .004)
for i in range(14):
    box("Edge pad", (PX - .42 + i * .065, PY - .30, PT + .0006), (.03, .022, .001), gold, 0)
for (cx, cy, w, d) in [(-.22, .12, .16, .16), (.2, .14, .1, .1), (.26, -.12, .12, .07), (-.25, -.16, .07, .05)]:
    box("IC", (PX + cx, PY + cy, PT + .012), (w, d, .024), chip, .003)
for i in range(8):
    box("Passive", (PX + .02 + i * .03, PY + .2, PT + .006), (.014, .028, .012), silk if i % 3 else gold, .001)
box("Silk outline", (PX, PY + .005, PT + .0007), (.42, .3, .0012), silk, 0)
box("Silk outline hole", (PX, PY + .005, PT + .0012), (.40, .28, .0014), pcb, 0)
SX, SY = PX, PY + .005
box("Header socket", (SX, SY, PT + .07), (.34, .21, .14), ivory, .01)
box("Socket mouth", (SX, SY, PT + .135), (.27, .14, .02), black, .004)
for i in range(4):
    box("Socket pin", (SX - .09 + i * .06, SY, PT + .12), (.02, .02, .03), gold, .002)
SOCKET_TOP = PT + .14
box("Pass LED housing", (SX + .3, SY - .2, PT + .008), (.04, .025, .016), chip, .003)
cyl("Pass LED", (SX + .3, SY - .2, PT + .02), .009, .008, lamp, bevel=.002, verts=24)

# tester
TX, TY = -1.02, .3
box("Tester pedestal", (TX, TY, Z0 + .04), (.56, .5, .08), graphite, .015)
box("Tester body", (TX, TY, Z0 + .37), (.5, .42, .58), alu, .045)
box("Tester bezel", (TX, TY - .213, Z0 + .39), (.42, .02, .46), graphite, .03)
box("Tester glass", (TX, TY - .225, Z0 + .41), (.34, .008, .36), glass, .02)
cyl("Lamp bezel", (TX, TY - .232, Z0 + .47), .07, .016, steel, "Y", .004)
cyl("Lamp", (TX, TY - .241, Z0 + .47), .055, .01, lamp, "Y", .004)
box("Lamp bar", (TX, TY - .232, Z0 + .3), (.16, .006, .012), lamp, .003)
board_cable = curve("Board to tester", rubber, .01, 4)
set_curve(board_cable, [(PX - .46, PY + .15, PT), (PX - .7, PY + .35, Z0 + .03), (TX + .1, TY - .1, Z0 + .03), (TX + .2, TY + .05, Z0 + .2)])

# the arm
BX, BY = 1.12, .34
base = empty("J1 base yaw")
base.location = (BX, BY, Z0)
cyl("Base flange", (BX, BY, Z0 + .03), .27, .06, graphite, bevel=.01)
for a in range(0, 360, 45):
    r = math.radians(a)
    cyl("Base bolt", (BX + .23 * math.cos(r), BY + .23 * math.sin(r), Z0 + .066), .016, .012, steel, bevel=.002, verts=24)
cyl("Base column", (0, 0, .28), .2, .44, paint, parent=base, bevel=.02)
ring("Base seam", (0, 0, .1), .201, .006, graphite, parent=base)
ZS = .62
SH = empty("shoulder housing", base)
SH.location = (0, 0, ZS)
cyl("Shoulder housing", (0, 0, 0), .2, .4, paint, "Y", .03, SH)
cyl("Shoulder cap", (0, -.205, 0), .165, .02, graphite, "Y", .006, SH)
ring("Shoulder ring", (0, -.212, 0), .145, .007, orange, "Y", SH)
cyl("Shoulder back cap", (0, .205, 0), .165, .02, graphite, "Y", .006, SH)
for sgn in (-1, 1):
    cyl("Shoulder boss", (0, sgn * .216, 0), .09, .008, paint, "Y", .003, SH)

L1, L2, L3 = 1.06, .94, .2


def link(name, length, r, housing_r, housing_len, accent=False):
    g = empty(name)
    tube = cyl(name + " tube", (length / 2, 0, 0), r, length, paint, "X", .01, g)
    ring(name + " seam a", (.08, 0, 0), r + .001, .005, graphite, "X", g)
    ring(name + " seam b", (length - .08, 0, 0), r + .001, .005, graphite, "X", g)
    h = cyl(name + " joint", (length, 0, 0), housing_r, housing_len, paint, "Y", .025, g)
    cyl(name + " cap", (length, -housing_len / 2 - .006, 0), housing_r * .82, .018, graphite, "Y", .005, g)
    if accent:
        ring(name + " ring", (length, -housing_len / 2 - .012, 0), housing_r * .72, .006, orange, "Y", g)
    cyl(name + " back", (length, housing_len / 2 + .006, 0), housing_r * .82, .018, graphite, "Y", .005, g)
    for sgn in (-1, 1):
        cyl(name + " cap boss", (length, sgn * (housing_len / 2 + .016), 0), housing_r * .5, .008, paint, "Y", .003, g)
        ring(name + " cap seam", (length, sgn * (housing_len / 2 + .0155), 0), housing_r * .5, .0025, black, "Y", g)
    return g


upper = link("Upper arm", L1, .115, .17, .34)
fore = link("Forearm", L2, .095, .13, .27)
wrist = empty("Wrist")
cyl("Wrist link", (0, 0, -L3 / 2), .085, L3, paint, "Z", .012, wrist)
cyl("Wrist 2 housing", (0, 0, -.06), .1, .2, paint, "X", .02, wrist)
cyl("Wrist 2 cap", (.106, 0, -.06), .082, .014, graphite, "X", .004, wrist)
cyl("Flange", (0, 0, -L3 - .015), .075, .03, steel, "Z", .004, wrist)

tool = empty("Tool")
cyl("Adapter", (0, 0, -.02), .09, .04, steel, bevel=.004, parent=tool)
cyl("Force sensor", (0, 0, -.09), .105, .1, black, bevel=.01, parent=tool)
ring("Index ring", (0, 0, -.05), .107, .006, orange, parent=tool)
box("Gripper body", (0, 0, -.21), (.4, .24, .14), graphite, .028, tool)
box("Gripper face", (0, -.122, -.21), (.3, .008, .08), alu, .006, tool)
for i, x in enumerate((-.03, 0, .03)):
    cyl("Status dot", (x, -.127, -.21), .007, .004, orange if i == 1 else black, "Y", .001, tool)
box("Guide rail", (0, 0, -.295), (.38, .17, .03), steel, .006, tool)
fingers = []
for s in (-1, 1):
    f = empty("finger", tool)
    box("Carriage", (0, 0, -.315), (.1, .16, .03), graphite, .006, f)
    box("Finger", (0, 0, -.42), (.05, .12, .2), alu, .01, f)
    box("Pad", (-s * .03, 0, -.45), (.012, .1, .1), rubber, .004, f)
    fingers.append((s, f))

conn = empty("Connector")
box("Connector housing", (0, 0, .13), (.24, .15, .26), ivory, .012, conn)
box("Connector collar", (0, 0, .03), (.26, .17, .06), ivory, .008, conn)
box("Latch", (0, -.085, .12), (.06, .02, .16), ivory, .006, conn)
box("Latch hook", (0, -.097, .045), (.08, .018, .03), ivory, .004, conn)
for i in range(4):
    box("Wire seal", (-.075 + i * .05, .078, .2), (.03, .01, .03), black, .003, conn)
lead = curve("Connector lead", rubber, .014, 5)

TOOL_LEN = .56
OPEN = .045
CLOSED_X = .12 + .006 + .03


def ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def ease2(x):
    x = max(0.0, min(1.0, x))
    return x * x * x * (x * (6 * x - 15) + 10)


def lerp(a, b, t):
    return a + (b - a) * t


def vlerp(a, b, t):
    return Vector(a).lerp(Vector(b), t)


mated_bottom = SOCKET_TOP - .085
HOVER0 = Vector((.55, -.55, mated_bottom + .75))
ABOVE = Vector((SX, SY, mated_bottom + .32))
NEAR = Vector((SX, SY, mated_bottom + .045))
MATED = Vector((SX, SY, mated_bottom))
RETREAT = Vector((.25, -.35, mated_bottom + .7))


def arm_state(t):
    yaw = 0.0
    if t < .1:
        p = HOVER0 + Vector((0, 0, .02 * math.sin(t / .1 * math.pi)))
        y0 = .45
        yaw = y0
    elif t < .44:
        u = ease2((t - .1) / .34)
        p = HOVER0.lerp(ABOVE, u)
        p.z += math.sin(u * math.pi) * .12
        yaw = lerp(.45, 0, u)
    elif t < .56:
        u = ease2((t - .44) / .12)
        p = ABOVE.lerp(NEAR, u)
    elif t < .64:
        u = ease((t - .56) / .08)
        p = NEAR.lerp(MATED, u)
    elif t < .84:
        p = MATED.copy()
    else:
        u = ease2((t - .84) / .16)
        p = MATED.lerp(RETREAT, u)
        p.z += math.sin(u * math.pi) * .05
    if t < .76:
        opening = 0.0
    else:
        opening = ease((t - .76) / .06) * OPEN
    attached = t < .79
    return p, yaw, opening, attached


def basis(x, y):
    x = x.normalized()
    z = x.cross(y).normalized()
    y = z.cross(x).normalized()
    return Matrix((x, y, z)).transposed().to_4x4()


def pose(t):
    tip, yaw, opening, attached = arm_state(t)
    flange = tip + Vector((0, 0, TOOL_LEN))
    W = flange + Vector((0, 0, L3))
    th1 = math.atan2(W.y - BY, W.x - BX)
    base.rotation_euler = (0, 0, th1 - math.pi / 2 + math.pi / 2)
    S = Vector((BX, BY, Z0 + ZS))
    d = W - S
    r = math.hypot(d.x, d.y)
    z = d.z
    D = (r * r + z * z - L1 * L1 - L2 * L2) / (2 * L1 * L2)
    D = max(-1.0, min(1.0, D))
    beta = math.acos(D)
    alpha = math.atan2(z, r) + math.atan2(L2 * math.sin(beta), L1 + L2 * math.cos(beta))
    u = Vector((math.cos(th1), math.sin(th1), 0))
    n = Vector((-math.sin(th1), math.cos(th1), 0))
    E = S + u * (L1 * math.cos(alpha)) + Vector((0, 0, L1 * math.sin(alpha)))
    base.matrix_world = Matrix.Translation((BX, BY, Z0)) @ Matrix.Rotation(th1 - math.pi / 2, 4, "Z")
    upper.matrix_world = Matrix.Translation(S) @ basis(E - S, n)
    fore.matrix_world = Matrix.Translation(E) @ basis(W - E, n)
    wrist.matrix_world = Matrix.Translation(W) @ Matrix.Rotation(th1 - math.pi / 2, 4, "Z")
    tool.matrix_world = Matrix.Translation(flange) @ Matrix.Rotation(yaw, 4, "Z")
    for s, f in fingers:
        f.location = (s * (CLOSED_X + opening), 0, 0)
    if attached:
        conn.matrix_world = Matrix.Translation(tip) @ Matrix.Rotation(yaw, 4, "Z")
    else:
        conn.matrix_world = Matrix.Translation(MATED)
    cm = conn.matrix_world
    a = cm @ Vector((0, .085, .2))
    b = cm @ Vector((0, .42, .3))
    set_curve(lead, [a, b, Vector((SX + .15, SY + .78, Z0 + .05)), Vector((TX + .45, TY + .42, Z0 + .03)), Vector((TX + .2, TY + .12, Z0 + .3))])
    if t < .66:
        col, st = (.25, .24, .22), .3
    elif t < .74:
        col, st = (1, .36, .02), 3.2
    else:
        col, st = (.03, .85, .22), 3.4
    lamp_bsdf.inputs["Emission Color"].default_value = (*col, 1)
    lamp_bsdf.inputs["Emission Strength"].default_value = st
    lamp_bsdf.inputs["Base Color"].default_value = (*col, 1)



import random

pose(args.t)
bpy.context.view_layer.update()

K = .62
TABLE_H = .92
root = empty("Workcell root")
for o in list(scene.collection.objects):
    if o is not root and o.parent is None:
        mw = o.matrix_world.copy()
        o.parent = root
        o.matrix_world = mw
root.scale = (K, K, K)
root.location = (0, 0, TABLE_H - Z0 * K)

brand_font = None
for fp in ("/System/Library/Fonts/HelveticaNeue.ttc", "/System/Library/Fonts/Helvetica.ttc"):
    try:
        brand_font = bpy.data.fonts.load(fp)
        break
    except Exception:
        pass


def label(text, size, parent, loc, rot, mat):
    cu = bpy.data.curves.new(text, "FONT")
    cu.body = text
    cu.size = size
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    cu.extrude = .0004
    if brand_font:
        cu.font = brand_font
    o = bpy.data.objects.new(text, cu)
    scene.collection.objects.link(o)
    o.data.materials.append(mat)
    o.parent = parent
    o.location = loc
    o.rotation_euler = rot
    return o


ink = material("Logo ink", (.03, .032, .035), 0, .4)
lg = label("defex", .075, upper, (L1 * .48, .1168, 0), (-math.pi / 2, 0, math.pi), ink)
lg.rotation_mode = "ZYX"
lg.rotation_euler = (-math.pi / 2, 0, math.pi)
lg.data.extrude = 0
lg.location = (L1 * .48, .1162, 0)


def mat_nodes(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    return m, nt, nt.nodes.get("Principled BSDF")


# orange-peel on the paint so highlights break up like a real finish
nt = paint.node_tree
p = nt.nodes.get("Principled BSDF")
nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 900; nz.inputs["Detail"].default_value = 2
bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = .025; bm.inputs["Distance"].default_value = .0005
nt.links.new(nz.outputs["Fac"], bm.inputs["Height"]); nt.links.new(bm.outputs["Normal"], p.inputs["Normal"])

# epoxy-coated concrete floor with saw joints and soft wear
floor_m, nt, p = mat_nodes("Epoxy floor")
tc = nt.nodes.new("ShaderNodeTexCoord")
br = nt.nodes.new("ShaderNodeTexBrick")
br.offset = 0
br.inputs["Scale"].default_value = 1
br.inputs["Mortar Size"].default_value = .006
br.inputs["Mortar Smooth"].default_value = .3
br.inputs["Brick Width"].default_value = 6
br.inputs["Row Height"].default_value = 6
br.inputs["Color1"].default_value = (1, 1, 1, 1)
br.inputs["Color2"].default_value = (1, 1, 1, 1)
br.inputs["Mortar"].default_value = (0, 0, 0, 1)
nt.links.new(tc.outputs["Object"], br.inputs["Vector"])
n1 = nt.nodes.new("ShaderNodeTexNoise"); n1.inputs["Scale"].default_value = .08; n1.inputs["Detail"].default_value = 6; n1.inputs["Roughness"].default_value = .6
nt.links.new(tc.outputs["Object"], n1.inputs["Vector"])
n2 = nt.nodes.new("ShaderNodeTexNoise"); n2.inputs["Scale"].default_value = 3; n2.inputs["Detail"].default_value = 8
nt.links.new(tc.outputs["Object"], n2.inputs["Vector"])
cr = nt.nodes.new("ShaderNodeValToRGB")
cr.color_ramp.elements[0].position = .35; cr.color_ramp.elements[0].color = (.30, .31, .32, 1)
cr.color_ramp.elements[1].position = .65; cr.color_ramp.elements[1].color = (.40, .41, .42, 1)
nt.links.new(n1.outputs["Fac"], cr.inputs["Fac"])
mul = nt.nodes.new("ShaderNodeMix"); mul.data_type = "RGBA"; mul.blend_type = "MULTIPLY"; mul.inputs["Factor"].default_value = .55
nt.links.new(cr.outputs["Color"], mul.inputs[6]); nt.links.new(br.outputs["Color"], mul.inputs[7])
nt.links.new(mul.outputs[2], p.inputs["Base Color"])
rr = nt.nodes.new("ShaderNodeMapRange")
rr.inputs["To Min"].default_value = .1; rr.inputs["To Max"].default_value = .32
nt.links.new(n2.outputs["Fac"], rr.inputs["Value"])
nt.links.new(rr.outputs["Result"], p.inputs["Roughness"])
p.inputs["Coat Weight"].default_value = .25
p.inputs["Coat Roughness"].default_value = .12

hall_white, nt, p = mat_nodes("Wall cladding")
p.inputs["Base Color"].default_value = (.66, .67, .68, 1); p.inputs["Roughness"].default_value = .55
wv = nt.nodes.new("ShaderNodeTexWave"); wv.wave_type = "BANDS"; wv.bands_direction = "X"; wv.inputs["Scale"].default_value = 1.6
bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = .25
nt.links.new(wv.outputs["Fac"], bm.inputs["Height"]); nt.links.new(bm.outputs["Normal"], p.inputs["Normal"])
deck, nt, p = mat_nodes("Roof deck")
p.inputs["Base Color"].default_value = (.30, .31, .32, 1); p.inputs["Metallic"].default_value = .6; p.inputs["Roughness"].default_value = .45
wv = nt.nodes.new("ShaderNodeTexWave"); wv.wave_type = "BANDS"; wv.bands_direction = "X"; wv.inputs["Scale"].default_value = 3
bm = nt.nodes.new("ShaderNodeBump"); bm.inputs["Strength"].default_value = .5
nt.links.new(wv.outputs["Fac"], bm.inputs["Height"]); nt.links.new(bm.outputs["Normal"], p.inputs["Normal"])
steel_paint = material("Painted steel", (.50, .51, .52), .3, .42)
column_paint = material("Column paint", (.82, .83, .84), 0, .5)
led = material("High-bay LED", (1, 1, 1), 0, .5, emission=((.92, .96, 1.0), 38))
housing = material("Light housing", (.35, .36, .37), .8, .4)
duct = material("Spiral duct", (.62, .63, .64), 1, .3)
wrap = material("Stretch wrap", (.82, .83, .84), 0, .18, coat=.4)
cardboard = material("Cardboard", (.42, .31, .19), 0, .8)
wood = material("Pallet pine", (.5, .38, .24), 0, .8)
yellow = material("Floor paint yellow", (.85, .62, .02), 0, .4)
extr = material("Clear anodized extrusion", (.62, .63, .64), .9, .28)
slot = material("Slot shadow", (.02, .02, .02), 0, .6)
estop_y = material("E-stop yellow", (.9, .7, .02), 0, .35)
estop_r = material("E-stop red", (.7, .02, .02), 0, .25)
dark_grey = material("Controller grey", (.16, .17, .18), .2, .45)
screen = material("Pendant screen", (.01, .015, .02), 0, .05)


def shared(name, mesh_obj, positions, rotations=None):
    me = mesh_obj.data
    out = []
    for i, pos in enumerate(positions):
        o = bpy.data.objects.new(name, me)
        scene.collection.objects.link(o)
        o.location = pos
        if rotations:
            o.rotation_euler = rotations[i]
        for m in mesh_obj.modifiers:
            pass
        out.append(o)
    return out


def proto_box(name, size, mat, bevel=0):
    o = box(name, (0, 0, -100), size, mat, bevel)
    for m in list(o.modifiers):
        if m.type == "BEVEL":
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.modifier_apply(modifier=m.name)
    return o


def proto_cyl(name, r, depth, mat, axis="Z", verts=32):
    o = cyl(name, (0, 0, -100), r, depth, mat, axis, 0, verts=verts)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return o


# ---- the bench: black tooling plate on an 80 mm extrusion frame
TW, TD = 3.56 * K, 2.1 * K
box("Tooling plate", (0, 0, TABLE_H - .015), (TW, TD, .03), plate, .004)
hole = proto_cyl("Tapped hole", .0045, .002, black, verts=16)
shared("Tapped hole", hole, [(x, y, TABLE_H + .0002) for x in [-TW / 2 + .05 + i * .1 for i in range(int(TW / .1))] for y in [-TD / 2 + .05 + j * .1 for j in range(int(TD / .1))]])
E = .08
for sx in (-1, 0, 1):
    for sy in (-1, 1):
        if sx == 0 and sy == 1:
            continue
        x, y = sx * (TW / 2 - E / 2 - .02), sy * (TD / 2 - E / 2 - .02)
        box("Leg", (x, y, (TABLE_H - .03) / 2 + .03), (E, E, TABLE_H - .09), extr, .003)
        for fx, fy in ((0, -1), (-1, 0), (1, 0), (0, 1)):
            box("T-slot", (x + fx * E / 2, y + fy * E / 2, (TABLE_H - .03) / 2 + .03), (.012 if fx else .008 + (E * .0), .012 if fy else .008, TABLE_H - .12), slot, 0)
        cyl("Foot", (x, y, .03), .045, .02, black, bevel=.004)
        cyl("Foot stem", (x, y, .055), .012, .04, steel, bevel=.002)
for sy in (-1, 1):
    for z in (TABLE_H - .07, .16):
        box("Rail", (0, sy * (TD / 2 - E / 2 - .02), z), (TW - .04, E, E), extr, .003)
        box("Rail slot", (0, sy * (TD / 2 - .02) + (.0 if sy > 0 else -.0), z), (TW - .06, .002, .01), slot, 0)
for sx in (-1, 1):
    for z in (TABLE_H - .07, .16):
        box("Cross rail", (sx * (TW / 2 - E / 2 - .02), 0, z), (E, TD - .04, E), extr, .003)
box("Shelf", (0, 0, .205), (TW - .1, TD - .1, .012), plate, .002)
box("Controller", (.45, .08, .205 + .27), (.56, .42, .52), dark_grey, .01)
box("Controller face", (.45, -.135, .205 + .3), (.5, .006, .4), black, .004)
for i in range(6):
    box("Vent", (.45, -.139, .205 + .14 + i * .018), (.3, .004, .006), slot, 0)
cyl("Power lamp", (.66, -.14, .205 + .45), .01, .006, led, "Y", .001)
box("Pendant", (-.62, -TD / 2 - .02, TABLE_H - .2), (.3, .03, .21), dark_grey, .012)
box("Pendant screen", (-.62, -TD / 2 - .037, TABLE_H - .195), (.24, .004, .15), screen, .003)
cyl("Pendant stop", (-.48, -TD / 2 - .04, TABLE_H - .13), .016, .012, estop_r, "Y", .003)
box("E-stop box", (TW / 2 - .08, -TD / 2 + .07, TABLE_H + .03), (.065, .065, .06), estop_y, .006)
cyl("E-stop collar", (TW / 2 - .08, -TD / 2 + .07, TABLE_H + .063), .02, .008, black, bevel=.002)
cyl("E-stop", (TW / 2 - .08, -TD / 2 + .07, TABLE_H + .074), .02, .016, estop_r, bevel=.006)
pend_cable = curve("Pendant cable", rubber, .006, 4)
set_curve(pend_cable, [(-.62, -TD / 2 - .02, TABLE_H - .3), (-.6, -TD / 2 - .05, .45), (-.2, -TD / 2 + .2, .23), (.2, -.1, .3)])
ctrl_cable = curve("Robot cable", rubber, .013, 4)
set_curve(ctrl_cable, [(.45, .3, .5), (.6, .45, .6), (BX * K + .08, BY * K + .32, TABLE_H - .08), (BX * K, BY * K + .1, TABLE_H - .02)])

# floor markings around the cell
fl = bpy.data.meshes.new("floor")
fl.from_pydata([(-60, -60, 0), (60, -60, 0), (60, 140, 0), (-60, 140, 0)], [], [(0, 1, 2, 3)])
floor = bpy.data.objects.new("Floor", fl); scene.collection.objects.link(floor); floor.data.materials.append(floor_m)
M = 1.1
for (cx, cy, w, d) in [(0, -TD / 2 - M, TW + 2 * M, .07), (0, TD / 2 + M, TW + 2 * M, .07), (-TW / 2 - M, 0, .07, TD + 2 * M), (TW / 2 + M, 0, .07, TD + 2 * M)]:
    box("Cell line", (cx, cy, .0006), (w, d, .0012), yellow, 0)
for x in (-7.5, 7.5):
    box("Aisle line", (x, 50, .0006), (.1, 120, .0012), yellow, 0)

# ---- the hall
HX, YB, YF, ZC = 36, 112, -30, 14.6
for x in (-HX, HX):
    box("Side wall", (x, (YB + YF) / 2, ZC / 2), (.3, YB - YF, ZC), hall_white, 0)
box("Back wall", (0, YB, ZC / 2), (2 * HX, .3, ZC), hall_white, 0)
box("Front wall", (0, YF, ZC / 2), (2 * HX, .3, ZC), hall_white, 0)
for x in (-18, -6, 6, 18):
    box("Dock door", (x, YB - .2, 2.4), (4.2, .1, 4.8), steel_paint, .02)
    box("Dock seal", (x, YB - .25, 4.85), (4.6, .2, .2), black, .02)
for i in range(-5, 6):
    box("Clerestory", (i * 6.2, YB - .16, 11.4), (5.2, .05, .9), led, 0)
box("Roof", (0, (YB + YF) / 2, ZC), (2 * HX, YB - YF, .1), deck, 0)
col_x = (-30, -12.5, 12.5, 30)
col_y = list(range(-24, 112, 12))
colp = proto_box("Column", (.42, .42, 11.6), column_paint, .01)
shared("Column", colp, [(x, y, 5.8) for x in col_x for y in col_y])
basep = proto_box("Column base", (.7, .7, .9), column_paint, .02)
shared("Column base", basep, [(x, y, .45) for x in col_x for y in col_y])

ZB, ZT = 11.6, 13.9
pitch = 1.8
chord = proto_cyl("Chord", .085, 2 * HX, steel_paint, "X", 20)
shared("Chord", chord, [(0, y, z) for y in col_y for z in (ZB, ZT)])
vert = proto_cyl("Truss vertical", .04, ZT - ZB, steel_paint, "Z", 12)
xs = [-HX + i * pitch for i in range(int(2 * HX / pitch) + 1)]
shared("Truss vertical", vert, [(x, y, (ZB + ZT) / 2) for y in col_y for x in xs])
dl = math.hypot(pitch, ZT - ZB)
diag = proto_cyl("Truss diagonal", .035, dl, steel_paint, "Z", 12)
ang = math.atan2(pitch, ZT - ZB)
pos, rot = [], []
for y in col_y:
    for i, x in enumerate(xs[:-1]):
        s = 1 if (i % 2) else -1
        pos.append((x + pitch / 2, y, (ZB + ZT) / 2))
        rot.append((0, s * ang, 0))
shared("Truss diagonal", diag, pos, rot)
purl = proto_box("Purlin", (.09, YB - YF, .22), steel_paint, 0)
shared("Purlin", purl, [(x, (YB + YF) / 2, ZT + .2) for x in [-HX + 1.5 + i * 3 for i in range(int(2 * HX / 3))]])
brace = proto_box("Bottom brace", (.06, YB - YF, .06), steel_paint, 0)
shared("Bottom brace", brace, [(x, (YB + YF) / 2, ZB) for x in (-21, -3, 3, 21)])
for x in (-21, 21):
    cyl("Duct", (x, (YB + YF) / 2, 12.6), .42, YB - YF, duct, "Y", 0, verts=48)

lamp_disc = proto_cyl("LED disc", .2, .02, led, "Z", 32)
lamp_body = proto_cyl("LED housing", .24, .16, housing, "Z", 32)
lamp_rod = proto_cyl("LED rod", .01, ZB - 10.6, steel, "Z", 8)
lp = [(x, y) for x in [-33 + i * 6 for i in range(12)] for y in [-21 + j * 6 for j in range(22)]]
shared("LED disc", lamp_disc, [(x, y, 10.5) for x, y in lp])
shared("LED housing", lamp_body, [(x, y, 10.6) for x, y in lp])
shared("LED rod", lamp_rod, [(x, y, (ZB + 10.6) / 2) for x, y in lp])

# stock on pallets, far back and along the sides
random.seed(7)
pal = proto_box("Pallet", (1.2, 1.0, .14), wood, .004)
stack_protos = {}
spots = []
for gx in (-1, 1):
    for row in range(10):
        for k in range(random.randint(2, 5)):
            spots.append((gx * (17 + k * 1.45 + random.uniform(-.1, .1)), 16 + row * 9 + random.uniform(-1.5, 1.5)))
for k in range(16):
    spots.append((random.uniform(-6, 6), random.uniform(70, 104)))
for i, (x, y) in enumerate(spots):
    if random.random() < .18:
        continue
    o = bpy.data.objects.new("Pallet", pal.data); scene.collection.objects.link(o); o.location = (x, y, .07)
    o.rotation_euler.z = random.choice((0, math.pi / 2)) + random.uniform(-.03, .03)
    h = random.choice((.9, 1.1, 1.3, 1.5))
    key = (h, random.random() < .55)
    if key not in stack_protos:
        stack_protos[key] = proto_box("Stack", (1.18, .98, h), wrap if key[1] else cardboard, .04)
    s = bpy.data.objects.new("Stack", stack_protos[key].data); scene.collection.objects.link(s)
    s.location = (x, y, .14 + h / 2); s.rotation_euler.z = o.rotation_euler.z + random.uniform(-.02, .02)
    if random.random() < .35:
        s2 = bpy.data.objects.new("Stack", stack_protos[key].data); scene.collection.objects.link(s2)
        s2.location = (x, y, .14 + h * 1.5 + .02); s2.rotation_euler.z = s.rotation_euler.z


def area(name, pos, target, power, size, color=(1, 1, 1), size_y=None, camera=False):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = color
    data.shape = "RECTANGLE"
    data.size = size
    data.size_y = size_y or size
    o = bpy.data.objects.new(name, data)
    scene.collection.objects.link(o)
    o.location = pos
    o.rotation_euler = (Vector(target) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    o.visible_camera = camera
    o.visible_glossy = False
    return o


COOL = (.9, .95, 1.0)
area("Hall fill", (0, 30, 10.3), (0, 30, 0), 16000, 64, COOL, 130)
area("Cell key", (-2.6, -1.8, 5), (0, 0, 1.2), 1800, 2.4, COOL)
area("Cell top", (0, .2, 5), (0, 0, 0), 600, 3, COOL, 2)
area("Cell rim", (2.8, 3.2, 3.2), (0, 0, 1.2), 900, 3, COOL, .6)

scene.world = bpy.data.worlds.new("World")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (.8, .85, .9, 1)
bg.inputs["Strength"].default_value = .05

cam_data = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam_data.sensor_width = 36
cam_data.dof.use_dof = True
cam_data.clip_start = .05
cam_data.clip_end = 400
SHOTS = {
    "wide": ((.35, -4.9, 1.32), (.12, 0, 1.28), 40, 2.8),
    "low": ((.25, -3.5, .98), (.12, 0, 1.42), 30, 2.2),
    "close": ((.3, -2.75, 1.22), (.15, 0, 1.45), 35, 2.4),
    "close3": ((1.35, -2.45, 1.2), (.05, .05, 1.42), 35, 2.4),
    "three": ((1.9, -3.2, 1.05), (.0, .05, 1.35), 32, 2.2),
    "tall": ((1.3, -2.45, 1.2), (.14, .05, 1.42), 44, 2.4),
}
loc, tgt, lens, fst = SHOTS[args.shot]
loc, tgt = Vector(loc), Vector(tgt)
cam.location = loc
cam.rotation_euler = (tgt - loc).to_track_quat("-Z", "Y").to_euler()
cam_data.lens = lens
cam_data.dof.focus_distance = (Vector((0, 0, 1.2)) - loc).length
cam_data.dof.aperture_fstop = fst
cam_data.dof.aperture_blades = 7

scene.render.engine = "CYCLES"
scene.cycles.samples = args.samples
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = .008
scene.cycles.use_denoising = True
scene.cycles.denoiser = "OPENIMAGEDENOISE"
scene.cycles.max_bounces = 10
scene.cycles.glossy_bounces = 6
scene.cycles.diffuse_bounces = 4
scene.cycles.transmission_bounces = 2
scene.cycles.use_light_tree = True
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for dv in prefs.devices:
        dv.use = True
    scene.cycles.device = "GPU"
except Exception as e:
    print("GPU fallback", e)
rx, ry = (int(v) for v in args.res.split("x"))
scene.render.resolution_x = rx
scene.render.resolution_y = ry
scene.render.resolution_percentage = args.scale
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.color_depth = "16"
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -.35
scene.use_nodes = True
ct = scene.node_tree
rl = ct.nodes.new("CompositorNodeRLayers")
gl = ct.nodes.new("CompositorNodeGlare"); gl.glare_type = "FOG_GLOW"; gl.quality = "HIGH"; gl.threshold = 1.2; gl.size = 7; gl.mix = -.82
ld = ct.nodes.new("CompositorNodeLensdist"); ld.inputs["Dispersion"].default_value = .006; ld.use_fit = True
ell = ct.nodes.new("CompositorNodeEllipseMask"); ell.width = .95; ell.height = .9
bl = ct.nodes.new("CompositorNodeBlur"); bl.use_relative = True; bl.factor_x = bl.factor_y = .25; bl.filter_type = "GAUSS"
vig = ct.nodes.new("CompositorNodeMixRGB"); vig.blend_type = "MULTIPLY"
vr = ct.nodes.new("CompositorNodeMapRange"); vr.inputs["To Min"].default_value = .78
out = ct.nodes.new("CompositorNodeComposite")
ct.links.new(rl.outputs["Image"], gl.inputs["Image"])
ct.links.new(gl.outputs["Image"], ld.inputs["Image"])
ct.links.new(ell.outputs["Mask"], bl.inputs["Image"])
ct.links.new(bl.outputs["Image"], vr.inputs["Value"])
ct.links.new(ld.outputs["Image"], vig.inputs[1])
ct.links.new(vr.outputs["Value"], vig.inputs[2])
ct.links.new(vig.outputs["Image"], out.inputs["Image"])
scene.render.filepath = str(args.output / f"{args.name}.png")
bpy.ops.render.render(write_still=True)
print("STILL_READY", flush=True)
bpy.ops.wm.save_as_mainfile(filepath=str(args.output / f"{args.name}.blend"))
