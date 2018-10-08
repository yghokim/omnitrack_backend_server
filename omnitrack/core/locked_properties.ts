export interface LockGroupDefinition {
  key: string,
  name: string
}

export class LockFlagDefinition {
  constructor(public readonly name: string, public readonly display: string, public readonly groupKey: string) { }
}

export class LockDefinition {
  constructor(
    public readonly groups: Array<LockGroupDefinition>,
    public readonly flags: Array<LockFlagDefinition>
  ) { }

  getFlagDefinitionsOfGroup(groupKey: string): Array<LockFlagDefinition> {
    return this.flags.filter(f => f.groupKey === groupKey)
  }
}

export interface IEntityLockedProperties {
  delete?: boolean
  edit?: boolean
}

export const LOCKED_PROPERTY_KEYS_COMMON = ["delete", "edit"]

export const LOCKED_PROPERTY_KEYS_TRACKER = LOCKED_PROPERTY_KEYS_COMMON.concat([
  "bookmark",
  "removeAttributes",
  "editAttributes",
  "addNewAttribute",
  "changeName",
  "changeAttributeOrder",
  "enterItemList",
  "enterVisualization",
  "addNewReminder",
  "selfInitiatedInput",
  "visibleInApp"
])

export const LOCKED_PROPERTY_KEYS_ATTRIBUTE = LOCKED_PROPERTY_KEYS_COMMON.concat([
  "visibility"
])

export const LOCKED_PROPERTY_KEYS_TRIGGER = LOCKED_PROPERTY_KEYS_COMMON.concat([
  "changeSwitch",
  "changeAssignedTrackers",
  "visibleInApp"
])

const COMMON_GROUP_VISIBILITY = { key: "Visibility", name: "Visibility" }
const COMMON_GROUP_INSTANCE_MODIFICATION = { key: "InstanceModification", name: "Instance Modification" }


export enum ETrackerLockGroupKeys {
  FEATURES = "FeaturesInList",
  ATTRIBUTE_CONFIGURATION = "AttributeConfiguration",
}

export enum ETriggerLockGroupKeys {

}

export const TRACKER_LOCK_DEFINITION = new LockDefinition(
  [
    COMMON_GROUP_VISIBILITY,
    COMMON_GROUP_INSTANCE_MODIFICATION,
    { key: ETrackerLockGroupKeys.ATTRIBUTE_CONFIGURATION, name: "Fields Configuration" },
    { key: ETrackerLockGroupKeys.FEATURES, name: "Features" },
  ],
  [
    new LockFlagDefinition("delete", "Delete the Tracker", COMMON_GROUP_INSTANCE_MODIFICATION.key),
    new LockFlagDefinition("edit", "Edit the Tracker", COMMON_GROUP_INSTANCE_MODIFICATION.key),
    new LockFlagDefinition("changeName", "Change the name of the tracker", COMMON_GROUP_INSTANCE_MODIFICATION.key),
    new LockFlagDefinition("bookmark", "Toggle assignment in the shortcut panel", COMMON_GROUP_INSTANCE_MODIFICATION.key),

    new LockFlagDefinition("removeAttributes", "Remove fields of the tracker", ETrackerLockGroupKeys.ATTRIBUTE_CONFIGURATION),
    new LockFlagDefinition("editAttributes", "Access the edit page of fields", ETrackerLockGroupKeys.ATTRIBUTE_CONFIGURATION),
    new LockFlagDefinition("addNewAttribute", "Create new fields to the tracker", ETrackerLockGroupKeys.ATTRIBUTE_CONFIGURATION),
    new LockFlagDefinition("changeAttributeOrder", "Reorder the fields", ETrackerLockGroupKeys.ATTRIBUTE_CONFIGURATION),

    new LockFlagDefinition("enterItemList", "Access to the items page of the tracker", ETrackerLockGroupKeys.FEATURES),
    new LockFlagDefinition("enterVisualization", "Access to the charts page of the tracker", ETrackerLockGroupKeys.FEATURES),

    new LockFlagDefinition("addNewReminder", "Add new reminder to the tracker", ETrackerLockGroupKeys.FEATURES),

    new LockFlagDefinition("selfInitiatedInput", "Enter new item without reminder prompts", ETrackerLockGroupKeys.FEATURES),

    new LockFlagDefinition("visibleInApp", "The tracker is shown to the participant", COMMON_GROUP_VISIBILITY.key)
  ]
)

function makeTriggerLockDefinition(isReminder: boolean): LockDefinition {
  const name = isReminder === true ? "reminder" : "trigger"

  return new LockDefinition(
    [
      COMMON_GROUP_VISIBILITY,
      COMMON_GROUP_INSTANCE_MODIFICATION
    ],
    [
      new LockFlagDefinition("delete", "Delete the " + name, COMMON_GROUP_INSTANCE_MODIFICATION.key),
      new LockFlagDefinition("edit", "Edit the " + name, COMMON_GROUP_INSTANCE_MODIFICATION.key),
      new LockFlagDefinition("changeSwitch", "Turn on/off the " + name, COMMON_GROUP_INSTANCE_MODIFICATION.key),
      new LockFlagDefinition("visibleInApp", "The " + name + " is shown to the participant", COMMON_GROUP_VISIBILITY.key)
    ].concat(isReminder === true ? [] : [
      new LockFlagDefinition("changeAssignedTrackers", "Change the assigned trackers on the " + name, COMMON_GROUP_INSTANCE_MODIFICATION.key)])
  )
}

export const LOGGING_TRIGGER_LOCK_DEFINITION = makeTriggerLockDefinition(false)
export const REMINDER_LOCK_DEFINITION = makeTriggerLockDefinition(true)

export const ATTRIBUTE_LOCK_DEFINITION = new LockDefinition(
  [
    COMMON_GROUP_INSTANCE_MODIFICATION
  ], [
    new LockFlagDefinition("delete", "Delete the field", COMMON_GROUP_INSTANCE_MODIFICATION.key),
    new LockFlagDefinition("edit", "Edit the field", COMMON_GROUP_INSTANCE_MODIFICATION.key),
    new LockFlagDefinition("visibility", "Show/hide the field in the tracker detail page", COMMON_GROUP_INSTANCE_MODIFICATION.key)
  ]
)

export interface ITrackerLockedProperties extends IEntityLockedProperties {
  bookmark?: boolean
  addNewAttribute?: boolean
  removeAttributes?: boolean
  editAttributes?: boolean
  changeName?: boolean
  changeAttributeOrder?: boolean
  enterItemList?: boolean
  enterVisualization?: boolean
  addNewReminder?: boolean
  selfInitiatedInput?: boolean
  visibleInApp?: boolean
}

export interface IAttributeLockedProperties extends IEntityLockedProperties {
  visibility?: boolean
}

export interface ITriggerLockedProperties extends IEntityLockedProperties {
  changeSwitch?: boolean
  changeAssignedTrackers?: boolean
  visibleInApp?: boolean
}