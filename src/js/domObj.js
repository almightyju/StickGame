function DomObj(game, container, clsOrId, dom) {
    if (typeof container == "undefined" || container == null) container = game.container;
    if (typeof container == "string") {
        clsOrId = container;
        container = game.container;
    }
    var x, y;
    if (typeof dom == "undefined") dom = DomObj.createDom("div", container, clsOrId);
    else {
        DomObj.setClsOrId(dom, clsOrId);
        container.appendChild(dom);
    }

    Object.defineProperty(this, "x", {
        get: function () {
            return x;
        },
        set: function (val) {
            x = val;
            dom.style.left = x + "px";
        }
    });
    Object.defineProperty(this, "y", {
        get: function () {
            return y;
        },
        set: function (val) {
            y = val;
            dom.style.top = y + "px";
        }
    });
    Object.defineProperty(this, "dom", {
        get: function () {
            return dom;
        }
    });
};
DomObj.setClsOrId = function (dom, clsOrId) {
    if (!(clsOrId instanceof Array)) clsOrId = [clsOrId];
    for (var i = 0; i < clsOrId.length; i++) {
        var item = clsOrId[i];
        if (typeof item == "string" && item.length > 0) {
            if (item[0] == "#") {
                var existing = document.getElementById(item.substr(1));
                if (existing != null) return existing;
                dom.id = item.substr(1);
            } else if (item[0] == ".")
                dom.classList.add(item.substr(1));
            else 
                dom.classList.add(item);
        }
    }
    return null;
};
DomObj.createDom = function (tag, appendTo, clsOrId) {
    var dom = document.createElement(tag);
    var existing = DomObj.setClsOrId(dom, clsOrId);
    if (existing == null && typeof appendTo != "undefined" && appendTo != null) appendTo.appendChild(dom);
    return existing || dom;
};
(function () {
    var offset = function (el, prop, offsetParent) {
        var ret = el[prop];
        if (el.offsetParent != null && el != offsetParent) ret += arguments.callee(el.offsetParent, prop, offsetParent);
        return ret;
    };
    DomObj.offsetTop = function (el, offsetParent) {
        return offset(el, "offsetTop", offsetParent);
    };
    DomObj.offsetLeft = function (el, offsetParent) {
        return offset(el, "offsetLeft", offsetParent);
    }
})();