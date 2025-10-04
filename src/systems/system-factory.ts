import { System } from "./system.js";
import { Service } from "@adobe/data/service";

export type SystemFactory<MainService extends Service> = (service: MainService) => System[];
