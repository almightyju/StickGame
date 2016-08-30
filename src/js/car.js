function Car(game) {
    DomObj.call(this, game, game.playArea, "#car");
    var me = this,
        hpContainer = this.dom.querySelector(".hp"),
        hpBar = this.dom.querySelector(".hp > div"),
        repairing = false,
        setClass = false,
        clearDamage = 0,
        repairTime = 5,//60,
        totalRepairTime = 0,
        currentRepairClasses = [],
        maxTransitionTime = 0,
        repairDoneRaised = false;
    this.dom.querySelectorAll("div")
        .forEach(function(e) {
            var d = parseFloat(e.currentStyle.transitionDuration);
            if (d > maxTransitionTime) maxTransitionTime = d;
        });
    this.dom.classList.clear();
    this.x = (this.dom.parentElement.clientWidth / 2) - (this.dom.clientWidth / 2);
    this.y = this.dom.parentElement.clientHeight - this.dom.clientHeight;
    this.repairDone = new EventHandler(this);
    this.repairDone.addListener(function() {
        this.repairing = false;
        this.repairDoneRaised = true;
    });
    this.repairStateChange = new EventHandler(this);
    Object.defineProperty(this, "repairing", {
        get: function() {
            return repairing;
        },
        set: function(val) {
            if (repairing == val) return;
            repairing = val;
            if (repairing) setClass = true;
            else hpContainer.classList.remove("active");
        }
    });
    this.handleRepair = function(delta, keys, mouse) {
        if (setClass) setClass = false;
        else if (!setClass && repairing) hpContainer.classList.add("active");
        if (clearDamage-- == 0) hpContainer.classList.remove("damage");
        if (repairing) totalRepairTime = Math.clamp(totalRepairTime + delta, 0, repairTime);
        var percentDone = Math.round(totalRepairTime / repairTime * 10000) / 100;
        hpBar.style.width = percentDone + "%";
        var classes = [];
        if (percentDone > 80) classes.push("done-80");
        if (percentDone > 60) classes.push("done-60");
        if (percentDone > 40) classes.push("done-40");
        if (percentDone > 20) classes.push("done-20");
        if (classes.length != currentRepairClasses.length) {
            me.dom.classList.clear();
            for (var i = 0; i < classes.length; i++) me.dom.classList.add(classes[i]);
            currentRepairClasses = classes;
            setTimeout(me.repairStateChange.raise, maxTransitionTime * 1000);
        }
        if (percentDone == 100 && !repairDoneRaised) this.repairDone.raise();
    };
    this.mobAttack = function(delta, size) {
        var timeLost = size / 2 * delta;
        totalRepairTime -= timeLost;
        if (totalRepairTime < 0) totalRepairTime = 0;
        hpContainer.classList.add("damage");
        clearDamage = 2;
    }
};