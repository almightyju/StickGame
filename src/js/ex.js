Math.clamp = function(val, min, max) {
    if (val > max) return max;
    if (val < min) return min;
    return val;
};
DOMTokenList.prototype.clear = function() {
    var attempt = 0,
        max = this.length;
    while (this.length > 0 && attempt++ < max) this.remove(this[0]);
    if (attempt == 0 && max > 0) debugger;
};
String.prototype.camelCaseSplit = function(uppercaseWords) {
    if (typeof uppercaseWords == "undefined") uppercaseWords = true;
    var ret = "";
    for (var i = 0; i < this.length; i++) {
        var code = this.charCodeAt(i);
        isUpper = code >= 65 && code <= 90;
        if (isUpper || i == 0) 
            ret += " " + this[i][uppercaseWords ? "toUpperCase" : "toLowerCase"]();
        else 
            ret += this[i];
    }
    return ret.trim();
};
NodeList.prototype.forEach = function(callback) {
    for (var i = 0; i < this.length; i++) 
        callback.call(this[i], this[i], i);
};