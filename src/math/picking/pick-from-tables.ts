import { Table } from "@adobe/data/table";
import { Aabb } from "math/aabb/aabb.js";
import { center } from "math/aabb/center.js";
import { lineIntersection } from "math/aabb/line-intersection.js";
import { Line3 } from "math/line3/line3.js";
import { closestPointOnLine, interpolate } from "math/line3/index.js";
import { distanceSquared } from "math/vec3/functions.js";
import { Vec3 } from "math/vec3/vec3.js";
import { Entity } from "@adobe/data/ecs";
import { PickResult } from "./pick-result.js";

function getIntersectingEntities<T extends Table<{ id: Entity, boundingBox: Aabb }>>(options: {
    tables: readonly T[],
    line: Line3,
    radius?: number,
    predicate?: (table: T, row: number) => boolean,
}): Map<Entity, Aabb> {
    const { tables, line, radius = 0, predicate } = options;
    const rows = new Map<number, Aabb>();
    for (const table of tables) {
        for (let row = 0; row < table.rowCount; row++) {
            const boundingBox = table.columns.boundingBox.get(row);
            if (lineIntersection(boundingBox, line, radius) !== -1 && (predicate?.(table, row) ?? true)) {
                rows.set(table.columns.id.get(row), boundingBox);
            }
        }
    }
    return rows;
}

function getClosestEntityToPoint(rows: Map<Entity, Aabb>, point: Vec3): PickResult | null {
    let closestRow = -1;
    let closestDistanceSquared = Infinity;
    let closestAabb: Aabb | null = null;
    for (const [row, aabb] of rows) {
        const distSquared = distanceSquared(point, center(aabb));
        if (distSquared < closestDistanceSquared) {
            closestDistanceSquared = distSquared;
            closestRow = row;
            closestAabb = aabb;
        }
    }
    if (closestRow !== -1 && closestAabb) {
        // For direct intersection, use the intersection point if possible
        // We'll use the intersection alpha from lineIntersection
        // If the line starts inside, alpha=0, so position is line.a
        // Otherwise, interpolate at alpha
        return {
            entity: closestRow,
            position: point,
        };
    }
    return null;
}

function getClosestEntityToLine(rows: Map<Entity, Aabb>, line: Line3): PickResult | null {
    let closestEntity: Entity | null = null;
    let closestDistanceSquared = Infinity;
    let closestAlpha = Infinity;
    let pickedPosition: Vec3 | null = null;
    for (const [id, aabb] of rows) {
        const aabbCenter = center(aabb);
        const alpha = closestPointOnLine(line, aabbCenter);
        const closestPointOnLineSegment = interpolate(line, alpha);
        const distSquared = distanceSquared(aabbCenter, closestPointOnLineSegment);
        if (
            distSquared < closestDistanceSquared ||
            (distSquared === closestDistanceSquared && alpha < closestAlpha)
        ) {
            closestDistanceSquared = distSquared;
            closestAlpha = alpha;
            closestEntity = id;
            pickedPosition = closestPointOnLineSegment;
        }
    }
    if (closestEntity !== null && pickedPosition) {
        return {
            entity: closestEntity,
            position: pickedPosition,
        };
    }
    return null;
}

/**
 * Picks the closest intersecting row from a table.
 * @returns The entity id and picked position, or null if no entity is found.
 */
export function pickFromTables<T extends Table<{ id: Entity, boundingBox: Aabb }>>(options: {
    tables: readonly T[],
    line: Line3,
    radius?: number,
    predicate?: (table: T, row: number) => boolean,
}): PickResult | null {
    const { tables, line, radius = 0, predicate } = options;
    let rows = getIntersectingEntities({ tables, line, radius: 0, predicate });
    if (rows.size > 0) {
        // For direct intersection, find the alpha for the closest intersecting entity
        let best: { id: Entity, alpha: number } | null = null;
        for (const [id, aabb] of rows) {
            const alpha = lineIntersection(aabb, line, 0);
            if (alpha !== -1 && (best === null || alpha < best.alpha)) {
                best = { id, alpha };
            }
        }
        if (best) {
            return {
                entity: best.id,
                position: interpolate(line, best.alpha),
            };
        }
        // fallback (should not happen):
        return getClosestEntityToPoint(rows, line.a);
    } else if (radius > 0) {
        rows = getIntersectingEntities({ tables, line, radius, predicate });
        if (rows.size > 0) {
            return getClosestEntityToLine(rows, line);
        }
    }
    return null;
}