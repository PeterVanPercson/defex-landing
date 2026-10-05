# Defex connector lab

An interactive software prototype with MuJoCo contact dynamics and a Three.js workcell. It uses illustrative geometry. No physical robot, sensor measurement, factory validation or neural policy is represented.

## Run

Tested with Node 25.4.0 and npm. Dependencies are pinned in `package-lock.json`.

```sh
cd prototype
npm ci
npm run dev
```

Open the printed localhost URL. The simulation runs in a Web Worker, in the visitor's browser. No API keys or cloud GPU are needed. The initial WASM download is about 4.5 MB before compression and about 1.3 MB with gzip; `npm run build:site` drops its debug sections, which are 5.8 MB of the 10.3 MB file npm installs. The renderer is about 175 KB gzipped.

## Build for the existing Django website

```sh
npm run build:site
```

This compiles TypeScript and bundles the app, copies the hashed assets to `../static/prototype/assets/`, and writes `../templates/landing/prototype.html`. Both generated outputs are included in the repository because the existing Vercel configuration serves static files directly. Do not hand-edit generated files.

The app is served at `/prototype/`; `?embed=1` is its compact homepage mode. Restart a running Django preview after rebuilding: its template loader can cache an older generated HTML document pointing at a replaced asset hash. Deploy HTML and assets together.

Use `/prototype/?view=schematic` for a lightweight 2D view. It runs the same physics and controls with a live X/Z diagram. The app also selects this view if WebGL cannot initialize. Camera controls and video capture require the 3D view.

## Demonstration

1. Click **Play demo**. Four actual simulation runs execute at the selected playback speed (2× by default): shifted fixed path, contact search, open-circuit rejection, and the saved correction reused. The camera stays on the socket from cycle to cycle, and the demo ends on the reused fit passing first time. Speed can be changed in **Experiment controls**, including during a run.
2. Pick a scenario, choose **Fixed path** or **Find a fit**, and click **Run attempt**. **Adjust the setup** contains connector variants, offsets and fault settings. Try **No latch** to see why continuity alone is insufficient.
3. **Inspect connector** frames the plug and socket. **See inside** makes the housings transparent. **Whole machine** restores the assembled overview, including after a part selection. **Pull it apart** separates the components; a run reassembles them first. Drag to rotate the view and pinch to zoom (Ctrl or ⌘ and the wheel with a mouse). On a phone a sideways drag turns the machine and an upward swipe scrolls the page. The mouse wheel scrolls the page, never the camera.
4. **Download data** saves configuration, samples, outcomes and the current model XML in JSON. These records stay in browser memory and are cleared on reload.
5. **Record demo** records that computed four-part sequence from the render canvas, with status overlays and a permanent simulation label. Keep the tab visible until the download finishes. Switching away pauses the sequence and recording; resume to continue from the same step. It captures no camera or microphone. Browser support for canvas capture and MediaRecorder is required.

Use **Pause / Resume** below the scene or on the demo button. Space toggles playback and R resets when focus is outside a form control; below the stage, Space pages down as usual unless you are in **Experiment controls**. Running from **Experiment controls** keeps the page where it is. Reset during a run releases the latch and retracts the tool along its normal path instead of jumping home. **Experiment controls** holds the live force plot.

The renderer interpolates between computed poses with a 70 ms buffer and never extrapolates through contact. Camera damping uses elapsed time. The camera holds during pause and stays still at rest. Circular controls animate their icons with CSS transitions. Geometry is reused while adjusting offsets; the worker sends only new samples, and the renderer stops scheduling frames once the view settles. Loss of the WebGL context switches to the live 2D schematic without discarding the physics run.

The illustrative machine has independent X/Y slides, open-backed linear bearings, a guided Z saddle and a rotating lead screw. The gripper rotates independently of the saddle. Clearance checks exercise 783 poses against the housing, motor and fixed slides; the connector has a latch relief channel, and each cable terminates at a gland. A service loop deforms using reusable GPU buffers. The plug has bored female contacts opposite the socket pins, and its wires terminate at a strain relief. These rendered details do not add flexible-body or electrical physics. The stage shows computed force, depth and playback speed, including in close views.

To package a built demo with an existing recording and evaluation output:

```sh
python3 scripts/package-demo.py /path/to/defex-connector-lab.zip --evidence /path/to/evidence --video /path/to/recording.mp4
```

