import { InferType } from "../Schema";
import { U32Schema } from "../U32";

export const RowIndexSchema = U32Schema;
export type RowIndex = InferType<typeof RowIndexSchema>;
