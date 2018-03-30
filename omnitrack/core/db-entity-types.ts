export interface IMongooseDbEntity{
  _id: string
  createdAt?: Date
  updatedAt?: Date
}

export interface IUserChildDbEntity extends IMongooseDbEntity{
  user: string
}

export interface IAttributeDbEntity{
  name?: string,
  localId?: string,
  trackerId?: string,
  connection?: any,
  fallbackPolicy?: number,
  fallbackPreset?: string,
  type?: number,
  isRequired?: boolean,
  isHidden?: boolean,
  isInTrashcan?: boolean,
  properties?: [{key: string, sVal: string}],
  userCreatedAt?: number,
  userUpdatedAt?: number,
  lockedProperties?: any,
  flags?: any,
}

export interface ITrackerDbEntity extends IUserChildDbEntity{
  name?: string,
  color?: Number,
  isBookmarked?: Boolean,
  position?: Number,
  attributes?: [IAttributeDbEntity],
  lockedProperties?: any,
  flags?: any,
  userCreatedAt?: Number,
  userUpdateAt?: Number,
  removed?: boolean
}

export interface ITriggerDbEntity extends IUserChildDbEntity{
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

export interface IItemDbEntity extends IUserChildDbEntity{
  tracker: string,
  user: string,
  source: string,
  timestamp: number,
  deviceId: string,
  dataTable: [{attrLocalId: string, sVal: string}],
  removed: boolean,
  userUpdatedAt: number
}

export interface IUsageLogDbEntity extends IUserChildDbEntity{
  name?: string,
  sub?: string,
  content?: any,
  deviceId?: string,
  timestamp?: Date,
  localId?: number
}