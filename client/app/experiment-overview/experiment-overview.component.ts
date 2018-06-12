import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ResearchVisualizationQueryConfigurationService } from '../services/research-visualization-query-configuration.service';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, flatMap, combineLatest } from 'rxjs/operators';
import * as moment from "moment-timezone";
import { diffDaysBetweenTwoMoments } from '../../../shared_lib/utils';
import { IParticipantDbEntity } from '../../../omnitrack/core/db-entity-types';

@Component({
  selector: 'app-experiment-overview',
  templateUrl: './experiment-overview.component.html',
  styleUrls: ['./experiment-overview.component.scss'],
  providers: [ResearchVisualizationQueryConfigurationService]
})
export class ExperimentOverviewComponent implements OnInit {

  tablinks = [
    {
      label: "Client Usage",
      path: "usage"
    },
    {
      label: "Tracking Engagement",
      path: "tracking"
    }
  ]


  public sidePanelWidth = 250
  public isSidePanelExpanded = true

  @ViewChild('sidePanel') sidePanelRef: ElementRef

  private readonly _internalSubscriptions = new Subscription()

  private tooltipText = {
    to: (number) => "D" + (number + 1).toFixed(0)
  }

  dayIndexRangeSliderConfigs = {
    margin: 1,
    step: 1,
    connect: true,
    behaviour: 'drag',
    tooltips: [this.tooltipText, this.tooltipText]
  }

  dayIndexMax = 100

  dayIndexRange

  private readonly _dayRangeValueInject = new Subject<Array<number>>()

  participants: Array<IParticipantDbEntity>

  constructor(
    private api: ResearchApiService,
    public configuration: ResearchVisualizationQueryConfigurationService) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this._dayRangeValueInject.pipe(debounceTime(200)).subscribe(
        range => {
          this.configuration.setDayIndexRange(range)
        }
      )
    )

    this._internalSubscriptions.add(
      this.configuration.scopeSubject.pipe(combineLatest(this.api.selectedExperimentService.pipe(flatMap(service => service.getParticipants())), (scope, participants) => ({ scope: scope, participants: participants }))).subscribe(
        project => {
          this.participants = project.participants

          let longestNumDays = null
          const today = moment().endOf("day")

          project.participants.forEach(participant => {
            const momentStart = moment(participant.experimentRange.from).startOf('day')
            const numDays = diffDaysBetweenTwoMoments(today, momentStart, project.scope.includeWeekends, participant.excludedDays)

            if (!longestNumDays) { longestNumDays = numDays } else {
              longestNumDays = Math.max(longestNumDays, numDays)
            }
          })

          if (longestNumDays != null) {
            this.dayIndexMax = Math.max(1, longestNumDays)
          }
        }
      )
    )

    this._internalSubscriptions.add(
      this.configuration.dayIndexRange().subscribe(
        dayIndexRange => {
          this.dayIndexRange = dayIndexRange
        }
      )
    )
  }

  includeWeekendsChanged(include: boolean) {
    this.configuration.setIncludeWeekends(include)
  }

  onDayIndexSliderChanged(newRange) {
    this._dayRangeValueInject.next(newRange)
    this.configuration.setDayIndexRange(newRange)
  }

  onFilteredParticipantToggle(participantId: string, checked: boolean) {
    this.configuration.setParticipantFiltered(participantId, !checked)
  }

}
