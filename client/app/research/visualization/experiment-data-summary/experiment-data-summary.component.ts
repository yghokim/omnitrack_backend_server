import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchVisualizationQueryConfigurationService, FilteredExperimentDataset } from '../../../services/research-visualization-query-configuration.service';
import { ResearchApiService } from '../../../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';
import * as d3 from 'd3';

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
  

  constructor(
    private queryConfigService: ResearchVisualizationQueryConfigurationService,
    private api: ResearchApiService) {

    }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.queryConfigService.dayIndexRange().combineLatest(this.queryConfigService.filteredDatesetSubject, (range, data: FilteredExperimentDataset)=>{
        return {range: range, data: data}
      }).subscribe(dataAndRange=>{
          const logCountPerParticipant = dataAndRange.data.data.map(row => {
            return d3.sum(row.trackingData, (trackerRow)=>{
              return trackerRow.decodedItems.filter(item => {return item.day >= dataAndRange.range[0] && item.day <= dataAndRange.range[1] }).length
            })
          })
          this.totalLogCount = d3.sum(logCountPerParticipant)
          this.logsPerParticipant = d3.mean(logCountPerParticipant)
          this.logsPerParticipantStDev = d3.deviation(logCountPerParticipant)
      })
    )
  }

  ngOnDestroy(){

  }

}
