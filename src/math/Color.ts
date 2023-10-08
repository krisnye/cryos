import { clamp } from "./functions.js"
import { Vector4 } from "./Vector4.js"

export class Color implements Iterable<number> {

    readonly red: number
    readonly green: number
    readonly blue: number
    readonly alpha: number

    constructor(red: number, green: number, blue: number, alpha: number = 1.0) {
        this.red = red
        this.green = green
        this.blue = blue
        this.alpha = alpha
    }

    *[Symbol.iterator]() {
        yield this.red
        yield this.green
        yield this.blue
        yield this.alpha
    }

    get isVisible() {
        return this.alpha > 0
    }

    get isTransparent() {
        return this.alpha === 0
    }

    get isTranslucent() {
        return this.alpha > 0 && this.alpha < 1
    }

    get isOpaque() {
        return this.alpha > 1
    }

    toString() {
        return `rgba(${this.red * 255},${this.green * 255},${this.blue * 255},${this.alpha})`
    }

    equals(c: Color) {
        return this.red === c.red
            && this.green === c.green
            && this.blue === c.blue
            && this.alpha === c.alpha
    }

    scale(f: number) {
        return new Color(this.red * f, this.green * f, this.blue * f, this.alpha)
    }

    opacity(alpha: number) {
        return new Color(this.red, this.green, this.blue, alpha)
    }

    writeTo(array: number[], index: number) {
        array[index + 0] = this.red
        array[index + 1] = this.green
        array[index + 2] = this.blue
        array[index + 3] = this.alpha
    }

    toVector4() {
        return new Vector4(this.red, this.green, this.blue, this.alpha)
    }

    lerp(color: Color, alpha: number) {
        return new Color(
            this.red + alpha * (color.red - this.red),
            this.green + alpha * (color.green - this.green),
            this.blue + alpha * (color.blue - this.blue),
            this.alpha + alpha * (color.alpha - this.alpha)
        )
    }

    /**
     * Converts to a 32 bit integer in ABGR format which seems
     * to be what WebGL expects.
     */
    toInt32() {
        //  we are using * 2 ** bits
        //  instead of << bits
        //  since shifts are treated as with signed 32 bit integers
        //  which makes the most significant bit be negative
        //  also using + instead of | for the same reason
        return (Math.round(clamp(this.alpha) * 255) * 2 ** 24) +
            (Math.round(clamp(this.blue) * 255) * 2 ** 16) +
            (Math.round(clamp(this.green) * 255) * 2 ** 8) +
            Math.round(clamp(this.red) * 255)
    }

    static readonly transparent = new Color(0, 0, 0, 0)

