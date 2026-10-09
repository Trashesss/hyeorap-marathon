// 그림을 그릴 캔버스와 WebGL. 만들 수 없는 브라우저에서는 안내를 띄우고 멈춘다.
export const canvas = document.getElementById('view');

function create() {
  try {
    return new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch (error) {
    document.getElementById('fail').hidden = false;
    throw new Error('이 브라우저에서는 WebGL을 쓸 수 없습니다');
  }
}
export const renderer = create();
