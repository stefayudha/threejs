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
const light = new THREE.AmbientLight( 0x404040 , 10); // soft white light
scene.add( light );

// point light / shadow point light
const lightpoint = new THREE.PointLight( 0xffffff, 3, 7);
lightpoint.position.set( 0, 3, 0 );
lightpoint.castShadow = true;
scene.add( lightpoint );
// lightpoint.shadow.mapSize.width = 512; // default
// lightpoint.shadow.mapSize.height = 512; // default
// lightpoint.shadow.camera.near = 0.5; // default
// lightpoint.shadow.camera.far = 500; // default

//all neccesaries for VR 
document.body.appendChild( VRButton.createButton( renderer ) );
onRequestSession();
renderer.xr.enabled = true;
let controller1 = renderer.xr.getController(0);
let controller2 = renderer.xr.getController(1);

// cam setting vr
const dolly = new THREE.Object3D(); // Create a dolly object
function VRCam() {

    dolly.position.set(0, 0, -3); // Set the desired spawn point
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
let isSqueezing;
let scaleReady;
let grabReady;
let rotateReady;
//load GLTF jantung 3D
const loader = new GLTFLoader();
let objectjantung = new THREE.Mesh();


let controller1Pos = new THREE.Vector3();
let controller2Pos = new THREE.Vector3();
loader.load('./assets/bottle.gltf', function (jantung) {
    objectjantung = jantung.scene;
    const materiale = new THREE.MeshPhongMaterial( );
    const mesh = objectjantung.children[0];
    mesh.material = materiale;
    objectjantung.castShadow = true; //default is false
    objectjantung.receiveShadow = true; //default
    objectjantung.scale.set(1 , 1 , 1);
    objectjantung.position.set(0, -1, 0);

    scene.add(objectjantung);

    // Create an animation mixer
    const mixer = new THREE.AnimationMixer(jantung.scene);

    // Get all animation clips from the gltf.animations array
    const clips = jantung.animations;

    // Play the first animation clip
    // const action = mixer.clipAction(clips[0]);
    // action.play();
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        mixer.update(delta);
        renderer.render(scene, camera);
        if (isSqueezing) {
            const rotationAmount = 1; // Adjust this value to control the rotation speed
            const scaleAmount = 0.01;
            controllerPosChange1 = new THREE.Vector3().subVectors(controller1.position, prevControllerPos1);
            controllerPosChange2 = new THREE.Vector3().subVectors(controller2.position, prevControllerPos2);
    
            // Update the previous controller positions
            prevControllerPos1.copy(controller1.position);
            prevControllerPos2.copy(controller2.position);

            if (rotateReady) {
            mesh.rotation.z += controllerPosChange1.z * rotationAmount;
            mesh.rotation.z += controllerPosChange2.z * rotationAmount;
            console.log("Rotate true");
            }
            if (scaleReady) {
                const scaleChange1 = (controllerPosChange1.x / 1) * scaleAmount;
                const scaleChange2 = (controllerPosChange1.x / 1)* scaleAmount;
                mesh.scale.x += scaleChange1;
                mesh.scale.y += scaleChange1;
                mesh.scale.z += scaleChange1;
                mesh.scale.x += scaleChange2;
                mesh.scale.y += scaleChange2;
                mesh.scale.z += scaleChange2;
                console.log(controllerPosChange1.x);
                console.log(controllerPosChange2.x);
                console.log("Scaling true");
            }
            if (grabReady) {
                const moveSpeed = 1;
                const controller1Delta = new THREE.Vector3().subVectors(controller1.position, controller1Pos);
                const controller2Delta = new THREE.Vector3().subVectors(controller2.position, controller2Pos);
    
                mesh.position.add(controller1Delta.multiplyScalar(moveSpeed));
                mesh.position.add(controller2Delta.multiplyScalar(moveSpeed));
    
                controller1Pos.copy(controller1.position);
                controller2Pos.copy(controller2.position);
            }
            controller1Pos.copy(controller1.position);
            controller2Pos.copy(controller2.position);
        }   
           
            // console.log("Squeezing true");
        
        // console.log("is squeezing :", isSqueezing)
    }

    animate();
}, undefined, function (error) {
    console.error(error);
});

let objectlab = new THREE.Mesh();

