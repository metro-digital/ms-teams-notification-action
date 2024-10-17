import { Payload } from "./types";
import { Context } from "@actions/github/lib/context";

export interface MS_TEAMS_WEBHOOK {
  url: string;
  preparePayload(ctx: Context): Payload;
  send(payload: Payload): Promise<Response>;
}
