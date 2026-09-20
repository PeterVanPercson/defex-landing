import argparse
import math
import shutil
import sys
from pathlib import Path

import bpy
from mathutils import Vector


parser = argparse.ArgumentParser()
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--frame", type=int, default=1)
parser.add_argument("--animation", action="store_true")
parser.add_argument("--scale", type=int, default=100)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
args.output.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def material(name, color, metallic=0, roughness=.35):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return mat


silver = material("Satin machined aluminium", (.47, .51, .54), .86, .26)
bright = material("Brushed stainless steel", (.67, .70, .71), .92, .22)
dark = material("Graphite anodized aluminium", (.037, .046, .051), .72, .3)
black = material("Black oxide steel", (.013, .019, .023), .58, .28)
rubber = material("Soft jaw inserts and cable jackets", (.018, .021, .023), 0, .58)
polymer = material("Ivory molded connector", (.78, .78, .71), 0, .26)
orange = material("Defex orange", (.92, .105, .018), .14, .29)
gold = material("Connector contacts", (.64, .39, .105), .85, .24)
floor = material("Warm studio", (.59, .57, .52), 0, .56)
glass = material("Smoked instrument lens", (.009, .024, .027), .25, .18)
led = material("Test indicator", (.38, .17, .015), .25, .22)
led_shader = led.node_tree.nodes.get("Principled BSDF")
led_shader.inputs["Emission Strength"].default_value = 1.5


def finish(obj, name, mat, bevel=0):
    obj.name = name
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new("Machined edge radii", "BEVEL")
        mod.width = bevel
        mod.segments = 3
    if obj.type == "MESH":
        for face in obj.data.polygons:
            face.use_smooth = True
        mod = obj.modifiers.new("Surface normals", "WEIGHTED_NORMAL")
        mod.keep_sharp = True
    return obj


def box(name, pos, size, mat, bevel=.015, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(obj, name, mat, bevel)
    obj.parent = parent
    return obj


def cylinder(name, pos, radius, depth, mat, axis="Z", bevel=.007, parent=None, vertices=64):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=pos)
    obj = bpy.context.object
    if axis == "Y":
        obj.rotation_euler.x = math.pi / 2
    elif axis == "X":
        obj.rotation_euler.y = math.pi / 2
    finish(obj, name, mat, bevel)
    obj.parent = parent
    return obj


def torus(name, pos, radius, tube, mat, axis="Z", parent=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=tube,
                                   major_segments=64, minor_segments=12, location=pos)
    obj = bpy.context.object
    if axis == "Y":
        obj.rotation_euler.x = math.pi / 2
    finish(obj, name, mat)
    obj.parent = parent
    return obj


def cable(name, points, radius, mat, parent=None):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.bevel_depth = radius
    data.bevel_resolution = 4
    data.resolution_u = 18
    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for knot, point in zip(spline.bezier_points, points):
        knot.co = point
        knot.handle_left_type = "AUTO"
        knot.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    data.materials.append(mat)
    obj.parent = parent
    return obj


def screw(pos, parent=None, radius=.034, axis="Z"):
    cylinder("Recess", pos, radius * 1.45, .01, black, axis, .003, parent)
    delta = (0, -.01, 0) if axis == "Y" else (0, 0, .011)
    head = tuple(a + b for a, b in zip(pos, delta))
    cylinder("Socket head", head, radius, .018, bright, axis, .003, parent)
    socket = tuple(a + b * 2 for a, b in zip(pos, delta))
    cylinder("Hex socket", socket, radius * .49, .004, black, axis, .001, parent, vertices=6)


def group(name):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    return obj


tool = group("Vertical tool travel")
plug = group("Connector insertion")
left = group("Left jaw")
right = group("Right jaw")
left.parent = right.parent = tool

box("Studio floor", (0, 0, -.12), (200, 200, .2), floor, 0)
box("Aluminium fixture plate", (0, 0, .13), (2.24, 1.54, .18), silver, .035)
box("Plate lower edge", (0, 0, .036), (2.15, 1.46, .045), dark, .013)
for x in (-.94, .94):
    for y in (-.59, .59):
        screw((x, y, .226), radius=.045)
for x in (-.88, -.66, .66, .88):
    for y in (-.36, -.12, .12, .36):
        cylinder("Tapped fixture hole", (x, y, .224), .018, .005, black, bevel=.002)

box("Test nest base", (-.28, .04, .3), (1.05, .88, .14), dark, .025)
box("Nest locating lip", (-.28, .04, .39), (.78, .66, .055), silver, .012)
box("Socket carrier", (-.28, .04, .51), (.68, .57, .21), black, .012)
box("Socket opening", (-.28, .04, .62), (.57, .42, .018), rubber, .005)
for x in (-.56, 0):
    box("Socket guide", (x, .04, .672), (.05, .46, .15), dark, .008)
