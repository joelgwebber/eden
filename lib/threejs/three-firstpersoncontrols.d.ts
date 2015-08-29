/// <reference path="./three.d.ts" />

declare module THREE {
    class FirstPersonControls extends EventDispatcher {
        constructor(object:Camera, domElement?:HTMLElement);

        object:Camera;
        domElement:HTMLElement;

        enabled:boolean;
      	movementSpeed:number;
      	lookSpeed:number;

      	lookVertical: boolean;
      	autoForward: boolean;

      	activeLook: boolean;

      	heightSpeed: boolean;
      	heightCoef: number;
      	heightMin: number;
      	heightMax: number;

      	constrainVertical: boolean;
      	verticalMin: number;
      	verticalMax: number;

      	autoSpeedFactor: number;

        update(delta: number):void;
        handleResize():void;
        handleEvent(event: any):void;
    }
}
