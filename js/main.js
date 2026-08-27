// ⭕ 1行目はこれだけにします！URLを使わないので、絶対に文字が削れません！
import * as THREE from 'three';

// 2. シーン（世界）を作成
const scene = new THREE.Scene();

// 3. カメラ（視点）を作成
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;

// 4. レンダラー（映写機）を作成してHTMLのcanvasと紐付ける
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#myCanvas'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);

// 5. ライト（照明）を作成
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(1, 1, 1).normalize();
scene.add(light);

// 6. メッシュ（立方体）を作成
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 }); // 緑色の立方体
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 7. アニメーション関数
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animate();

// 8. 画面サイズ変更のレスポンシブ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
