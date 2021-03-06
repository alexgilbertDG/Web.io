var global = require('./global');
const $ = require('jquery');
const Hammer = require('hammerjs');


class Control {
    constructor() {
        this.directionLock = false;
        this.target = global.target;
        this.reenviar = true;

        this.mouseTimer = 0;
        this.mouseTimerID = -1;

        this.directions = [];
        var self = this;

        this.cv = document.getElementById('cvs');
        this.cv.width = global.screenWidth;
        this.cv.height = global.screenHeight;
        this.cv.addEventListener('mousemove', this.gameInput, false);
        this.cv.addEventListener('mouseout', this.outOfBounds, false);
        this.cv.addEventListener('keypress', this.keyInput, false);
        this.cv.addEventListener('keyup', function (event) {
            self.reenviar = true;
            self.directionUp(event);
        }, false);
        this.cv.addEventListener('keydown', this.directionDown, false);
        this.cv.addEventListener('touchstart', this.touchInput, false);
        //this.cv.addEventListener('touchmove', this.touchInput, false);
        this.cv.addEventListener('touchend', this.touchEnd, false);


        this.cv.addEventListener("mousedown", this.mouseDown, false);
        this.cv.addEventListener("mouseup", this.mouseUp, false);
        this.cv.parent = self;
        global.control = this;


        $("#split").click(function () {
            //socket.emit('1');
            window.control.reenviar = false;
        });

        $("#move").on('tap', function (event) {
            console.log('move click');
            self.keyInput({which:global.KEY_LEFT});
            window.control.reenviar = false;
        });
    }

    mouseDown(event) {
        this.mouseTimer = 0;
        var self = this.parent;

        var pos = {x: event.clientX - this.width / 2, y: event.clientY - this.height / 2};


        //normalize vector
        var dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
        pos.x /= dist;
        pos.y /= dist;

        console.log(pos);
        if (global.socket) {
            global.socket.emit("shooting", pos, {
                x: event.clientX - this.width / 2,
                y: event.clientY - this.height / 2
            });
        }

        this.mouseTimerID = setInterval(() => this.mouseTimer++, 10);
    }

    mouseUp(event) {
        console.log('mouse UP');
        console.log(this.mouseTimer);
        clearInterval(this.mouseTimerID);
        if (global.player.webAttach !== null && this.mouseTimer > 10) {
            console.log('mouseUPShooting');
            global.socket.emit("mouseUPShooting");
        } else {
            console.log('deleteWebAttach');
            global.socket.emit("deleteWebAttach");
        }

        this.mouseTimer = 0;
    }

    // Function called when a key is pressed, will change direction if arrow key.
    directionDown(event) {
        var key = event.which || event.keyCode;
        var self = this.parent; // have to do this so we are not using the cv object
        if (self.directional(key)) {
            self.directionLock = true;
            if (self.newDirection(key, self.directions, true)) {
                self.updateTarget(self.directions);
                global.socket.emit('0', self.target);
            }
        }
    }

    // Function called when a key is lifted, will change direction if arrow key.
    directionUp(event) {
        var key = event.which || event.keyCode;
        if (this.directional(key)) { // this == the actual class
            if (this.newDirection(key, this.directions, false)) {
                this.updateTarget(this.directions);
                if (this.directions.length === 0) this.directionLock = false;
                global.socket.emit('0', this.target);
            }
        }
    }

    // Updates the direction array including information about the new direction.
    newDirection(direction, list, isAddition) {
        var result = false;
        var found = false;
        for (var i = 0, len = list.length; i < len; i++) {
            if (list[i] === direction) {
                found = true;
                if (!isAddition) {
                    result = true;
                    // Removes the direction.
                    list.splice(i, 1);
                }
                break;
            }
        }
        // Adds the direction.
        if (isAddition && found === false) {
            result = true;
            list.push(direction);
        }

        return result;
    }

    // Updates the target according to the directions in the directions array.
    updateTarget(list) {
        this.target = {x: 0, y: 0};
        var directionHorizontal = 0;
        var directionVertical = 0;
        for (var i = 0, len = list.length; i < len; i++) {
            if (directionHorizontal === 0) {
                if (list[i] === global.KEY_LEFT || list[i] === global.KEY_LEFT_A) directionHorizontal -= Number.MAX_VALUE;
                else if (list[i] === global.KEY_RIGHT || list[i] === global.KEY_RIGHT_D) directionHorizontal += Number.MAX_VALUE;
            }
            if (directionVertical === 0) {
                if (list[i] === global.KEY_UP || list[i] === global.KEY_UP_W) directionVertical -= Number.MAX_VALUE;
                else if (list[i] === global.KEY_DOWN || list[i] === global.KEY_DOWN_S) directionVertical += Number.MAX_VALUE;
            }
        }
        this.target.x += directionHorizontal;
        this.target.y += directionVertical;
        global.target = this.target;
    }

    directional(key) {
        return this.horizontal(key) || this.vertical(key);
    }

    horizontal(key) {
        return key === global.KEY_LEFT || key === global.KEY_RIGHT || key === global.KEY_LEFT_A || key === global.KEY_RIGHT_D;
    }

    vertical(key) {
        return key === global.KEY_DOWN || key === global.KEY_UP || key === global.KEY_UP_W || key === global.KEY_DOWN_S;
    }

    // Register when the mouse goes off the canvas.
    outOfBounds() {
        if (!global.continuity) {
            this.parent.target = {x: 0, y: 0};
            global.target = this.parent.target;
        }
    }

    gameInput(mouse) {
        global.cursor.x = mouse.clientX;
        global.cursor.y = mouse.clientY;
    }

    touchEnd(touch) {
        global.socket.emit("mouseUPShooting");
    }


    touchInput(touch) {
        console.log(touch);
        touch.preventDefault();
        touch.stopPropagation();
        var event = touch.touches[0];
        var pos = {x: event.clientX - this.width / 2, y: event.clientY - this.height / 2};


        //normalize vector
        var dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
        pos.x /= dist;
        pos.y /= dist;

        console.log(pos);
        if (global.socket) {
            global.socket.emit("shooting", pos, {
                x: event.clientX - this.width / 2,
                y: event.clientY - this.height / 2
            });
        }

        if (!this.directionLock) {
            this.parent.target.x = touch.touches[0].clientX - this.width / 2;
            this.parent.target.y = touch.touches[0].clientY - this.height / 2;
            global.target = this.parent.target;
        }
    }

    // Chat command callback functions.
    keyInput(event) {
        var key = event.which || event.keyCode;
        if (key === global.KEY_FIREFOOD && this.parent.reenviar) {
            this.parent.socket.emit('1');
            this.parent.reenviar = false;
        }
        else if (key === global.KEY_SPLIT && this.parent.reenviar) {
            document.getElementById('split_cell').play();
            this.parent.socket.emit('2');
            this.parent.reenviar = false;
        }
        else if (key === global.KEY_CHAT) {
            document.getElementById('chatInput').focus();
        }
    }
}

module.exports = Control;
