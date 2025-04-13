import { type createMainService } from "./createMainService";

export type MainService = Awaited<ReturnType<typeof createMainService>>;

