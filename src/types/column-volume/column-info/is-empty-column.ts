import type { ColumnInfo } from "./column-info.js";
import { EMPTY_COLUMN } from "./empty-column.js";

export const isEmptyColumn = (columnInfo: ColumnInfo): boolean => columnInfo === EMPTY_COLUMN;
