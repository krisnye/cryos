import { Entity } from "ecs";
import { CoreComponents } from "ecs/datastore/core-components";
import { ArchetypeComponents } from "ecs/datastore/archetype-components";
import { ResourceComponents } from "ecs/datastore/resource-components";
import { ArchetypeId } from "ecs/archetype";
import { Observe } from "data/observe";
import { TransactionResult, TransactionDatastore, TransactionDeclarations, ToTransactionFunctions, TransactionFunctions } from "ecs/datastore/transaction/transaction-datastore";
import { EntityValues } from "ecs/datastore/datastore";
import { Simplify } from "types";
import { DefaultPhases, System, SystemNames, SystemPhases, Systems } from "./system";

export interface Database<
    C extends CoreComponents = CoreComponents,
    A extends ArchetypeComponents<CoreComponents> = {},
    R extends ResourceComponents = {},
    T extends TransactionFunctions = {},
    S extends SystemNames = never,
    P extends SystemPhases = DefaultPhases,
> extends Omit<TransactionDatastore<C, A, R>, "withArchetypes" | "withComponents" | "withResources" | "toDatabase"> {
    readonly transactions: T;
    readonly observe: {
        readonly component: { [K in keyof C]: Observe<void> };
        readonly resource: { [K in keyof R]: Observe<R[K]> };
        readonly transactions: Observe<TransactionResult<C>>;
        entity(id: Entity): Observe<EntityValues<C> | null>;
        archetype(id: ArchetypeId): Observe<void>;
    }
    readonly systems: Systems<S, P> & { readonly phases: P, run(phases?: readonly P[number][]): Promise<void> };
    withTransactions: <NT extends TransactionDeclarations<C, A, R>>(transactions: NT)
        => Database<C, A, R, Simplify<T & ToTransactionFunctions<NT>>>;
    withComputedResource<
        N extends string,
        const D extends readonly (keyof R)[],
        CT
      >(
        name: N,
        resources: D,
        compute: (resources: { [K in D[number]]: R[K] }) => CT
      ): Database<C, A, Simplify<R & { [K in N]: CT }>>;
    withPhases: <NP extends SystemPhases>(phases: NP) => Database<C, A, R, T, S, NP>;
    withSystems:<
        const NewSystems extends readonly System<P>[],
        NewNames extends NewSystems[number]["name"]
      >(
        ...systems: NewSystems
      ) => Database<C, A, R, T, S | NewNames, P>;
}

export type ComputedResource<
  R extends ResourceComponents,
  D extends readonly (keyof R)[],
  T
> = {
  resources: D;
  compute: (resources: { [K in D[number]]: R[K] }) => T;
};

export type ComputedResources<R extends ResourceComponents> = {
  [name: string]: ComputedResource<R, readonly (keyof R)[], unknown>;
};

declare const db: Database<{ id: number }, {}, { a: number, b: string }, {}>;
async () => {
    const db2 = db.withComputedResource("foo", ["a", "b"], ({a, b}) => false);
    const db3 = db2.withSystems(
      {
        name: "foo",
        phase: "input",
        run: () => {
          console.log("foo");
        }
      },
      {
        name: "bar",
        phase: "input",
        run: () => {
          console.log("bar");
        }
      }
    );
    db3.systems.foo.run();
    await db3.systems.bar.run();
    // @ts-expect-error
    db3.systems.baz.run();
};

