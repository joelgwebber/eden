/// <reference path="lib/threejs/three.d.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="flycontrols.ts"/>
/// <reference path="world.ts"/>
/// <reference path="arcball.ts"/>
/// <reference path="blocks.ts"/>
/// <reference path="math.ts"/>

module Eden {
  var camera: THREE.PerspectiveCamera;
  var scene: THREE.Scene;
  var renderer: THREE.WebGLRenderer;
  var mouse = new THREE.Vector2();
  var controls: FlyControls;
  var world: World;
  var clock = new THREE.Clock();

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onDocumentMouseMove(event) {
    event.preventDefault();
  }

  function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xf0f0f0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = false;
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.rotation.x = -TAU / 4;
    camera.position.x = 5;
    camera.position.y = 8;
    camera.position.z = 6;

    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 2, 3).normalize();
    scene.add(light);

    world = new World(scene);

    controls = new FlyControls(camera);
    controls.movementSpeed = 8;
    controls.rollSpeed = 0.5;
    controls.dragToLook = true;

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
  }

  function render() {
    requestAnimationFrame(render);

    controls.update(clock.getDelta());
    world.update();

    camera.updateMatrixWorld(false);

    renderer.render(scene, camera);
  }

  export function main() {
    init();
    render();
  }
}

Eden.main();
