import { CoreComponents } from "./core";

export type ArchetypeComponents<C extends CoreComponents> = { [name: string]: (keyof C)[]; };
