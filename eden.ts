/// <reference path="lib/threejs/three.d.ts"/>
/// <reference path="lib/threejs/detector.d.ts"/>
/// <reference path="lib/threejs/three-canvasrenderer.d.ts"/>
/// <reference path="lib/threejs/three-css3drenderer.d.ts"/>
/// <reference path="lib/threejs/three-projector.d.ts"/>
/// <reference path="lib/threejs/three-orbitcontrols.d.ts"/>
/// <reference path="lib/threejs/three-trackballcontrols.d.ts"/>
/// <reference path="lib/threejs/three-effectcomposer.d.ts"/>
/// <reference path="lib/threejs/three-renderpass.d.ts"/>
/// <reference path="lib/threejs/three-shaderpass.d.ts"/>
/// <reference path="lib/threejs/three-copyshader.d.ts"/>

/// <reference path="lib/csg/csg.d.ts"/>

/// <reference path="world.ts"/>
/// <reference path="arcball.ts"/>
/// <reference path="blocks.ts"/>

declare module THREE {
  var AWDLoader: any;
  var FlyControls: any;
  var BloomPass: any;
  var DotScreenShader: Shader;
  var RGBShiftShader: Shader;
  var FXAAShader: Shader;
}

module Eden {
  var camera: THREE.PerspectiveCamera;
  var scene: THREE.Scene;
  var renderer: THREE.WebGLRenderer;
  var mouse = new THREE.Vector2();
  var target = new THREE.Vector3();
  var radius = 20, theta = 0, phi = 0;
  var world: World;

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onDocumentMouseMove(event) {
    event.preventDefault();
    theta = - (event.clientX / window.innerWidth) * 2 + 1;
    phi = - (event.clientY / window.innerHeight) * 2 + 1;
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

    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    world = new World(scene);
    target.x = 8; target.z = 8;

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
  }

  function render() {
    requestAnimationFrame(render);

    world.update();

    camera.position.x = radius * Math.cos(theta) * Math.cos(phi);
    camera.position.y = radius * Math.sin(phi);
    camera.position.z = radius * Math.sin(theta) * Math.cos(phi);
    camera.lookAt(target);

    camera.updateMatrixWorld(false);

    renderer.render(scene, camera);
  }

  export function main() {
    init();
    render();
  }
}

Eden.main();
