import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 5);
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90ee90 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Keyboard state
const keys = {
    'z': false, 'q': false, 's': false, 'd': false,
    'arrowup': false, 'arrowdown': false, 'arrowleft': false, 'arrowright': false
};

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
});

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

// UI Elements
const speedEl = document.getElementById('speed');
const altitudeEl = document.getElementById('altitude');
const fuelEl = document.getElementById('fuel');
const solarEngineCheckbox = document.getElementById('solar-engine');

// Airplane model & physics
let plane;
let mixer; // For animations
let propellerAction;
let speed = 0;
let verticalSpeed = 0;
let isAirborne = false;
let fuel = 100;
let engineOn = false;

const config = {
    acceleration: 0.01,
    braking: 0.02,
    friction: 0.005,
    turnSpeed: 0.02,
    takeoffSpeed: 0.4,
    liftForce: 0.01,
    gravity: 0.005,
    fuelConsumption: 0.02,
    maxPitch: Math.PI / 4,
    maxRoll: Math.PI / 3,
};

function resetGame() {
    if (plane) {
        plane.position.set(0, 0.5, 0);
        plane.rotation.set(0, 0, 0);
    }
    speed = 0;
    verticalSpeed = 0;
    isAirborne = false;
    fuel = 100;
    engineOn = false;
    if (propellerAction) propellerAction.stop();
}

// Load Plane Model
const loader = new GLTFLoader();
loader.load('assets/aviao_low_poly.glb', (gltf) => {
    plane = gltf.scene;
    plane.position.y = 0.5;
    scene.add(plane);

    console.log("Animations in aviao_low_poly.glb:", gltf.animations);
    if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(plane);
        propellerAction = mixer.clipAction(gltf.animations[0]);
        propellerAction.setLoop(THREE.LoopRepeat);
    }

    resetGame();

}, undefined, (error) => {
    console.error("An error occurred while loading the model:", error);
});

function updateCamera() {
    if (plane) {
        // Corrected offset to be behind the plane
        const idealOffset = new THREE.Vector3(0, 5, -12);
        idealOffset.applyQuaternion(plane.quaternion);
        const targetPosition = plane.position.clone().add(idealOffset);

        camera.position.lerp(targetPosition, 0.1);
        camera.lookAt(plane.position);
    }
}

function updateUI() {
    if (plane) {
        speedEl.textContent = (speed * 200).toFixed(1);
        altitudeEl.textContent = (plane.position.y <= 0.5 ? 0 : (plane.position.y - 0.5) * 10).toFixed(1);
        fuelEl.textContent = fuel.toFixed(1);
    }
}

const clock = new THREE.Clock();

// Animation Loop
function animate() {
    const delta = clock.getDelta();
    requestAnimationFrame(animate);

    if (plane) {
        engineOn = (keys['z'] && fuel > 0);

        // Propeller animation
        if (mixer) {
            if (engineOn && !propellerAction.isRunning()) {
                propellerAction.play();
            } else if (!engineOn && propellerAction.isRunning()) {
                propellerAction.stop();
            }
            if(propellerAction.isRunning()) {
                propellerAction.timeScale = Math.max(0, speed / config.takeoffSpeed * 2);
            }
            mixer.update(delta);
        }

        // Fuel consumption
        if (engineOn && !solarEngineCheckbox.checked) {
            fuel -= config.fuelConsumption;
            if (fuel <= 0) {
                fuel = 0;
                engineOn = false;
            }
        }

        // Physics calculations
        if (engineOn) speed += config.acceleration;
        if (keys['s']) speed -= config.braking;
        speed -= config.friction * speed;
        speed = Math.max(0, speed);

        // Takeoff logic
        if (!isAirborne && speed > config.takeoffSpeed && keys['arrowdown']) {
            isAirborne = true;
            verticalSpeed = config.liftForce * 5;
        }

        if (isAirborne) {
            verticalSpeed -= config.gravity;

            if (keys['arrowdown']) { // Pull up
                plane.rotation.x = Math.max(-config.maxPitch, plane.rotation.x - 0.01);
                verticalSpeed += config.liftForce * (speed / config.takeoffSpeed);
            }
            if (keys['arrowup']) { // Nose down
                plane.rotation.x = Math.min(config.maxPitch, plane.rotation.x + 0.01);
            }

            let turn = 0;
            if (keys['q']) turn = 1;
            if (keys['d']) turn = -1;
            plane.rotation.z += turn * 0.02;
            plane.rotation.z *= 0.95;
            plane.rotation.z = Math.max(-config.maxRoll, Math.min(config.maxRoll, plane.rotation.z));

            // Apply yaw based on roll
            plane.rotation.y -= plane.rotation.z * speed * 0.1;

            plane.position.y += verticalSpeed;

            if (plane.position.y < 0.5) {
                if (Math.abs(plane.rotation.x) > Math.PI / 4 || verticalSpeed < -0.2) {
                    console.log("Crashed!");
                    resetGame();
                } else {
                    plane.position.y = 0.5;
                    verticalSpeed = 0;
                    isAirborne = false;
                    plane.rotation.x *= 0.5;
                    plane.rotation.z *= 0.5;
                }
            }
        } else {
            if (speed > 0.01) {
                if (keys['q']) plane.rotation.y += config.turnSpeed;
                if (keys['d']) plane.rotation.y -= config.turnSpeed;
            }
            plane.rotation.x *= 0.95;
            plane.rotation.z *= 0.95;
        }

        // Corrected movement to be along the plane's forward direction
        plane.translateZ(speed);
    }

    updateCamera();
    updateUI();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});