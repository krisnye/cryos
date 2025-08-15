import { createTwixtStateService, TwixtStore } from "./create-state-service.js";

export type Player = "red" | "black";
export type BoardPoint = Player | null;
export type BoardLink = readonly [number, number]; // [fromIndex, toIndex]

export { createTwixtStateService, createTwixtStore, createTwixtDatabase } from "./create-state-service.js";
export type { TwixtStore, TwixtReadonlyStore } from "./create-state-service.js";
export type TwixtStateService = ReturnType<typeof createTwixtStateService>;
