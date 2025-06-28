import { Table } from "@adobe/data/table";
import { Aabb } from "math/aabb/aabb.js";
import { center } from "math/aabb/center.js";
import { lineIntersection } from "math/aabb/line-intersection.js";
import { Line3 } from "math/line3/line3.js";
import { closestPointOnLine, interpolate } from "math/line3/index.js";
import { distanceSquared } from "math/vec3/functions.js";
import { Vec3 } from "math/vec3/vec3.js";
import { Entity } from "@adobe/data/ecs";

function getIntersectingEntities<T extends Table<{ id: Entity, boundingBox: Aabb }>>(options: {
    tables: readonly T[],
    line: Line3,
    radius?: number,
    predicate?: (table: T, row: number) => boolean,
}): Map<Entity, Aabb> {
    const { tables, line, radius = 0, predicate } = options;
    const rows = new Map<number, Aabb>();
    for (const table of tables) {
        for (let row = 0; row < table.rows; row++) {
            const boundingBox = table.columns.boundingBox.get(row);
            if (lineIntersection(boundingBox, line, radius) !== -1 && (predicate?.(table, row) ?? true)) {
                rows.set(table.columns.id.get(row), boundingBox);
            }
        }
    }
    return rows;
}

function getClosestEntityToPoint(rows: Map<Entity, Aabb>, point: Vec3): Entity {
    let closestRow = -1;
    let closestDistanceSquared = Infinity;
    
    for (const [row, aabb] of rows) {
        // Calculate squared distance from line start to AABB center
        const distSquared = distanceSquared(point, center(aabb));
        
        if (distSquared < closestDistanceSquared) {
            closestDistanceSquared = distSquared;
            closestRow = row;
        }
    }
    
    return closestRow;
}

function getClosestEntityToLine(rows: Map<Entity, Aabb>, line: Line3): Entity | null {
    let closestEntity = null;
    let closestDistanceSquared = Infinity;
    let closestAlpha = Infinity;
    
    for (const [id, aabb] of rows) {
        // Find the closest point on the line to the AABB center
        const aabbCenter = center(aabb);
        const alpha = closestPointOnLine(line, aabbCenter);
        const closestPointOnLineSegment = interpolate(line, alpha);
        
        // Calculate squared distance from AABB center to closest point on line
        const distSquared = distanceSquared(aabbCenter, closestPointOnLineSegment);
        
        // Prefer closer distance, and if equal, prefer lower alpha (closer to line origin)
        if (distSquared < closestDistanceSquared || 
            (distSquared === closestDistanceSquared && alpha < closestAlpha)) {
            closestDistanceSquared = distSquared;
            closestAlpha = alpha;
            closestEntity = id;
        }
    }
    
    return closestEntity;
}

/**
 * Picks the closest intersecting row from a table.
 * @returns The entity id or null if no entity is found.
 */
export function pickFromTables<T extends Table<{ id: Entity, boundingBox: Aabb }>>(options: {
    tables: readonly T[],
    line: Line3,
    radius?: number,
    predicate?: (table: T, row: number) => boolean,
}): Entity | null {
    const { tables, line, radius = 0, predicate } = options;
    let rows = getIntersectingEntities({ tables, line, radius: 0, predicate });
    if (rows.size > 0) {
        return getClosestEntityToPoint(rows, line.a);
    }
    else if (radius > 0) {
        // try to pick from a larger radius
        rows = getIntersectingEntities({ tables, line, radius, predicate });
        if (rows.size > 0) {
            return getClosestEntityToLine(rows, line);
        }
    }
    // no hits
    return null;
}