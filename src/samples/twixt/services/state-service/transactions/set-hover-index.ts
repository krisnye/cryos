import { TwixtStore } from "../state-service.js";

export const setHoverIndex = (store: TwixtStore) => (index: number | null) => {
    store.resources.hoverIndex = index;
};
