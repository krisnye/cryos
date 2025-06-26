import { Observe } from "@adobe/data/observe";
import { Service } from "@adobe/data/service";

export interface MainService extends Service {
    serviceName: "main-service";
    name: Observe<string>;
    setName(name: string): void;
    counter: Observe<number>;
    increment(): void;
}
