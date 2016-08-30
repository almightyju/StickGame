function WalkOutHouse(game) {
    var me = this,
        house = document.getElementById("house"),
        houseMain = house.querySelector(".main"),
        houseFoundation = house.querySelector(".foundation"),
        houseStair1 = house.querySelector(".stair-1"),
        houseStair2 = house.querySelector(".stair-2"),
        housewindow2 = house.querySelector(".window.br"),
        houseDoor = house.querySelector(".door"),
        walkY = DomObj.offsetTop(houseFoundation, game.playArea) - game.player.dom.clientHeight,
        playerWep = document.querySelector("#player .weapon"),
        playerArm = document.querySelector("#player .armL"),
        mob = document.querySelector("#player").cloneNode(true),
        stage = 0,
        stageTimer = 0;
    game.mobs.forceSpawnSide = "right";
    mob.attributes.removeNamedItem("id");
    ["mob", "character", "size-2", "intro"].forEach(function(i) {
        mob.classList.add(i);
    });
    mob = new DomObj(game, game.playArea, null, mob);
    mob.x = game.playArea.clientWidth;
    mob.y = game.playArea.clientHeight - mob.clientHeight;
    game.player.y = walkY;
    game.player.x = DomObj.offsetLeft(house.querySelector(".window.bl"), game.playArea) + 5;
    game.player.facingRight = true;
    playerWep.classList.add("hidden");
    playerArm.style.transform = "rotate(-20deg)";
    playerArm.style.transition = "0.3s transform";
    playerWep.style.transition = playerArm.style.transition;
    this.run = function(delta, keys, m) {
        if (stage > 1 && stage < 5) movePlayToOtherWindow(delta);
        if (stage < 5) introZombie(delta);
        if (stage >= 5) bangDoor(delta);
        stageTimer += delta * 1000;
    };
    this.skip = function() {
        mob.y = DomObj.offsetTop(houseFoundation, game.playArea) - mob.dom.clientHeight;
        mob.x = mobTargetDoor;
        houseDoor.classList.add("smash");
        mob.dom.classList.add("dead");
        game.player.x = targetFoundation;
        playerWep.classList.remove("hidden");
        document.querySelector("#player")
            .style.zIndex = 12;
        cleanupAndEnd();
    };
    this.end = new EventHandler(this);

    function cleanupAndEnd() {
        [mobMsg, playerMsg, bangMsg].forEach(function(e) {
            if (e != null) e.removeNode(true);
        });
        mob.x -= house.offsetLeft;
        mob.y -= house.offsetTop;
        house.appendChild(mob.dom);
        playerArm.style.transition = "";
        playerWep.style.transition = "";
        me.end.raise();
    };
    var mobTargetStair2 = DomObj.offsetLeft(houseStair2, game.playArea) + houseStair2.clientWidth + 5,
        mobTargetDoor = DomObj.offsetLeft(houseMain, game.playArea) + houseMain.clientWidth + 5,
        mobMsg = null,
        stair1x = DomObj.offsetLeft(houseStair1, game.playArea),
        stair2x = DomObj.offsetLeft(houseStair2, game.playArea),
        step = 0;

    function introZombie(delta) {
        var move = 0,
            targetX = 0;
        if (stage == 0) {
            move = 40 * delta;
            targetX = mobTargetStair2;
        } else if (stage == 1) {
            mobMsg = createMsg("Grawrsfdsa?", mob.dom);
            stage++;
            stageTimer = 0;
        } else if (stage == 2 && stageTimer > 2000) {
            mobMsg.classList.add("anim");
            stage++;
        } else if (stage == 3) {
            if (mobMsg.currentStyle.opacity == 0) stage++;
        } else if (stage == 4) {
            move = 20 * delta;
            targetX = mobTargetDoor;
            if (step == 3) move = 40 * delta;
            else if (step == 2 && mob.x < stair1x - 5) {
                mob.y = DomObj.offsetTop(houseFoundation, game.playArea) - mob.dom.clientHeight;
                step++;
            } else if (step == 1 && mob.x < stair2x - 5) {
                mob.y = DomObj.offsetTop(houseStair1, game.playArea) - mob.dom.clientHeight;
                step++;
            } else if (step == 0 && mob.x < stair2x + houseStair2.clientWidth - 5) {
                mob.y = DomObj.offsetTop(houseStair2, game.playArea) - mob.dom.clientHeight;
                step++;
            }
        }
        if (move > 0) {
            if (mob.x - move < targetX) move = mob.x - targetX;
            mob.x -= move;
            if (move == 0) stage++;
        }
    };
    var playerMsg = null,
        playerTargetWindow2 = DomObj.offsetLeft(housewindow2, game.playArea) + 5;

    function movePlayToOtherWindow(delta) {
        if (stage == 2 && stageTimer > 800 && playerMsg == null) {
            playerMsg = createMsg("Huh?", game.player.dom);
            playerMsg.classList.add("player");
        } else if (stage == 2 && stageTimer > 1600) {
            playerMsg.classList.add("anim");
        }
        var target = 0;
        if (((stage == 2 && stageTimer > 1500) || (stage > 2 && stage < 5)) && step < 3) target = playerTargetWindow2;
        else if (stage == 4 && step > 2) target = playerTargetWindow2 + 30;
        if (target > 0) {
            var move = 100 * delta;
            if (game.player.x + move > target) move = target - game.player.x;
            game.player.x += move;
        }
    };
    var bangMsg = null,
        targetWall = DomObj.offsetLeft(houseMain, game.playArea) + houseMain.clientWidth - game.player.dom.clientWidth,
        targetFoundation = DomObj.offsetLeft(houseFoundation, game.playArea) + houseFoundation.clientWidth - game.player.dom.clientWidth + 5;

    function bangDoor(delta) {
        var move = 0,
            target = 0;
        if (stage == 5) {
            bangMsg = createMsg("BANG", mob.dom);
            stage++;
            stageTimer = 0;
        } else if (stage == 6 && stageTimer > 500) {
            bangMsg.classList.add("anim");
            stage++;
        } else if (stage == 7 && stageTimer > 1000) {
            move = 300 * delta;
            target = targetWall;
        } else if (stage == 8) {
            houseDoor.classList.add("smash");
            mob.dom.classList.add("dead");
            stage++;
        } else if (stage == 9) {
            move = 100 * delta;
            target = targetFoundation;
        } else if (stage == 10) {
            playerArm.style.transform = "rotate(-9Odeg)";
            playerWep.style.transform = playerArm.style.transform;
            stageTimer = 0;
            stage++;
        } else if (stage == 11 && stageTimer > 700 && stageTimer < 1100) {
            playerWep.classList.remove("hidden");
        } else if (stage == 11 && stageTimer > 1100) {
            playerArm.style.transform = "rotate(0deg)";
            playerWep.style.transform = playerArm.style.transform;
            stage++;
            stageTimer = 0;
        } else if (stage == 12 && stageTimer > 200) {
            document.querySelector("#player").style.zIndex = 12;
            cleanupAndEnd();
        }
        if (move > 0) {
            if (game.player.x + move > target) move = target - game.player.x;
            game.player.x += move;
            if (move == 0) stage++;
        }
    };

    function createMsg(msg, byDom) {
        var d = DomObj.createDom("div", game.playArea, "msg");
        d.innerHTML = msg;
        d.style.left = (DomObj.offsetLeft(byDom, game.playArea) + (byDom.clientWidth / 2) - (d.clientWidth / 2)) + "px";
        d.style.top = (DomObj.offsetTop(byDom, game.playArea) - d.clientHeight) + "px";
        return d;
    };
}