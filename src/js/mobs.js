function Mobs(game) {
    var mobs = [],
        mobDomTemplate = document.getElementById("player").cloneNode(true),
        mobDeathAnimTime = -1,
        levelScaleFactor = 1.5,
        levelMobAdd = 4,
        level = 1,
        levelStartTime = 0,
        levelTime = 0,
        mobSpawns = null,
        endLevelRaised = false,
        mobSizeSpawnLevels = {
            1: 0,
            2: 0,
            3: 4,
            4: 8
        },
        mobSizeSpawnPhases = {
            1: -1,
            2: -1,
            3: 0,
            4: 2
        },
        spawnSide = null,
        me = this;
    ["id", "style"].forEach(function(i) {
        if (mobDomTemplate.attributes.item(i) != null) mobDomTemplate.attributes.removeNamedItem(i);
    });
    ["mob", "character"].forEach(function(i) {
        mobDomTemplate.classList.add(i);
    });
    this.onMobDead = new EventHandler(this);
    this.drawFrame = function(delta, keys, mouse) {
        levelTime += delta;
        checkSpawnMobs();
        moveMobs(delta);
    };
    game.levelStart.addListener(function(lvl) {
        endLevelRaised = false;
        level = lvl;
        levelTime = 0;
        setMobSpawns();
    });
    this.hit = function(mob, dmg) {
        mob.hp -= dmg;
        if (mob.hp <= 0) {
            mob.dom.dom.classList.add("dead");
            mob.money = new DomObj("div", game.playArea, ".mob-money");
            mob.money.dom.innerHTML = "&pound;" + mob.value.toLocaleString();
            mob.money.y = mob.dom.y - mob.money.dom.clientHeight;
            mob.money.x = mob.dom.x + (mob.dom.dom.clientWidth / 2) - (mob.money.dom.clientWidth / 2);
            me.onMobDead.raise(mob);
            if (mobDeathAnimTime == -1) {
                mobDeathAnimTime = 0;
                [mob.money, mob.dom].forEach(function(i) {
                    return i["dom"].currentStyle.transitionDuration.split(",")
                        .map(function(j) {
                            return parseFloat(j);
                        })
                        .forEach(function(j) {
                            mobDeathAnimTime += j;
                        });
                });
            }
            mob.deathCounter = mobDeathAnimTime;
        }
    };
    Object.defineProperty(this, "mobs", {
        get: function() {
            return mobs;
        }
    });
    Object.defineProperty(this, "level", {
        get: function() {
            return level;
        },
        set: function(val) {
            level = val < 1 ? 1 : val;
        }
    });
    Object.defineProperty(this, "forceSpawnSide", {
        get: function() {
            return spawnSide;
        },
        set: function(val) {
            spawnSide = val;
        }
    });

    function moveMobs(delta) {
        if (me.suspend) return;
        var mobsToRemove = [],
            undeadMobs = 0;
        for (var i = 0; i < mobs.length; i++) {
            var mob = mobs[i],
                speed = 0;
            switch (mob.size) {
                case 1:
                    speed = 60;
                    break;
                case 2:
                    speed = 40;
                    break;
                case 3:
                    speed = 15;
                    break;
                case 4:
                    speed = 8;
                    break;
                default:
                    throw Error("mob size has no speed set");
            }
            if (mob.hp <= 0) {
                mob.deathCounter -= delta;
                if (mob.deathCounter <= 0) mobsToRemove.push(i);
                if (!mob.money.dom.classList.contains("anim")) mob.money.dom.classList.add("anim");
            } else {
                undeadMobs++;
                var targetX = mob.carTargetX || game.player.x;
                if (mob.dom.y < game.player.ledgeY) targetX = game.player.x;
                var targetTolerance = 3,
                    wasAtCar = targetX == mob.carTargetX && mob.dom.x > targetX - targetTolerance && mob.dom.x < targetX + targetTolerance;
                if (mob.dom.x < targetX) {
                    mob.dom.x += speed * delta;
                    mob.dom.dom.classList.add("right");
                } else {
                    mob.dom.x -= speed * delta;
                    mob.dom.dom.classList.remove("right");
                }
                var nowAtCar = targetX == mob.carTargetX && mob.dom.x > targetX - targetTolerance && mob.dom.x < targetX + targetTolerance;
                if (nowAtCar && wasAtCar) game.player.car.mobAttack(delta, mob.size);
            }
        }
        while (mobsToRemove.length > 0) {
            var m = mobs.splice(mobsToRemove.pop(), 1)[0];
            m.dom.dom.removeNode(true);
            m.money.dom.removeNode(true);
        }
        if (undeadMobs == 0 && mobSpawns.length == 0 && !endLevelRaised) {
            endLevelRaised = true;
            game.levelComplete.raise(level);
        }
    };

    function createMob(size, spawnOnRight) {
        var mob = {
            dom: new DomObj(game, game.playArea, "size-" + size, mobDomTemplate.cloneNode(true)),
            size: size,
            value: Math.round((Math.pow(size, 1.4) + 1) * (Math.pow(level, 1.01) + 1))
        };
        switch (size) {
            case 1:
                mob.hp = 1;
                break;
            case 2:
                mob.hp = 4;
                break;
            case 3:
                mob.hp = 30;
                break;
            case 4:
                mob.hp = 100;
                break;
            default:
                throw Error("mob size " + size + " unknown");
        }
        if (level > mobSizeSpawnLevels[size]) mob.hp += Math.round(Math.pow((mob.hp * ((level - mobSizeSpawnLevels[size]) / 15)), 1.1));
        if (game.player.car != null) {
            var randPercent = Math.random(),
                min = game.player.car.x,
                extra = randPercent * game.player.car.dom.clientWidth;
            mob.carTargetX = Math.round(min + extra);
        }
        mob.dom.y = game.playArea.clientHeight - mob.dom.dom.clientHeight;
        if (spawnOnRight) mob.dom.x = game.playArea.clientWidth;
        else mob.dom.x = -mob.dom.dom.clientWidth;
        return mob;
    };

    function checkSpawnMobs() {
        for (var i = 0; i < mobSpawns.length; i++)
            if (levelTime >= mobSpawns[i][0]) {
                var mob = mobSpawns.splice(i, 1)[0],
                    spawnOnRight = null;
                if (spawnSide == "right") spawnOnRight = true;
                else if (spawnSide == "left") spawnOnRight = false;
                else spawnOnRight = Math.random() > 0.5;
                mobs.push(createMob(mob[1], spawnOnRight));
                i--;
            }
    };

    function setMobSpawns() {
        mobSpawns = [];
        var totalMobs = Math.pow(level, levelScaleFactor) + levelMobAdd,
            normalMobs = level > mobSizeSpawnLevels[2] && game.phase > mobSizeSpawnPhases[2] ? Math.round(totalMobs / 100 * 35) : 0,
            largeMobs = level > mobSizeSpawnLevels[3] && game.phase > mobSizeSpawnPhases[3] ? Math.round((totalMobs - normalMobs) / 100 * 12) : 0,
            massiveMobs = level > mobSizeSpawnLevels[4] && game.phase > mobSizeSpawnPhases[4] ? Math.round((totalMobs - normalMobs - largeMobs) / 100 * 8) : 0,
            timePerLevel = 0,
            baseTimePerLevel = 0,
            spawnsPerSec = {};
        if (game.phase <= 0) baseTimePerLevel = 5;
        else baseTimePerLevel = 10;
        timePerLevel = baseTimePerLevel + Math.round(level * 1.3);
        for (var i = 0; i < totalMobs; i++) {
            var sec = null;
            while (sec == null || sec in spawnsPerSec) 
                sec = parseFloat((Math.random() * timePerLevel).toFixed(2));
            var size = 1;
            if (normalMobs-- > 0) size = 2;
            else if (largeMobs-- > 0) size = 3;
            else if (massiveMobs-- > 0) size = 4;
            mobSpawns.push([sec,size]);
            if (!(sec in spawnsPerSec)) spawnsPerSec[sec] = 0;
            spawnsPerSec[sec] += 1;
        }
    };
    setMobSpawns();
}