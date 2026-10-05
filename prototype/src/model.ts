export type Controller = 'fixed' | 'search' | 'reuse';
export const METHOD_NAMES: Record<Controller, string> = { fixed: 'Fixed path', search: 'Find a fit', reuse: 'Reuse fit' };
export type Fault = 'none' | 'open' | 'latch';
export interface Configuration {
  variant: 'six' | 'eight';
  offsetX: number;
  offsetY: number;
  yaw: number;
  friction: number;
  fault: Fault;
}

export const DEFAULT_CONFIG: Configuration = {
  variant: 'six', offsetX: 1.2, offsetY: 0.65, yaw: 1.5, friction: 0.35, fault: 'none',
};
export const MODEL_VERSION = 'connector-contact-v1';
export const DT = 0.0005;
export const START_Z = 0.042;
export const SEATED_Z = 0.0151;
export const TOP_Z = 0.022;
export const PLUG_HALF_Z = 0.004;

export function dimensions(variant: Configuration['variant']) {
  return variant === 'six'
    ? { halfX: 0.0056, halfY: 0.0036, socketX: 0.006, socketY: 0.004, pins: 6 }
    : { halfX: 0.0076, halfY: 0.0036, socketX: 0.008, socketY: 0.004, pins: 8 };
}

export function validConfig(c: Configuration): Configuration {
  const bounded = (v: number, a: number, b: number) => Math.min(b, Math.max(a, Number.isFinite(v) ? v : 0));
  return {
    variant: c.variant === 'eight' ? 'eight' : 'six',
    offsetX: bounded(c.offsetX, -2, 2), offsetY: bounded(c.offsetY, -2, 2),
    yaw: bounded(c.yaw, -5, 5), friction: bounded(c.friction, 0.1, 0.8),
    fault: c.fault === 'open' || c.fault === 'latch' ? c.fault : 'none',
  };
}

export function modelXML(config: Configuration): string {
  const c = validConfig(config);
  const d = dimensions(c.variant);
  return `<mujoco model="Defex illustrative connector">
  <compiler angle="radian"/>
  <option timestep="${DT}" gravity="0 0 0" integrator="implicitfast" cone="elliptic" iterations="60" tolerance="1e-10"/>
  <default>
    <geom friction="${c.friction} 0.005 0.0001" condim="3" solref="0.004 1" solimp="0.98 0.99 0.001" margin="0.00001"/>
    <joint damping="0.2" armature="0.002"/>
  </default>
  <worldbody>
    <body name="socket" pos="${c.offsetX / 1000} ${c.offsetY / 1000} 0" euler="0 0 ${c.yaw * Math.PI / 180}">
      <geom name="wall_left" type="box" pos="${-d.socketX - 0.002} 0 0.016" size="0.002 ${d.socketY + 0.004} 0.006"/>
      <geom name="wall_right" type="box" pos="${d.socketX + 0.002} 0 0.016" size="0.002 ${d.socketY + 0.004} 0.006"/>
      <geom name="wall_front" type="box" pos="0 ${-d.socketY - 0.002} 0.016" size="${d.socketX} 0.002 0.006"/>
      <geom name="wall_back" type="box" pos="0 ${d.socketY + 0.002} 0.016" size="${d.socketX} 0.002 0.006"/>
      <geom name="seat" type="box" pos="0 0 0.009" size="${d.socketX + 0.004} ${d.socketY + 0.004} 0.002"/>
    </body>
    <body name="plug">
      <joint name="x" type="slide" axis="1 0 0"/>
      <joint name="y" type="slide" axis="0 1 0"/>
      <joint name="z" type="slide" axis="0 0 1"/>
      <joint name="yaw" type="hinge" axis="0 0 1" damping="0.0002" armature="0.000002"/>
      <geom name="plug_body" type="box" size="${d.halfX} ${d.halfY} ${PLUG_HALF_Z}" mass="0.08"/>
      <site name="tcp" pos="0 0 0"/>
    </body>
  </worldbody>
  <equality><joint name="ideal_latch" joint1="z" polycoef="${SEATED_Z} 0 0 0 0" active="false" solref="0.004 1"/></equality>
  <actuator>
    <position name="axis_x" joint="x" kp="1800" kv="18" forcerange="-10 10"/>
    <position name="axis_y" joint="y" kp="1800" kv="18" forcerange="-10 10"/>
    <position name="axis_z" joint="z" kp="5000" kv="25" forcerange="-12 12"/>
    <position name="axis_yaw" joint="yaw" kp="1" kv="0.02" forcerange="-0.03 0.03"/>
  </actuator>
</mujoco>`;
}

export function probePoints(): [number, number][] {
  const points: [number, number][] = [[0, 0]];
  for (const r of [0.0007, 0.0014, 0.0021, 0.0028]) {
    for (let i = 0; i < 12; i++) points.push([r * Math.cos(i * Math.PI / 6), r * Math.sin(i * Math.PI / 6)]);
  }
  return points;
}
