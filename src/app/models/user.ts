import { JobDefinition } from "./job_definition";
import { ServiceDefinition } from "./service_definition/service_definition";

export class User {
  _id!: string;
  username!: string;
  registrated!: Date;
  status!: string;
  configSyncJobDefinition!: JobDefinition | null;
  timeEntrySyncJobDefinition!: JobDefinition | null;
  serviceDefinitions!: ServiceDefinition[];

  token: string;
}