import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const container = document.createElement('div');
document.body.appendChild(container);

const clock = new THREE.Clock();

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.6, 5);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x505050);

scene.add(new THREE.HemisphereLight(0xffffff, 0x404040));

const light = new THREE.DirectionalLight(0xffffff);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;

container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.update();

const stats = new Stats();
container.appendChild(stats.dom);

const raycaster = new THREE.Raycaster();
const workingMatrix = new THREE.Matrix4();
const workingVector = new THREE.Vector3();
const origin = new THREE.Vector3();

renderer.xr.enabled = true;
document.body.appendChild( VRButton.createButton(renderer) );

initScene();
setupVR();

window.addEventListener('resize', resize);

renderer.setAnimationLoop(render);

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function initScene() {
  scene.background = new THREE.Color(0xa0a0a0);
  scene.fog = new THREE.Fog(0xa0a0a0, 50, 100);

  // ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);

  const geometry = new THREE.BoxGeometry(5, 5, 5);
  const material = new THREE.MeshPhongMaterial({ color: 0xAAAA22 });
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));

  const colliders = [];

  for (let x = -100; x < 100; x += 10) {
    for (let z = -100; z < 100; z += 10) {
      if (x == 0 && z == 0) continue;
      const box = new THREE.Mesh(geometry, material);
      box.position.set(x, 2.5, z);
      const edge = line.clone();
      edge.position.copy(box.position);
      scene.add(box);
      scene.add(edge);
      colliders.push(box);
    }
  }
}
const dolly = new THREE.Object3D();
dolly.position.z = 5;
dolly.add(camera);
scene.add(dolly);


const dummyCam = new THREE.Object3D();
camera.add(dummyCam);

function setupVR() {
  renderer.xr.enabled = true;

  const button = new VRButton(renderer);

  const controller = renderer.xr.getController(0);
  controller.addEventListener('connected', function (event) {
    const mesh = buildController(event.data);
    mesh.scale.z = 0;
    this.add(mesh);
  });
  controller.addEventListener('disconnected', function () {
    this.remove(this.children[0]);
  });
  scene.add(controller);

  const controllerModelFactory = new XRControllerModelFactory();

  const controllerGrip = renderer.xr.getControllerGrip(0);
  controllerGrip.add(controllerModelFactory.createControllerModel(controllerGrip));
  scene.add(controllerGrip);



  controller.addEventListener('selectstart', function () {
    this.userData.selectPressed = true;
  });

  controller.addEventListener('selectend', function () {
    this.userData.selectPressed = false;
  });
}

function buildController(data) {
  let geometry, material;

  switch (data.targetRayMode) {
    case 'tracked-pointer':
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));

      material = new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending });

      return new THREE.Line(geometry, material);

    case 'gaze':
      geometry = new THREE.RingBufferGeometry(0.02, 0.04, 32).translate(0, 0, -1);
      material = new THREE.MeshBasicMaterial({ opacity: 0.5, transparent: true });
      return new THREE.Mesh(geometry, material);
  }
}

function handleController(controller, dt) {
  if (controller.userData.selectPressed) {
    const wallLimit = 1.3;
    const speed = 2;
    let pos = dolly.position.clone();
    pos.y += 1;

    let dir = new THREE.Vector3();
    const quaternion = dolly.quaternion.clone();
    dolly.quaternion.copy(dummyCam.getWorldQuaternion());
    dolly.getWorldDirection(dir);
    dir.negate();
    raycaster.set(pos, dir);

    let blocked = false;
    let intersect = raycaster.intersectObjects(colliders);

    if (intersect.length > 0) {
      if (intersect[0].distance < wallLimit) blocked = true;
    }

    if (!blocked) {
      dolly.translateZ(-dt * speed);
      pos = dolly.getWorldPosition(origin);
    }

    dir.set(-1, 0, 0);
    dir.applyMatrix4(dolly.matrix);
    dir.normalize();
    raycaster.set(pos, dir);

    intersect = raycaster.intersectObjects(colliders);

    if (intersect.length > 0) {
      if (intersect[0].distance < wallLimit) dolly.translateX(wallLimit - intersect[0].distance);
    }

    dir.set(1, 0, 0);
    dir.applyMatrix4(dolly.matrix);
    dir.normalize();
    raycaster.set(pos, dir);

    intersect = raycaster.intersectObjects(colliders);

    if (intersect.length > 0) {
      if (intersect[0].distance < wallLimit) dolly.translateX(intersect[0].distance - wallLimit);
    }

    dolly.position.y = 0;
    dolly.quaternion.copy(quaternion);
  }
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
  const dt = clock.getDelta();
  stats.update();
  handleController(renderer.xr.getController(0), dt);
  renderer.render(scene, camera);
}

render();
