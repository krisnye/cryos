import { ensureCapacity } from "./ensure-capacity";
import { RowIndex } from "./row-index";
import { Table } from "./table";

/**
 * Adds a row to the end of the Table.
 * @param Table 
 * @param rowData 
 */
export const addRow = <C>(table: Table<C>, rowData: C): RowIndex => {
    ensureCapacity(table, table.rows + 1);
    const rowIndex = table.rows;
    for (const name in rowData) {
        const column = table.columns[name];
        if (column) {
            column.set(rowIndex, rowData[name]);
        }
    }
    table.rows++;
    return rowIndex;
}
