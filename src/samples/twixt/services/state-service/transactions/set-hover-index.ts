import { TwixtStore } from "../state-service";

export const setHoverIndex = (store: TwixtStore, index: number | null) => {
    store.resources.hoverIndex = index;
};
