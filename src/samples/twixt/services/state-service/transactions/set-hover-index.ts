import { TwixtTransaction } from "../state-service.js";

export const setHoverIndex = (t: TwixtTransaction, index: number | null) => {
    t.resources.hoverIndex = index;
};
