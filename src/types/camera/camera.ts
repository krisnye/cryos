import { Schema } from "@adobe/data/schema";
import { schema } from "./schema.js";

export type Camera = Schema.ToType<typeof schema>;
