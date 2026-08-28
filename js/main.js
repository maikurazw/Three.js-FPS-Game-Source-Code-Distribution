import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

// --- キー入力を確実に受け取る ---
window.focus();
document.body.tabIndex = 0;
document.body.focus();

// ====== 基本セットアップ ======
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

// ====== HTMLの座標表示用要素を取得 ======
const coordsElement = document.getElementById("coords");

// ====== 視点移動の設定 ======
const controls = new PointerLockControls(camera, document.body);
controls.pointerSpeed = 0.6; 

window.addEventListener("click", () => {
    controls.lock();
});

// ====== ジャンプと重力の変数 ======
let velocityY = 0;        
const gravity = -0.008;    
const jumpStrength = 0.22; 
let isGrounded = true;    
const playerHeight = 1.6;  

// ====== かっこいい床（地面）を表示させる ======
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

// ====== カラフルな街（ビル）と当たり判定の準備 ======
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

    // スタート位置（0, 1.6, 5）の目の前にいきなり重なって動けなくなるのを防ぐため、少し離して設置します
    const x = (Math.random() - 0.5) * 40;
    // Z座標が5の付近（初期位置）にならないように調整
    let z = (Math.random() - 0.5) * 40;
    if (z > 3 && z < 7) z += 4; 
    
    building.position.set(x, buildingHeight / 2, z);
    scene.add(building);
    
    building.geometry.computeBoundingBox();
    buildings.push(building);
}

// プレイヤー自身の当たり判定用の「箱」
const playerBox = new THREE.Box3();

// ====== キー入力管理 ======
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

// ====== 移動・当たり判定・境界制限の処理 ======
function updateMovement() {
    // ----------------------------------------
    // 1. まず横方向（W, A, S, D）の移動を処理
    // ----------------------------------------
    const oldX = camera.position.x;
    const oldZ = camera.position.z;

    const speed = 0.15;
    if (keys["w"]) controls.moveForward(speed);
    if (keys["s"]) controls.moveForward(-speed);
    if (keys["a"]) controls.moveRight(-speed);
    if (keys["d"]) controls.moveRight(speed);
    
    // 今のカメラの位置から、プレイヤーの当たり判定の箱を作ります
    // 足元から頭までの高さをカバーします
    playerBox.setFromCenterAndSize(
        new THREE.Vector3(camera.position.x, camera.position.y - 0.9, camera.position.z),
        new THREE.Vector3(0.6, 1.8, 0.6)
    );

    let isCollidingX_Z = false;
    for (let i = 0; i < buildings.length; i++) {
        const b = buildings[i];
        const buildingBox = b.geometry.boundingBox.clone().translate(b.position);
        
        // 横移動した結果、ビルとごっつんこした場合
        if (playerBox.intersectsBox(buildingBox)) {
            // かつ、自分の足元がビルの屋根より「下」にいる時だけ壁としてぶつかる
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

    // ビルの壁にぶつかった、または床の外に出たら横移動をキャンセル
    if (isCollidingX_Z || isOutOfBounds) {
        camera.position.x = oldX;
        camera.position.z = oldZ;
    }

    // ----------------------------------------
    // 2. 次に縦方向（ジャンプ・落下）の移動を処理
    // ----------------------------------------
    const oldY = camera.position.y;
    camera.position.y += velocityY; 
    velocityY += gravity;           

    // 縦に動いた後の位置でプレイヤーの箱の形を更新
    playerBox.setFromCenterAndSize(
        new THREE.Vector3(camera.position.x, camera.position.y - 0.9, camera.position.z),
        new THREE.Vector3(0.6, 1.8, 0.6)
    );

    let currentMinY = playerHeight; // 最低着地高度（基本は地面の高さ 1.6）

    // すべてのビルに対して、上から乗れるかチェック
    for (let i = 0; i < buildings.length; i++) {
        const b = buildings[i];
        const buildingBox = b.geometry.boundingBox.clone().translate(b.position);
        
        // プレイヤーの箱がビルと重なっているかチェック
        if (playerBox.intersectsBox(buildingBox)) {
            // 落ちている途中で、動く前の足元がビルの屋根より高い位置にあったなら「屋根」を着地点にする
            if (velocityY <= 0 && (oldY - 1.6) >= (buildingBox.max.y - 0.3)) {
                // 地面より高いビルの上が新しい着地地点（currentMinY）になります
                if (buildingBox.max.y + playerHeight > currentMinY) {
                    currentMinY = buildingBox.max.y + playerHeight;
                }
            }
        }
    }

    // 地面、またはビルの屋根の上に着地した時の処理
    if (camera.position.y <= currentMinY) {
        camera.position.y = currentMinY; 
        velocityY = 0;                    
        isGrounded = true;                
    } else {
        // ビルの上から歩いて踏み外した時にちゃんと下に落ちるためのチェック
        if (currentMinY === playerHeight && camera.position.y > playerHeight + 0.1 && isGrounded) {
            // もし地面より高い位置にいるのに「着地中フラグ」が残っていたら、空中状態にする
            isGrounded = false;
        }
    }

    // 3. 画面の下の文字（X, Y, Z）を書き換える
    if (coordsElement) {
        coordsElement.innerText = 
            `X: ${camera.position.x.toFixed(2)} | ` +
            `Y: ${(camera.position.y - playerHeight).toFixed(2)} | ` + 
            `Z: ${camera.position.z.toFixed(2)}`;
    }
}

// ====== アニメーション ======
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
