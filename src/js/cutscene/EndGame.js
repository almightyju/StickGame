function EndGame(game) {
    var me = this,
        stage = 0,
        stageTimer = 0;

    document.querySelector("#endGame").classList.add("anim");
    this.run = function(delta, keys, m) {};
    this.end = new EventHandler(this);
}