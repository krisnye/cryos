import { InferType } from "../Schema";
import { U32Schema } from "../U32";

export const EntitySchema = U32Schema;
export type Entity = InferType<typeof EntitySchema>;
