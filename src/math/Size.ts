import { Spacing } from "./Spacing.js"

export class Size {

    width: number
    height: number

    constructor(width: number, height: number) {
        this.width = width
        this.height = height
    }

    add(b: Spacing) {
        if (!b || b.isZero) {
            return this
        }
        return new Size(this.width + b.left + b.right, this.height + b.top + b.bottom)
    }

    subtract(b: Spacing) {
        if (!b || b.isZero) {
            return this
        }
        return new Size(this.width - b.left - b.right, this.height - b.top - b.bottom)
    }

}
