import { AHierarchicalDependencyGraph } from "./hierarchical-dependency-graph";
import { ITriggerDbEntity, ITrackerDbEntity, IAttributeDbEntity } from "../db-entity-types";

export enum DependencyLevel {
  Field = "field",
  Reminder = "reminder",
  Trigger = "trigger",
  Tracker = "tracker",
  App = "app"
}

export enum FunctionFlag {

  //AppLevel
  ModifyExistingTrackersTriggers = "modifyTrTg",
  AddNewTracker = "addNewTracker",
  AccessTriggersTab = "accessTriggersTab",
  AddNewTrigger = "addNewTrigger",
  AccessServicesTab = "accessServicesTab",
  UseShortcutPanel = "useShortcut",
  UseScreenWidget = "useWidget",

  //entities common
  Visible = "visible",
  Modify = "modify",
  Delete = "delete",
  EditName = "editName", // tracker, fields
  EditProperties = "editProp", // triggers, reminders

  //Tracker Level
  AccessItems = "accessItems",
  ModifyItems = "modifyItems",
  AccessVisualization = "accessVis",
  ManualInput = "manualInput",
  ToggleShortcut = "toggleShortcut",
  ModifyFields = "modifyFields",
  AddNewFields = "addNewField",
  ModifyReminders = "modifyRem",
  AddNewReminders = "addNewRem",
  EditColor = "editColor",
  ReorderFields = "reorderFields",

  //Field Level
  ToggleVisibility = "toggleVisible",
  EditMeasureFactory = "editMeasure",
  ToggleRequired = "toggleRequired",

  //Trigger/reminder
  ToggleSwitch = "switch",
  ModifyAssignedTrackers = "modifyAssignees",
}

export interface DependencyGraphKeyType {
  level: DependencyLevel,
  flag: FunctionFlag
}

export function convertKeyTypeToString(keyType: DependencyGraphKeyType): string {
  return keyType.level.toString() + ":" + keyType.flag
}
export function convertStringToKeyType(stringKey: string): DependencyGraphKeyType {
  const splitResult = stringKey.split(":")
  return {
    level: splitResult[0] as DependencyLevel,
    flag: splitResult[1] as FunctionFlag
  }
}

//this class is only used to generate a static dependency graph.
class OmniTrackDependencyGraphBase extends AHierarchicalDependencyGraph<DependencyGraphKeyType>{

  convertKeyTypeToString(keyType: DependencyGraphKeyType): string {
    return convertKeyTypeToString(keyType)
  }
  convertStringToKeyType(stringKey: string): DependencyGraphKeyType {
    return convertStringToKeyType(stringKey)
  }

  addSameLevelDependency(level: DependencyLevel, flagA: FunctionFlag, dependsOn: FunctionFlag) {
    this.addDependency(
      { level: level, flag: flagA },
      { level: level, flag: dependsOn })
  }

  addDependencySimple(levelA: DependencyLevel, flagA: FunctionFlag, levelDependsOn: DependencyLevel, dependsOn: FunctionFlag) {
    this.addDependency(
      { level: levelA, flag: flagA },
      { level: levelDependsOn, flag: dependsOn })
  }

  setDefaultValueSimple(level: DependencyLevel, flag: FunctionFlag, defaultFlag: boolean) {
    this.setDefaultValue({ level: level, flag: flag }, defaultFlag)
  }



  public getRawFlag(key: DependencyGraphKeyType): boolean {
    return false
  }
}

const graphBase = new OmniTrackDependencyGraphBase()

//app level
graphBase.addSameLevelDependency(
  DependencyLevel.App,
  FunctionFlag.AddNewTrigger, FunctionFlag.AccessTriggersTab)

// tracker level
graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.AccessItems, FunctionFlag.Visible)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.ModifyItems, FunctionFlag.AccessItems)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.AccessVisualization, FunctionFlag.Visible)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.ManualInput, FunctionFlag.Visible)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.Modify, FunctionFlag.Visible)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.Delete, FunctionFlag.Modify)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.ToggleShortcut, FunctionFlag.Modify)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.ModifyFields, FunctionFlag.Modify)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.AddNewFields, FunctionFlag.Modify)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.ModifyReminders, FunctionFlag.Modify)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.AddNewReminders, FunctionFlag.Modify)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.EditName, FunctionFlag.Modify)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.EditColor, FunctionFlag.Modify)

graphBase.addSameLevelDependency(DependencyLevel.Tracker,
  FunctionFlag.ReorderFields, FunctionFlag.Modify)

graphBase.addDependencySimple(
  DependencyLevel.Tracker, FunctionFlag.Modify,
  DependencyLevel.App, FunctionFlag.ModifyExistingTrackersTriggers)

graphBase.addDependencySimple(
  DependencyLevel.Tracker, FunctionFlag.ToggleShortcut,
  DependencyLevel.App, FunctionFlag.UseShortcutPanel)

//Field level
graphBase.addSameLevelDependency(DependencyLevel.Field,
  FunctionFlag.Delete, FunctionFlag.Modify
)

