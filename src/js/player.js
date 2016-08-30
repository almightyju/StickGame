function Player(game) {
    DomObj.call(this, game, game.playArea, "#player");
    var me = this;
    this.x = (this.dom.parentElement.clientWidth / 2) - this.dom.clientWidth;
    this.y = this.dom.parentElement.clientHeight - this.dom.clientHeight;
    this.dom.classList.add("pistol");
    this.onSelectWeapon = new EventHandler(this);
    this.hpChange = new EventHandler(this);
    Object.defineProperty(this, "facingRight", {
        get: function() {
            return me.dom.classList.contains("right");
        },
        set: function(val) {
            me.dom.classList[val ? "add" : "remove"]("right");
        }
    });
    Object.defineProperty(this, "weapon", {
        get: function() {
            return weapons[me.weaponList.filter(function(v) {
                return me.dom.classList.contains(v);
            })[0]];
        },
        set: function(val) {
            me.dom.classList.remove(this.weapon.name);
            me.dom.classList.add(val);
            this.onSelectWeapon.raise(val);
        }
    });
    Object.defineProperty(this, "weaponList", {
        get: function() {
            return wepList;
        }
    });
    Object.defineProperty(this, "reloadingWeapons", {
        get: function() {
            return Object.getOwnPropertyNames(weapons).filter(function(name) {
                return weapons[name].reloadTime > Number.MIN_VALUE;
            }).map(function(name) {
                var wep = weapons[name],
                    reloadSpeed = game.upgrades.state.weapons[name].reloadSpeed;
                return {
                    name: name,
                    percentDone: (reloadSpeed - wep.reloadTime) / reloadSpeed * 100
                };
            });
        }
    });
    Object.defineProperty(this, "maxHp", {
        get: function() {
            return game.upgrades.state.player.maxHealth;
        }
    });
    Object.defineProperty(this, "hp", {
        get: function() {
            return hp;
        },
        set: function(v) {
            v = Math.clamp(v, 0, me.maxHp);
            var raiseChange = v != hp;
            hp = v;
            if (raiseChange) me.hpChange.raise(v);
        }
    });
    Object.defineProperty(this, "onGround", {
        get: function() {
            return onGround;
        }
    });
    Object.defineProperty(this, "car", {
        get: function() {
            return car;
        }
    });
    Object.defineProperty(this, "ledgeY", {
        get: function() {
            return lastLedgeY;
        }
    });
    var moveSpeed = 60;
    jumpTime = 1;
    jumpHeight = 30, weapons = {
        pistol: {
            bulletYOffset: 1,
            autofire: false,
            bulletSpeed: 1500
        },
        uzi: {
            bulletYOffset: 1,
            autofire: true,
            bulletSpeed: 1300
        }
    }, hp = -1, lastMaxHp = -1, invincibleTime = 1, gunTip = {
        x: 0,
        y: 0,
        angle: 0,
        fireUp: false
    }, wepList = Object.getOwnPropertyNames(weapons), car = null, ledges = [];

    function upgradeBought() {
        moveSpeed = game.upgrades.state.player.moveSpeed;
        jumpHeight = game.upgrades.state.player.jumpHeight;
        if (lastMaxHp < me.maxHp) {
            me.hp = me.maxHp;
            lastMaxHp = me.maxHp;
        }
        invincibleTime = game.upgrades.state.player.invincibleTime;
    };
    this.init = function() {
        for (var wep in weapons) {
            weapons[wep].name = wep;
            weapons[wep].clip = game.upgrades.state.weapons[wep].clipSize;
            weapons[wep].reloadTime = Number.MIN_VALUE;
        }
        game.upgrades.upgradeBought.addListener(upgradeBought);
        me.hp = me.maxHp;
        lastMaxHp = me.maxHp;
        setupLedges();
    };
    this.setupCar = function() {
        car = new Car(game);
        car.repairStateChange.addListener(setupLedges);
    };
    this.drawFrame = function(delta, keys, mouse) {
        handleMovement.call(this, delta, keys);
        handleAim.call(this, delta, mouse);
        handleFire.call(this, delta, keys, mouse);
        handleReload.call(this, delta, keys, mouse);
        handleChangeWeapon.call(this, delta, keys, mouse);
        if (car != null) car.handleRepair(delta, keys, mouse);
    };
    this.collisionDetect = function(delta) {
        checkBulletCollisions(delta);
        checkMobCollisions(delta);
    };
    this.moveTo = function(delta, targetX) {
        var keys = {
            left: false,
            right: false
        };
        if (targetX > me.x) keys.right = true;
        if (targetX < me.x) keys.left = true;
        var minX = keys.left ? targetX : me.x;
        var maxX = keys.left ? me.x : targetX;
        handleMovement.call(me, delta, keys, minX, maxX);
        return me.x == targetX;
    };

    function setupLedges() {
        ledges = [];
        var doms = [game.playArea.querySelector("#house .foundation"), game.playArea.querySelector("#house .stair-1"), game.playArea.querySelector("#house .stair-2")];
        if (car != null) doms = doms.concat([car.dom.querySelector(".lbody"), car.dom.querySelector(".body"), car.dom.querySelector(".rbody")]);
        for (var i = 0; i < doms.length; i++) {
            var d = doms[i];
            if (d == null || d.clientHeight == 0) continue;
            var x = DomObj.offsetLeft(d, game.playArea);
            ledges.push({
                x: x,
                x2: x + d.clientWidth,
                y: DomObj.offsetTop(d, game.playArea)
            });
        }
        ledges.push({
            x: 0,
            x2: game.playArea.clientWidth,
            y: game.playArea.clientHeight
        });
    };
    game.endPhase.addListener(function(phase) {
        preJumpY = me.y;
        inAir = false;
        onGround = me.y == game.playArea.clientHeight - me.dom.clientHeight;
        setupLedges();
    });
    var preJumpY = this.y,
        curJumpTime = 0,
        inAir = false,
        onGround = true,
        lastLedgeY = game.playArea.clientHeight,
        halfJumpTime = jumpTime / 2,
        midCurve = (halfJumpTime * jumpTime) - (Math.pow(halfJumpTime, 2));

    function handleMovement(delta, keys, minX, maxX) {
        if (keys.left) this.x -= moveSpeed * delta;
        else if (keys.right) this.x += moveSpeed * delta;
        if (typeof minX == "undefined") minX = 0;
        if (typeof maxX == "undefined") maxX = game.playArea.clientWidth - me.dom.clientWidth;
        this.x = Math.clamp(this.x, minX, maxX);
        var intersectLedge = null,
            thisX2 = this.x + this.dom.clientWidth,
            thisY2 = this.y + this.dom.clientHeight;
        for (var i = 0; i < ledges.length; i++)
            if (((this.x >= ledges[i].x && this.x <= ledges[i].x2) || (thisX2 >= ledges[i].x && thisX2 <= ledges[i].x2)) && (thisY2 - 3 <= ledges[i].y && thisY2 + 3 >= ledges[i].y)) {
                intersectLedge = ledges[i];
                break;
            }
        if (keys.up && !inAir) {
            curJumpTime = 0;
            inAir = true;
        } else if (intersectLedge == null && !inAir) {
            curJumpTime = jumpTime;
            inAir = true;
        } else if (inAir && intersectLedge != null && curJumpTime > halfJumpTime) {
            this.y = intersectLedge.y - this.dom.clientHeight;
            preJumpY = this.y;
            inAir = false;
            onGround = intersectLedge.y == game.playArea.clientHeight;
            lastLedgeY = intersectLedge.y;
        }
        if (inAir) {
            curJumpTime += delta;
            var percentOfJump = ((jumpTime * curJumpTime) - (Math.pow(curJumpTime, 2))) / midCurve * 100,
                yOffset = jumpHeight / 100 * percentOfJump;
            this.y = preJumpY - yOffset;
        }
        if (car != null) {
            if (inAir || keys.right || keys.left) car.repairing = false;
            if (!inAir && onGround && keys.e)
                if (me.x >= car.x && me.x + me.dom.clientWidth <= car.x + car.dom.clientWidth) car.repairing = true;
        }
    };
    var armL = this.dom.querySelector(".armL"),
        weapon = this.dom.querySelector(".weapon");

    function handleAim(delta, mouse) {
        var centerY = DomObj.offsetTop(weapon) + this.weapon.bulletYOffset,
            centerX = DomObj.offsetLeft(armL) + armL.clientWidth,
            adj = Math.abs(centerX - mouse.x),
            opp = Math.abs(centerY - mouse.y),
            oppDadj = opp / adj,
            angleRad = Math.atan(oppDadj);
        if (mouse.x > centerX) this.facingRight = true;
        if (mouse.x < centerX) this.facingRight = false;
        var hyp = armL.clientWidth + (DomObj.offsetLeft(armL) - DomObj.offsetLeft(weapon)) - (this.facingRight ? 1 : 0),
            opp = Math.sin(angleRad) * hyp,
            adj = Math.cos(angleRad) * hyp;
        if (mouse.y > centerY) angleRad = -angleRad;
        armL.style.transform = "rotate(" + angleRad + "rad)";
        weapon.style.transform = armL.style.transform;
        gunTip.fireUp = mouse.y <= centerY;
        gunTip.angle = this.facingRight ? -angleRad : angleRad;
        gunTip.x = centerX + (this.facingRight ? adj : -adj) - DomObj.offsetLeft(game.playArea);
        gunTip.y = centerY + (gunTip.fireUp ? -opp : opp) - DomObj.offsetTop(game.playArea);
    };
    var lastFire = 0,
        fired = false,
        bullets = [];

    function handleReload(delta, keys, mouse) {
        if ((this.weapon.clip == 0 || keys.r) && this.weapon.reloadTime == Number.MIN_VALUE) this.weapon.reloadTime = game.upgrades.state.weapons[this.weapon.name].reloadSpeed;
        for (var wep in weapons) {
            if (weapons[wep].reloadTime == Number.MIN_VALUE) continue;
            if (weapons[wep].reloadTime > 0) weapons[wep].reloadTime -= delta;
            if (weapons[wep].reloadTime <= 0) {
                weapons[wep].clip = game.upgrades.state.weapons[wep].clipSize;
                weapons[wep].reloadTime = Number.MIN_VALUE;
            }
        }
    };

    function handleFire(delta, keys, mouse) {
        if ((keys.space || mouse.left) && lastFire <= 0 && !fired && this.weapon.clip > 0 && this.weapon.reloadTime == Number.MIN_VALUE) {
            addNewBullet();
            if (car != null) car.repairing = false;
        }
        if (!keys.space && !mouse.left) fired = false;
        if (lastFire > 0) lastFire -= delta;
        moveBullets(delta);
    };

    function addNewBullet() {
        var nB = {
            x: gunTip.x,
            y: gunTip.y,
            angle: gunTip.angle,
            dom: DomObj.createDom("div", game.playArea, "bullet"),
            weapon: me.weapon,
            direction: {
                left: !me.facingRight,
                up: gunTip.fireUp
            },
            pierce: game.upgrades.state.weapons[me.weapon.name].piercing || 0,
            hitMobs: []
        };
        nB.dom.style.transform = "rotate(" + nB.angle + "rad)";
        bullets.push(nB);
        lastFire = game.upgrades.state.weapons[me.weapon.name].fireSpeed;
        me.weapon.clip -= 1;
        fired = true;
        if (me.weapon.autofire) fired = false;
    };

    function moveBullets(delta) {
        var bulletsToRemove = [];
        for (var i = 0; i < bullets.length; i++) {
            var b = bullets[i],
                hyp = (b.weapon.bulletSpeed * delta),
                opp = Math.sin(b.angle) * hyp,
                adj = Math.cos(b.angle) * hyp;
            b.previousX = b.x;
            b.previousY = b.y;
            if (b.direction.left) {
                b.x -= adj;
                b.y -= opp;
            } else {
                b.x += adj;
                b.y += opp;
            }
            if (b.x < -b.dom.clientWidth || b.y < -b.dom.clientHeight || b.x > me.dom.parentElement.clientWidth || b.y > me.dom.parentElement.clientHeight) bulletsToRemove.push(i);
            b.dom.style.top = b.y + "px";
            b.dom.style.left = b.x + "px";
        }
        for (var i = 0; i < bulletsToRemove.length; i++) removeBullet(bulletsToRemove[i]);
    };

    function removeBullet(i) {
        var b = bullets.splice(i, 1)[0];
        if (typeof b == "undefined") {
            console.warn("wtf? i dunno man");
            return;
        }
        b.dom.removeNode();
    };

    function checkBulletCollisions() {
        var bulletsToRemove = [],
            xOrderedMobs = [];
        for (var j = 0, m = game.mobs.mobs[j]; j < game.mobs.mobs.length; j++, m = game.mobs.mobs[j])
            if (m.hp > 0) xOrderedMobs.push(m);
        xOrderedMobs.sort(function(a, b) {
            return a.dom.x - b.dom.x;
        });
        for (var i = 0, b = bullets[i]; i < bullets.length; i++, b = bullets[i]) {
            var remBullet = false;
            for (var j = b.direction.left ? xOrderedMobs.length - 1 : 0, m = xOrderedMobs[j]; 
                    b.direction.left ? j >= 0 : j < xOrderedMobs.length;
                    b.direction.left ? j-- : j++, m = xOrderedMobs[j]) {
                if (b.hitMobs.indexOf(m) > -1) continue;
                var mobX = m.dom.x,
                    mobX2 = m.dom.x + m.dom.dom.clientWidth,
                    mobY = m.dom.y,
                    mobY2 = m.dom.y + m.dom.dom.clientHeight,
                    xCollide = false,
                    yCollide = false;
                var xStartedInside = b.previousX >= mobX && b.previousX <= mobX2,
                    xEndedInside = b.x >= mobX && b.x <= mobX2;
                xCollide = (xStartedInside && xEndedInside) || 
                           (xStartedInside && !xEndedInside) || 
                           (!xStartedInside && xEndedInside);
                if (b.direction.left) 
                    xCollide = xCollide || (b.previousX >= mobX2 && b.x <= mobX);
                else 
                    xCollide = xCollide || (b.previousX <= mobX && b.x >= mobX2);
                if (!xCollide) continue;

                var yStartedInside = b.previousY >= mobY && b.previousY <= mobY2,
                    yEndedInside = b.y >= mobY && b.y <= mobY2;
                yCollide = (yStartedInside && yEndedInside) || 
                           (yStartedInside && !yEndedInside) || 
                           (!yStartedInside && yEndedInside);
                if (b.direction.up) 
                    yCollide = yCollide || (b.previousY >= mobY2 && b.y <= mobY);
                else 
                    yCollide = yCollide || (b.previousY <= mobY && b.y >= mobY2);
                if (!yCollide) continue;

                game.mobs.hit(m, game.upgrades.state.weapons[b.weapon.name].damage);
                b.hitMobs.push(m);
                if (b.pierce-- == 0) {
                    remBullet = true;
                    break;
                }
            }
            if (remBullet) {
                bulletsToRemove.push(i);
                break;
            }
        }
        for (var i = 0; i < bulletsToRemove.length; i++) removeBullet(bulletsToRemove[i]);
    };
    var invincibleCounter = -10000,
        preInvincibleMoveSpeed;

    function checkMobCollisions(delta) {
        if (invincibleCounter >= 0) {
            invincibleCounter -= delta;
            return;
        }
        if (invincibleCounter > -10000) {
            invincibleCounter = -10000;
            moveSpeed = preInvincibleMoveSpeed;
            me.dom.classList.remove("hit");
        }
        var meX2 = me.x + me.dom.clientWidth,
            meY2 = me.y + me.dom.clientHeight,
            hit = false;
        for (var i = 0, m = game.mobs.mobs[i]; !hit && i < game.mobs.mobs.length; i++, m = game.mobs.mobs[i]) {
            if (m.hp <= 0) continue;
            var mX2 = m.dom.x + m.dom.dom.clientWidth,
                mY2 = m.dom.y + m.dom.dom.clientHeight;
            var xCollide = (m.dom.x >= me.x && m.dom.x <= meX2) || (mX2 <= meX2 && mX2 >= me.x) || (m.dom.x >= me.x && mX2 <= meX2),
                yCollide = (m.dom.y >= me.y && m.dom.y <= meY2) || (mY2 <= meY2 && mY2 >= me.y) || (m.dom.y >= me.y && mY2 <= meY2);
            if (xCollide && yCollide) hit = true;
        }
        if (hit) {
            invincibleCounter = invincibleTime;
            preInvincibleMoveSpeed = moveSpeed;
            moveSpeed += moveSpeed / 2;
            me.hpChange.raise(--hp);
            me.dom.classList.add("hit");
        }
    };

    function handleChangeWeapon(delta, keys, mouse) {
        if (!mouse.scrollUp && !mouse.scrollDown) return;
        var curWep = this.weapon.name,
            idx = wepList.indexOf(curWep);
        wep = null;
        do {
            if (mouse.scrollUp) idx += 1;
            else if (mouse.scrollDown) idx -= 1;
            if (idx == wepList.length) idx = 0;
            if (idx < 0) idx = wepList.length - 1;
            wep = wepList[idx];
        } while (!game.upgrades.state.weapons[wep].bought) this.weapon = wep;
    };
}