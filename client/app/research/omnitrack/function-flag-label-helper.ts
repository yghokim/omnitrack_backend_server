import { DependencyGraphKeyType, convertKeyTypeToString, DependencyLevel, FunctionFlag } from "../../../../omnitrack/core/functionality-locks/omnitrack-dependency-graph";

export interface FunctionFlagLabelInfo {
  name: string,
  description?: string
}


class FunctionFlagHelper<ValueType> {
  private dict = new Map<string, ValueType>()

  public get(level: DependencyLevel, flag: FunctionFlag): ValueType {
    return this.dict.get(convertKeyTypeToString({ level: level, flag: flag }))
  }

  public putValue(level: DependencyLevel, flag: FunctionFlag, value: ValueType) {
    this.dict.set(convertKeyTypeToString({ level: level, flag: flag }), value)
  }
}

class FunctionFlagLabelHelper extends FunctionFlagHelper<FunctionFlagLabelInfo> {

  public putLabelInfo(level: DependencyLevel, flag: FunctionFlag, name: string, description?: string) {
    this.putValue(level, flag, { name: name, description: description })
  }
}

export const FLAG_VISIBILITY_DICT = new FunctionFlagHelper<boolean>()

//Temporarily hide this flag to researchers.
FLAG_VISIBILITY_DICT.putValue(DependencyLevel.App, FunctionFlag.ModifyExistingTrackersTriggers, false)
FLAG_VISIBILITY_DICT.putValue(DependencyLevel.Tracker, FunctionFlag.EditName, false)
FLAG_VISIBILITY_DICT.putValue(DependencyLevel.Tracker, FunctionFlag.EditColor, false)
FLAG_VISIBILITY_DICT.putValue(DependencyLevel.Tracker, FunctionFlag.ReorderFields, false)

FLAG_VISIBILITY_DICT.putValue(DependencyLevel.Field, FunctionFlag.ToggleRequired, false)
FLAG_VISIBILITY_DICT.putValue(DependencyLevel.Field, FunctionFlag.EditName, false)


export const FUNCTION_FLAG_LABEL_HELPER = new FunctionFlagLabelHelper()

FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.App, FunctionFlag.ModifyExistingTrackersTriggers, "Modify existing trackers and triggers")

FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.App, FunctionFlag.AddNewTracker,
  "Add new trackers")

FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.App, FunctionFlag.AccessTriggersTab,
  "Access the triggers tab")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.App, FunctionFlag.AddNewTrigger,
  "Add new triggers")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.App, FunctionFlag.AccessServicesTab,
  "Access the services tab")

FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.App, FunctionFlag.UseShortcutPanel,
  "Use the shortcut panel")

FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.App, FunctionFlag.UseScreenWidget,
  "User screen widgets")

FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.Visible,
  "Visible to participants")

FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.AccessItems,
  "Access the item list")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.ModifyItems,
  "Modify the items")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.AccessVisualization,
  "Access the visualization page")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.ManualInput,
  "Manual input without receiving a reminder")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.Modify,
  "Modify the tracker")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.Delete,
  "Delete the tracker")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.ToggleShortcut,
  "Toggle on the shortcut panel")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.AddNewFields,
  "Add new fields")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.ModifyReminders,
  "Modify existing reminders")

FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.AddNewReminders,
  "Add new reminders")

FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.EditName, "Edit name")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.EditColor, "Edit Color")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Tracker, FunctionFlag.ReorderFields, "Reorder the fields")

FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Field, FunctionFlag.Modify, "Modify the field")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Field, FunctionFlag.Delete, "Delete the field")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Field, FunctionFlag.ToggleVisibility, "Toggle visibility")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Field, FunctionFlag.EditProperties, "Edit properties")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Field, FunctionFlag.EditMeasureFactory, "Edit the connected measure factory")

FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Field, FunctionFlag.ToggleRequired, "Toggle Required")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Field, FunctionFlag.EditName, "Edit Name")

FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Reminder, FunctionFlag.Visible, "Visible to participants")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Reminder, FunctionFlag.Modify, "Modify the reminder")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Reminder, FunctionFlag.Delete, "Delete the reminder")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Reminder, FunctionFlag.ToggleSwitch, "Turn on/off the switch")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Reminder, FunctionFlag.EditProperties, "Edit properties")


FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Trigger, FunctionFlag.Visible, "Visible to participants")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Trigger, FunctionFlag.Modify, "Modify the trigger")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Trigger, FunctionFlag.Delete, "Delete the trigger")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Trigger, FunctionFlag.ToggleSwitch, "Turn on/off the switch")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Trigger, FunctionFlag.ModifyAssignedTrackers, "Modify the assigned trackers")
FUNCTION_FLAG_LABEL_HELPER.putLabelInfo(DependencyLevel.Trigger, FunctionFlag.EditProperties, "Edit properties")