    static readonly aliceblue = new Color(240 / 255, 248 / 255, 255 / 255)
    static readonly antiquewhite = new Color(250 / 255, 235 / 255, 215 / 255)
    static readonly aqua = new Color(0 / 255, 255 / 255, 255 / 255)
    static readonly aquamarine = new Color(127 / 255, 255 / 255, 212 / 255)
    static readonly azure = new Color(240 / 255, 255 / 255, 255 / 255)
    static readonly beige = new Color(245 / 255, 245 / 255, 220 / 255)
    static readonly bisque = new Color(255 / 255, 228 / 255, 196 / 255)
    static readonly black = new Color(0 / 255, 0 / 255, 0 / 255)
    static readonly blanchedalmond = new Color(255 / 255, 235 / 255, 205 / 255)
    static readonly blue = new Color(0 / 255, 0 / 255, 255 / 255)
    static readonly blueviolet = new Color(138 / 255, 43 / 255, 226 / 255)
    static readonly brown = new Color(165 / 255, 42 / 255, 42 / 255)
    static readonly burlywood = new Color(222 / 255, 184 / 255, 135 / 255)
    static readonly cadetblue = new Color(95 / 255, 158 / 255, 160 / 255)
    static readonly chartreuse = new Color(127 / 255, 255 / 255, 0 / 255)
    static readonly chocolate = new Color(210 / 255, 105 / 255, 30 / 255)
    static readonly coral = new Color(255 / 255, 127 / 255, 80 / 255)
    static readonly cornflowerblue = new Color(100 / 255, 149 / 255, 237 / 255)
    static readonly cornsilk = new Color(255 / 255, 248 / 255, 220 / 255)
    static readonly crimson = new Color(220 / 255, 20 / 255, 60 / 255)
    static readonly cyan = new Color(0 / 255, 255 / 255, 255 / 255)
    static readonly darkblue = new Color(0 / 255, 0 / 255, 139 / 255)
    static readonly darkcyan = new Color(0 / 255, 139 / 255, 139 / 255)
    static readonly darkgoldenrod = new Color(184 / 255, 134 / 255, 11 / 255)
    static readonly darkgray = new Color(169 / 255, 169 / 255, 169 / 255)
    static readonly darkgreen = new Color(0 / 255, 100 / 255, 0 / 255)
    static readonly darkgrey = new Color(169 / 255, 169 / 255, 169 / 255)
    static readonly darkkhaki = new Color(189 / 255, 183 / 255, 107 / 255)
    static readonly darkmagenta = new Color(139 / 255, 0 / 255, 139 / 255)
    static readonly darkolivegreen = new Color(85 / 255, 107 / 255, 47 / 255)
    static readonly darkorange = new Color(255 / 255, 140 / 255, 0 / 255)
    static readonly darkorchid = new Color(153 / 255, 50 / 255, 204 / 255)
    static readonly darkred = new Color(139 / 255, 0 / 255, 0 / 255)
    static readonly darksalmon = new Color(233 / 255, 150 / 255, 122 / 255)
    static readonly darkseagreen = new Color(143 / 255, 188 / 255, 143 / 255)
    static readonly darkslateblue = new Color(72 / 255, 61 / 255, 139 / 255)
    static readonly darkslategray = new Color(47 / 255, 79 / 255, 79 / 255)
    static readonly darkslategrey = new Color(47 / 255, 79 / 255, 79 / 255)
    static readonly darkturquoise = new Color(0 / 255, 206 / 255, 209 / 255)
    static readonly darkviolet = new Color(148 / 255, 0 / 255, 211 / 255)
    static readonly deeppink = new Color(255 / 255, 20 / 255, 147 / 255)
    static readonly deepskyblue = new Color(0 / 255, 191 / 255, 255 / 255)
    static readonly dimgray = new Color(105 / 255, 105 / 255, 105 / 255)
    static readonly dimgrey = new Color(105 / 255, 105 / 255, 105 / 255)
    static readonly dodgerblue = new Color(30 / 255, 144 / 255, 255 / 255)
    static readonly firebrick = new Color(178 / 255, 34 / 255, 34 / 255)
    static readonly floralwhite = new Color(255 / 255, 250 / 255, 240 / 255)
    static readonly forestgreen = new Color(34 / 255, 139 / 255, 34 / 255)
    static readonly fuchsia = new Color(255 / 255, 0 / 255, 255 / 255)
    static readonly gainsboro = new Color(220 / 255, 220 / 255, 220 / 255)
    static readonly ghostwhite = new Color(248 / 255, 248 / 255, 255 / 255)
    static readonly goldenrod = new Color(218 / 255, 165 / 255, 32 / 255)
    static readonly gold = new Color(255 / 255, 215 / 255, 0 / 255)
    static readonly gray = new Color(128 / 255, 128 / 255, 128 / 255)
    static readonly green = new Color(0 / 255, 128 / 255, 0 / 255)
    static readonly greenyellow = new Color(173 / 255, 255 / 255, 47 / 255)
    static readonly grey = new Color(128 / 255, 128 / 255, 128 / 255)
    static readonly honeydew = new Color(240 / 255, 255 / 255, 240 / 255)
    static readonly hotpink = new Color(255 / 255, 105 / 255, 180 / 255)
    static readonly indianred = new Color(205 / 255, 92 / 255, 92 / 255)
    static readonly indigo = new Color(75 / 255, 0 / 255, 130 / 255)
    static readonly ivory = new Color(255 / 255, 255 / 255, 240 / 255)
    static readonly khaki = new Color(240 / 255, 230 / 255, 140 / 255)
    static readonly lavenderblush = new Color(255 / 255, 240 / 255, 245 / 255)
    static readonly lavender = new Color(230 / 255, 230 / 255, 250 / 255)
    static readonly lawngreen = new Color(124 / 255, 252 / 255, 0 / 255)
    static readonly lemonchiffon = new Color(255 / 255, 250 / 255, 205 / 255)
    static readonly lightblue = new Color(173 / 255, 216 / 255, 230 / 255)
    static readonly lightcoral = new Color(240 / 255, 128 / 255, 128 / 255)
    static readonly lightcyan = new Color(224 / 255, 255 / 255, 255 / 255)
    static readonly lightgoldenrodyellow = new Color(250 / 255, 250 / 255, 210 / 255)
    static readonly lightgray = new Color(211 / 255, 211 / 255, 211 / 255)
    static readonly lightgreen = new Color(144 / 255, 238 / 255, 144 / 255)
    static readonly lightgrey = new Color(211 / 255, 211 / 255, 211 / 255)
    static readonly lightpink = new Color(255 / 255, 182 / 255, 193 / 255)
    static readonly lightsalmon = new Color(255 / 255, 160 / 255, 122 / 255)
    static readonly lightseagreen = new Color(32 / 255, 178 / 255, 170 / 255)
    static readonly lightskyblue = new Color(135 / 255, 206 / 255, 250 / 255)
    static readonly lightslategray = new Color(119 / 255, 136 / 255, 153 / 255)
    static readonly lightslategrey = new Color(119 / 255, 136 / 255, 153 / 255)
    static readonly lightsteelblue = new Color(176 / 255, 196 / 255, 222 / 255)
    static readonly lightyellow = new Color(255 / 255, 255 / 255, 224 / 255)
    static readonly lime = new Color(0 / 255, 255 / 255, 0 / 255)
    static readonly limegreen = new Color(50 / 255, 205 / 255, 50 / 255)
    static readonly linen = new Color(250 / 255, 240 / 255, 230 / 255)
    static readonly magenta = new Color(255 / 255, 0 / 255, 255 / 255)
    static readonly maroon = new Color(128 / 255, 0 / 255, 0 / 255)
    static readonly mediumaquamarine = new Color(102 / 255, 205 / 255, 170 / 255)
    static readonly mediumblue = new Color(0 / 255, 0 / 255, 205 / 255)
    static readonly mediumorchid = new Color(186 / 255, 85 / 255, 211 / 255)
    static readonly mediumpurple = new Color(147 / 255, 112 / 255, 219 / 255)
    static readonly mediumseagreen = new Color(60 / 255, 179 / 255, 113 / 255)
    static readonly mediumslateblue = new Color(123 / 255, 104 / 255, 238 / 255)
    static readonly mediumspringgreen = new Color(0 / 255, 250 / 255, 154 / 255)
    static readonly mediumturquoise = new Color(72 / 255, 209 / 255, 204 / 255)
    static readonly mediumvioletred = new Color(199 / 255, 21 / 255, 133 / 255)
    static readonly midnightblue = new Color(25 / 255, 25 / 255, 112 / 255)
    static readonly mintcream = new Color(245 / 255, 255 / 255, 250 / 255)
    static readonly mistyrose = new Color(255 / 255, 228 / 255, 225 / 255)
    static readonly moccasin = new Color(255 / 255, 228 / 255, 181 / 255)
    static readonly navajowhite = new Color(255 / 255, 222 / 255, 173 / 255)
    static readonly navy = new Color(0 / 255, 0 / 255, 128 / 255)
    static readonly oldlace = new Color(253 / 255, 245 / 255, 230 / 255)
    static readonly olive = new Color(128 / 255, 128 / 255, 0 / 255)
    static readonly olivedrab = new Color(107 / 255, 142 / 255, 35 / 255)
    static readonly orange = new Color(255 / 255, 165 / 255, 0 / 255)
    static readonly orangered = new Color(255 / 255, 69 / 255, 0 / 255)
    static readonly orchid = new Color(218 / 255, 112 / 255, 214 / 255)
    static readonly palegoldenrod = new Color(238 / 255, 232 / 255, 170 / 255)
    static readonly palegreen = new Color(152 / 255, 251 / 255, 152 / 255)
    static readonly paleturquoise = new Color(175 / 255, 238 / 255, 238 / 255)
    static readonly palevioletred = new Color(219 / 255, 112 / 255, 147 / 255)
    static readonly papayawhip = new Color(255 / 255, 239 / 255, 213 / 255)
    static readonly peachpuff = new Color(255 / 255, 218 / 255, 185 / 255)
    static readonly peru = new Color(205 / 255, 133 / 255, 63 / 255)
    static readonly pink = new Color(255 / 255, 192 / 255, 203 / 255)
    static readonly plum = new Color(221 / 255, 160 / 255, 221 / 255)
    static readonly powderblue = new Color(176 / 255, 224 / 255, 230 / 255)
    static readonly purple = new Color(128 / 255, 0 / 255, 128 / 255)
    static readonly rebeccapurple = new Color(102 / 255, 51 / 255, 153 / 255)
    static readonly red = new Color(255 / 255, 0 / 255, 0 / 255)
    static readonly rosybrown = new Color(188 / 255, 143 / 255, 143 / 255)
    static readonly royalblue = new Color(65 / 255, 105 / 255, 225 / 255)
    static readonly saddlebrown = new Color(139 / 255, 69 / 255, 19 / 255)
    static readonly salmon = new Color(250 / 255, 128 / 255, 114 / 255)
    static readonly sandybrown = new Color(244 / 255, 164 / 255, 96 / 255)
    static readonly seagreen = new Color(46 / 255, 139 / 255, 87 / 255)
    static readonly seashell = new Color(255 / 255, 245 / 255, 238 / 255)
    static readonly sienna = new Color(160 / 255, 82 / 255, 45 / 255)
    static readonly silver = new Color(192 / 255, 192 / 255, 192 / 255)
    static readonly skyblue = new Color(135 / 255, 206 / 255, 235 / 255)
    static readonly slateblue = new Color(106 / 255, 90 / 255, 205 / 255)
    static readonly slategray = new Color(112 / 255, 128 / 255, 144 / 255)
    static readonly slategrey = new Color(112 / 255, 128 / 255, 144 / 255)
    static readonly snow = new Color(255 / 255, 250 / 255, 250 / 255)
    static readonly springgreen = new Color(0 / 255, 255 / 255, 127 / 255)
    static readonly steelblue = new Color(70 / 255, 130 / 255, 180 / 255)
    static readonly tan = new Color(210 / 255, 180 / 255, 140 / 255)
    static readonly teal = new Color(0 / 255, 128 / 255, 128 / 255)
    static readonly thistle = new Color(216 / 255, 191 / 255, 216 / 255)
    static readonly tomato = new Color(255 / 255, 99 / 255, 71 / 255)
    static readonly turquoise = new Color(64 / 255, 224 / 255, 208 / 255)
    static readonly violet = new Color(238 / 255, 130 / 255, 238 / 255)
    static readonly wheat = new Color(245 / 255, 222 / 255, 179 / 255)
    static readonly white = new Color(255 / 255, 255 / 255, 255 / 255)
    static readonly whitesmoke = new Color(245 / 255, 245 / 255, 245 / 255)
    static readonly yellow = new Color(255 / 255, 255 / 255, 0 / 255)
    static readonly yellowgreen = new Color(154 / 255, 205 / 255, 50 / 255)

}