loader.load('./assets/lab.gltf', function (lab) {
    objectlab = lab.scene;
    const materiale = new THREE.MeshPhongMaterial( );
    const mesh = objectlab.children[0];
    mesh.material = materiale;
    objectlab.castShadow = true; //default is false
    objectlab.receiveShadow = true; //default
    objectlab.scale.set(1 , 1 , 1);
    objectlab.position.set(0, -1.1, 0);

    scene.add(objectlab);

    // Create an animation mixer
    // const mixer = new THREE.AnimationMixer(lab.scene);

    // Get all animation clips from the gltf.animations array
    // const clips = lab.animations;

    // Play the first animation clip
    // const action = mixer.clipAction(clips[0]);
    // action.play();
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        // const delta = clock.getDelta();
        // mixer.update(delta);
        renderer.render(scene, camera);
    }

    animate();
}, undefined, function (error) {
    console.error(error);
});

let objectbutton = new THREE.Mesh();

loader.load('./assets/button.gltf', function (button) {
    objectbutton = button.scene;
    const materiale = new THREE.MeshBasicMaterial( );
    const mesh = objectbutton.children[0];
    mesh.material = materiale;
    objectbutton.castShadow = true; //default is false
    objectbutton.receiveShadow = true; //default
    objectbutton.scale.set(0.4 , 0.4 , 0.4);
    objectbutton.position.set(0, 0, 0);

    scene.add(objectbutton);

    // Create an animation mixer
    // const mixer = new THREE.AnimationMixer(button.scene);

    // Get all animation clips from the gltf.animations array
    // const clips = lab.animations;

    // Play the first animation clip
    // const action = mixer.clipAction(clips[0]);
    // action.play();
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        // const delta = clock.getDelta();
        // mixer.update(delta);
        renderer.render(scene, camera);

    }

    animate();
}, undefined, function (error) {
    console.error(error);
});

    //controller mesh XR
    let controllermesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.2,0.2,0.2),
        new THREE.MeshBasicMaterial({ color: 0xf0f000 })
    );
    controllermesh.position.set(0,0,0);
    scene.add(controllermesh);

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
    // controller1.add( line.clone() );
    // controller2.add( line2.clone() );
    dolly.add(controller1 , controller2 , controllerGrip1 , controllerGrip2 , hand1 , hand2, line, line2, controllermesh , objectjantung);
    // line.material.color.set(0xff0000);


    //

renderer.setClearColor(0x0000ff); // Set the clear color to bluish

