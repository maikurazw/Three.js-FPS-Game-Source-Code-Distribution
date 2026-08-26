// 🌍 1. インターネット上の公式ファイルを直接インポートする（URLの末尾まで全て必要です）
import * as THREE from 'https://unpkg.com';

// 2. シーン（世界）を作成
const scene = new THREE.Scene();

// 3. カメラ（視点）を作成
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3; // カメラを手前に引く

// 4. レンダラー（映写機）を作成してHTMLのcanvasと紐付ける
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#myCanvas'),
    antialias: true // ギザギザを滑らかにする設定
});
renderer.setSize(window.innerWidth, window.innerHeight);

// 5. ライト（照明）を作成して世界に追加
const light = new THREE.DirectionalLight(0xffffff, 1.5);
light.position.set(1, 1, 1).normalize();
scene.add(light);

// 6. メッシュ（表示する物）を作成
// 箱の「形（ジオメトリ）」と「質感（マテリアル）」を作って合体させる
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 }); // 緑色のツルツルした質感
const cube = new THREE.Mesh(geometry, material);
scene.add(cube); // 世界に箱を追加

// 7. アニメーション関数（1秒間に60回実行されて画面を更新する）
function animate() {
    requestAnimationFrame(animate);

    // 箱を少しずつ回転させる
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // 描画する
    renderer.render(scene, camera);
}

// アニメーションを開始
animate();

// 8. 画面サイズが変更されたときのレスポンシブ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
