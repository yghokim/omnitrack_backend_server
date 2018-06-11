import { IMongooseDbEntity } from "../db-entity-types";
import { VisualizationConfigs } from "./configs";

export interface IExperimentGroupDbEntity extends IMongooseDbEntity{
  name: string,
  maxSize: number,
  trackingPackageKey?: string
}

export interface IExperimentTrackingPackgeDbEntity{
  key: string,
  name: string,
  data: any
}

export interface IExperimentDbEntity extends IMongooseDbEntity{
  name: string,
  groups: Array<IExperimentGroupDbEntity>,
  manager: string | IResearcherDbEntity,
  visualizationConfigs: VisualizationConfigs,
  trackingPackages: Array<IExperimentTrackingPackgeDbEntity>,
  experimenters: Array<{researcher: string | IResearcherDbEntity, permissions: any}>
}

export interface IClientSignatureDbEntity extends IMongooseDbEntity{
  key: string,
  package: string,
  alias: string
}

export interface IResearcherDbEntity extends IMongooseDbEntity{
  alias: string,
  email: string,
  account_approved: boolean,
  managingExperiments?: Array<IExperimentDbEntity>,
  collaboratingExperiments?: Array<IExperimentDbEntity>
}