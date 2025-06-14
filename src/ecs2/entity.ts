import { FromSchema, U32Schema } from "data";

export const EntitySchema = U32Schema;
export type Entity = FromSchema<typeof EntitySchema>;
