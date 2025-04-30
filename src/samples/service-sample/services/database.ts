import { Observe } from "data/observe";
import { Service } from "services";

export interface MainService extends Service {
    name: Observe<string>;
    setName(name: string): void;
    counter: Observe<number>;
    increment(): void;
}
