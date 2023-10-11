import { Component } from "lithos"
import { readFlag, writeFlag } from "./functions.js"

enum GPUComponentFlags {
    None = 0,
    isConnected = 1 << 0,
    isUpdateNeeded = 1 << 1,
    isRenderNeeded = 1 << 2,
}

const connectedEvent = new CustomEvent("connected")
const disconnectedEvent = new CustomEvent("disconnected")

export class GPUComponent extends EventTarget implements Component {

    private flags = GPUComponentFlags.None
    private children?: Set<GPUComponent>

    add(child: GPUComponent) {
        this.children ??= new Set()
        this.children.add(child)
        if (this.isConnected) {
            child.isConnected = true
        }
    }

    remove(child: GPUComponent) {
        child.isConnected = false
        this.children!.delete(child)
    }

    get isConnected(): boolean {
        return readFlag(this.flags, GPUComponentFlags.isConnected)
    }
    set isConnected(value: boolean) {
        this.flags = writeFlag(this.flags, GPUComponentFlags.isConnected, value)
        this.dispatchEvent(value ? connectedEvent : disconnectedEvent)
        if (this.children) {
            for (let child of this.children) {
                child.isConnected = value
            }
        }
    }

}