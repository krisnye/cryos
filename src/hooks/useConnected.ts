import type { EffectCallback } from "./useEffect.js";
import { useEffect } from "./useEffect.js";
import { Component_stack } from "./Component/stack.js";

export function useConnected(callback: EffectCallback, dependencies?: unknown[]) {
    const component = Component_stack.active();

    let disconnect;
    function onConnect() {
        if (!disconnect) {
            disconnect = callback();
        }
    }

    function onDisconnect() {
        if (disconnect) {
            disconnect?.();
            disconnect = undefined;
        }
    }

    //  TODO
    if (component.isConnected) {
        onConnect();
    }

    useEffect(() => {
        component.addEventListener("connected", onConnect);
        component.addEventListener("disconnected", onDisconnect);

        return () => {
            component.removeEventListener("connected", onConnect);
            component.removeEventListener("disconnected", onDisconnect);

            onDisconnect();
        }

    }, dependencies);
}