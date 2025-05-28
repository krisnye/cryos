import { Database } from "ecs/database";
import { ArchetypeComponents } from "ecs/database/archetype-components";
import { CoreComponents } from "ecs/database/core-components";
import { ResourceComponents } from "ecs/database/resource-components";
import { TransactionWriteOperation } from "./transaction-database";

export function applyWriteOperations<
    C extends CoreComponents,
    A extends ArchetypeComponents<CoreComponents>,
    R extends ResourceComponents>(database: Database<C, A, R>, operations: TransactionWriteOperation<C>[]): void {
    for (const operation of operations) {
        switch (operation.type) {
            case "create": {
                const archetype = database.getArchetype(["id", ...(Object.keys(operation.values) as (keyof C)[])]);
                archetype.create(operation.values);
                break;
            }
            case "update":
                database.updateEntity(operation.entity, operation.values);
                break;
            case "delete":
                database.deleteEntity(operation.entity);
                break;
        }
    }
}
