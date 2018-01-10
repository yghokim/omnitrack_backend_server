import { merge } from "../../../server/utils";


export class TrackingItemListTableConfig{
  showExternalTrackers?: boolean = false
  filters: Array<{type: string, show: boolean}> = [
    {type: "shortcut", show: true},
    {type: "manual", show: true},
    {type: "trigger", show: true}
  ]
}

export class ExperimentDashboardConfigs{
  excludeWeekends?: boolean = false
  alignStartDate?: boolean = true
}

export class VisualizationConfigs{
  trackingItemListTableConfig: TrackingItemListTableConfig = new TrackingItemListTableConfig()
  experimentDashboardConfigs: ExperimentDashboardConfigs = new ExperimentDashboardConfigs()

  static fromJson(json: any): VisualizationConfigs{
    return merge(new VisualizationConfigs(), json, true, true) 
  }
}