
export class Spacing {

    readonly left: number
    readonly top: number
    readonly right: number
    readonly bottom: number

    constructor(left: number = 0, top: number = left, right: number = left, bottom: number = top) {
        this.left = left
        this.top = top
        this.right = right
        this.bottom = bottom
    }

    negate() {
        if (this.isZero) {
            return this
        }
        return new Spacing(-this.left, -this.top, -this.right, -this.bottom)
    }

    add(b: Spacing) {
        if (b.isZero) {
            return this
        }
        return new Spacing(this.left + b.left, this.top + b.top, this.right + b.right, this.bottom + b.bottom)
    }

    subtract(b: Spacing) {
        if (b.isZero) {
            return this
        }
        return new Spacing(this.left - b.left, this.top - b.top, this.right - b.right, this.bottom - b.bottom)
    }

    get isZero() {
        return this === Spacing.zero || (this.left === 0 && this.top === 0 && this.right === 0 && this.bottom === 0)
    }

    static readonly zero = new Spacing()

}