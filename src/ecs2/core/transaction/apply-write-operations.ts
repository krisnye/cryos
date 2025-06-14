import { Datastore } from "../datastore";
import { ArchetypeComponents } from "../archetype-components";
import { CoreComponents } from "../core";
import { ResourceComponents } from "../resource-components";
import { TransactionWriteOperation } from "./transaction-datastore";
import { TypedBuffer } from "data";

export function applyWriteOperations<
    C extends CoreComponents,
    A extends ArchetypeComponents<CoreComponents>,
    R extends ResourceComponents>(database: Datastore<C, A, R>, operations: TransactionWriteOperation<C>[]): void {
    for (const operation of operations) {
        switch (operation.type) {
            case "create": {
                const archetype = database.getArchetype(["id", ...(Object.keys(operation.values) as (keyof C)[])]);
                archetype.insert(operation.values);
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
