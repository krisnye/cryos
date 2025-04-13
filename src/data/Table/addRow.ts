import { Table_ensureCapacity } from "./ensureCapacity";
import { RowIndex } from "./RowIndex";
import { Table } from "./Table";

/**
 * Adds a row to the end of the Table.
 * @param Table 
 * @param rowData 
 */
export const Table_addRow = <C>(table: Table<C>, rowData: C): RowIndex => {
    Table_ensureCapacity(table, table.rows + 1);
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
