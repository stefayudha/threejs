import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { GUI, controllers } from './node_modules/dat.gui/build/dat.gui.module.js';
import { VRButton } from './node_modules/three/examples/jsm/webxr/VRButton.js';
import { DragControls } from './node_modules/three/examples/jsm/controls/DragControls.js'
import { XRControllerModelFactory } from './node_modules/three/examples/jsm/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from './node_modules/three/examples/jsm/webxr/XRHandModelFactory.js';

//CONTAIN FAILED RASYCASTER AND NOT WORKING TURN ON LGHT 

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
// const lightpoint = new THREE.PointLight( 0xffffff, 4, 5);
// lightpoint.position.set( 0, 3, 0 );
// lightpoint.castShadow = true;
// scene.add( lightpoint );
// lightpoint.shadow.mapSize.width = 512; // default
// lightpoint.shadow.mapSize.height = 512; // default
// lightpoint.shadow.camera.near = 0.5; // default
// lightpoint.shadow.camera.far = 500; // default

//all neccesaries for VR 
document.body.appendChild( VRButton.createButton( renderer ) );
renderer.xr.enabled = true;
let controller1 = renderer.xr.getController(0);
let controller2 = renderer.xr.getController(1);

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
    const geometry = new THREE.BoxGeometry( 100, 0.1, 100 );
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
    const controllerModelFactory = new XRControllerModelFactory();

    let isSelecting = false;
    let isSelectingback = false;
    let movementSpeed = 0;
    const maxSpeed = 0.1; // Adjust the maximum movement speed as needed
    const acceleration = 0.001; // Adjust the acceleration as needed
    const deceleration = 0.002; // Adjust the deceleration as needed

    controller2.addEventListener('selectstart', () => {
        isSelecting = true;
    });
    
    controller2.addEventListener('selectend', () => {
        isSelecting = false;
    });
    controller1.addEventListener('selectstart', () => {
        isSelectingback = true;
    });
    
    controller1.addEventListener('selectend', () => {
        isSelectingback = false;
    });

    // controller1.addEventListener('selectend', onSelectEnd);
    // scene.add( controller1 );

    controller2 = renderer.xr.getController( 1 );
    scene.add( controller2 );

    const handModelFactory = new XRHandModelFactory();
    let controllerGrip1, controllerGrip2;
    let hand1, hand2;
    // Hand 1
    controllerGrip1 = renderer.xr.getControllerGrip( 0 );
    controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
    scene.add( controllerGrip1 );

    hand1 = renderer.xr.getHand( 0 );
    hand1.add( handModelFactory.createHandModel( hand1 ) );

    // scene.add( hand1 );

    // Hand 2
    controllerGrip2 = renderer.xr.getControllerGrip( 1 );
    controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
    scene.add( controllerGrip2 );

    hand2 = renderer.xr.getHand( 1 );
    hand2.add( handModelFactory.createHandModel( hand2 ) );
    // scene.add( hand2 );



    //

    const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );

    const line = new THREE.Line( geometry );
    line.name = 'line';
    const line2 = new THREE.Line( geometry );
    line2.name = 'line2';

    line.scale.z = 5;
    line2.scale.z = 5;
    controller1.add( line.clone() );
    controller2.add( line2.clone() );
    dolly.add(controller1 , controller2 , controllerGrip1 , controllerGrip2 , hand1 , hand2);
    // line.material.color.set(0xff0000);


    //

renderer.setClearColor(0x0000ff); // Set the clear color to bluish

