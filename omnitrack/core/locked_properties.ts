export interface IEntityLockedProperties {
  delete?: boolean
  edit?: boolean
}

export interface ITrackerLockedProperties extends IEntityLockedProperties {
  bookmark?: boolean
  removeAttributes?: boolean
  editAttributes?: boolean
  changeName?: boolean
  changeAttributeOrder?: boolean
  enterItemList?: boolean
  enterVisualization?: boolean
}

export interface ITriggerLockedProperties extends IEntityLockedProperties {
  changeSwitch?: boolean
}