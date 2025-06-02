import { CoreComponents } from "./core-components";

export type ArchetypeComponents<C extends CoreComponents> = { [name: string]: (keyof C)[]; };
