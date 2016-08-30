document.onreadystatechange = function(e) {
    if (document.readyState == "complete") {
        var container = document.getElementById("game");
        var g = new Game(container);
        g.run();
        window.g = g;
    }
};

function Game(container) {
    var frameInterval = Math.ceil(1000 / 60),
        tickTime = frameInterval / 2,
        time = 0,
        me = this;
    Object.defineProperty(this, "container", {
        get: function() {
            return container;
        }
    });
    Object.defineProperty(this, "playArea", {
        get: function() {
            return priv.playArea;
        }
    });
    Object.defineProperty(this, "player", {
        get: function() {
            return priv.player;
        }
    });
    Object.defineProperty(this, "mobs", {
        get: function() {
            return priv.mobs;
        }
    });
    Object.defineProperty(this, "gui", {
        get: function() {
            return priv.gui;
        }
    });
    Object.defineProperty(this, "upgrades", {
        get: function() {
            return priv.upgrades;
        }
    });
    Object.defineProperty(this, "car", {
        get: function() {
            return priv.player.car;
        }
    });
    Object.defineProperty(this, "phase", {
        get: function() {
            return priv.phase;
        }
    });
    var priv = {
        frameInterval: Math.ceil(1000 / 60),
        tickTime: frameInterval / 3,
        time: 0,
        playArea: container.querySelector("#play-area"),
        pressedKeys: [],
        mouse: {
            x: 0,
            y: 0,
            left: false,
            middle: false,
            scrollUp: false,
            scrollDown: false
        },
        player: null,
        gui: null,
        mobs: null,
        upgrades: null,
        phase: -1,
        running: false,
        cutscene: null,
        skipBtn: document.querySelector("#skip"),
        tick: function() {
            if (!priv.running) return;
            var now = performance.now(),
                diff = now - time;
            if (diff > priv.frameInterval) {
                var delta = diff / 1000;
                priv.drawFrame(delta);
                time = performance.now();
            }
            setTimeout(priv.tick, priv.tickTime);
        },
        drawFrame: function(delta) {
            if (priv.paused || priv.upgrades.open) return;
            let keys = {
                    left: priv.pressedKeys.indexOf("left") > -1 || priv.pressedKeys.indexOf("a") > -1,
                    right: priv.pressedKeys.indexOf("right") > -1 || priv.pressedKeys.indexOf("d") > -1,
                    up: priv.pressedKeys.indexOf("up") > -1 || priv.pressedKeys.indexOf("w") > -1,
                    down: priv.pressedKeys.indexOf("down") > -1 || priv.pressedKeys.indexOf("s") > -1,
                    space: priv.pressedKeys.indexOf("spacebar") > -1,
                    r: priv.pressedKeys.indexOf("r") > -1,
                    e: priv.pressedKeys.indexOf("e") > -1
                },
                m = {
                    x: priv.mouse.x,
                    y: priv.mouse.y,
                    left: priv.mouse.left,
                    middle: priv.mouse.middle,
                    scrollUp: priv.mouse.scrollUp,
                    scrollDown: priv.mouse.scrollDown,
                };
            priv.upgrades.updateState();
            if (priv.cutscene != null) priv.cutscene.run(delta, keys, m);
            else {
                priv.player.drawFrame(delta, keys, m);
                priv.gui.drawFrame(delta, keys, m);
                priv.mobs.drawFrame(delta, keys, m);
                priv.player.collisionDetect(delta);
            }
            priv.mouse.scrollUp = false;
            priv.mouse.scrollDown = false;
        }
    };
    Object.defineProperty(priv, "cutscene", {
        get: function() {
            return priv._cutscene;
        },
        set: function(val) {
            priv._cutscene = val;
            priv.skipBtn.classList[val == null || val.skip == null ? "add" : "remove"]("hidden");
        }
    });
    priv.cutscene = null;
    priv.skipBtn.addEventListener("click", function(e) {
        this.blur();
        priv.cutscene.skip();
    });
    this.pause = function() {
        priv.paused = true;
    };
    this.resume = function() {
        priv.paused = false;
    };
    this.levelComplete = new EventHandler(this);
    this.levelComplete.addListener(function(level) {
        if (priv.phase == 0 && level == 5) setCutsceneForCurrentPhase();
        else priv.upgrades.show(function() {
            me.levelStart.raise(level + 1);
        });
    });
    this.levelStart = new EventHandler(this);
    this.run = function() {
        priv.player = new Player(this);
        priv.mobs = new Mobs(this);
        priv.gui = new GUI(this);
        priv.upgrades = new Upgrades(this);
        priv.player.init();
        priv.gui.init();
        priv.player.hpChange.addListener(playHpChange);
        priv.running = true;
        setCutsceneForCurrentPhase();
        setTimeout(priv.tick, priv.tickTime);
    };

    function playHpChange(hp) {
        if (hp > 0) return;
        priv.cutscene = new EndGame(me);
        document.querySelector("#endGame .win")
            .classList.add("hidden");
        document.querySelector("#endGame .loose")
            .classList.remove("hidden");
    };
    this.endPhase = new EventHandler(this);
    this.endPhase.addListener(function(phase) {
        priv.cutscene = null;
        if (phase == 0) {
            priv.player.setupCar();
            me.car.repairDone.addListener(setCutsceneForCurrentPhase);
            me.levelStart.raise(priv.mobs.level + 1);
        }
    });

    function setCutsceneForCurrentPhase() {
        if (priv.phase == -1) priv.cutscene = new WalkOutHouse(me);
        if (priv.phase == 0) priv.cutscene = new RunAway(me);
        if (priv.phase == 1) priv.cutscene = new DriveAway(me);
        priv.cutscene.end.addListener(function() {
            if (priv.phase == 1) priv.cutscene = new EndGame(me);
            else me.endPhase.raise(priv.phase++);
        });
    };
    window.addEventListener("keydown", function(e) {
        if (priv.pressedKeys.indexOf(e.key.toLowerCase()) == -1) priv.pressedKeys.push(e.key.toLowerCase());
    });
    window.addEventListener("keyup", function(e) {
        var idx = priv.pressedKeys.indexOf(e.key.toLowerCase());
        priv.pressedKeys.splice(idx, 1);
    });
    window.addEventListener("mousemove", function(e) {
        priv.mouse.x = e.pageX;
        priv.mouse.y = e.pageY;
    });

    window.addEventListener("mousedown", function(e) {
        if (e.button == 0) priv.mouse.left = true;
        if (e.button == 1) priv.mouse.middle = true;
    });

    window.addEventListener("mouseup", function(e) {
        if (e.button == 0) priv.mouse.left = false;
        if (e.button == 1) priv.mouse.middle = false;
    });

    window.addEventListener("mousewheel", function(e) {
        priv.mouse.scrollUp = e.wheelDelta > 0;
        priv.mouse.scrollDown = e.wheelDelta < 0;
    });
    this.dbg = me;
}