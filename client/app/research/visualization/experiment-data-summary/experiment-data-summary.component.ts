import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchVisualizationQueryConfigurationService, FilteredExperimentDataset } from '../../../services/research-visualization-query-configuration.service';
import { ResearchApiService } from '../../../services/research-api.service';
import { Subscription } from 'rxjs';
import { combineLatest } from 'rxjs/operators';
import * as d3 from 'd3';
import { unique, isNullOrBlank } from '../../../../../shared_lib/utils';

@Component({
  selector: 'app-experiment-data-summary',
  templateUrl: './experiment-data-summary.component.html',
  styleUrls: ['./experiment-data-summary.component.scss']
})
export class ExperimentDataSummaryComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  public totalLogCount: number = 0
  public logsPerParticipant: number = 0
  public logsPerParticipantStDev: number = 0
  public numParticipants: number = 0

  public statisticsPerTracker: Array<{trackerName: string, total: number, mean: number, stdev: number, min: number, max: number, median: number, count: number}>
  

  constructor(
    private queryConfigService: ResearchVisualizationQueryConfigurationService,
    private api: ResearchApiService) {

    }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.queryConfigService.dayIndexRange().pipe(combineLatest(this.queryConfigService.filteredDatesetSubject, (range, data: FilteredExperimentDataset)=>{
        return {range: range, data: data}
      })).subscribe(dataAndRange=>{
          const processed = dataAndRange.data.data.map(row => {
            return row.trackingData.map((trackerRow)=>{
              return {
                tracker: trackerRow.tracker,
                logCount: trackerRow.decodedItems.filter(item => {return item.day >= dataAndRange.range[0] && item.day <= dataAndRange.range[1] }).length
              }
            })
          })
          
          const trackerFlagIds = []
          dataAndRange.data.data.forEach(r => {
            r.trackingData.forEach(trackerRow => {
              if(trackerRow.tracker.flags && trackerRow.tracker.flags.injectionId){
                trackerFlagIds.push(trackerRow.tracker.flags.injectionId)
              }
            })
          })
          const trackerPivotedLogCountPerParticipant = unique(trackerFlagIds).map(injectionId=>{
            var trackerName = ""
            const logCountPerParticipant = processed.map(p=>{
              const items = p.find(t=>{
                const match = t.tracker.flags && t.tracker.flags.injectionId === injectionId
                if(match === true){
                  if(isNullOrBlank(t.tracker.name)!==true){
                    trackerName = t.tracker.name
                  }
                }
                return match})
              if(items){
                return items.logCount
              }else return 0
            })
            return {trackerName: trackerName, logCountPerParticipant: logCountPerParticipant}
          })

          const logCountPerParticipant = processed.map(p => d3.sum(p, r=> r.logCount))
          this.totalLogCount = d3.sum(logCountPerParticipant)
          this.logsPerParticipant = d3.mean(logCountPerParticipant)
          
          this.logsPerParticipantStDev = d3.deviation(logCountPerParticipant)
          this.numParticipants = logCountPerParticipant.length

          this.statisticsPerTracker = trackerPivotedLogCountPerParticipant.map(row=>{
            return {
              trackerName: row.trackerName,
              total: d3.sum(row.logCountPerParticipant),
              mean: d3.mean(row.logCountPerParticipant),
              min: d3.min(row.logCountPerParticipant),
              max: d3.max(row.logCountPerParticipant),
              median: d3.median(row.logCountPerParticipant),
              stdev: d3.deviation(row.logCountPerParticipant),
              count: row.logCountPerParticipant.length
            }
          })
      })
    )
  }

  ngOnDestroy(){

  }

}
