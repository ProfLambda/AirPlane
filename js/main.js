import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 5, 15);

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
const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 10, 10);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90ee90 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Keyboard state
const keys = {
    'z': false, 'q': false, 's': false, 'd': false,
    'ArrowUp': false, 'ArrowDown': false, 'ArrowLeft': false, 'ArrowRight': false
};

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    } else if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = true;
    }
});

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    } else if (keys.hasOwnProperty(event.key)) {
        keys[event.key] = false;
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
        // Assuming the first animation is the propeller
        propellerAction = mixer.clipAction(gltf.animations[0]);
        propellerAction.setLoop(THREE.LoopRepeat);
    }

    resetGame();

}, undefined, (error) => {
    console.error("An error occurred while loading the model:", error);
});

function updateCamera() {
    if (plane) {
        const idealOffset = new THREE.Vector3(0, 5, 12);
        idealOffset.applyQuaternion(plane.quaternion);
        const idealLookat = new THREE.Vector3(0, 2, -10);
        idealLookat.applyQuaternion(plane.quaternion);

        const targetPosition = plane.position.clone().add(idealOffset);
        const lookatPosition = plane.position.clone().add(idealLookat);

        camera.position.lerp(targetPosition, 0.1);
        camera.lookAt(lookatPosition);
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
            propellerAction.timeScale = speed / config.takeoffSpeed * 2;
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
        speed -= config.friction * speed; // Simplified friction
        speed = Math.max(0, speed);

        // Takeoff logic
        if (!isAirborne && speed > config.takeoffSpeed && keys['ArrowDown']) {
            isAirborne = true;
            verticalSpeed = config.liftForce * 5;
        }

        if (isAirborne) {
            // Apply gravity
            verticalSpeed -= config.gravity;

            // Pitch controls (up/down)
            if (keys['ArrowDown']) { // Pull up
                plane.rotation.x = Math.max(-config.maxPitch, plane.rotation.x - 0.01);
                verticalSpeed += config.liftForce * (speed / config.takeoffSpeed);
            }
            if (keys['ArrowUp']) { // Nose down
                plane.rotation.x = Math.min(config.maxPitch, plane.rotation.x + 0.01);
            }

            // Roll controls for turning
            let turn = 0;
            if (keys['q']) turn = 1;
            if (keys['d']) turn = -1;
            plane.rotation.z = Math.max(-config.maxRoll, Math.min(config.maxRoll, plane.rotation.z + turn * 0.02));

            // Yaw based on roll
            plane.rotation.y += plane.rotation.z * speed * 0.1;

            // Update vertical position
            plane.position.y += verticalSpeed;

            // Crash detection
            if (plane.position.y < 0.5) {
                const angle = plane.rotation.x;
                if (Math.abs(angle) > Math.PI / 4 || verticalSpeed < -0.2) {
                    console.log("Crashed!");
                    resetGame();
                } else { // Landed
                    plane.position.y = 0.5;
                    verticalSpeed = 0;
                    isAirborne = false;
                    plane.rotation.x = 0;
                    plane.rotation.z = 0;
                }
            }
        } else { // On the ground
            if (speed > 0.01) {
                if (keys['q']) plane.rotation.y += config.turnSpeed;
                if (keys['d']) plane.rotation.y -= config.turnSpeed;
            }
            // Reset pitch/roll on ground
            plane.rotation.x *= 0.95;
            plane.rotation.z *= 0.95;
        }

        // Update plane position based on its forward direction
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(plane.quaternion);
        plane.position.add(forward.multiplyScalar(speed));
    }

    updateCamera();
    updateUI();
    renderer.render(scene, camera);
}

animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});