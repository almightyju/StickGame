function Upgrades(game) {
    var upgradesEl = document.getElementById("upgrades"),
        open = false,
        callback = null,
        me = this,
        upgrades = {
            weapons: {
                pistol: {
                      fireSpeed: { idx: 0, all: [0.8, 0.7, 0.6, 0.5], costs: [10, 20, 30]     },
                    reloadSpeed: { idx: 0, all: [3, 2.5, 2, 1.5, 1],  costs: [10, 20, 30, 40] },
                       clipSize: { idx: 0, all: [12, 15, 18],         costs: [15, 30]         },
                         damage: { idx: 0, all: [1, 2, 3],            costs: [50, 100]        },
                           cost: 0
                },
                uzi: {
                      fireSpeed: { idx: 0, all: [0.2, 0.18, 0.15, 0.12, 0.09], costs: [150, 250, 400, 1000] },
                    reloadSpeed: { idx: 0, all: [2.3, 1.9, 1.4, 0.9],          costs: [130, 220, 400]       },
                       clipSize: { idx: 0, all: [20, 32, 45],                  costs: [150, 300]            },
                         damage: { idx: 0, all: [1, 1.4, 1.8, 2.5],            costs: [250, 600, 1100]      },
                       piercing: { idx: 0, all: [0, 1, 2],                     costs: [2000, 40000]         },
                           cost: -1
                }
            },
            player: {
                     maxHealth: { idx: 0, all: [3, 4, 5, 6],       costs: [50, 150, 300]  },
                     moveSpeed: { idx: 0, all: [60, 80, 110, 140], costs: [20, 50, 140]   },
                    jumpHeight: { idx: 0, all: [30, 35, 40],       costs: [100, 200]      },
                invincibleTime: { idx: 0, all: [2, 2.5, 3, 4],     costs: [200, 400, 700] }
            }
        },
        upgradeState = null,
        healBtn = upgradesEl.querySelector("button.heal");
    Object.defineProperty(this, "open", {
        get: function() {
            return open;
        }
    });
    Object.defineProperty(this, "state", {
        get: function() {
            return upgradeState;
        }
    });
    Object.defineProperty(this, "maxClipSize", {
        get: function() {
            return Object.getOwnPropertyNames(upgrades.weapons).map(function(w) {
                var m = 0;
                upgrades.weapons[w].clipSize.all.forEach(function(c) {
                    if (c > m) m = c;
                });
                return m;
            }).sort().reverse()[0];
        }
    });
    this.upgradeBought = new EventHandler(this);
    this.show = function(c) {
        callback = c;
        upgradesEl.classList.add("open");
        open = true;
        setOneOffButtons();
    };
    this.close = function() {
        if (!open) return;
        upgradesEl.classList.remove("open");
        open = false;
        callback();
    };
    this.updateState = function() {
        upgradeState = {
            weapons: {},
            player: {}
        };

        Object.getOwnPropertyNames(upgrades.weapons).forEach(function(w) {
            var wep = upgrades.weapons[w];
            upgradeState.weapons[w] = {
                bought: wep.cost == 0
            };
            Object.getOwnPropertyNames(wep).forEach(function(p) {
                if (wep[p] instanceof Object) upgradeState.weapons[w][p] = wep[p].all[wep[p].idx];
            });
        });
        Object.getOwnPropertyNames(upgrades.player).forEach(function(p)

            {
                upgradeState.player[p] = upgrades.player[p].all[upgrades.player[p].idx];
            });
    };
    this.updateState();
    this.unlockWeapon = function(wep) {
        upgrades.weapons[wep].cost = 0;
        wepContainer.querySelector(".wep." + wep).classList.remove("hidden");
        me.updateState();
        me.upgradeBought.raise();
    };
    var allTabs = [],
        tabsEl = upgradesEl.querySelector(".tabs");
    upgradesEl.querySelectorAll(".tab-buttons > button").forEach(function(btn) {
        var cls = btn.classList[0],
            tab = upgradesEl.querySelector(".tabs > ." + cls);
        allTabs.push(tab);
        btn.addEventListener("click", function(e) {
            tabsEl.style.left = "-" + (allTabs.indexOf(tab) * 100) + "%";
        });
    });
    tabsEl.style.width = (allTabs.length * 100) + "%";
    var wepTemplate = upgradesEl.querySelector(".wep"),
        wepContainer = upgradesEl.querySelector("div.weapons");
    wepTemplate.parentNode.removeChild(wepTemplate);
    Object.getOwnPropertyNames(upgrades.weapons).forEach(function(w) {
        var wep = upgrades.weapons[w],
            newNode = wepTemplate.cloneNode(true);
        newNode.classList.add(w);
        GUI.addWeaponDivs(newNode.querySelector(".weapon"));
        newNode.querySelector(".wep-text").innerHTML = w.camelCaseSplit();
        if (wep.cost <= 0)

            newNode.classList.add("bought");
        if (wep.cost == -1) newNode.classList.add("hidden");
        var buyOverlay = document.createElement("div");
        buyOverlay.classList.add("buy-wrap");
        var buyBtn = document.createElement("button");
        buyBtn.innerHTML = "Buy - &pound;" + wep.cost.toLocaleString();
        buyBtn.classList.add("buy");

        buyBtn.addEventListener("click", function(e) {
            if (game.gui.money < wep.cost) return;
            game.gui.money -= wep.cost;
            wep.cost = 0;
            newNode.classList.add("bought");
            me.updateState();
            me.upgradeBought.raise();
        });
        buyOverlay.appendChild(buyBtn);
        newNode.appendChild(buyOverlay);
        Object.getOwnPropertyNames(wep).forEach(function(p)

            {
                var prop = wep[p];
                if (prop instanceof Object) addBars(newNode, prop, p);
            });
        wepContainer.appendChild(newNode);
    });
    var shitIeFixEl = upgradesEl.querySelector(".wep");
    shitIeFixEl.style.width = "40%";
    setTimeout(function() {
        shitIeFixEl.style.width = "";
    }, 100);
    var playerUpCont = upgradesEl.querySelector(".tabs div.player .upgrades");
    Object.getOwnPropertyNames(upgrades.player).forEach(function(prop) {
        addBars(playerUpCont, upgrades.player[prop], prop);
    });

    function addBars(parentNode, upgrade, txt) {
        var row = DomObj.createDom("div", parentNode, [".row", ".upgrade"]),
            barContainer = DomObj.createDom("div", row, ".blocks"),
            text = DomObj.createDom("span", row);
        text.innerHTML = txt.camelCaseSplit();


        upgrade.costs.forEach(function(cost) {
            var block = DomObj.createDom("div",

                barContainer, ".block");
            block.innerHTML = "&pound;" + cost.toLocaleString();
        });
        row.addEventListener("click", function(e) {
            upgradeRowClick(e, upgrade, barContainer);
        });
    };

    function upgradeRowClick(event, upgrade, barsDom) {
        if (upgrade.idx > upgrade.costs.length) return;
        var cost =

            upgrade.costs[upgrade.idx];
        if (game.gui.money >= cost) {
            game.gui.money -= cost;
            barsDom.children[upgrade.idx].classList.add("bought");
            upgrade.idx += 1;
            var currentWep = game.player.weapon.name,
                currentClip =

                me.state.weapons[currentWep].clipSize;
            me.updateState();
            var newClip = me.state.weapons[currentWep].clipSize;
            if (newClip != currentClip) game.player.weapon.clip = newClip;
            me.upgradeBought.raise();
        }
    };

    function setOneOffButtons() {
        healBtn.innerHTML = "Heal";
        healBtn.disabled = game.player.hp == game.player.maxHp;
        if (game.player.hp < game.player.maxHp) {
            var cost = Math.round(Math.pow(50 * (game.player.maxHp - game.player.hp), 1 + game.mobs.level / 100));
            healBtn.innerHTML += " - &pound;" + cost;
            healBtn.cost = cost;
        }
    };
    addEventListener("keypress", function(e) {
        if (!open) return;
        if (upgradesEl.offsetTop == 0 && e.key.toLowerCase() == "spacebar") me.close();
    });

    upgradesEl.querySelector("button.close").addEventListener("click", function(e) {
            me.close();
            this.blur();
    });
    healBtn.addEventListener("click", function(e){
        if (game.gui.money < this.cost) return;
        game.gui.money -= this.cost;
        game.player.hp = game.player.maxHp;;
        setOneOffButtons();
    });
}