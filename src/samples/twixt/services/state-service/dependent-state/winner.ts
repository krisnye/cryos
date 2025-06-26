import { calculateWinner } from "../../../functions/calculate-winner.js";
import { TwixtReadonlyStore } from "../state-service.js";

export const winner = (db: TwixtReadonlyStore) => calculateWinner(db);
