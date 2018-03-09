import { Component, OnInit } from '@angular/core';
import { ResearchVisualizationQueryConfigurationService } from '../services/research-visualization-query-configuration.service';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';
import * as moment from "moment-timezone";
import { diffDaysBetweenTwoMoments } from '../../../shared_lib/utils';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'app-experiment-overview',
  templateUrl: './experiment-overview.component.html',
  styleUrls: ['./experiment-overview.component.scss'],
  providers: [ResearchVisualizationQueryConfigurationService]
})
export class ExperimentOverviewComponent implements OnInit {

  private readonly _internalSubscriptions = new Subscription()

  private tooltipText = {
    to: (number)=>{ return "D" + (number+1).toFixed(0)}
  }

  dayIndexRangeSliderConfigs = {
    margin: 1,
    step: 1,
    connect: true,
    behaviour: 'drag',
    tooltips: [this.tooltipText, this.tooltipText]
  }

  dayIndexMax: number = 100

  dayIndexRange

  private readonly _dayRangeValueInject = new Subject<Array<number>>()

  participants: Array<any>

  constructor(
    private api: ResearchApiService,
    public configuration: ResearchVisualizationQueryConfigurationService) {
      
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this._dayRangeValueInject.debounceTime(200).subscribe(
        range=>{
          this.configuration.setDayIndexRange(range)
        }
      )
    )

    this._internalSubscriptions.add(
      this.configuration.scopeSubject.combineLatest(this.api.selectedExperimentService.flatMap(service => service.getParticipants()), (scope, participants)=> {return {scope: scope, participants: participants}}).subscribe(
        project=>{
          this.participants = project.participants

          let earliestExperimentStart: number = null
          
          project.participants.forEach(participant => {
            const experimentRangeStart = new Date(participant.experimentRange.from).getTime()
            if (!earliestExperimentStart) earliestExperimentStart = experimentRangeStart
            else {
              earliestExperimentStart = Math.min(earliestExperimentStart, experimentRangeStart)
            }
          })

          if(earliestExperimentStart!=null)
          {
            const today = moment().endOf("day")
            const numDays = diffDaysBetweenTwoMoments(today, moment(earliestExperimentStart).startOf("day"), project.scope.includeWeekends) + 1

            this.dayIndexMax = Math.max(1, numDays-1)
          }
        }
      )
    )

    this._internalSubscriptions.add(
      this.configuration.dayIndexRange().subscribe(
        dayIndexRange=>{
          this.dayIndexRange = dayIndexRange
        }
      )
    )
  }

  includeWeekendsChanged(include: boolean){
    this.configuration.setIncludeWeekends(include)
  }

  onDayIndexSliderChanged(newRange){
    this._dayRangeValueInject.next(newRange)
    //this.configuration.setDayIndexRange(newRange)
  }

}