function updateCameraPosition() {
    const dollySpeed = movementSpeed;
    const cameraForward = new THREE.Vector3();
    camera.getWorldDirection(cameraForward);
    cameraForward.y = 0;
    // Check if the select button is pressed
    if (isSelecting) {
        // Get the forward vector of the camera


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

    if (xrInputSources) {
        // Normalize the camera's forward vector
        cameraForward.normalize();
    
        // Get joystick axes values
        let xAxis = xrInputSources[1]?.gamepad?.axes[2] || 0;
        let zAxis = xrInputSources[1]?.gamepad?.axes[3] || 0;
    
        // Calculate the movement vector based on joystick input
        let movement = new THREE.Vector3(xAxis, 0, zAxis);
    
        // Rotate the movement vector to align with the camera's orientation
        movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
    
        // Scale the movement vector based on your desired speed
        movement.multiplyScalar(0.05); // Adjust the speed as needed
    
        // Move the dolly along the calculated movement vector
        dolly.position.add(movement);
    
        // Update the controls' target to maintain proper look-at behavior
        controls.target.copy(dolly.position);
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
  function rotateboxspawn(object1) {
    box1 = new THREE.Box3().setFromObject(object1);
    let rotatebox = new THREE.Box3();
    let boxSize = new THREE.Vector3(1, 0.3, 0.5); // Set the collider box size
    let boxCenter = new THREE.Vector3(0.15, 1.3, -1.6); // Set the collider box center

    rotatebox.setFromCenterAndSize(boxCenter, boxSize);
    let rotateboxHelper = new THREE.Box3Helper(rotatebox, 0xff0000);
    scene.add(rotateboxHelper);

    return box1.intersectsBox(rotatebox);
  }

function scaleboxspawn(object1) {
    box1 = new THREE.Box3().setFromObject(object1);
    let scalebox = new THREE.Box3();
    let boxSize = new THREE.Vector3(1, 0.3, 0.5); // Set the collider box size
    let boxCenter = new THREE.Vector3(0.15, 0.9, -1.6); // Set the collider box center

    scalebox.setFromCenterAndSize(boxCenter, boxSize);
    let scaleboxHelper = new THREE.Box3Helper(scalebox, 0xff0000);
    scene.add(scaleboxHelper);

    return box1.intersectsBox(scalebox);
}

function grabspawn(object1) {
    box1 = new THREE.Box3().setFromObject(object1);
    let grabbox = new THREE.Box3();
    let boxSize = new THREE.Vector3(1, 0.3, 0.5); // Set the collider box size
    let boxCenter = new THREE.Vector3(0.15, 0.5, -1.6); // Set the collider box center
    grabbox.setFromCenterAndSize(boxCenter, boxSize);
    let grabboxHelper = new THREE.Box3Helper(grabbox, 0xff0000);
    scene.add(grabboxHelper);

    return box1.intersectsBox(grabbox);
}
const prevControllerPos1 = new THREE.Vector3().copy(controller1.position);
const prevControllerPos2 = new THREE.Vector3().copy(controller2.position);
  // Event listener for the "squeezestart" event
  controller1.addEventListener('squeezestart', () => {
    if (isTouching(controllermesh, objectjantung)) {
        // Change the color of the controllermesh to red
        controllermesh.material.color.set(0xff0000);
        isSqueezing = true;
      } 
      if (!isTouching(controllermesh, objectjantung)) {
        // Change the color of the controllermesh to white
        controllermesh.material.color.set(0xffffff);
        isSqueezing = false;
      } console.log(isTouching(controllermesh, objectjantung))

    if (rotateboxspawn(controllermesh)) {
        rotateReady = true;
        scaleReady = false;
        grabReady = false;
    }
    if (scaleboxspawn(controllermesh)) {
        rotateReady = false;
        scaleReady = true;
        grabReady = false;
    }
    if (grabspawn(controllermesh)) {
        rotateReady = false;
        scaleReady = false;
        grabReady = true;
    }
      console.log("is squeezing :", isSqueezing);
      console.log("rotateReady :", rotateReady);
      console.log("scaleReady :", scaleReady);
      console.log("grabReady  :", grabReady);
   
  }
  );
  
  controller2.addEventListener('squeezestart', () => {
    if (isTouching(line2, objectjantung)) {
        // Change the color of the line to red
        line2.material.color.set(0xff0000);
        isSqueezing = true;
      } 
      if (!isTouching(line2, objectjantung)) {
        // Change the color of the line to red
        line2.material.color.set(0xffffff);
        isSqueezing = false;
      }   
      console.log(isTouching(line2, objectjantung))
      console.log("is squeezing :", isSqueezing)
  });
  controller1.addEventListener('squeezeend', () => {
    isSqueezing = false;
    controllermesh.material.color.set(0xf0f000);
    });

    controller2.addEventListener('squeezeend', () => {
        isSqueezing = false;
    });

    let controllerPosChange1;
    let controllerPosChange2;

renderer.setAnimationLoop(() => {
    updateCameraPosition();
    line.position.copy(controller1.position);
    line2.position.copy(controller2.position);
    line.quaternion.copy(controller1.quaternion);
    line2.quaternion.copy(controller2.quaternion);
    controllermesh.position.copy(controller1.position);
    controllermesh.quaternion.copy(controller1.quaternion);



    renderer.render(scene, camera);
    controls.update();

});

let xrSession = null;

function onRequestSession() {
  navigator.xr
    .requestSession('immersive-vr')
    .then((session) => {
      xrSession = session;
      setupXR();
    })
    .catch((error) => {
      console.error('WebXR session request failed:', error);
    });
}
// Function to set up XR environment after session is obtained
let xrInputSources = [];
function setupXR() {
    // Check if xrSession is available
    if (xrSession) {
      xrInputSources = xrSession.inputSources; // Store input sources directly from xrSession object
      console.log('Input sources:', xrInputSources);
  
      // Now you can work with the input sources
      // For example, you can add event listeners to them
    } else {
      console.error('XR session is not available.');
    }
    xrSession.requestAnimationFrame(onXRFrame);
    // onXRFrame();
  }
  function onXRFrame(time, frame) {
    renderer.xr.enabled = true;
    renderer.setAnimationLoop(() => {
      // Render the scene
      renderer.render(scene, camera);
    });
    for (const inputSource of xrInputSources) {
        const gamepad = inputSource.gamepad;
          const axes = gamepad.axes;
          console.log('Joystick X:', axes[0]);
          console.log('Joystick Y:', axes[1]);
      }
    // Continue the XR animation loop
    xrSession.requestAnimationFrame(onXRFrame);
  }

//   function updateCameraPositionxr() {
//     // Update camera position based on XR controller input
//     if (controllerxr1) {
//       // Update camera position based on controller1 input
//     }
  
//     if (controllerxr2) {
//       // Update camera position based on controller2 input
//     }
//   }

  // Assuming xrSession is the XRSession object

// Function to handle XR input
