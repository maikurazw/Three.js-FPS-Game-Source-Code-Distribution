// 1. 素材パック（three.module.js）から機能を取り出す
import * as THREE from './three.module.js';

// 2. 3Dの「世界（シーン）」を作る
const scene = new THREE.Scene();

// 3. 「カメラ」を作って設置する 👈 別ファイル（ここ）で組む！
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5; // カメラの位置を調整

// 4. 「ライト（照明）」を作って設置する 👈 別ファイル（ここ）で組む！
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light); // 世界にライトを追加

// 5. 「動かす（レンダリング）」
// （ここにアニメーションなどの処理を書いて画面に映します）
