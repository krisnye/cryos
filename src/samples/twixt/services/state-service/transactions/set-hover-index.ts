import { TwixtStore } from "../create-state-service2";

export const setHoverIndex = (store: TwixtStore, index: number | null) => {
    store.resources.hoverIndex = index;
};