for y in (-.19, .27):
    box("Socket rim", (-.28, y, .652), (.53, .045, .11), dark, .008)
for x in (-.68, .12):
    for y in (-.27, .35):
        screw((x, y, .377), radius=.028)
for x in (-.42, -.28, -.14):
    cylinder("Gold socket contact", (x, .04, .695), .022, .12, gold, bevel=.004)

box("Connector housing", (-.28, .04, .93), (.49, .35, .6), polymer, .022, plug)
box("Connector mating collar", (-.28, .04, .68), (.535, .39, .11), polymer, .013, plug)
box("Mold parting seam", (-.28, -.137, .76), (.45, .005, .01), silver, .002, plug)
for x in (-.485, -.075):
    box("Connector molded rib", (x, -.146, .92), (.024, .025, .37), polymer, .007, plug)
box("Connector latch arm", (-.28, -.17, .89), (.095, .045, .35), polymer, .009, plug)
box("Connector latch hook", (-.28, -.193, .74), (.12, .038, .055), polymer, .006, plug)
for x in (-.42, -.28, -.14):
    box("Terminal recess", (x, .04, 1.233), (.078, .18, .012), black, .01, plug)
    box("Terminal inset", (x, .04, 1.24), (.038, .09, .004), gold, .004, plug)

box("Gripper body", (-.28, .04, 1.57), (.94, .62, .34), dark, .048, tool)
box("Gripper machined face", (-.28, -.277, 1.565), (.74, .024, .22), silver, .025, tool)
box("Linear guide rail", (-.28, .04, 1.363), (.87, .41, .064), bright, .012, tool)
box("Rail seal", (-.28, -.174, 1.364), (.81, .018, .031), black, .004, tool)
for x in (-.61, .05):
    screw((x, -.296, 1.565), tool, radius=.025, axis="Y")
for n, z in enumerate((1.615, 1.565, 1.515)):
    cylinder("Defex mark", (-.28, -.296, z), .014, .006,
             orange if n == 1 else black, "Y", .002, tool)
for sign, jaw in ((-1, left), (1, right)):
    x = -.28 + sign * .342
    box("Guided carriage", (x, .04, 1.343), (.22, .36, .075), dark, .009, jaw)
    box("Machined gripper finger", (x, .04, 1.109), (.13, .255, .4), silver, .013, jaw)
    box("Finger relief", (x + sign * .067, .04, 1.119), (.005, .13, .225), dark, .007, jaw)
    box("Replaceable gripping pad", (x - sign * .075, .04, 1.074), (.03, .21, .18), rubber, .008, jaw)
    for z in (1.19, 1.27):
        screw((x, -.097, z), jaw, radius=.022, axis="Y")

cylinder("Gripper adapter", (-.28, .04, 1.786), .24, .09, bright, parent=tool)
cylinder("Force sensor", (-.28, .04, 1.91), .275, .17, black, parent=tool)
cylinder("Force sensor upper cap", (-.28, .04, 2.009), .29, .046, silver, parent=tool)
for a in range(0, 360, 60):
    rad = math.radians(a)
    screw((-.28 + .245 * math.cos(rad), .04 + .245 * math.sin(rad), 2.037), tool, radius=.021)
torus("Tool index ring", (-.28, .04, 2.07), .302, .018, orange, parent=tool)
cylinder("Robot wrist", (-.28, .04, 2.24), .317, .3, silver, parent=tool)
cylinder("Wrist seal", (-.28, .04, 2.417), .323, .06, black, parent=tool)
cylinder("Robot end link", (-.28, .04, 2.68), .275, .46, dark, parent=tool)
torus("Upper collar", (-.28, .04, 2.89), .267, .012, silver, parent=tool)
for z in (2.49, 2.53, 2.57):
    torus("Wrist cover detail", (-.28, .04, z), .276, .006, black, parent=tool)
cable("Tool loom", [(-.10, .21, 2.69), (.15, .22, 2.5), (.16, .22, 2.0), (.16, .19, 1.75)], .032, rubber, tool)
cylinder("Loom strain relief", (.14, .18, 1.74), .05, .11, black, parent=tool)

