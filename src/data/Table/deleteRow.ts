import { RowIndex } from "./RowIndex";
import { Table } from "./Table";

/**
 * Deletes a row from the Table, replacing it with the last row in the Table.
 * @returns true if a row was moved into the deleted row's position, false if the row was the last row in the Table.
 *  @param Table 
 * @param rowIndex 
 */
export const Table_deleteRow = <C>(table: Table<C>, rowIndex: RowIndex): boolean => {
    const lastRowIndex = --table.rows;
    if (rowIndex === lastRowIndex) {
        return false;
    }

    for (const name in table.columns) {
        const column = table.columns[name];
        column.move(lastRowIndex, rowIndex);
    }
    return true;
}
