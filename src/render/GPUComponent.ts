import { GPUContext } from "../core/GPUContext.js";

export interface GPUComponent {
    update?(c: GPUContext): boolean | void
    render(c: GPUContext)
    destroy()
}
