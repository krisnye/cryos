import { Entity } from "../entity";
import { Archetype, ReadonlyArchetype } from "../archetype/archetype";
import { Schema } from "data";
import { EntityLocation } from "../entity-location";
import { CoreComponents } from "../core-components";
import { StringKeyOf } from "types/string-key-of";

export type EntityValues<C> = CoreComponents & { readonly [K in StringKeyOf<C>]?: C[K] }
export type EntityUpdateValues<C> = Partial<Omit<C, "id">>;;

export type QueryOptions<Include, Exclude> =
    Extract<Include, Exclude> extends never
        ? { exclude?: readonly Exclude[] }
        : { exclude?: never };

export interface ReadonlyCore<
    C extends CoreComponents = CoreComponents,
> {
    readonly componentSchemas: { readonly [K in StringKeyOf<C>]: Schema };

    queryArchetypes<
        Include extends StringKeyOf<C>,
        Exclude extends StringKeyOf<C> = never
    >(
        include: readonly Include[],
        options?: QueryOptions<Include, Exclude>
    ): readonly ReadonlyArchetype<Pick<C, Include>>[];

    ensureArchetype: <CC extends StringKeyOf<C>>(components: CC[]) => ReadonlyArchetype<CoreComponents & { [K in CC]: C[K]}>;
    locate: (entity: Entity) => EntityLocation | null;
    read: (entity: Entity) => EntityValues<C> | null;
}

/**
 * This is the main interface for the low level ECS Core.
 */
export interface Core<
    C extends CoreComponents = CoreComponents,
> extends ReadonlyCore<C> {
    queryArchetypes<
        Include extends StringKeyOf<C>,
        Exclude extends StringKeyOf<C> = never
    >(
        include: Include[],
        options?: QueryOptions<Include, Exclude>
    ): readonly Archetype<Pick<C, Include>>[];
    ensureArchetype: <CC extends StringKeyOf<C>>(components: CC[]) => Archetype<CoreComponents & { [K in CC]: C[K]}>;
    delete: (entity: Entity) => void;
    update: (entity: Entity, values: EntityUpdateValues<C>) => void;
}