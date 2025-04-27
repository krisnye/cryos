import { InferType } from "../schema";
import { U32Schema } from "../u32";

export const RowIndexSchema = U32Schema;
export type RowIndex = InferType<typeof RowIndexSchema>;
