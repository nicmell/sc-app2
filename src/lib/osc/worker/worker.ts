/// <reference lib="webworker" />
import { workerGlobalPort } from "../protocol/port";
import { createOscEndpoint } from "./endpoint";

createOscEndpoint(workerGlobalPort(self as unknown as DedicatedWorkerGlobalScope));
