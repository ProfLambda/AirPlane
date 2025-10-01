import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Ground
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x556B2F });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Keyboard state
const keys = {
    'z': false, 'q': false, 's': false, 'd': false,
    'ArrowUp': false, 'ArrowDown': false, 'ArrowLeft': false, 'ArrowRight': false
};

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key in keys) keys[key] = true;
    else if (event.key in keys) keys[event.key] = true; // For arrow keys
});

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key in keys) keys[key] = false;
    else if (event.key in keys) keys[event.key] = false; // For arrow keys
});

// UI Elements
const speedEl = document.getElementById('speed');
const altitudeEl = document.getElementById('altitude');
const fuelEl = document.getElementById('fuel');
const solarEngineCheckbox = document.getElementById('solar-engine');

// Airplane model & physics
let plane;
let planeInitialHeight = 0;
let speed = 0;
let verticalSpeed = 0;
let isAirborne = false;
let fuel = 100;
const acceleration = 0.01;
const braking = 0.02;
const friction = 0.005;
const turnSpeed = 0.02;
const takeoffSpeed = 0.3;
const liftForce = 0.01;
const gravity = 0.005;
const fuelConsumption = 0.02;


const loader = new GLTFLoader();
loader.load('assets/cartoon_plane.glb', (gltf) => {
    plane = gltf.scene;
    scene.add(plane);

    // Calculate bounding box to set the initial position correctly
    const box = new THREE.Box3().setFromObject(plane);
    planeInitialHeight = -box.min.y;
    plane.position.y = planeInitialHeight;

    // Log animations
    console.log('Animations found in GLB:', gltf.animations);

    // Initial camera position
    updateCamera();
}, undefined, (error) => {
    console.error(error);
});

function updateCamera() {
    if (plane) {
        const offset = new THREE.Vector3(0, 2, 5);
        offset.applyQuaternion(plane.quaternion);
        camera.position.copy(plane.position).add(offset);
        camera.lookAt(plane.position);
    }
}

function updateUI() {
    if (plane) {
        speedEl.textContent = (speed * 200).toFixed(1);
        altitudeEl.textContent = (plane.position.y * 10).toFixed(1);

        if (!solarEngineCheckbox.checked) {
            fuel -= fuelConsumption;
            if (fuel < 0) {
                fuel = 0;
                console.log("Out of fuel!");
                resetGame();
            }
        }
        fuelEl.textContent = fuel.toFixed(1);
    }
}

function resetGame() {
    if (plane) {
        plane.position.set(0, planeInitialHeight, 0);
        plane.rotation.set(0, 0, 0);
    }
    speed = 0;
    verticalSpeed = 0;
    isAirborne = false;
    fuel = 100;
}

// Animation loop
function animate() {
    if (plane) {
        // Handle acceleration and braking
        if (keys.z && fuel > 0) speed += acceleration;
        if (keys.s) speed -= braking;
        speed *= (1 - friction);
        speed = Math.max(0, speed);

        // Takeoff
        if (!isAirborne && speed > takeoffSpeed) {
            isAirborne = true;
        }

        if (isAirborne) {
            // Apply gravity
            verticalSpeed -= gravity;

            // Pitch controls (up/down)
            if (keys.arrowup) {
                plane.rotation.x -= 0.01;
                verticalSpeed += liftForce * (speed / takeoffSpeed);
            }
            if (keys.arrowdown) {
                plane.rotation.x += 0.01;
                verticalSpeed -= liftForce * 0.5;
            }

            // Roll controls (left/right)
            if (keys.q) plane.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), 0.02);
            if (keys.d) plane.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -0.02);

            // Yaw based on roll
            plane.rotation.y -= plane.rotation.z * 0.02;


            // Update vertical position
            plane.position.y += verticalSpeed;

            // Crash detection
            if (plane.position.y < planeInitialHeight) {
                const angle = plane.rotation.x;
                if (Math.abs(angle) > Math.PI / 4) { // Crash if angle is too steep
                    console.log("Crashed!");
                    resetGame();
                } else { // Landed
                    plane.position.y = planeInitialHeight;
                    verticalSpeed = 0;
                    isAirborne = false;
                    plane.rotation.x = 0;
                    plane.rotation.z = 0;
                }
            }

        } else { // On the ground
            if (speed > 0.01) {
                if (keys.q) plane.rotation.y += turnSpeed;
                if (keys.d) plane.rotation.y -= turnSpeed;
            }
        }

        // Update plane position
        plane.translateZ(-speed);
    }

    updateCamera();
    updateUI();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

console.log("main.js loaded and scene created");