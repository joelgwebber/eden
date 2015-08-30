/// <reference path="lib/threejs/three.d.ts"/>

module Eden {
    export class FlyControls {
        movementSpeed = 1.0;
        rollSpeed = 0.005;

        dragToLook = false;
        autoForward = false;

        private tmpQuaternion = new THREE.Quaternion();
        private mouseStatus = 0;
        private moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
        private moveVector = new THREE.Vector3();
        private rotationVector = new THREE.Vector3();
        private movementSpeedMultiplier: number;

        constructor(public object: THREE.Camera) {
            document.addEventListener('contextmenu', function(event) { event.preventDefault(); }, false);

            document.addEventListener('mousemove', (evt: MouseEvent) => {this.mousemove(evt)}, false);
            document.addEventListener('mousedown', (evt: MouseEvent) => {this.mousedown(evt)}, false);
            document.addEventListener('mouseup', (evt: MouseEvent) => {this.mouseup(evt)}, false);

            window.addEventListener('keydown', (evt: KeyboardEvent) => {this.keydown(evt)}, false);
            window.addEventListener('keyup', (evt: KeyboardEvent) => {this.keyup(evt)}, false);

            this.updateMovementVector();
            this.updateRotationVector();
        }

        update(delta) {
            var moveMult = delta * this.movementSpeed;
            var rotMult = delta * this.rollSpeed;

            this.object.translateX(this.moveVector.x * moveMult);
            this.object.translateY(this.moveVector.y * moveMult);
            this.object.translateZ(this.moveVector.z * moveMult);

            this.tmpQuaternion.set(this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1).normalize();
            this.object.quaternion.multiply(this.tmpQuaternion);

            // expose the rotation vector for convenience
            this.object.rotation.setFromQuaternion(this.object.quaternion, this.object.rotation.order);
        }

        private keydown(event: KeyboardEvent) {
            if (event.altKey) {
                return;
            }

            switch (event.keyCode) {
                case 16: /* shift */ this.movementSpeedMultiplier = .1; break;

                case 87: /*W*/ this.moveState.forward = 1; break;
                case 83: /*S*/ this.moveState.back = 1; break;

                case 65: /*A*/ this.moveState.left = 1; break;
                case 68: /*D*/ this.moveState.right = 1; break;

                case 82: /*R*/ this.moveState.up = 1; break;
                case 70: /*F*/ this.moveState.down = 1; break;

                case 38: /*up*/ this.moveState.pitchUp = 1; break;
                case 40: /*down*/ this.moveState.pitchDown = 1; break;

                case 37: /*left*/ this.moveState.yawLeft = 1; break;
                case 39: /*right*/ this.moveState.yawRight = 1; break;

                case 81: /*Q*/ this.moveState.rollLeft = 1; break;
                case 69: /*E*/ this.moveState.rollRight = 1; break;
            }

            this.updateMovementVector();
            this.updateRotationVector();
        }

        private keyup(event) {
            switch (event.keyCode) {
                case 16: /* shift */ this.movementSpeedMultiplier = 1; break;

                case 87: /*W*/ this.moveState.forward = 0; break;
                case 83: /*S*/ this.moveState.back = 0; break;

                case 65: /*A*/ this.moveState.left = 0; break;
                case 68: /*D*/ this.moveState.right = 0; break;

                case 82: /*R*/ this.moveState.up = 0; break;
                case 70: /*F*/ this.moveState.down = 0; break;

                case 38: /*up*/ this.moveState.pitchUp = 0; break;
                case 40: /*down*/ this.moveState.pitchDown = 0; break;

                case 37: /*left*/ this.moveState.yawLeft = 0; break;
                case 39: /*right*/ this.moveState.yawRight = 0; break;

                case 81: /*Q*/ this.moveState.rollLeft = 0; break;
                case 69: /*E*/ this.moveState.rollRight = 0; break;
            }

            this.updateMovementVector();
            this.updateRotationVector();
        }

        private mousedown(event) {
            event.preventDefault();
            event.stopPropagation();

            if (this.dragToLook) {
                this.mouseStatus++;
            } else {
                switch (event.button) {
                    case 0: this.moveState.forward = 1; break;
                    case 2: this.moveState.back = 1; break;
                }

                this.updateMovementVector();
            }
        }

        private mousemove(event) {
            if (!this.dragToLook || this.mouseStatus > 0) {
                var halfWidth = window.innerWidth / 2;
                var halfHeight = window.innerHeight / 2;

                this.moveState.yawLeft = - ((event.pageX) - halfWidth) / halfWidth;
                this.moveState.pitchDown = ((event.pageY) - halfHeight) / halfHeight;

                this.updateRotationVector();
            }
        }

        private mouseup(event) {
            event.preventDefault();
            event.stopPropagation();

            if (this.dragToLook) {
                this.mouseStatus--;
                this.moveState.yawLeft = this.moveState.pitchDown = 0;
            } else {
                switch (event.button) {
                    case 0: this.moveState.forward = 0; break;
                    case 2: this.moveState.back = 0; break;
                }
                this.updateMovementVector();
            }

            this.updateRotationVector();
        }

        private updateMovementVector() {
            var forward = (this.moveState.forward || (this.autoForward && !this.moveState.back)) ? 1 : 0;
            this.moveVector.x = (-this.moveState.left + this.moveState.right);
            this.moveVector.y = (-this.moveState.down + this.moveState.up);
            this.moveVector.z = (-forward + this.moveState.back);
        }

        private updateRotationVector() {
            this.rotationVector.x = (-this.moveState.pitchDown + this.moveState.pitchUp);
            this.rotationVector.y = (-this.moveState.yawRight + this.moveState.yawLeft);
            this.rotationVector.z = (-this.moveState.rollRight + this.moveState.rollLeft);
        }
    }
}
