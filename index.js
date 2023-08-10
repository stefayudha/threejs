import * as THREE from 'three';
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { GUI, controllers } from './node_modules/dat.gui/build/dat.gui.module.js';
import { VRButton } from './node_modules/three/examples/jsm/webxr/VRButton.js';
import { DragControls } from './node_modules/three/examples/jsm/controls/DragControls.js'
import { XRControllerModelFactory } from './node_modules/three/examples/jsm/webxr/XRControllerModelFactory.js';


const scene = new THREE.Scene();
let camera;
let isCameraOrtho;

// perspective camera
function perscam() {
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100000 );
    isCameraOrtho = false;
}

//orthographic camera
function orthocam() {
    camera = new THREE.OrthographicCamera(-window.innerWidth / 2 , window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, 1, 10000);
    isCameraOrtho = true;
}

perscam();
scene.add(camera);

camera.position.z = 5;

//camera group (webXR)
let camGroup = new THREE.Group();
camGroup.add(camera);
camGroup.position.set(0,0,2);
scene.add(camGroup);
function initScene() {
    const dolly = new THREE.Object3D();
    dolly.position.z = 5;
    dolly.add(camera);
    scene.add(dolly);
  
    const dummyCam = new THREE.Object3D();
    camera.add(dummyCam);
  }

//renderer
const renderer = new THREE.WebGLRenderer({
    antialias: true,
});
shadowMapEnabled: true;
shadowMapType: THREE.PCFSoftShadowMap;

//basic renderer setup
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

//webXR renderer setup
renderer.xr.enabled = true;
document.body.appendChild( VRButton.createButton(renderer) );

//XR Controller
let XRcontroller = renderer.xr.getController(0);
console.log(XRcontroller);
XRcontroller.addEventListener('selectstart', ()=>{
    controllermesh.material.color.set(0x000000);
});
XRcontroller.addEventListener('selectend', ()=>{
    controllermesh.material.color.set(0x00f000);
});


// cube test:
function cubespawn() {
    const geometry = new THREE.BoxGeometry( 10, 0.1, 10 );
    const material = new THREE.MeshPhongMaterial( { color: 0xc0c0c0 } );
    const cube = new THREE.Mesh( geometry, material );
    const cube1 = new THREE.Mesh( geometry, material );
    cube.receiveShadow = true;
    cube.castShadow = true;
    cube.position.set(0, -1, 0);
    cube1.position.set(1, 1, 3);
    scene.add( cube );
    // scene.add( cube1 );
}
cubespawn();

//skybox geometry :
let materialArray = []
let texture_ft = new THREE.TextureLoader().load('./assets/SwedishRoyalCastle/negx.jpg');
let texture_bk = new THREE.TextureLoader().load('./assets/SwedishRoyalCastle/posx.jpg');
let texture_up = new THREE.TextureLoader().load('./assets/SwedishRoyalCastle/posy.jpg');
let texture_dn = new THREE.TextureLoader().load('./assets/SwedishRoyalCastle/negy.jpg');
let texture_rt = new THREE.TextureLoader().load('./assets/SwedishRoyalCastle/negz.jpg');
let texture_lf = new THREE.TextureLoader().load('./assets/SwedishRoyalCastle/posz.jpg');

materialArray.push(new THREE.MeshPhongMaterial({map: texture_ft}));
materialArray.push(new THREE.MeshPhongMaterial({map: texture_bk}));
materialArray.push(new THREE.MeshPhongMaterial({map: texture_up}));
materialArray.push(new THREE.MeshPhongMaterial({map: texture_dn}));
materialArray.push(new THREE.MeshPhongMaterial({map: texture_rt}));
materialArray.push(new THREE.MeshPhongMaterial({map: texture_lf}));

for (let i = 0; i < 6; i++) {
    materialArray[i].side = THREE.BackSide;    
}
const skyboxGeo = new THREE.BoxGeometry( 1000, 1000, 1000 );
const skybox = new THREE.Mesh( skyboxGeo, materialArray );
scene.add(skybox);

//make GUI folder 
const gui = new GUI();
const geometryFolder = gui.addFolder('Mesh Geometry');
const rotationFolder = geometryFolder.addFolder('Rotation');
const scaleFolder = geometryFolder.addFolder('Scale');

