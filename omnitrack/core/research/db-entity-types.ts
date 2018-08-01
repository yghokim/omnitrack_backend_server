import { IMongooseDbEntity } from "../db-entity-types";
import { VisualizationConfigs } from "./configs";

export interface IExperimentGroupDbEntity extends IMongooseDbEntity {
  name: string,
  trackingPackageKey?: string
}

export interface IExperimentTrackingPackgeDbEntity {
  key: string,
  name: string,
  data: any
}

export interface IExperimentDbEntity extends IMongooseDbEntity {
  name: string,
  groups: Array<IExperimentGroupDbEntity>,
  manager: string | IResearcherDbEntity,
  visualizationConfigs: VisualizationConfigs,
  maxExperimentalDay: number,
  finishDate: Date,
  consent: string,
  receiveConsentInApp: boolean,
  trackingPackages: Array<IExperimentTrackingPackgeDbEntity>,
  experimenters: Array<{ researcher: string | IResearcherDbEntity, permissions: any }>,
  clientBuildConfigs?: Array<any>
}

export interface IClientBuildConfigBase<T> extends IMongooseDbEntity {
  experiment: string | IExperimentDbEntity,
  platform: string,
  sourceCode: { sourceType: string, data: any },
  packageName: string,
  appName: string,
  repository: string,
  iconPath: string,
  disableExternalEntities: boolean,
  showTutorials: boolean,
  disableTrackerCreation: boolean,
  disableTriggerCreation: boolean,
  hideTriggersTab: boolean,
  hideServicesTab: boolean,
  credentials: T, // dictionary
  apiKeys: Array<{ key: string, value: any }>
}

export const APP_THIRD_PARTY_KEYSTORE_KEYS = [
  "GOOGLE_MAPS_API_KEY",
  "FITBIT_CLIENT_ID", "FITBIT_CLIENT_SECRET",
  "MISFIT_APP_KEY", "MISFIT_APP_SECRET",
  "RESCUETIME_CLIENT_ID", "RESCUETIME_CLIENT_SECRET", "RESCUETIME_REDIRECT_URI",
  "JAWBONE_CLIENT_ID", "JAWBONE_CLIENT_SECRET", "JAWBONE_REDIRECT_URI"]

export interface AndroidBuildCredentials {
  googleServices: any,
  keystoreFileHash: string,
  keystorePassword: string
  keystoreAlias: string,
  keystoreKeyPassword: string,
}

export interface IAndroidBuildConfig extends IClientBuildConfigBase<AndroidBuildCredentials> { }

export interface IClientBuildAction extends IMongooseDbEntity {
  experiment: string | IExperimentDbEntity,
  config: string | IClientBuildConfigBase<any>,
  platform: string,
  configHash: string,
  runAt: Date,
  finishedAt: Date,
  result: string,
  lastError: any,
  binaryFileName: String
}

export interface IClientSignatureDbEntity extends IMongooseDbEntity {
  key: string,
  package: string,
  alias: string
}

export interface IResearcherDbEntity extends IMongooseDbEntity {
  alias: string,
  email: string,
  account_approved: boolean,
  managingExperiments?: Array<IExperimentDbEntity>,
  collaboratingExperiments?: Array<IExperimentDbEntity>
}