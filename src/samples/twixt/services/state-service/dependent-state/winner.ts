import { calculateWinner } from "samples/twixt/functions/calculate-winner";
import { TwixtReadonlyStore } from "../create-state-service2";

export const winner = (db: TwixtReadonlyStore) => calculateWinner(db);
