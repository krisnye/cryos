import { RowIndex } from "./row-index";
import { Table } from "./table";

export const getRowData = <C>(table: Table<C>, rowIndex: RowIndex): C => {
    const rowData: C = {} as C;
    for (const name in table.columns) {
        rowData[name] = table.columns[name].get(rowIndex);
    }
    return rowData;
}