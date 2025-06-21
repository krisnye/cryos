import { Service } from "@adobe/data/service";
import { TwixtStateService } from "../state-service/state-service.js";

export interface MainService extends Service {
    serviceName: "main-service";
    state: TwixtStateService;
}
