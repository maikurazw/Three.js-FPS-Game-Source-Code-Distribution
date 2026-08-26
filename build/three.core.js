// 全てのエクスポート要求を自動で受け流すための特殊なダミー設定
const dummy = 0;
const handler = {
    get: function() { return dummy; }
};
const proxy = new Proxy({}, handler);

// Three.jsが内部で探す定数をまとめて定義（よく使われるもの）
export const AddEquation = 0;
export const SubstractEquation = 0;
export const ReverseSubtractEquation = 0;
export const MinEquation = 0;
export const MaxEquation = 0;
export const ZeroFactor = 0;
export const OneFactor = 0;
export const SrcColorFactor = 0;
export const OneMinusSrcColorFactor = 0;
export const SrcAlphaFactor = 0;
export const OneMinusSrcAlphaFactor = 0;
export const DstAlphaFactor = 0;
export const OneMinusDstAlphaFactor = 0;
export const DstColorFactor = 0;
export const OneMinusDstColorFactor = 0;

// その他の名前で要求されてもエラーにならないように、ファイル全体を丸ごとエクスポート
export default proxy;
