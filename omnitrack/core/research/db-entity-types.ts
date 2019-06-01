import { IMongooseDbEntity } from "../db-entity-types";
import { VisualizationConfigs } from "./configs";

export interface IExperimentGroupDbEntity extends IMongooseDbEntity {
  name: string,
  trackingPlanKey?: string
}

export interface IExperimentTrackingPlanDbEntity {
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
  demographicFormSchema: any,
  receiveConsentInApp: boolean,
  trackingPlans: Array<IExperimentTrackingPlanDbEntity>,
  experimenters: Array<{ researcher: string | IResearcherDbEntity, permissions: any }>,
  clientBuildConfigs?: Array<any>
}

export interface IClientBuildConfigBase<T> extends IMongooseDbEntity {
  experiment: string | IExperimentDbEntity,
  platform: string,
  sourceCode: { sourceType: string, data: any },
  packageName: string,
  appName: string,
  iconPath: string,
  credentials: T, // dictionary
  researcherMode: boolean,
  apiKeys: Array<{ key: string, value: any }>,
  firebasePlatformAppId: string
}

export const APP_THIRD_PARTY_KEYSTORE_KEYS = [
  "GOOGLE_MAPS_API_KEY",
  "FITBIT_CLIENT_ID", "FITBIT_CLIENT_SECRET",
  "MISFIT_APP_KEY", "MISFIT_APP_SECRET",
  "RESCUETIME_CLIENT_ID", "RESCUETIME_CLIENT_SECRET", "RESCUETIME_REDIRECT_URI"]

export const ANDROID_PACKAGE_NAME_REGEX = /^([A-Za-z]{1}[A-Za-z\d_]*\.)*[A-Za-z][A-Za-z\d_]*$/

export interface AndroidBuildCredentials {
  //googleServices: any,
  keystoreFileHash: string,
  keystorePassword: string
  keystoreAlias: string,
  keystoreKeyPassword: string,
  keystoreValidated: boolean,
}

export interface IAndroidBuildConfig extends IClientBuildConfigBase<AndroidBuildCredentials> { }

export interface IClientBuildAction extends IMongooseDbEntity {
  experiment?: string | IExperimentDbEntity,
  researcherMode?: boolean,
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
  alias: string,
  experiment?: string | IExperimentDbEntity
}

export interface IResearcherDbEntity extends IMongooseDbEntity {
  alias: string,
  email: string,
  account_approved: boolean,
  managingExperiments?: Array<IExperimentDbEntity>,
  collaboratingExperiments?: Array<IExperimentDbEntity>
}
