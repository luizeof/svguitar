"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SVGuitarChord = exports.ChordStyle = exports.Shape = exports.FretLabelPosition = exports.SILENT = exports.OPEN = void 0;
var utils_1 = require("./utils");
var constants_1 = require("./constants");
var renderer_1 = require("./renderer");
/**
 * Value for an open string (O)
 */
exports.OPEN = 0;
/**
 * Value for a silent string (X)
 */
exports.SILENT = 'x';
/**
 * Possible positions of the fret label (eg. "3fr").
 */
var FretLabelPosition;
(function (FretLabelPosition) {
    FretLabelPosition["LEFT"] = "left";
    FretLabelPosition["RIGHT"] = "right";
})(FretLabelPosition = exports.FretLabelPosition || (exports.FretLabelPosition = {}));
var Shape;
(function (Shape) {
    Shape["CIRCLE"] = "circle";
    Shape["SQUARE"] = "square";
    Shape["TRIANGLE"] = "triangle";
    Shape["PENTAGON"] = "pentagon";
})(Shape = exports.Shape || (exports.Shape = {}));
var ChordStyle;
(function (ChordStyle) {
    ChordStyle["normal"] = "normal";
    ChordStyle["handdrawn"] = "handdrawn";
})(ChordStyle = exports.ChordStyle || (exports.ChordStyle = {}));
var defaultSettings = {
    style: ChordStyle.normal,
    strings: 6,
    frets: 5,
    position: 1,
    tuning: [],
    tuningsFontSize: 28,
    fretLabelFontSize: 38,
    fretLabelPosition: FretLabelPosition.RIGHT,
    nutSize: 0.65,
    nutTextColor: '#FFF',
    nutTextSize: 24,
    sidePadding: 0.2,
    titleFontSize: 48,
    titleBottomMargin: 0,
    color: '#000',
    emptyStringIndicatorSize: 0.6,
    strokeWidth: 2,
    topFretWidth: 10,
    fretSize: 1.5,
    barreChordRadius: 0.25,
    fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    shape: Shape.CIRCLE,
};
var SVGuitarChord = /** @class */ (function () {
    function SVGuitarChord(container) {
        this.container = container;
        this.settings = {};
        this.chordInternal = { fingers: [], barres: [] };
    }
    Object.defineProperty(SVGuitarChord.prototype, "renderer", {
        get: function () {
            var _a;
            if (!this.rendererInternal) {
                var style = (_a = this.settings.style) !== null && _a !== void 0 ? _a : defaultSettings.style;
                switch (style) {
                    case ChordStyle.normal:
                        this.rendererInternal = new renderer_1.SvgJsRenderer(this.container);
                        break;
                    case ChordStyle.handdrawn:
                        this.rendererInternal = new renderer_1.RoughJsRenderer(this.container);
                        break;
                    default:
                        throw new Error(style + " is not a valid chord diagram style.");
                }
            }
            return this.rendererInternal;
        },
        enumerable: false,
        configurable: true
    });
    SVGuitarChord.prototype.configure = function (settings) {
        SVGuitarChord.sanityCheckSettings(settings);
        // special case for style: remove current renderer instance if style changed. The new renderer
        // instance will be created lazily.
        if (settings.style !== this.settings.style) {
            this.renderer.remove();
            delete this.rendererInternal;
        }
        this.settings = __assign(__assign({}, this.settings), settings);
        return this;
    };
    SVGuitarChord.prototype.chord = function (chord) {
        this.chordInternal = chord;
        return this;
    };
    SVGuitarChord.prototype.draw = function () {
        var _a;
        this.clear();
        this.drawTopEdges();
        this.drawBackground();
        var y;
        y = this.drawTitle((_a = this.settings.titleFontSize) !== null && _a !== void 0 ? _a : defaultSettings.titleFontSize);
        y = this.drawEmptyStringIndicators(y);
        y = this.drawTopFret(y);
        this.drawPosition(y);
        y = this.drawGrid(y);
        y = this.drawTunings(y);
        // now set the final height of the svg (and add some padding relative to the fret spacing)
        y += this.fretSpacing() / 10;
        this.renderer.size(constants_1.constants.width, y);
        return {
            width: constants_1.constants.width,
            height: y,
        };
    };
    SVGuitarChord.sanityCheckSettings = function (settings) {
        if (typeof settings.strings !== 'undefined' && settings.strings <= 1) {
            throw new Error('Must have at least 2 strings');
        }
        if (typeof settings.frets !== 'undefined' && settings.frets < 0) {
            throw new Error('Cannot have less than 0 frets');
        }
        if (typeof settings.position !== 'undefined' && settings.position < 1) {
            throw new Error('Position cannot be less than 1');
        }
        if (typeof settings.fretSize !== 'undefined' && settings.fretSize < 0) {
            throw new Error('Fret size cannot be smaller than 0');
        }
        if (typeof settings.nutSize !== 'undefined' && settings.nutSize < 0) {
            throw new Error('Nut size cannot be smaller than 0');
        }
        if (typeof settings.strokeWidth !== 'undefined' && settings.strokeWidth < 0) {
            throw new Error('Stroke width cannot be smaller than 0');
        }
    };
    SVGuitarChord.prototype.drawTunings = function (y) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        // add some padding relative to the fret spacing
        var padding = this.fretSpacing() / 5;
        var stringXPositions = this.stringXPos();
        var strings = (_a = this.settings.strings) !== null && _a !== void 0 ? _a : defaultSettings.strings;
        var color = (_c = (_b = this.settings.tuningsColor) !== null && _b !== void 0 ? _b : this.settings.color) !== null && _c !== void 0 ? _c : defaultSettings.color;
        var tuning = (_d = this.settings.tuning) !== null && _d !== void 0 ? _d : defaultSettings.tuning;
        var fontFamily = (_e = this.settings.fontFamily) !== null && _e !== void 0 ? _e : defaultSettings.fontFamily;
        var tuningsFontSize = (_f = this.settings.tuningsFontSize) !== null && _f !== void 0 ? _f : defaultSettings.tuningsFontSize;
        var text;
        tuning.forEach(function (tuning_, i) {
            if (i < strings) {
                var tuningText = _this.renderer.text(tuning_, stringXPositions[i], y + padding, tuningsFontSize, color, fontFamily, renderer_1.Alignment.MIDDLE);
                if (tuning_) {
                    text = tuningText;
                }
            }
        });
        if (text) {
            return y + text.height + padding * 2;
        }
        return y;
    };
    SVGuitarChord.prototype.drawPosition = function (y) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g;
        var position = (_a = this.settings.position) !== null && _a !== void 0 ? _a : defaultSettings.position;
        if (position <= 1) {
            return;
        }
        var stringXPositions = this.stringXPos();
        var endX = stringXPositions[stringXPositions.length - 1];
        var startX = stringXPositions[0];
        var text = this.settings.position + "fr";
        var size = (_b = this.settings.fretLabelFontSize) !== null && _b !== void 0 ? _b : defaultSettings.fretLabelFontSize;
        var color = (_d = (_c = this.settings.fretLabelColor) !== null && _c !== void 0 ? _c : this.settings.color) !== null && _d !== void 0 ? _d : defaultSettings.color;
        var nutSize = this.stringSpacing() * ((_e = this.settings.nutSize) !== null && _e !== void 0 ? _e : defaultSettings.nutSize);
        var fontFamily = (_f = this.settings.fontFamily) !== null && _f !== void 0 ? _f : defaultSettings.fontFamily;
        var fretLabelPosition = (_g = this.settings.fretLabelPosition) !== null && _g !== void 0 ? _g : defaultSettings.fretLabelPosition;
        // add some padding relative to the string spacing. Also make sure the padding is at least
        // 1/2 nutSize plus some padding to prevent the nut overlapping the position label.
        var padding = Math.max(this.stringSpacing() / 5, nutSize / 2 + 5);
        var drawText = function (sizeMultiplier) {
            if (sizeMultiplier === void 0) { sizeMultiplier = 1; }
            if (sizeMultiplier < 0.01) {
                // text does not fit: don't render it at all.
                // eslint-disable-next-line no-console
                console.warn('Not enough space to draw the starting fret');
                return;
            }
            if (fretLabelPosition === FretLabelPosition.RIGHT) {
                var svgText = _this.renderer.text(text, endX + padding, y, size * sizeMultiplier, color, fontFamily, renderer_1.Alignment.LEFT);
                var width = svgText.width, x = svgText.x;
                if (x + width > constants_1.constants.width) {
                    svgText.remove();
                    drawText(sizeMultiplier * 0.9);
                }
            }
            else {
                var svgText = _this.renderer.text(text, 1 / sizeMultiplier + startX - padding, y, size * sizeMultiplier, color, fontFamily, renderer_1.Alignment.RIGHT);
                var x = svgText.x;
                if (x < 0) {
                    svgText.remove();
                    drawText(sizeMultiplier * 0.8);
                }
            }
        };
        drawText();
    };
    /**
     * Hack to prevent the empty space of the svg from being cut off without having to define a
     * fixed width
     */
    SVGuitarChord.prototype.drawTopEdges = function () {
        this.renderer.circle(constants_1.constants.width, 0, 0, 0, 'transparent', 'none');
        this.renderer.circle(0, 0, 0, 0, 'transparent', 'none');
    };
    SVGuitarChord.prototype.drawBackground = function () {
        if (this.settings.backgroundColor) {
            this.renderer.background(this.settings.backgroundColor);
        }
    };
    SVGuitarChord.prototype.drawTopFret = function (y) {
        var _a, _b, _c, _d, _e;
        var stringXpositions = this.stringXPos();
        var strokeWidth = (_a = this.settings.strokeWidth) !== null && _a !== void 0 ? _a : defaultSettings.strokeWidth;
        var topFretWidth = (_b = this.settings.topFretWidth) !== null && _b !== void 0 ? _b : defaultSettings.topFretWidth;
        var startX = stringXpositions[0] - strokeWidth / 2;
        var endX = stringXpositions[stringXpositions.length - 1] + strokeWidth / 2;
        var position = (_c = this.settings.position) !== null && _c !== void 0 ? _c : defaultSettings.position;
        var color = (_e = (_d = this.settings.fretColor) !== null && _d !== void 0 ? _d : this.settings.color) !== null && _e !== void 0 ? _e : defaultSettings.color;
        var fretSize;
        if (position > 1) {
            fretSize = strokeWidth;
        }
        else {
            fretSize = topFretWidth;
        }
        this.renderer.line(startX, y + fretSize / 2, endX, y + fretSize / 2, fretSize, color);
        return y + fretSize;
    };
    SVGuitarChord.prototype.stringXPos = function () {
        var _a, _b;
        var strings = (_a = this.settings.strings) !== null && _a !== void 0 ? _a : defaultSettings.strings;
        var sidePadding = (_b = this.settings.sidePadding) !== null && _b !== void 0 ? _b : defaultSettings.sidePadding;
        var startX = constants_1.constants.width * sidePadding;
        var stringsSpacing = this.stringSpacing();
        return utils_1.range(strings).map(function (i) { return startX + stringsSpacing * i; });
    };
    SVGuitarChord.prototype.stringSpacing = function () {
        var _a, _b;
        var sidePadding = (_a = this.settings.sidePadding) !== null && _a !== void 0 ? _a : defaultSettings.sidePadding;
        var strings = (_b = this.settings.strings) !== null && _b !== void 0 ? _b : defaultSettings.strings;
        var startX = constants_1.constants.width * sidePadding;
        var endX = constants_1.constants.width - startX;
        var width = endX - startX;
        return width / (strings - 1);
    };
    SVGuitarChord.prototype.fretSpacing = function () {
        var _a;
        var stringSpacing = this.stringSpacing();
        var fretSize = (_a = this.settings.fretSize) !== null && _a !== void 0 ? _a : defaultSettings.fretSize;
        return stringSpacing * fretSize;
    };
    SVGuitarChord.prototype.fretLinesYPos = function (startY) {
        var _a;
        var frets = (_a = this.settings.frets) !== null && _a !== void 0 ? _a : defaultSettings.frets;
        var fretSpacing = this.fretSpacing();
        return utils_1.range(frets, 1).map(function (i) { return startY + fretSpacing * i; });
    };
    SVGuitarChord.prototype.toArrayIndex = function (stringIndex) {
        var _a;
        var strings = (_a = this.settings.strings) !== null && _a !== void 0 ? _a : defaultSettings.strings;
        return Math.abs(stringIndex - strings);
    };
    SVGuitarChord.prototype.drawEmptyStringIndicators = function (y) {
        var _this = this;
        var _a, _b, _c;
        var stringXPositions = this.stringXPos();
        var stringSpacing = this.stringSpacing();
        var emptyStringIndicatorSize = (_a = this.settings.emptyStringIndicatorSize) !== null && _a !== void 0 ? _a : defaultSettings.emptyStringIndicatorSize;
        var size = emptyStringIndicatorSize * stringSpacing;
        // add some space above and below the indicator, relative to the indicator size
        var padding = size / 3;
        var color = (_b = this.settings.color) !== null && _b !== void 0 ? _b : defaultSettings.color;
        var strokeWidth = (_c = this.settings.strokeWidth) !== null && _c !== void 0 ? _c : defaultSettings.strokeWidth;
        var hasEmpty = false;
        this.chordInternal.fingers
            .filter(function (_a) {
            var _b = __read(_a, 2), value = _b[1];
            return value === exports.SILENT || value === exports.OPEN;
        })
            .map(function (_a) {
            var _b = __read(_a, 2), index = _b[0], value = _b[1];
            return [_this.toArrayIndex(index), value];
        })
            .forEach(function (_a) {
            var _b = __read(_a, 2), stringIndex = _b[0], value = _b[1];
            hasEmpty = true;
            if (value === exports.OPEN) {
                // draw an O
                _this.renderer.circle(stringXPositions[stringIndex] - size / 2, y + padding, size, strokeWidth, color);
            }
            else {
                // draw an X
                var startX = stringXPositions[stringIndex] - size / 2;
                var endX = startX + size;
                var startY = y + padding;
                var endY = startY + size;
                _this.renderer.line(startX, startY, endX, endY, strokeWidth, color);
                _this.renderer.line(startX, endY, endX, startY, strokeWidth, color);
            }
        });
        return hasEmpty || this.settings.fixedDiagramPosition ? y + size + 2 * padding : y + padding;
    };
    SVGuitarChord.prototype.drawGrid = function (y) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        var frets = (_a = this.settings.frets) !== null && _a !== void 0 ? _a : defaultSettings.frets;
        var fretSize = (_b = this.settings.fretSize) !== null && _b !== void 0 ? _b : defaultSettings.fretSize;
        var relativeNutSize = (_c = this.settings.nutSize) !== null && _c !== void 0 ? _c : defaultSettings.nutSize;
        var stringXPositions = this.stringXPos();
        var fretYPositions = this.fretLinesYPos(y);
        var stringSpacing = this.stringSpacing();
        var fretSpacing = stringSpacing * fretSize;
        var height = fretSpacing * frets;
        var startX = stringXPositions[0];
        var endX = stringXPositions[stringXPositions.length - 1];
        var nutSize = relativeNutSize * stringSpacing;
        var nutColor = (_e = (_d = this.settings.nutColor) !== null && _d !== void 0 ? _d : this.settings.color) !== null && _e !== void 0 ? _e : defaultSettings.color;
        var fretColor = (_g = (_f = this.settings.fretColor) !== null && _f !== void 0 ? _f : this.settings.color) !== null && _g !== void 0 ? _g : defaultSettings.color;
        var barreChordRadius = (_h = this.settings.barreChordRadius) !== null && _h !== void 0 ? _h : defaultSettings.barreChordRadius;
        var strokeWidth = (_j = this.settings.strokeWidth) !== null && _j !== void 0 ? _j : defaultSettings.strokeWidth;
        var fontFamily = (_k = this.settings.fontFamily) !== null && _k !== void 0 ? _k : defaultSettings.fontFamily;
        var nutTextColor = (_l = this.settings.nutTextColor) !== null && _l !== void 0 ? _l : defaultSettings.nutTextColor;
        var nutTextSize = (_m = this.settings.nutTextSize) !== null && _m !== void 0 ? _m : defaultSettings.nutTextSize;
        // draw frets
        fretYPositions.forEach(function (fretY) {
            _this.renderer.line(startX, fretY, endX, fretY, strokeWidth, fretColor);
        });
        // draw strings
        stringXPositions.forEach(function (stringX) {
            _this.renderer.line(stringX, y, stringX, y + height + strokeWidth / 2, strokeWidth, fretColor);
        });
        // draw fingers
        this.chordInternal.fingers
            .filter(function (_a) {
            var _b = __read(_a, 2), value = _b[1];
            return value !== exports.SILENT && value !== exports.OPEN;
        })
            .map(function (_a) {
            var _b = __read(_a, 3), stringIndex = _b[0], fretIndex = _b[1], text = _b[2];
            return [
                _this.toArrayIndex(stringIndex),
                fretIndex,
                text,
            ];
        })
            .forEach(function (_a) {
            var _b = __read(_a, 3), stringIndex = _b[0], fretIndex = _b[1], textOrOptions = _b[2];
            // const nutCenterX = x + stringIndex * stringSpacing
            // const startX = size / 2;
            // const nutCenterY = y + fretIndex * fretSpacing - fretSpacing / 2;
            // const startY = nutCenterY - size / 2
            //
            var nutCenterX = startX + stringIndex * stringSpacing;
            var nutCenterY = y + fretIndex * fretSpacing - fretSpacing / 2;
            var fingerOptions = SVGuitarChord.getFingerOptions(textOrOptions);
            _this.drawNut(nutCenterX, nutCenterY, nutSize, nutColor, nutTextSize, fontFamily, fingerOptions);
        });
        // draw barre chords
        this.chordInternal.barres.forEach(function (_a) {
            var fret = _a.fret, fromString = _a.fromString, toString = _a.toString, text = _a.text, color = _a.color, textColor = _a.textColor;
            var barreCenterY = fretYPositions[fret - 1] - strokeWidth / 4 - fretSpacing / 2;
            var fromStringX = stringXPositions[_this.toArrayIndex(fromString)];
            var distance = Math.abs(toString - fromString) * stringSpacing;
            _this.renderer.rect(fromStringX - stringSpacing / 4, barreCenterY - nutSize / 2, distance + stringSpacing / 2, nutSize, 0, color !== null && color !== void 0 ? color : nutColor, color !== null && color !== void 0 ? color : nutColor, nutSize * barreChordRadius);
            // draw text on the barre chord
            if (text) {
                _this.renderer.text(text, fromStringX + distance / 2, barreCenterY, nutTextSize, textColor !== null && textColor !== void 0 ? textColor : nutTextColor, fontFamily, renderer_1.Alignment.MIDDLE, true);
            }
        });
        return y + height;
    };
    SVGuitarChord.prototype.drawNut = function (x, y, size, color, textSize, fontFamily, fingerOptions) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        var shape = (_a = fingerOptions.shape) !== null && _a !== void 0 ? _a : defaultSettings.shape;
        var nutTextColor = (_b = fingerOptions.textColor) !== null && _b !== void 0 ? _b : defaultSettings.nutTextColor;
        var startX = x - size / 2;
        var startY = y - size / 2;
        switch (shape) {
            case Shape.CIRCLE:
                this.renderer.circle(startX, startY, size, 0, (_c = fingerOptions.color) !== null && _c !== void 0 ? _c : color, (_d = fingerOptions.color) !== null && _d !== void 0 ? _d : color);
                break;
            case Shape.SQUARE:
                this.renderer.rect(startX, startY, size, size, 0, (_e = fingerOptions.color) !== null && _e !== void 0 ? _e : color, (_f = fingerOptions.color) !== null && _f !== void 0 ? _f : color);
                break;
            case Shape.TRIANGLE:
                this.renderer.triangle(startX, startY, size, 0, (_g = fingerOptions.color) !== null && _g !== void 0 ? _g : color, (_h = fingerOptions.color) !== null && _h !== void 0 ? _h : color);
                break;
            case Shape.PENTAGON:
                this.renderer.pentagon(startX, startY, size, 0, (_j = fingerOptions.color) !== null && _j !== void 0 ? _j : color, (_k = fingerOptions.color) !== null && _k !== void 0 ? _k : color);
                break;
            default:
                throw new Error("Invalid shape \"" + fingerOptions.shape + "\". Valid shapes are: " + Object.values(Shape)
                    .map(function (val) { return "\"" + val + "\""; })
                    .join(', ') + ".");
        }
        // draw text on the nut
        if (fingerOptions.text) {
            this.renderer.text(fingerOptions.text, x, y, textSize, (_l = fingerOptions.textColor) !== null && _l !== void 0 ? _l : nutTextColor, fontFamily, renderer_1.Alignment.MIDDLE, true);
        }
    };
    SVGuitarChord.prototype.drawTitle = function (size) {
        var _a, _b, _c, _d;
        var color = (_a = this.settings.color) !== null && _a !== void 0 ? _a : defaultSettings.color;
        var titleBottomMargin = (_b = this.settings.titleBottomMargin) !== null && _b !== void 0 ? _b : defaultSettings.titleBottomMargin;
        var fontFamily = (_c = this.settings.fontFamily) !== null && _c !== void 0 ? _c : defaultSettings.fontFamily;
        // This is somewhat of a hack to get a steady diagram position: If no title is defined we initially
        // render an 'X' and later remove it again. That way we get the same y as if there was a title. I tried
        // just rendering a space but that doesn't work.
        var title = (_d = this.settings.title) !== null && _d !== void 0 ? _d : (this.settings.fixedDiagramPosition ? 'X' : '');
        // draw the title
        var _e = this.renderer.text(title, constants_1.constants.width / 2, 5, size, color, fontFamily, renderer_1.Alignment.MIDDLE), x = _e.x, y = _e.y, width = _e.width, height = _e.height, remove = _e.remove;
        // check if the title fits. If not, try with a smaller size
        if (x < -0.0001) {
            remove();
            // try again with smaller font
            return this.drawTitle(size * (constants_1.constants.width / width));
        }
        if (!this.settings.title && this.settings.fixedDiagramPosition) {
            remove();
        }
        return y + height + titleBottomMargin;
    };
    SVGuitarChord.prototype.clear = function () {
        this.renderer.clear();
    };
    /**
     * Completely remove the diagram from the DOM
     */
    SVGuitarChord.prototype.remove = function () {
        this.renderer.remove();
    };
    /**
     * Helper method to get an options object from the 3rd array value for a finger, that can either
     * be undefined, a string or and options object. This method will return an options object in
     * any case, so it's easier to work with this third value.
     *
     * @param textOrOptions
     */
    SVGuitarChord.getFingerOptions = function (textOrOptions) {
        if (!textOrOptions) {
            return {};
        }
        if (typeof textOrOptions === 'string') {
            return {
                text: textOrOptions,
            };
        }
        return textOrOptions;
    };
    return SVGuitarChord;
}());
exports.SVGuitarChord = SVGuitarChord;
//# sourceMappingURL=svguitar.js.map