import { ArchetypeComponents } from "ecs/datastore/archetype-components";
import { CoreComponents } from "ecs/datastore/core-components";
import { ResourceComponents } from "ecs/datastore/resource-components";
import { TransactionFunctions } from "ecs/datastore/transaction/transaction-datastore";
import { Database } from "./database";

export type SyncSystem = () => void;
export type AsyncSystem = () => Promise<void>;
export type System = SyncSystem | AsyncSystem;

export type SystemDeclarations<
  C extends CoreComponents,
  A extends ArchetypeComponents<CoreComponents>,
  R extends ResourceComponents,
  T extends TransactionFunctions,
> = {
    [name: string]: ((db: Database<C, A, R, T>) => void) | ((db: Database<C, A, R, T>) => Promise<void>);
}

export type CoreSystems = { all(): Promise<void> }

/**
 * For any system declarations we return a type with the same signature but with no parameters and return type void or Promise<void>
 */
export type SystemFunctionsFromDeclarations<T extends SystemDeclarations<any, any, any, any>> = {
    [K in keyof T]: T[K] extends (db: any) => Promise<void> ? () => Promise<void> : () => void;
}