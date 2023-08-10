import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { GUI, controllers } from './node_modules/dat.gui/build/dat.gui.module.js';
import { VRButton } from './node_modules/three/examples/jsm/webxr/VRButton.js';
import { DragControls } from './node_modules/three/examples/jsm/controls/DragControls.js'
import { XRControllerModelFactory } from './node_modules/three/examples/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from './node_modules/three/examples/jsm/webxr/XRHandModelFactory.js';

const scene = new THREE.Scene();
let camera;
let isCameraOrtho;

// perspective camera
function perscam() {
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100000 );
    isCameraOrtho = false;
}

perscam();
scene.add(camera);

camera.position.z = 5;

//renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
//basic renderer setup
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);
const light = new THREE.AmbientLight( 0x404040 , 100); // soft white light
scene.add( light );

// point light / shadow point light
const lightpoint = new THREE.PointLight( 0xffffff, 4, 5);
lightpoint.position.set( 0, 3, 0 );
lightpoint.castShadow = true;
scene.add( lightpoint );
lightpoint.shadow.mapSize.width = 512; // default
lightpoint.shadow.mapSize.height = 512; // default
lightpoint.shadow.camera.near = 0.5; // default
lightpoint.shadow.camera.far = 500; // default

//all neccesaries for VR 
document.body.appendChild( VRButton.createButton( renderer ) );
renderer.xr.enabled = true;
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);

// cam setting vr
const dolly = new THREE.Object3D(); // Create a dolly object
function VRCam() {

    dolly.position.set(0, 0, 5); // Set the desired spawn point
    scene.add(dolly);
    dolly.add(camera);
}
VRCam();

//resize feature
window.addEventListener('resize', function(){
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width/height;
    renderer.setSize(width, height);
    camera.updateProjectionMatrix();
});

// cube test:
function cubespawn() {
    const geometry = new THREE.BoxGeometry( 10, 0.1, 10 );
    const material = new THREE.MeshBasicMaterial( { color: 0xc0c0c0 } );
    const cube = new THREE.Mesh( geometry, material );
    cube.receiveShadow = true;
    cube.castShadow = true;
    cube.position.set(0, -1, 0);
    scene.add( cube );
}
cubespawn();

//load GLTF jantung 3D
const loader = new GLTFLoader();
let objectjantung = new THREE.Mesh();

loader.load('./assets/jantung.gltf', function (jantung) {
    objectjantung = jantung.scene;
    const materiale = new THREE.MeshPhongMaterial( );
    const mesh = objectjantung.children[0];
    mesh.material = materiale;
    objectjantung.castShadow = true; //default is false
    objectjantung.receiveShadow = true; //default
    objectjantung.scale.set(10 , 10 , 10);
    objectjantung.position.set(0, 0, 0);

    scene.add(objectjantung);

    // Create an animation mixer
    const mixer = new THREE.AnimationMixer(jantung.scene);

    // Get all animation clips from the gltf.animations array
    const clips = jantung.animations;

    // Play the first animation clip
    const action = mixer.clipAction(clips[0]);
    action.play();
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        mixer.update(delta);
        renderer.render(scene, camera);
    }

    animate();
}, undefined, function (error) {
    console.error(error);
});
//VR Controller
	// controllers
    const controllerModelFactory = new XRControllerModelFactory();

    function onSelectStart() {
        this.userData.isSelecting = true;
    }
    function onSelectEnd() {
        this.userData.isSelecting = false;
    }

    controller1.addEventListener("selectstart", onSelectStart);
    controller1.addEventListener("selectend", onSelectEnd);
    scene.add(controller1);

    controller2.addEventListener("selectstart", onSelectStart);
    controller2.addEventListener("selectend", onSelectEnd);
    scene.add(controller2);

    controller1.addEventListener("connected", function (event) {
        if (event.data && event.data.handedness === "left") {
            const controller = this;
            const grip = renderer.xr.getControllerGrip(0);
            grip.add(controllerModelFactory.createControllerModel(grip));
            scene.add(grip);
            function VRGrip() {
                dolly.position.set(0, 0, 5); // Set the desired spawn point
                dolly.add(grip);
            }
            VRGrip();
        }
    });

    controller2.addEventListener("connected", function (event) {
        if (event.data && event.data.handedness === "right") {
            const controller = this;
            const grip = renderer.xr.getControllerGrip(1);
            grip.add(controllerModelFactory.createControllerModel(grip));
            scene.add(grip);
            function VRGrip() {
                dolly.position.set(0, 0, 5); // Set the desired spawn point
                dolly.add(grip);
            }
            VRGrip();
        }
    });
renderer.setClearColor(0x0000ff); // Set the clear color to bluish

renderer.setAnimationLoop(() => {
    // Render
    renderer.render(scene, camera);
    controls.update();
});