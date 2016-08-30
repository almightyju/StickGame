function RunAway(game) {
    var me = this,
        car = game.playArea.querySelector("#car"),
        carDoor = car.querySelector(".door"),
        carWeapon = car.querySelector(".weapon"),
        carWep = car.querySelector(".wep"),
        unlockWep = null,
        stage = 0,
        stageTimer = 0;
    game.mobs.forceSpawnSide = null;
    car.classList.remove("hidden");
    car.style.top = (game.playArea.clientHeight - car.clientHeight) + "px";
    car.style.left = (game.playArea.clientWidth + 140) + "px";
    GUI.addWeaponDivs(carWeapon);
    for (var i = 0; i < carWep.classList.length; i++)
        if (game.upgrades.state.weapons.hasOwnProperty(carWep.classList[i])) {
            unlockWep = carWep.classList[i];
            break;
        }
    if (unlockWep == null) throw new Error("cant work out what weapon is in the car....");
    game.player.facingRight = true;
    game.player.dom.querySelector(".armL").style.transform = "rotate(-20deg)";
    game.player.dom.querySelector(".weapon").style.transform = "rotate(-20deg)";
    this.run = function(delta, keys, m) {
        if (stage == 0) init(delta);
        if (stage == 1) runToEdge(delta);
        if (stage == 2) moveHouseAndCar(delta);
        if (stage >= 3 && stage <= 5) centraliseCar(delta);
        if (stage == 6) me.end.raise();
    };
    this.skip = function() {
        house.style.left = -house.clientWidth + "px";
        game.upgrades.unlockWeapon(unlockWep);
        game.player.weapon = unlockWep;
        carWep.classList.add("anim");
        car.style.left = (midPoint - (car.clientWidth / 2)) + "px";
        game.player.x = car.offsetLeft + 30;
        game.player.y = game.playArea.clientHeight - game.player.dom.clientHeight;
        me.end.raise();
    };
    this.end = new EventHandler(this);
    var runTo80Percent = game.playArea.clientWidth * 0.9;

    function init(delta) {
        if (game.player.x > runTo80Percent) stage = 2;
        else stage = 1;
    };

    function runToEdge(delta) {
        if (game.player.moveTo(delta, runTo80Percent)) stage++;
    };
    var house = game.playArea.querySelector("#house");

    function moveHouseAndCar(delta) {
        moveTo(delta, house, 0 - house.clientWidth, game.upgrades.state.player.moveSpeed);
        moveTo(delta, car, game.player.x - 30, game.upgrades.state.player.moveSpeed);
    };
    var midPoint = game.playArea.clientWidth / 2;

    function centraliseCar(delta) {
        if (stageTimer == 0) {
            carDoor.classList.add("open");
        } else if (stage == 4 && stageTimer > 3000) {
            carDoor.classList.remove("open");
            stage++;
            stageTimer = 0;
        } else if (stage == 3 && stageTimer > 2700) {
            game.upgrades.unlockWeapon(unlockWep);
            game.player.weapon = unlockWep;
            stage++;
        } else if (stage == 3 && stageTimer > 2000) {
            carWep.classList.add("anim");
        }
        var moveCarDone = moveTo(delta, car, midPoint - (car.clientWidth / 2), game.upgrades.state.player.moveSpeed, false),
            moveHouseDone = moveTo(delta, house, 0 - house.clientWidth, game.upgrades.state.player.moveSpeed, false);
        game.player.x = car.offsetLeft + 30;
        if (stage == 5 && stageTimer > 1000 && moveCarDone && moveHouseDone) {
            stage++;
            stageTimer = 0;
            return;
        }
        stageTimer += delta * 1000;
    };

    function moveTo(delta, obj, target, moveSpeed, incStage) {
        if (typeof incStage == "undefined") incStage = true;
        var move = moveSpeed * delta;
        if (obj.offsetLeft - move < target) move = obj.offsetLeft - target;
        var origLeft = obj.style.left;
        obj.style.left = (obj.offsetLeft - move) + "px";
        if (origLeft == obj.style.left && incStage) stage++;
        return origLeft == obj.style.left;
    };
}