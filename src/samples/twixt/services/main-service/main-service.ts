import { Service } from "services";
import { TwixtStateService } from "../state-service/state-service";

export interface MainService extends Service {
    state: TwixtStateService;
}
