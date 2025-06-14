import * as TABLE from "data/table";
import { Archetype } from "./archetype";
import { CoreComponents } from "../core-components";
import { EntityLocationTable } from "../entity-location-table";

/**
 * Deletes a row from the archetype and updates the entity location table for any row which may have been moved into it's position.
 * Does NOT modify the deleted row's entity location.
 */
export const deleteRow = <C extends CoreComponents>(archetype: Archetype<C>, row: number, entityLocationTable: EntityLocationTable): void => {
    const movedARowToFillHole = TABLE.deleteRow(archetype, row);
    if (movedARowToFillHole) {
        const movedId = archetype.columns.id.get(row);
        entityLocationTable.updateEntity(movedId, { archetype: archetype.id, row });
    }
}