The ZIP includes the runtime assets, licenses, video, evidence and a Python 3 local server. Extract it, run `python3 serve.py`, and open the printed URL. It does not need the Django site or Node. It does not publish the app.

## What the controller actually does

The fixed controller approaches the nominal socket center. The search controller uses the same insertion controller, but retracts after blocked contact and tries 12 angles on each of four XY rings. It does not read the socket's configured translation. Once seating, continuity and retention pass, it saves that XY correction. Reuse is a single new, independently checked attempt with the saved correction. It can fail if the socket moves.

This is deterministic feedback search and calibration. It is not RL, a learned neural policy, vision alignment, a competitive industrial baseline, or a demonstration of transfer to unseen connector families. Socket rotation can exceed what this XY-only search can handle.

## Model boundaries

- The contact model includes a rigid box plug, four socket walls and a seat. Cartesian slides and yaw are position-actuated. Gravity is disabled. Tooling, wires, pins and the grasp extension are visual details, not extra collision bodies.
- Timestep: 0.5 ms; samples: approximately 50 Hz; browser state updates: 30 Hz. Reported time is simulation time, not measured production cycle time.
- The displayed axial force is the absolute generalized constraint force on Z. It includes the ideal latch constraint during retention. It is not a real force-sensor reading. The records' peak force covers insertion and the connection test only, so a clean insertion and a jam read differently.
- Continuity is a depth threshold plus a manually injected open-circuit flag. No circuit is simulated.
- Retention uses an ideal equality constraint switched on at seating, unless the no-latch fault is enabled. An upward motion checks whether the connector remains seated. No deforming snap-fit or damage model is present.
- Reset releases the constraint, lifts the same connector clear of the socket, then returns XY to the home position before the next attempt. A feeder, fresh parts, wear and jam recovery are not modeled.
- Rounded rendering geometry is an illustration of simpler box colliders. The geometry and material parameters are not manufacturer CAD or measured tolerances.

## Verify and reproduce

```sh
npm test
npm run evaluate -- /absolute/path/to/evidence
npm run build
```

The evaluator exports five full demonstration traces and a fixed-seed, 32-case synthetic perturbation check across two variants, XY offsets, yaw and friction. The current model accepted 15/32 searches and 0/32 nominal fixed paths in that broad check. Those are software results on this chosen case set, not manufacturing reliability estimates. The default demo is a selected, reproducible example; the perturbation check includes its limitations.

Twenty-five tests cover display interpolation at 60/120 Hz, delayed updates, pose reset, camera damping, dock springs at 30/60/120 Hz, open contact bores, socket geometry, service-loop buffer reuse, static mesh batching, and numerical seating, blocked contact, correction reuse, a moved fixture, both fault models, both variants, search termination and finite values. Django tests check production asset availability, the WASM MIME type and stage labeling. CI runs the simulation tests and build before site regression tests.

## Files

- `src/model.ts`: model dimensions, limits, MJCF and search locations.
- `src/engine.ts`: deterministic simulation/controller and records.
- `src/simulation.worker.ts`: browser clock and physics isolation.
- `src/scene.ts`: original procedural geometry and rendering.
- `src/batching.ts`: static geometry batching with selection and animation boundaries.
- `src/finishes.ts`: procedural material microtextures.
- `src/tooling.ts`: mechanically separated carriage, bearings, saddle and gripper geometry.
- `src/mechanism.ts`: molded connector geometry and deforming service-loop buffers.
- `src/motion.ts`: buffered pose interpolation and time-based damping.
- `src/main.ts`: controls, guided experiment, telemetry and exports.
- `src/recording.ts`: local video export.
- `scripts/evaluate.ts`: repeatable software evidence.
- `scripts/integrate.mjs`: static site integration.

## Dependencies and provenance

MuJoCo 3.14.0 is Apache-2.0; Three.js 0.186.1 is MIT. License copies are included in `../static/prototype/licenses/`. Geometry is original procedural code. This app includes no customer parts, proprietary factory data, company funding details or external model assets.

The MuJoCo 3.14 WASM `eq_active` bool-array getter failed in this environment. `engine.ts` uses the supported `mj_setState` state API to toggle the same equality state; both latch tests cover that behavior. Vite reports that the package's Node-only `module` branch is externalized; the browser production worker was tested successfully.
