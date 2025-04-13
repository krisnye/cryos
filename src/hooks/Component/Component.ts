
export interface Component extends EventTarget {
    /**
     * Is this component active and connected to the containing dom?
     */
    readonly isConnected: boolean;
    hookIndex: number
    hooks: any[]
    requestUpdate(): void
}