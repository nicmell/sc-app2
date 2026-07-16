import type { OscClient } from "@/lib/osc/worker/OscClient";
export let workerOscClient: OscClient;
export const setWorkerOscClient = (client: OscClient) => {
  workerOscClient = client;
};