box("Test electronics pedestal", (.64, .24, .31), (.53, .49, .17), dark, .02)
box("Test electronics enclosure", (.64, .24, .71), (.51, .38, .63), silver, .038)
box("Instrument black bezel", (.64, .035, .72), (.45, .035, .52), dark, .032)
box("Instrument lens", (.64, .013, .74), (.375, .012, .42), glass, .027)
cylinder("Indicator bezel", (.64, .001, .79), .087, .018, bright, "Y", .004)
cylinder("Indicator lamp", (.64, -.011, .79), .066, .012, led, "Y", .005)
box("Indicator bar", (.64, -.001, .62), (.18, .007, .012), led, .005)
for x in (.49, .79):
    screw((x, .012, .933), radius=.016, axis="Y")
for x, endx in ((-.46, .55), (-.16, .7)):
    cylinder("Fixture cable gland", (x, -.418, .29), .046, .075, black, "Y")
    cable("Continuity test cable", [(x, -.44, .29), (x, -.63, .21), (.22, -.62, .22),
                                    (endx, -.41, .22), (endx, .05, .4)], .025, rubber)
    torus("Cable gland ring", (x, -.464, .29), .038, .006, bright, "Y")

travel = [(1, .51), (13, .51), (38, .16), (57, 0), (140, 0), (151, .025), (180, .62)]
for frame, z in travel:
    tool.location.z = z
    tool.keyframe_insert(data_path="location", frame=frame)
for frame, z in [(1, .51), (13, .51), (38, .16), (57, 0), (180, 0)]:
    plug.location.z = z
    plug.keyframe_insert(data_path="location", frame=frame)
for sign, jaw in ((-1, left), (1, right)):
    for frame, opening in [(1, 0), (140, 0), (149, .11), (180, .11)]:
        jaw.location.x = sign * opening
        jaw.keyframe_insert(data_path="location", frame=frame)
for frame, color, strength in [(1, (.24, .12, .013), .2),
                                (64, (1, .29, .015), 2),
                                (112, (.035, .65, .17), 2.2)]:
    for socket in ("Base Color", "Emission Color"):
        led_shader.inputs[socket].default_value = (*color, 1)
        led_shader.inputs[socket].keyframe_insert("default_value", frame=frame)
    led_shader.inputs["Emission Strength"].default_value = strength
    led_shader.inputs["Emission Strength"].keyframe_insert("default_value", frame=frame)
for curve in led.node_tree.animation_data.action.fcurves:
    for key in curve.keyframe_points:
        key.interpolation = "CONSTANT"

for obj in (tool, plug, left, right):
    for curve in obj.animation_data.action.fcurves:
        for key in curve.keyframe_points:
            key.handle_left_type = key.handle_right_type = "AUTO_CLAMPED"


def area(name, pos, target, power, size, color=(1, 1, 1), size_y=None):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = color
    data.shape = "RECTANGLE"
    data.size = size
    data.size_y = size_y or size
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = pos
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


area("Large silk key", (-3.2, -4.0, 6), (0, 0, 1), 950, 4.5, (1, .94, .85))
area("Strip reflection", (3.4, 1.7, 4.1), (0, 0, 1.5), 1150, 2.4, (.85, .93, 1), .85)
area("Soft front fill", (1.5, -4, 2.2), (0, 0, 1.1), 180, 3)
area("Overhead", (-.5, 2.5, 5.3), (0, 0, .8), 550, 3)
bpy.ops.object.camera_add(location=(3.8, -7.8, 4.1))
camera = bpy.context.object
camera.name = "Product camera"
camera.rotation_euler = (Vector((-.12, 0, 1.48)) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.type = "ORTHO"
camera.data.ortho_scale = 5.6
scene = bpy.context.scene
scene.camera = camera
scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = .04
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 3
scene.render.use_persistent_data = True
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == "METAL"
    scene.cycles.device = "GPU"
except Exception:
    scene.cycles.device = "CPU"
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (.7, .75, .8, 1)
scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = .23
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = args.scale
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 180
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.compression = 20
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.frame_set(args.frame)
bpy.ops.wm.save_as_mainfile(filepath=str(args.output / "prototype-concept.blend"))
if args.animation:
    frames = args.output / "frames"
    frames.mkdir(exist_ok=True)
    rendered = {}
    for frame in range(scene.frame_start, scene.frame_end + 1):
        scene.frame_set(frame)
        state = tuple(round(value, 6) for obj in (tool, plug, left, right) for value in obj.location)
        state += tuple(led_shader.inputs["Emission Color"].default_value)
        path = frames / f"frame-{frame:04d}.png"
        if state in rendered:
            shutil.copyfile(rendered[state], path)
        else:
            scene.render.filepath = str(path)
            bpy.ops.render.render(write_still=True)
            rendered[state] = path
        print(f"FRAME_READY {frame}/180", flush=True)
else:
    scene.render.filepath = str(args.output / f"preview-{args.frame:03d}.png")
    bpy.ops.render.render(write_still=True)
