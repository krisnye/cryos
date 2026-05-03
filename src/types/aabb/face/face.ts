
import { Schema } from "@adobe/data/schema";
import { schema } from "./schema.js";

export type Face = Schema.ToType<typeof schema>;

export * as Face from "./public.js";
