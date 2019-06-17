import { isString } from "../../shared_lib/utils";

export function getIdPopulateCompat(obj: any, variableName: string = "_id"): string {
  if (obj == null) {
    return null
  } else if (isString(obj) === true) {
    return obj.toString()
  } else {
    return obj[variableName]
  }
}

export interface IMongooseDbEntity {
  _id: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 *
 * @export
 * @interface IUserDbEntity
 * @extends {IMongooseDbEntity}
 */
export interface IUserDbEntity extends IMongooseDbEntity {
  name: string,
  nameUpdatedAt?: Date,
  picture?: string,
  username: string,
  email: string,
  participationInfo: {
    alias?: string,
    groupId?: string,
    excludedDays?: Array<number>,
    invitation: string | any,
    approvedAt?: Date,
    dropped?: boolean,
    droppedReason?: string,
    droppedBy?: string | any,
    droppedAt?: Date,
    experimentRange?: { from: Date, to?: Date }
    demographic?: any
  },
  deviceLocalKeySeed?: number,
  devices?: Array<IClientDevice>,

  appFlags: any,

  lastSyncTimestamp?: number
  lastSessionTimestamp?: number
  lastTimestampsUpdated?: boolean
}

export interface IClientDevice {
  localKey: string,
  deviceId: string,
  instanceId: string,
  os: string,
  firstLoginAt: Date,
  appVersion: string
}

export interface IUserChildDbEntity extends IMongooseDbEntity {
  user: string
}

export interface IAttributeDbEntity {
  name?: string,
  _id?: string,
  localId?: string,
  trackerId?: string,
  connection?: any,
  fallbackPolicy?: number,
  fallbackPreset?: string,
  type?: number,
  isRequired?: boolean,
  isHidden?: boolean,
  isInTrashcan?: boolean,
  properties?: [{ key: string, sVal: string }],
  userCreatedAt?: number,
  userUpdatedAt?: number,
  lockedProperties?: any,
  flags?: any,
}

export interface ITrackerDbEntity extends IUserChildDbEntity {
  name?: string,
  color?: number,
  isBookmarked?: boolean,
  position?: number,
  attributes?: Array<IAttributeDbEntity>,
  lockedProperties?: any,
  flags?: any,
  redirectUrl?: string,
  userCreatedAt?: number,
  userUpdatedAt?: number,
  removed?: boolean
}

export interface ITriggerDbEntity extends IUserChildDbEntity {
  alias: string,
  position: number,
  conditionType: number,
  actionType: number,
  action: any,
  condition: any,
  script: string,
  checkScript: boolean,
  lastTriggeredTime: number,
  trackers: Array<string>,
  userCreatedAt: number,
  userUpdatedAt: number,
  lockedProperties: any,
  flags: any,
  isOn: boolean,
  removed: boolean
}

export interface IItemDbEntity extends IUserChildDbEntity {
  tracker: string,
  user: string,
  source: string,
  timestamp: number,
  timezone: string,
  deviceId: string,
  dataTable: [{ attrLocalId: string, sVal: string }],
  removed: boolean,
  metadata?: IItemMetadata,
  userUpdatedAt: number
}

export interface IItemMetadata {
  pingIndex?: number,
  pivotDate?: string,//YYYY-MM-DD
  conditionType?: string,
  reservedAt?: number,
  actuallyFiredAt?: number,
  screenAccessedAt?: number,
  accessedDirectlyFromReminder?: boolean,
  pairedToReminder?: boolean
}

export interface IUsageLogDbEntity extends IUserChildDbEntity {
  name?: string,
  sub?: string,
  content?: any,
  deviceId?: string,
  timestamp?: Date,
  localId?: number
}

export interface ISessionUsageLog extends IUsageLogDbEntity {
  session: string,
  startedAt: number,
  endedAt: number,
  duration: number
}