graphBase.addSameLevelDependency(DependencyLevel.Field,
  FunctionFlag.ToggleVisibility, FunctionFlag.Modify
)

graphBase.addSameLevelDependency(DependencyLevel.Field,
  FunctionFlag.EditProperties, FunctionFlag.Modify
)

graphBase.addSameLevelDependency(DependencyLevel.Field,
  FunctionFlag.EditMeasureFactory, FunctionFlag.Modify
)

graphBase.addSameLevelDependency(DependencyLevel.Field,
  FunctionFlag.ToggleRequired, FunctionFlag.Modify
)

graphBase.addSameLevelDependency(DependencyLevel.Field,
  FunctionFlag.EditName, FunctionFlag.Modify
)

graphBase.addDependencySimple(
  DependencyLevel.Field, FunctionFlag.Modify,
  DependencyLevel.Tracker, FunctionFlag.ModifyFields)


//reminder level
graphBase.addSameLevelDependency(DependencyLevel.Trigger,
  FunctionFlag.Modify, FunctionFlag.Visible
)

graphBase.addSameLevelDependency(DependencyLevel.Trigger,
  FunctionFlag.Delete, FunctionFlag.Modify
)

graphBase.addSameLevelDependency(DependencyLevel.Trigger,
  FunctionFlag.ToggleSwitch, FunctionFlag.Modify
)

graphBase.addSameLevelDependency(DependencyLevel.Trigger,
  FunctionFlag.ModifyAssignedTrackers, FunctionFlag.Modify
)

graphBase.addSameLevelDependency(DependencyLevel.Trigger,
  FunctionFlag.EditProperties, FunctionFlag.Modify
)

graphBase.addDependencySimple(
  DependencyLevel.Trigger, FunctionFlag.Modify,
  DependencyLevel.App, FunctionFlag.ModifyExistingTrackersTriggers)


//trigger level
graphBase.addSameLevelDependency(DependencyLevel.Reminder,
  FunctionFlag.Modify, FunctionFlag.Visible
)

graphBase.addSameLevelDependency(DependencyLevel.Reminder,
  FunctionFlag.Delete, FunctionFlag.Modify
)

graphBase.addSameLevelDependency(DependencyLevel.Reminder,
  FunctionFlag.ToggleSwitch, FunctionFlag.Modify
)

graphBase.addSameLevelDependency(DependencyLevel.Reminder,
  FunctionFlag.EditProperties, FunctionFlag.Modify
)

graphBase.addDependencySimple(
  DependencyLevel.Reminder, FunctionFlag.Modify,
  DependencyLevel.Tracker, FunctionFlag.ModifyReminders)


//default flags
graphBase.setDefaultValueSimple(DependencyLevel.App, FunctionFlag.ModifyExistingTrackersTriggers, false)
graphBase.setDefaultValueSimple(DependencyLevel.App, FunctionFlag.AddNewTracker, false)
graphBase.setDefaultValueSimple(DependencyLevel.App, FunctionFlag.AccessTriggersTab, false)
graphBase.setDefaultValueSimple(DependencyLevel.App, FunctionFlag.AddNewTrigger, false)
graphBase.setDefaultValueSimple(DependencyLevel.App, FunctionFlag.AccessServicesTab, false)
graphBase.setDefaultValueSimple(DependencyLevel.App, FunctionFlag.UseShortcutPanel, true)
graphBase.setDefaultValueSimple(DependencyLevel.App, FunctionFlag.UseScreenWidget, true)

graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.Visible, true)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.AccessItems, true)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.ModifyItems, true)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.AccessVisualization, true)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.ManualInput, true)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.Modify, false)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.Delete, false)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.ToggleShortcut, true)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.AddNewFields, false)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.ModifyReminders, true)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.AddNewReminders, true)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.EditName, false)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.EditColor, false)
graphBase.setDefaultValueSimple(DependencyLevel.Tracker, FunctionFlag.ReorderFields, false)

graphBase.setDefaultValueSimple(DependencyLevel.Field, FunctionFlag.Modify, false)
graphBase.setDefaultValueSimple(DependencyLevel.Field, FunctionFlag.Delete, false)
graphBase.setDefaultValueSimple(DependencyLevel.Field, FunctionFlag.ToggleVisibility, true)
graphBase.setDefaultValueSimple(DependencyLevel.Field, FunctionFlag.EditProperties, true)
graphBase.setDefaultValueSimple(DependencyLevel.Field, FunctionFlag.EditMeasureFactory, false)
graphBase.setDefaultValueSimple(DependencyLevel.Field, FunctionFlag.ToggleRequired, false)
graphBase.setDefaultValueSimple(DependencyLevel.Field, FunctionFlag.EditName, false)

graphBase.setDefaultValueSimple(DependencyLevel.Reminder, FunctionFlag.Visible, true)
graphBase.setDefaultValueSimple(DependencyLevel.Reminder, FunctionFlag.Modify, false)
graphBase.setDefaultValueSimple(DependencyLevel.Reminder, FunctionFlag.Delete, false)
graphBase.setDefaultValueSimple(DependencyLevel.Reminder, FunctionFlag.ToggleSwitch, true)
graphBase.setDefaultValueSimple(DependencyLevel.Reminder, FunctionFlag.EditProperties, true)


