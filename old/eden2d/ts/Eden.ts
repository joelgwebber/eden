///<reference path='Region.ts'/>
///<reference path='Message.ts'/>
///<reference path='Controller.ts'/>
///<reference path='Connection.ts'/>
///<reference path='pixi.js.d.ts'/>

module eden {

  import Px = PIXI;
  import Loaders = Px.loaders;
  import WebGLRenderer = PIXI.WebGLRenderer;

  var _renderer: Px.SystemRenderer;
  var _root: Px.Container;
  var _connection: Connection;
  var _controller: Controller;

  export function main() {
    _renderer = Px.autoDetectRenderer(1000, 1000, {
      backgroundColor: 0xffffff,
      autoResize: true
    });

    document.body.appendChild(_renderer.view);
    _root = new Px.Container();
    _root.scale.x = _root.scale.y = 2;

    _connection = new Connection(_root, {
      onConnected: () => { _controller.onConnected(); },
      onDisconnected: () => { _controller.onDisconnected(); }
    });
    _controller = new Controller({
      onPlayerAction: (type, args) => { _connection.sendPlayerAction(type, args); }
    });

    // Kick off the rendering loop.
    animate();
  }

  export function log(...args: any[]) {
    console.log.apply(this, args)
  }

  // Rendering loop.
  function animate() {
    requestAnimationFrame(animate);
    _renderer.resize(window.innerWidth, window.innerHeight);
    _renderer.render(_root);
  }
}

eden.main();
