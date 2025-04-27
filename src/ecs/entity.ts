import { InferType, U32Schema } from "data";

export const EntitySchema = U32Schema;
export type Entity = InferType<typeof EntitySchema>;
