import { Schema } from "../../schema";
import { getStructLayout } from "./get-struct-layout";

/**
 * Asserts that the schema is a valid struct schema.
 * @param schema - The schema to assert.
 * @returns The schema.
 * @throws An error if the schema is not a valid struct schema.
 */
export const assertStruct = <S extends Schema>(schema: S): S => {
    const layout = getStructLayout(schema);
    if (!layout) {
        throw new Error("Invalid structure schema");
    }
    return schema;
};
