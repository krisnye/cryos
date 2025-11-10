import { ArchetypeComponents, ComponentSchemas, createDatabase, Database, ResourceSchemas, Store, ToTransactionFunctions, TransactionDeclarations, TransactionFunctions } from "@adobe/data/ecs";
import { FromSchemas } from "@adobe/data/schema";
import { Service } from "@adobe/data/service";
import { StringKeyof } from "@adobe/data/types";
import { GraphicsDatabase } from "graphics/database/graphics-database.js";
import { GraphicsStore, graphicsStoreSchema } from "graphics/database/graphics-store.js";
import { getWebGPUDevice } from "graphics/get-web-gpu-device.js";
import { createSystemSchedulerService } from "systems/create-scheduler-service.js";
import { SystemFactory } from "systems/system-factory.js";
import { SystemSchedulerService } from "systems/system-scheduler-service.js";
import * as graphicsTransactions from "graphics/database/transactions/index.js";
import * as graphicsSystems from "graphics/systems/index.js";
import * as uiSystems from "ui/systems/index.js";

export interface GameService<
    C extends object,
    R extends object,
    A extends ArchetypeComponents<StringKeyof<C>>,
    T extends TransactionFunctions
> extends Service {
    store: Store<C, R, A> & GraphicsStore;
    database: Database<C, R, A, T> & GraphicsDatabase;
    scheduler: SystemSchedulerService;
    unobservable: {
        /**
         * These actions bypass the observable system.
         * They are higher performance BUT will not trigger any observers which is needed for Lit UI elements.
         */
        actions: T;
    },
    initializeSystems(
        customSystemFactories?: Record<string, SystemFactory<this>>,
    ): this;
}

export namespace GameService {
    /**
     * Creates a game service schema.
     */
    export function schema<
        const CS extends ComponentSchemas,
        const RS extends ResourceSchemas,
        const A extends ArchetypeComponents<StringKeyof<CS & typeof graphicsStoreSchema.components>>,
    >(
        components: CS,
        resources: RS,
        archetypes: A,
    ) {
        return {
            components: {
                ...components,
                ...graphicsStoreSchema.components,  
            },
            resources: {
                ...resources,
                ...graphicsStoreSchema.resources,
            },
            archetypes: {
                ...archetypes,
                ...graphicsStoreSchema.archetypes,
            },
        } as const satisfies Store.Schema<CS & typeof graphicsStoreSchema.components, RS & typeof graphicsStoreSchema.resources, A>;
    };
    /**
     * Creates a game service instance.
     */
    export function create<
        const CS extends ComponentSchemas,
        const RS extends ResourceSchemas,
        const A extends ArchetypeComponents<StringKeyof<CS>>,
        const TD extends TransactionDeclarations<FromSchemas<CS>, FromSchemas<RS>, A>,
    >(
        schema: Store.Schema<CS, RS, A>,
        actions: TD,
    ): GameService<FromSchemas<CS>, FromSchemas<RS>, A, ToTransactionFunctions<TD>> {
        const store = Store.createFromSchema(schema);
        actions = {
            ...graphicsTransactions,
            ...actions,
        }
        const database = createDatabase(store, actions) as Database<FromSchemas<CS>, FromSchemas<RS>, A, ToTransactionFunctions<TD>> & GraphicsDatabase;
        const scheduler = createSystemSchedulerService(store as GraphicsStore);
        getWebGPUDevice().then(device => {
            database.transactions.setDevice(device);
        });

        const engine = {
            serviceName: "engine",
            store: store as Store<FromSchemas<CS>, FromSchemas<RS>, A> & GraphicsStore,
            database,
            scheduler,
            unobservable: {
                actions: Object.fromEntries(Object.entries(actions).map(([key, value]) => [key, value.bind(store)])) as ToTransactionFunctions<TD>,
            },
            initializeSystems: (customSystems: Record<string, SystemFactory<any>> = {}) => {
                customSystems = {
                    ...graphicsSystems,
                    ...uiSystems,
                    ...customSystems,
                }
                scheduler.addSystems(Object.values(customSystems).map((factory) => factory(engine)).flat());
                scheduler.setRunning(true);
                return engine;
            },
        } satisfies GameService<FromSchemas<CS>, FromSchemas<RS>, A, ToTransactionFunctions<TD>> as GameService<FromSchemas<CS>, FromSchemas<RS>, A, ToTransactionFunctions<TD>>;


        return engine;
    }

}

