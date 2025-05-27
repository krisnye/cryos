import { Entity } from "ecs";
import { CoreComponents } from "ecs/database/core-components";
import { ArchetypeComponents } from "ecs/database/archetype-components";
import { ResourceComponents } from "ecs/database/resource-components";
import { ArchetypeId } from "ecs/archetype";
import { Observe } from "data/observe";
import { TransactionResult, TransactionDatabase } from "ecs/transaction-database/transaction-database";
import { EntityValues } from "ecs/database/database";

export interface ObservableDatabase<
    C extends CoreComponents = CoreComponents,
    A extends ArchetypeComponents<CoreComponents> = {},
    R extends ResourceComponents = {}
> extends TransactionDatabase<C, A, R> {
    readonly observe: {
        readonly component: { [K in keyof C]: Observe<void> };
        readonly resource: { [K in keyof R]: Observe<R[K]> };
        readonly transactions: Observe<TransactionResult<C>>;
        entity(id: Entity): Observe<EntityValues<C> | null>;
        archetype(id: ArchetypeId): Observe<void>;
    }
}
