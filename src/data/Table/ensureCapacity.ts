import { Table } from "./Table";

export const Table_ensureCapacity = <C>(table: Table<C>, minimumCapacity: number, growthFactor = 2) => {
    // we don't actually loop, we just need to check the first columns length.
    for (const name in table.columns) {
        const currentCapacity = table.columns[name].length;
        if (currentCapacity < minimumCapacity) {
            const newCapacity = Math.max(minimumCapacity, currentCapacity * growthFactor);
            for (const name in table.columns) {
                const column = table.columns[name];
                column.length = newCapacity;
            }
        }
        return;
    }
}
