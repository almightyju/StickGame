function DriveAway(game) {
    var me = this,
        targetWalkTo = DomObj.offsetLeft(game.playArea.querySelector(".front-window"), game.playArea),
        distance = targetWalkTo - game.player.x,
        carDoor = game.player.car.dom.querySelector(".cbody .door"),
        inCarPlayer = game.player.car.dom.querySelector(".cbody .player"),
        stage = 0,
        stageTimer = 0;
    game.player.dom.querySelector(".weapon").classList.add("hidden");
    game.player.facingRight = distance > 0;
    game.player.dom.querySelector(".armL").style.transform = "rotate(Orad)";
    this.run = function(delta, keys, m) {
        if (stage == 0) moveToCar(delta);
        else if (stage >= 1) enterCar(delta);
    };
    this.end = new EventHandler(this);

    function moveToCar(delta) {
        var move = game.upgrades.state.player.moveSpeed * delta;
        if (Math.abs(distance) - move < 0) move = distance;
        else if (distance < 0) move = -move;
        game.player.x += move;
        distance -= move;
        if (move == 0) stage++;
    };

    function enterCar(delta) {
        delta = delta * 1000;
        if (stageTimer == 0 && stage == 1) {
            carDoor.classList.add("open");
            stage++;
        }
        if (stageTimer > 1000 && stage == 2) {
            game.player.dom.classList.add("hidden");
            inCarPlayer.classList.remove("hidden");
            stage++;
        }
        if (stageTimer > 1300 && stage == 3) {
            carDoor.classList.remove("open");
            stage++;
        }
        if (stageTimer > 2500 && stage == 4) {
            game.player.car.dom.classList.add("drive");
            stage++;
        }
        if (stageTimer > 4500 && stage == 5) me.end.raise();
        stageTimer += delta;
    };
}