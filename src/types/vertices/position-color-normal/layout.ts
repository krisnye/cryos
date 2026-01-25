import { getStructLayout } from "@adobe/data/typed-buffer";
import { schema } from "./schema.js";

export const layout = getStructLayout(schema);

