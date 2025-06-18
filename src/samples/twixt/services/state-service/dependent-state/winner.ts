import { calculateWinner } from "../../../functions/calculate-winner";
import { TwixtReadonlyStore } from "../state-service";

export const winner = (db: TwixtReadonlyStore) => calculateWinner(db);
