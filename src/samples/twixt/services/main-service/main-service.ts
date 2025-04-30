import { Service } from "services";
import { StateService } from "../state-service/state-service";

export interface MainService extends Service {
    state: StateService;
}
