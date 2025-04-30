import { createDatabase } from "ecs/database";
import { addObservableResources } from "ecs/extensions/add-observable-resources";

export type BoardElement = true | false | null;
export type BoardLink = [number, number, number, number];

export function createStateService() {
    return addObservableResources(
        createDatabase(),
        {
            board: new Array<BoardElement>(16).fill(null),
            links: new Array<BoardLink>(0),
        } as const
    );
}
