/// <reference path="./three.d.ts" />

declare module THREE {
    class FlyControls extends EventDispatcher {
        constructor(object:Camera, domElement?:HTMLElement);

        object:Camera;
        domElement:HTMLElement;

      	movementSpeed:number;
      	rollSpeed:number;

      	dragToLook: boolean;
      	autoForward: boolean;

        update(delta: number):void;
    }
}
