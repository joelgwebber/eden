/// <reference path="lib/threejs/three.d.ts"/>
/// <reference path="lib/threejs/detector.d.ts"/>
/// <reference path="lib/threejs/three-canvasrenderer.d.ts"/>
/// <reference path="lib/threejs/three-css3drenderer.d.ts"/>
/// <reference path="lib/threejs/three-projector.d.ts"/>
/// <reference path="lib/threejs/three-orbitcontrols.d.ts"/>
/// <reference path="./lib/threejs/three-firstpersoncontrols.d.ts"/>
/// <reference path="./lib/threejs/three-flycontrols.d.ts"/>
/// <reference path="lib/threejs/three-trackballcontrols.d.ts"/>
/// <reference path="lib/threejs/three-effectcomposer.d.ts"/>
/// <reference path="lib/threejs/three-renderpass.d.ts"/>
/// <reference path="lib/threejs/three-shaderpass.d.ts"/>
/// <reference path="lib/threejs/three-copyshader.d.ts"/>

/// <reference path="lib/csg/csg.d.ts"/>

/// <reference path="world.ts"/>
/// <reference path="arcball.ts"/>
/// <reference path="blocks.ts"/>

module Eden {
  var camera: THREE.PerspectiveCamera;
  var scene: THREE.Scene;
  var renderer: THREE.WebGLRenderer;
  var mouse = new THREE.Vector2();
  var controls: THREE.FlyControls;
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
    var container = document.createElement('div');
    document.body.appendChild(container);

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xf0f0f0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.sortObjects = false;
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 20;

    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 2, 3).normalize();
    scene.add(light);

    world = new World(scene);

    controls = new THREE.FlyControls(camera, container);
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
