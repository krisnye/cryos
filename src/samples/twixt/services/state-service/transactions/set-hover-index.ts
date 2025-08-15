import { TwixtStore } from "../state-service.js";

export const setHoverIndex = (t: TwixtStore, index: number | null) => {
    t.resources.hoverIndex = index;
};
