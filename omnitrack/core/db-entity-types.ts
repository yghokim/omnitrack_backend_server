export interface IMongooseDbEntity{
  _id: string
  createdAt?: Date
  updatedAt?: Date
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

export interface ITrackerDbEntity extends IMongooseDbEntity{
  name?: string,
  color?: Number,
  user?: string,
  isBookmarked?: Boolean,
  position?: Number,
  attributes?: [IAttributeDbEntity],
  lockedProperties?: any,
  flags?: any,
  userCreatedAt?: Number,
  userUpdateAt?: Number,
  removed?: boolean
}

export interface ITriggerDbEntity extends IMongooseDbEntity{
  user: string,
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

export interface IItemDbEntity extends IMongooseDbEntity{
  tracker: string,
  user: string,
  source: string,
  timestamp: number,
  deviceId: string,
  dataTable: [{attrLocalId: String, sVal: String}],
  removed: boolean,
  userUpdatedAt: number
}