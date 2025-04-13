import { Table_ensureCapacity } from "./ensureCapacity";
import { RowIndex } from "./RowIndex";
import { Table } from "./Table";

/**
 * Adds a row to the end of the Table.
 * @param Table 
 * @param rowData 
 */
export const Table_updateRow = <C>(archetype: Table<C>, row: RowIndex, rowData: Partial<C>) => {
    for (const name in rowData) {
        const column = archetype.columns[name];
        column.set(row, rowData[name] as C[typeof name]);
    }
}
