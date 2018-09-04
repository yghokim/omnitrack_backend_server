export interface IEntityLockedProperties {
  delete?: boolean
  edit?: boolean
}

export const LOCKED_PROPERTY_KEYS_COMMON = ["delete", "edit"]

export const LOCKED_PROPERTY_KEYS_TRACKER = LOCKED_PROPERTY_KEYS_COMMON.concat([
  "bookmark", 
  "removeAttributes",
  "editAttributes",
  "addAttributes",
  "changeName",
  "changeAttributeOrder",
  "enterItemList",
  "enterVisualization"
])

export const LOCKED_PROPERTY_KEYS_ATTRIBUTE = LOCKED_PROPERTY_KEYS_COMMON.concat([
  "visibility"
])

export const LOCKED_PROPERTY_KEYS_TRIGGER = LOCKED_PROPERTY_KEYS_COMMON.concat([
  "changeSwitch", 
  "changeAssignedTrackers"
])



export interface ITrackerLockedProperties extends IEntityLockedProperties {
  bookmark?: boolean
  addAttributes?: boolean
  removeAttributes?: boolean
  editAttributes?: boolean
  changeName?: boolean
  changeAttributeOrder?: boolean
  enterItemList?: boolean
  enterVisualization?: boolean
}

export interface IAttributeLockedProperties extends IEntityLockedProperties{
  visibility?: boolean
}

export interface ITriggerLockedProperties extends IEntityLockedProperties {
  changeSwitch?: boolean
  changeAssignedTrackers?: boolean
}