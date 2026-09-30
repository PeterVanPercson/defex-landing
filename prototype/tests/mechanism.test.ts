import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { contactCenters, plugHousing, ServiceLoop, socketHousing } from '../src/mechanism.ts';
import { dimensions } from '../src/model.ts';

test('each connector contact has an open bore through its rendered housing',()=>{
  for(const variant of ['six','eight'] as const){
    const d=dimensions(variant), geometry=plugHousing(d.halfX*1000,d.halfY*1000,d.pins);
    const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geometry,material);
    for(const [x,y] of contactCenters(d.pins)){
      const ray=new THREE.Raycaster(new THREE.Vector3(x,y,20),new THREE.Vector3(0,0,-1));
      assert.equal(ray.intersectObject(mesh).length,0);
    }
    assert.ok(new THREE.Raycaster(new THREE.Vector3(0,0,20),new THREE.Vector3(0,0,-1)).intersectObject(mesh).length>0);
    geometry.dispose();material.dispose();
  }
});

test('socket cavity remains open and its top agrees with the contact model',()=>{
  for(const variant of ['six','eight'] as const){
    const d=dimensions(variant), geometry=socketHousing(d.socketX*1000,d.socketY*1000);
    geometry.computeBoundingBox();
    assert.ok(Math.abs(geometry.boundingBox!.max.z+10.2-22)<1e-5);
    const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}), mesh=new THREE.Mesh(geometry,material);
    const ray=new THREE.Raycaster(new THREE.Vector3(0,0,20),new THREE.Vector3(0,0,-1));
    assert.equal(ray.intersectObject(mesh).length,0);
    geometry.dispose();material.dispose();
  }
});

test('service loop stays finite over the stroke and reuses its GPU buffers',()=>{
  const material=new THREE.MeshBasicMaterial(), loop=new ServiceLoop(material);
  const positions=loop.geometry.attributes.position.array;
  for(const z of [15.1,26.8,42])for(const x of [-2.8,2.8]){
    loop.update(x,-2,z);
    assert.equal(loop.geometry.attributes.position.array,positions);
    assert.ok(positions.every(Number.isFinite));
    assert.ok(loop.geometry.attributes.normal.array.every(Number.isFinite));
    const first=new THREE.Vector3().fromBufferAttribute(loop.geometry.attributes.position,0);
    const last=new THREE.Vector3().fromBufferAttribute(loop.geometry.attributes.position,32*9);
    assert.ok(Math.abs(first.distanceTo(loop.curve.v0)-.52)<1e-4);
    assert.ok(Math.abs(last.distanceTo(loop.curve.v3)-.52)<1e-4);
  }
  loop.geometry.dispose();material.dispose();
});

test('the socket has a relief channel for the plug latch on both variants',()=>{
  for(const variant of ['six','eight'] as const){
    const d=dimensions(variant), geometry=socketHousing(d.socketX*1000,d.socketY*1000);
    const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}), mesh=new THREE.Mesh(geometry,material);
    for(const x of [-1.15,0,1.15]) {
      const ray=new THREE.Raycaster(new THREE.Vector3(x,-d.socketY*1000-.65,30),new THREE.Vector3(0,0,-1));
      assert.equal(ray.intersectObject(mesh).length,0);
    }
    geometry.dispose();material.dispose();
  }
});