//load GLTF aruvana 3D
const loader = new GLTFLoader();
let objectaruvana = new THREE.Mesh();
loader.load('./assets/aruvana3d.gltf', function (aruvana) {
    // objectaruvana = aruvana.scene;
    objectaruvana = aruvana.scene;
    const materiale = new THREE.MeshPhongMaterial( { color: 0x7fffd4  } );
    const mesh = objectaruvana.children[0];
    mesh.material = materiale;
    objectaruvana.castShadow = true; //default is false
    objectaruvana.receiveShadow = true; //default
    
    // //geometry GUI
    
    // geometryFolder.open();

    let enableRotation = true;
    rotationFolder.add(objectaruvana.rotation, 'x', 0 , Math.PI).name('Rotate X Axis');
    rotationFolder.add(objectaruvana.rotation, 'y', 0 , Math.PI).name('Rotate Y Axis');
    rotationFolder.add(objectaruvana.rotation, 'z', 0 , Math.PI).name('Rotate Z Axis');
    scaleFolder.add(objectaruvana.scale, 'x', 0, 2 ).name('Scale X Axis');
    scaleFolder.add(objectaruvana.scale, 'y', 0, 2 ).name('Scale Y Axis');
    scaleFolder.add(objectaruvana.scale, 'z', 0, 2 ).name('Scale Z Axis');
    // scaleFolder.open();

    objectaruvana.position.set(0, 0, 0);
    const dragControls = new DragControls([objectaruvana], camera, renderer.domElement);
    let previousClientX, previousClientY;

    dragControls.addEventListener('dragstart', function (event) {
        controls.enabled = false; // Disable orbit controls during drag
        previousClientX = event.object.position.x; // Store the initial X position
        previousClientY = event.object.position.y; // Store the initial Y position
        enableRotation = false;
    });

    dragControls.addEventListener('drag', function (event) {
        const deltaX = event.object.position.x - previousClientX; // Calculate the change in X position
        // const deltaY = event.object.position.y - previousClientY; // Calculate the change in Y position
        event.object.position.x = previousClientX + deltaX; // Update the X position
        event.object.position.y = previousClientY; // Ignore the change in Y position
    });

    dragControls.addEventListener('dragend', function (event) {
        controls.enabled = true; // Enable orbit controls after drag
        enableRotation = true;
    });

    scene.add(objectaruvana);
    function animate() {
        requestAnimationFrame( animate );
        if (enableRotation) {
            mesh.rotation.z += 0.01;
        }
       }
       
       animate();
       //GUI initialize
   
}, undefined, function (error) {
    console.error(error);
});


//controller mesh XR
let controllermesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.5,0.5,0.5),
    new THREE.MeshBasicMaterial({ color: 0xf0f000 })
);
controllermesh.position.set(0,-10,0);
scene.add(controllermesh);

function handleController( XRcontroller, dt ){
    if (XRcontroller.userData.selectPressed ){
        
        const wallLimit = 1.3;
        const speed = 2;
        let pos = this.dolly.position.clone();
        pos.y += 1;

        let dir = new THREE.Vector3();
        //Store original dolly rotation
        const quaternion = this.dolly.quaternion.clone();
        //Get rotation for movement from the headset pose
        this.dolly.quaternion.copy( this.dummyCam.getWorldQuaternion() );
        this.dolly.getWorldDirection(dir);
        dir.negate();
        this.raycaster.set(pos, dir);

        let blocked = false;

        let intersect = this.raycaster.intersectObjects(this.colliders);
        if (intersect.length>0){
            if (intersect[0].distance < wallLimit) blocked = true;
        }

        if (!blocked){
            this.dolly.translateZ(-dt*speed);
            pos = this.dolly.getWorldPosition( this.origin );
        }

        //cast left
        dir.set(-1,0,0);
        dir.applyMatrix4(this.dolly.matrix);
        dir.normalize();
        this.raycaster.set(pos, dir);

        intersect = this.raycaster.intersectObjects(this.colliders);
        if (intersect.length>0){
            if (intersect[0].distance<wallLimit) this.dolly.translateX(wallLimit-intersect[0].distance);
        }

        //cast right
        dir.set(1,0,0);
        dir.applyMatrix4(this.dolly.matrix);
        dir.normalize();
        this.raycaster.set(pos, dir);

        intersect = this.raycaster.intersectObjects(this.colliders);
        if (intersect.length>0){
            if (intersect[0].distance<wallLimit) this.dolly.translateX(intersect[0].distance-wallLimit);
        }

        this.dolly.position.y = 0;

        //Restore the original rotation
        this.dolly.quaternion.copy( quaternion );

    }
}

