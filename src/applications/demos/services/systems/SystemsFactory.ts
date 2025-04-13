import { StateService } from "../StateService";
import { Systems } from "./Systems";

export type SystemsFactory = (db: StateService) => Systems;
