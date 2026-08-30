import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

// --- Ensure key inputs are captured ---
window.focus();
document.body.tabIndex = 0;
document.body.focus();

// ====== Basic Setup ======
const canvas = document.getElementById("myCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a16);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 1.6, 5);

// ====== Get HTML elements for coordinates display ======
const coordsElement = document.getElementById("coords");

// ====== Controls Setup ======
const controls = new PointerLockControls(camera, document.body);
controls.pointerSpeed = 0.6; 

window.addEventListener("click", () => {
    controls.lock();
});

// ====== Variables for Jump and Gravity ======
let velocityY = 0;        
const gravity = -0.008;    
const jumpStrength = 0.22; 
let isGrounded = true;    
const playerHeight = 1.6;  

// ====== Create Floor ======
const floorSize = 100; 
const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
const floorMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x112211, 
    side: THREE.DoubleSide 
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const gridHelper = new THREE.GridHelper(floorSize, 50, 0x00ff00, 0x004400);
gridHelper.position.y = 0.01; 
scene.add(gridHelper);

// ====== Create Colorful Buildings & Setup Collision ======
const colors = [0xff3366, 0x3333ff, 0xffcc00, 0x9933ff, 0x00ffff];
const buildings = []; 

for (let i = 0; i < 30; i++) {
    const buildingHeight = 2 + Math.random() * 4;
    const boxGeometry = new THREE.BoxGeometry(1.5, buildingHeight, 1.5);
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const boxMaterial = new THREE.MeshBasicMaterial({ color: randomColor });
    const building = new THREE.Mesh(boxGeometry, boxMaterial);
    
    const edges = new THREE.EdgesGeometry(boxGeometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const line = new THREE.LineSegments(edges, lineMaterial);
    building.add(line);

    // Keep buildings away from the starting position (0, 1.6, 5) to prevent getting stuck
    const x = (Math.random() - 0.5) * 40;
    // Adjust Z coordinate so it doesn't overlap with the initial position
    let z = (Math.random() - 0.5) * 40;
    if (z > 3 && z < 7) z += 4; 
    
    building.position.set(x, buildingHeight / 2, z);
    scene.add(building);
    
    building.geometry.computeBoundingBox();
    buildings.push(building);
}

// Bounding box for player collision detection
const playerBox = new THREE.Box3();

// ====== Key Inputs Manager ======
const keys = {};

window.addEventListener("keydown", (e) => {
    if (e.key === " " && isGrounded) {
        velocityY = jumpStrength;
        isGrounded = false; 
    }
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ====== Movement, Collision Detection & Boundary Limits ======
function updateMovement() {
    // ----------------------------------------
    // 1. Handle horizontal movement (W, A, S, D)
    // ----------------------------------------
    const oldX = camera.position.x;
    const oldZ = camera.position.z;

    const speed = 0.15;
    if (keys["w"]) controls.moveForward(speed);
    if (keys["s"]) controls.moveForward(-speed);
    if (keys["a"]) controls.moveRight(-speed);
    if (keys["d"]) controls.moveRight(speed);
    
    // Update player bounding box based on the current camera position
    // Covers the area from feet to head
    playerBox.setFromCenterAndSize(
        new THREE.Vector3(camera.position.x, camera.position.y - 0.9, camera.position.z),
        new THREE.Vector3(0.6, 1.8, 0.6)
    );

    let isCollidingX_Z = false;
    for (let i = 0; i < buildings.length; i++) {
        const b = buildings[i];
        const buildingBox = b.geometry.boundingBox.clone().translate(b.position);
        
        // Check if player collides with a building horizontally
        if (playerBox.intersectsBox(buildingBox)) {
            // Acts as a wall only if player's feet are below the roof level
            if (camera.position.y - 1.6 < buildingBox.max.y - 0.1) {
                isCollidingX_Z = true;
                break;
            }
        }
    }

    const limit = floorSize / 2;
    const isOutOfBounds = 
        camera.position.x < -limit || camera.position.x > limit ||
        camera.position.z < -limit || camera.position.z > limit;

    // Revert horizontal movement if player collides with a wall or goes out of bounds
    if (isCollidingX_Z || isOutOfBounds) {
        camera.position.x = oldX;
        camera.position.z = oldZ;
    }

    // ----------------------------------------
    // 2. Handle vertical movement (Jump & Gravity)
    // ----------------------------------------
    const oldY = camera.position.y;
    camera.position.y += velocityY; 
    velocityY += gravity;           

    // Update player bounding box after vertical movement
    playerBox.setFromCenterAndSize(
        new THREE.Vector3(camera.position.x, camera.position.y - 0.9, camera.position.z),
        new THREE.Vector3(0.6, 1.8, 0.6)
    );

    let currentMinY = playerHeight; // Default minimum height (ground level)

    // Check if player can land on top of any building
    for (let i = 0; i < buildings.length; i++) {
        const b = buildings[i];
        const buildingBox = b.geometry.boundingBox.clone().translate(b.position);
        
        // Check if player bounding box overlaps with building
        if (playerBox.intersectsBox(buildingBox)) {
            // Set building roof as new ground if falling down and player's feet were above the roof level before moving
            if (velocityY <= 0 && (oldY - 1.6) >= (buildingBox.max.y - 0.3)) {
                if (buildingBox.max.y + playerHeight > currentMinY) {
                    currentMinY = buildingBox.max.y + playerHeight;
                }
            }
        }
    }

    // Handle landing on the ground or building roof
    if (camera.position.y <= currentMinY) {
        camera.position.y = currentMinY; 
        velocityY = 0;                    
        isGrounded = true;                
    } else {
        // Trigger falling state if player walks off a building roof
        if (currentMinY === playerHeight && camera.position.y > playerHeight + 0.1 && isGrounded) {
            isGrounded = false;
        }
    }

    // 3. Update coordinate display text
    if (coordsElement) {
        coordsElement.innerText = 
            `X: ${camera.position.x.toFixed(2)} | ` +
            `Y: ${(camera.position.y - playerHeight).toFixed(2)} | ` + 
            `Z: ${camera.position.z.toFixed(2)}`;
    }
}

// ====== Animation Loop ======
function animate() {
    requestAnimationFrame(animate);

    updateMovement();

    renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
