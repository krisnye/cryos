import { Table } from "@adobe/data/table";
import { Aabb, Line3, Quat, Vec3 } from "@adobe/data/math";
import { Entity, Store } from "@adobe/data/ecs";
import { PickResult } from "./pick-result.js";
import { GraphicsStore } from "graphics/database/graphics-store.js";
import { PickIntermediateResult } from "./pick-intermediate-result.js";
import { Rgba, Volume } from "data/index.js";
import { Transform } from "graphics/transform/transform.js";

/**
 * Uses bounding boxes to test for broad phase intersection.
 */
export function* boundingBoxBroadTest<
    S extends GraphicsStore,
    T extends Table<{ id: Entity, position: Vec3, boundingBox: Aabb } & Partial<Store.Components<S>>>
>(table: T, props: { line: Line3, radius: number }): Generator<PickIntermediateResult<S, T>> {
    const { line, radius } = props;
    for (let row = 0; row < table.rowCount; row++) {
        const alpha = Aabb.lineIntersection(table.columns.boundingBox.get(row), line, radius);
        yield { table, row, alpha };
    }
}

/**
 * Everything passes the default broad test.
 */
export function* defaultBroadTest<
    S extends GraphicsStore,
    T extends Table<{ id: Entity, position: Vec3 } & Partial<Store.Components<S>>>
>(table: T, props: { line: Line3, radius: number }): Generator<PickIntermediateResult<S, T>> {
    const { line } = props;
    for (let row = 0; row < table.rowCount; row++) {
        const position = table.columns.position.get(row);
        const alpha = Line3.closestPointOnLine(line, position);
        yield { table, row, alpha };
    }
}

export const defaultNarrowTest = <
    S extends GraphicsStore,
    T extends Table<{ id: Entity, position: Vec3 } & Partial<Store.Components<S>>>
>(
    props: { store: S, line: Line3, radius: number }, broadResult: PickIntermediateResult<S, T>
): PickResult | null => {
    const { table, row, alpha } = broadResult;
    const { store, line, radius } = props;
    // first we are going to convert the line to model space
    // gather any transforms for the entity
    let position: Vec3 = table.columns.position.get(row);
    let rotation: Quat = table.columns.rotation?.get(row) ?? Quat.identity;
    let scale: Vec3 = table.columns.scale?.get(row) ?? Vec3.one;
    const transform: Transform = { position, rotation, scale };
    // transform the line to model space
    let modelLine: Line3 = {
        a: Transform.transformInverse(transform, line.a),
        b: Transform.transformInverse(transform, line.b)
    };

    if (table.columns.voxelColor) {
        const voxelColor = table.columns.voxelColor.get(row)!;
        if (table.columns.centerOfMass) {
            modelLine = {
                a: Vec3.add(modelLine.a, table.columns.centerOfMass.get(row)!),
                b: Vec3.add(modelLine.b, table.columns.centerOfMass.get(row)!),
            }
        }

        const voxelPick = Volume.pick(voxelColor, modelLine, Rgba.isVisible);
        if (voxelPick) {
            const entity = table.columns.id.get(row);
            return {
                entity,
                lineAlpha: voxelPick.alpha,
                worldPosition: Line3.interpolate(line, voxelPick.alpha),
                modelPosition: Line3.interpolate(modelLine, voxelPick.alpha),
                voxel: {
                    index: voxelPick.index,
                    face: voxelPick.face,
                },
            };
        }
    }
    else {
        // this is a voxel model
        const entity = table.columns.id.get(row);
        const color = table.columns.color?.get(row);
        if (!color || color[3 /* alpha */] === 0) {
            return null;
        }
        // every voxel is just a unit cube with transformations applied to it
        const aabb = Aabb.unit;
        const alpha = Aabb.lineIntersection(aabb, modelLine, radius);
        if (alpha === -1) {
            return null;
        }
        const modelPosition = Line3.interpolate(modelLine, alpha);
        const worldPosition = Line3.interpolate(line, alpha);
        return {
            entity,
            lineAlpha: alpha,
            worldPosition,
            modelPosition,
        };
    }
    return null;
}

// Broad phase picking of entities.
// Sorting based on position from picking line.a
// Narrow phase picking of entities.
export function pick<
    S extends GraphicsStore,
    T extends Table<{ id: Entity, position: Vec3 } & Partial<Store.Components<S>>>
>(options: {
    store: S,
    tables: readonly T[],
    line: Line3,
    radius?: number,
    predicate?: (result: PickIntermediateResult<S, T>) => boolean,
    broad?: (table: T, props: { line: Line3, radius: number }) => Iterable<PickIntermediateResult<S, T>>,
    narrow?: (props: { store: S, line: Line3, radius: number }, broadResult: PickIntermediateResult<S, T>) => PickResult | null,
}): PickResult[] {
    const { store, tables, line, radius = 0, predicate, broad = defaultBroadTest, narrow = defaultNarrowTest } = options;
    // iterate each table and get the broad phase intermediate results, applying predicate
    const intermediateResults: PickIntermediateResult<S, T>[] = [];
    for (const table of tables) {
        for (const result of broad(table, { line, radius })) {
            if (!predicate || predicate(result)) {
                intermediateResults.push(result);
            }
        }
    }
    // sort the intermediate results by alpha, so the closest ones are first
    // intermediateResults.sort((a, b) => a.alpha - b.alpha);

    // iterate each intermediate result and perform the narrow phase picking
    const pickResults: PickResult[] = [];
    for (const intermediateResult of intermediateResults) {
        const pickResult = narrow({ store, line, radius }, intermediateResult);
        if (pickResult) {
            pickResults.push(pickResult);
        }
    }
    // sort the pick results by line alpha, so the closest ones are first
    pickResults.sort((a, b) => a.lineAlpha - b.lineAlpha);
    return pickResults;
}