function GUI(game) {
    var ammoContainer = document.getElementById("ammo"),
        ammoChunkContainer = ammoContainer.querySelector("#chunks"),
        reloadBar = ammoContainer.querySelector("#reloadBar"),
        wepContainer = document.getElementById("weapons"),
        hpContainer = document.getElementById("hp"),
        waveText = document.getElementById("wave-text"),
        money, moneyEl = document.getElementById("money"),
        me = this;
    Object.defineProperty(this, "money", {
        get: function() {
            return money;
        },
        set: function(val) {
            money = val;
            moneyEl.innerHTML = "&pound;" + val.toLocaleString();
        }
    });
    this.money = 0;
    game.mobs.onMobDead.addListener(function(mob) {
        me.money += mob.value;
    });
    GUI.addWeaponDivs(game.player.dom.querySelector(".weapon"));
    game.player.weaponList.forEach(function(wep) {
        var outer = DomObj.createDom("div", wepContainer, "." + wep);
        GUI.addWeaponDivs(DomObj.createDom("div", outer, ".weapon"));
    });
    game.player.onSelectWeapon.addListener(setSelectedWeapon);

    function setSelectedWeapon(wep) {
        var selected = wepContainer.querySelector(".selected"),
            toSelect = wepContainer.querySelector("." + wep);
        if (selected != null) selected.classList.remove("selected");
        toSelect.classList.add("selected");
        ammoChunkContainer.classList.clear();
        ammoChunkContainer.classList.add(wep);
        for (var i = 0, c = game.upgrades.state.weapons[game.player.weapon.name].clipSize - 1; i < ammoChunkContainer.children.length; i++) ammoChunkContainer.children[i].classList[i > c ? "add" : "remove"]("hidden");
    };
    var heart = hpContainer.querySelector(".heart");
    game.player.hpChange.addListener(function(hp) {
        var nodes = hpContainer.children;
        for (var i = nodes.length; i < game.player.maxHp; i++) hpContainer.appendChild(heart.cloneNode(true));
        for (var i = 0; i < game.player.maxHp; i++) nodes[i].classList[hp > i ? "remove" : "add"]("empty");
    });
    this.init = function() {
        for (var i = 0, c = game.upgrades.maxClipSize; i < c; i++) DomObj.createDom("div", ammoChunkContainer, "chunk");
        setSelectedWeapon(game.player.weapon.name);
        setBoughtWeapons();
        game.upgrades.upgradeBought.addListener(setBoughtWeapons);
        game.upgrades.upgradeBought.addListener(setAmmoAmount);
    };
    var lastAmmoCount = -1;
    this.drawFrame = function(delta, keys, mouse) {
        if (lastAmmoCount != game.player.weapon.clip) {
            setAmmoAmount();
            lastAmmoCount = game.player.weapon.clip;
        }
        setReloadIndicators();
    };

    function setAmmoAmount() {
        for (var i = 0, c = game.player.weapon.clip - 1, m = game.upgrades.state.weapons[game.player.weapon.name].clipSize - 1; i < ammoChunkContainer.children.length; i++) {
            ammoChunkContainer.children[i].classList[i > c ? "add" : "remove"]("empty");
            ammoChunkContainer.children[i].classList[i > m ? "add" : "remove"]("hidden");
        }
    };

    function setReloadIndicators() {
        var reloadStates = game.player.reloadingWeapons;
        game.player.weaponList.forEach(function(wep) {
                var wepDom = wepContainer.querySelector("." + wep),
                    reloadState = reloadStates.filter(function(i) {
                        return i.name == wep;
                    });
                if (reloadState.length == 1) reloadState = reloadState[0];
                else reloadState = null;
                wepDom.classList[reloadState == null ? "remove" : "add"]("reloading");
                if (ammoChunkContainer.classList.contains(wep)) {
                    ammoContainer.classList[reloadState == null ? "remove" : "add"]("reloading");
                if (reloadState != null) reloadBar.style.width = reloadState.percentDone.toFixed(2) + "%";
            }
        });
    };

    function setBoughtWeapons() {
        game.player.weaponList.forEach(function(wep) {
            var dom = wepContainer.querySelector("." + wep);
            dom.classList[game.upgrades.state.weapons[wep].bought ? "remove" : "add"]("collapse");
        });
    };
    waveText.innerHTML = "Wave: 1";
    game.levelStart.addListener(function(level) {
        waveText.innerHTML = "Wave: " + level;
    });
};
GUI.addWeaponDivs = function(parent) {
    for (var i = 0; i < 4; i++) DomObj.createDom("div", parent, ".wp-" + (i + 1));
}
