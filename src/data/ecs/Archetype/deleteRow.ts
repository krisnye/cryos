import { Archetype } from "./Archetype";
import { EntityLocationTable } from "../EntityLocationTable/EntityLocationTable";
import { Table_deleteRow } from "../../Table/deleteRow";
import { CoreComponents } from "../CoreComponents";

/**
 * Deletes a row from the archetype and updates the entity location table for any row which may have been moved into it's position.
 * Does NOT modify the deleted row's entity location.
 */
export const Archetype_deleteRow = <C extends CoreComponents>(archetype: Archetype<C>, row: number, entityLocationTable: EntityLocationTable): void => {
    const movedARowToFillHole = Table_deleteRow(archetype, row);
    if (movedARowToFillHole) {
        const movedId = archetype.columns.id.get(row);
        entityLocationTable.updateEntity(movedId, { archetype: archetype.id, row });
    }
}