graphBase.setDefaultValueSimple(DependencyLevel.Trigger, FunctionFlag.Visible, true)
graphBase.setDefaultValueSimple(DependencyLevel.Trigger, FunctionFlag.Modify, false)
graphBase.setDefaultValueSimple(DependencyLevel.Trigger, FunctionFlag.Delete, false)
graphBase.setDefaultValueSimple(DependencyLevel.Trigger, FunctionFlag.ToggleSwitch, true)
graphBase.setDefaultValueSimple(DependencyLevel.Trigger, FunctionFlag.ModifyAssignedTrackers, true)
graphBase.setDefaultValueSimple(DependencyLevel.Trigger, FunctionFlag.EditProperties, true)


//============================

export class OmniTrackFlagGraph extends OmniTrackDependencyGraphBase {

  static generateFlagWithDefault(level: DependencyLevel): any {
    const result = {}

    graphBase.defaultFlags.forEach((value, key) => {
      const keyType = graphBase.convertStringToKeyType(key)
      if (keyType.level === level) {
        result[keyType.flag] = value
      }
    })

    return result
  }

  static wrapAppFlags(flags: any): OmniTrackFlagGraph {
    const graph = new OmniTrackFlagGraph()
    graph.appFlags = flags
    return graph
  }

  static wrapTrackerFlags(trackerFlags: any, appFlags: any): OmniTrackFlagGraph {
    const graph = new OmniTrackFlagGraph()
    graph.appFlags = appFlags
    graph.trackerFlags = trackerFlags
    return graph
  }

  static wrapFieldFlags(fieldFlags: any, trackerFlags: any, appFlags: any): OmniTrackFlagGraph {
    const graph = new OmniTrackFlagGraph()
    graph.appFlags = appFlags
    graph.trackerFlags = trackerFlags
    graph.fieldFlags = fieldFlags
    return graph
  }

  static wrapTriggerFlags(triggerFlags: any, appFlags: any): OmniTrackFlagGraph {
    const graph = new OmniTrackFlagGraph()
    graph.appFlags = appFlags
    graph.triggerFlags = triggerFlags
    return graph
  }


  static wrapReminderFlags(reminderFlags: any, trackerFlags: any, appFlags: any): OmniTrackFlagGraph {
    const graph = new OmniTrackFlagGraph()
    graph.appFlags = appFlags
    graph.reminderFlags = reminderFlags
    graph.trackerFlags = trackerFlags
    return graph
  }

  public appFlags?: any
  public trackerFlags?: any
  public triggerFlags?: any
  public reminderFlags?: any
  public fieldFlags?: any

  private constructor() {
    super(graphBase.dependencyMap, graphBase.defaultFlags)
  }

  public getRawFlag(key: DependencyGraphKeyType): boolean {
    let dict: any = null
    switch (key.level) {
      case DependencyLevel.App:
        dict = this.appFlags
        break;
      case DependencyLevel.Field:
        dict = this.fieldFlags
        break;
      case DependencyLevel.Reminder:
        dict = this.reminderFlags
        break;
      case DependencyLevel.Tracker:
        dict = this.trackerFlags;
        break;
      case DependencyLevel.Trigger:
        dict = this.triggerFlags
        break;
    }

    if (dict) {
      return dict[key.flag]
    } else return false
  }

  getFlagObject(level: DependencyLevel): any {
    switch (level) {
      case DependencyLevel.App: return this.appFlags
      case DependencyLevel.Field: return this.fieldFlags
      case DependencyLevel.Reminder: return this.reminderFlags
      case DependencyLevel.Tracker: return this.trackerFlags;
      case DependencyLevel.Trigger: return this.triggerFlags;
    }
  }

  getCascadedFlagObject(level: DependencyLevel): any {
    const defaultFlags = OmniTrackFlagGraph.generateFlagWithDefault(level)
    for (const flag of Object.keys(defaultFlags)) {
      defaultFlags[flag] = this.getCascadedFlag({ level: level, flag: flag as FunctionFlag })
    }
    console.log("level: ", level, "flags: ", defaultFlags)
    return defaultFlags
  }


  public hierarchyInSameLevel(level: DependencyLevel, flag: FunctionFlag, last: number = 0): number {
    const key = this.convertKeyTypeToString({ level: level, flag: flag })
    if (this.dependencyMap.has(key) === true) {
      const dependencyKeys = this.dependencyMap.get(key).filter(d => d.level === level)
      if (dependencyKeys.length == 0) return last
      else {
        let currentMax = 0
        for (const dependencyKey of dependencyKeys) {
          const recurred = this.hierarchyInSameLevel(level, dependencyKey.flag, last + 1)
          if (currentMax < recurred) {
            currentMax = recurred
          }
        }
        return currentMax
      }
    } else return last
  }
}