function updateCameraPosition() {
    const dollySpeed = movementSpeed;
    // Check if the select button is pressed
    if (isSelecting) {
        // Get the forward vector of the camera
        const cameraForward = new THREE.Vector3();
        camera.getWorldDirection(cameraForward);
        cameraForward.y = 0;

        // Normalize the vector to ensure consistent movement speed in all directions
        cameraForward.normalize();

        // Move the dolly forward in the direction of the camera
        dolly.position.add(cameraForward.multiplyScalar(dollySpeed));

        // Update the camera's target to look at the new position
        controls.target.copy(dolly.position);
        if (movementSpeed < maxSpeed) {
            movementSpeed += acceleration;
        }
    }
    if (isSelectingback) {
        // Get the forward vector of the camera
        const cameraForward = new THREE.Vector3();
        camera.getWorldDirection(cameraForward);
        cameraForward.y = 0;

        // Normalize the vector to ensure consistent movement speed in all directions
        cameraForward.normalize();
        // Move the dolly forward in the direction of the camera
        dolly.position.add(cameraForward.multiplyScalar(-dollySpeed));

        // Update the camera's target to look at the new position
        controls.target.copy(dolly.position);
        if (movementSpeed < maxSpeed) {
            movementSpeed += acceleration;
        }
    }
}
  // Function to check if two objects are touching
  let box1;
  function isTouching(object1, object2) {
    // Get the bounding boxes of the objects
    box1 = new THREE.Box3().setFromObject(object1);
    let box2 = new THREE.Box3().setFromObject(object2);
    let box1Helper = new THREE.Box3Helper(box1, 0xff0000);
    let box2Helper = new THREE.Box3Helper(box2, 0x00ff00);
    scene.add(box1Helper, box2Helper);
  
    // Check for intersection between the bounding boxes
    return box1.intersectsBox(box2);
  }
  
  
  
  // Event listener for the "squeezestart" event
  controller1.addEventListener('squeezestart', () => {
    
      console.log(isTouching(line, objectjantung))

  }
  );
  
  controller2.addEventListener('squeezestart', () => {
    
      console.log(isTouching(line2, objectjantung))
  });


//raycast
// Create new raycasters for line and line2
const raycaster1 = new THREE.Raycaster();
const raycaster2 = new THREE.Raycaster();

// const rayVisual1 = new THREE.ArrowHelper(new THREE.Vector3(), controller1.position, 10, 0xff0000);
// const rayVisual2 = new THREE.ArrowHelper(new THREE.Vector3(), controller2.position, 10, 0x00ff00);
// dolly.add(rayVisual1, rayVisual2);
// scene.add(rayVisual1, rayVisual2);
// controller1.add( rayVisual1.clone() );
// controller2.add( rayVisual2.clone() );

let raycasterLine1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([line.position, line.position.clone().add(raycaster1.ray.direction)]), new THREE.LineBasicMaterial({ color: 0xff0000 }));
scene.add(raycasterLine1);

// Create a visual line representing the raycast for controller2
let raycasterLine2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([line2.position, line2.position.clone().add(raycaster2.ray.direction)]), new THREE.LineBasicMaterial({ color: 0x00ff00 }));
scene.add(raycasterLine2);

renderer.setAnimationLoop(() => {
    updateCameraPosition();
    line.position.copy(controller1.position);
    line2.position.copy(controller2.position);

    //if raycaster interact with object then turn red
    if (isTouching(line, objectjantung)) {
        // Change the color of the line to red
        line.material.color.set(0xff0000);

      } 
      if (!isTouching(line, objectjantung)) {
        // Change the color of the line to white
        line.material.color.set(0xffffff);
      } 
    if (isTouching(line2, objectjantung)) {
        // Change the color of the line to red
        line2.material.color.set(0xff0000);
      } 
      if (!isTouching(line2, objectjantung)) {
        // Change the color of the line to red
        line2.material.color.set(0xffffff);
      }   

    controller1.getWorldDirection(raycaster1.ray.direction);
    controller2.getWorldDirection(raycaster2.ray.direction);
    raycaster1.ray.origin.copy(line.position);
    raycaster2.ray.origin.copy(line2.position);
    raycaster1.ray.direction.copy(line.getWorldDirection(new THREE.Vector3()));
    raycaster2.ray.direction.copy(line.getWorldDirection(new THREE.Vector3()));
    // Create a visual line representing the raycast for controller1


  


    renderer.render(scene, camera);
    controls.update();
});
