function EventHandler(scope) {
    var callbacks = [];
    this.addListener = function(callback) {
        callbacks.push(callback);
    };
    this.raise = function() {
        for (var i = 0; i < callbacks.length; i++) callbacks[i].apply(scope, arguments);
    };
}