// rotationFolder.add(objectaruvana.rotation, 'x', 0 , Math.PI).name('Rotate Xa Axis');
// rotationFolder.add(objectaruvana.rotation, 'y', 0 , Math.PI).name('Rotate Ya Axis');
// rotationFolder.add(objectaruvana.rotation, 'z', 0 , Math.PI).name('Rotate Za Axis');
// scaleFolder.add(objectaruvana.scale, 'x', 0, 2 ).name('Scale Xa Axis');
// scaleFolder.add(objectaruvana.scale, 'y', 0, 2 ).name('Scale Ya Axis');
// scaleFolder.add(objectaruvana.scale, 'z', 0, 2 ).name('Scale Za Axis');
// scaleFolder.open();


//resize all object in the the screen
window.addEventListener('resize', function(){
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (isCameraOrtho) { //if camera is Orthographic Camera
        camera.left = -width / 250;
        camera.right = width / 250;
        camera.top = height / 250;
        camera.bottom = -height / 250;
    } else { //if camera is perspective camera
        camera.aspect = width/height;
    }
    renderer.setSize(width, height);
    camera.updateProjectionMatrix();
});


const controls = new OrbitControls(camera, renderer.domElement);
const light = new THREE.AmbientLight( 0x404040 , 2); // soft white light
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

//directional light (sunray)
// const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
// scene.add( directionalLight );

// controls.minDistance = 500;
controls.maxDistance = 1500;

// //loop basic renderer
// function animate() {
//  requestAnimationFrame( animate );
//     renderer.render( scene, camera );
//     controls.update();
// }
// animate();

//loop XR renderer 
renderer.setAnimationLoop(()=>{
    //map the controller mesh to the controller
    controllermesh.position.copy(XRcontroller.position);
    controllermesh.quaternion.copy(XRcontroller.quaternion);

    //render
    renderer.render(scene, camera);
    controls.update();
    
});

/**
 * Adding simple object in the scene
 *
 * @param {number} radius of the object
 * @param {Object} pos object containing position data { x: number, y: number, z: number }
 * @param {Color} color hex code for color of object
 */
function addObject(radius, pos, color) {
    let object = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.5, 8),
      new THREE.MeshPhongMaterial({ color: color })
    );
    object.position.set(pos.x, pos.y, pos.z);
    object.isDraggable = true;
    scene.add(object);
    const dragControls = new DragControls([object], camera, renderer.domElement);
    let previousClientX, previousClientY;

    dragControls.addEventListener('dragstart', function (event) {
        controls.enabled = false; // Disable orbit controls during drag
        previousClientX = event.object.position.x; // Store the initial X position
        previousClientY = event.object.position.y; // Store the initial Y position
    });

    dragControls.addEventListener('drag', function (event) {
        const deltaX = event.object.position.x - previousClientX; // Calculate the change in X position
        // const deltaY = event.object.position.y - previousClientY; // Calculate the change in Y position
        event.object.position.x = previousClientX + deltaX; // Update the X position
        event.object.position.y = previousClientY; // Ignore the change in Y position
    });

    dragControls.addEventListener('dragend', function (event) {
        controls.enabled = true; // Enable orbit controls after drag
    });

  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  (function () {
    window.addEventListener("resize", onWindowResize, false);
    const clock = new THREE.Clock();
    const dt = clock.getDelta();
    initScene();
    
    // Adding multiple objects
    addObject(0.3, { x: 0, y: -0.7, z: 0 }, "#FF0000");
    addObject(0.3, { x: 4, y: -0.7, z: 4 }, "#313DF8");
    addObject(0.3, { x: -4, y: -0.7, z: -4 }, "#000000");
    addObject(0.3, { x: -4, y: -0.7, z: 4 }, "#EF0A61");
    addObject(0.3, { x: 4, y: -0.7, z: -4 }, "#CAB21D");
    // setAnimationLoop();
    handleController( XRcontroller, dt );
    
  })();
