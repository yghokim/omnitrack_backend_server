import { Component, OnInit, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ResearchVisualizationQueryConfigurationService } from '../services/research-visualization-query-configuration.service';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, flatMap, combineLatest, tap } from 'rxjs/operators';
import * as moment from "moment-timezone";
import { diffDaysBetweenTwoMoments } from '../../../shared_lib/utils';
import { IUserDbEntity } from '../../../omnitrack/core/db-entity-types';
import * as deepEqual from 'deep-equal';

@Component({
  selector: 'app-experiment-overview',
  templateUrl: './experiment-overview.component.html',
  styleUrls: ['./experiment-overview.component.scss'],
  providers: [ResearchVisualizationQueryConfigurationService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentOverviewComponent implements OnInit {

  tablinks = [/*
    {
      label: "Client Usage",
      path: "usage"
    },*/
    {
      label: "Tracking Engagement",
      path: "tracking"
    }
  ]

  public isParticipantsExist

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

  private _dayIndexRange: Array<number>
  get dayIndexRange(): Array<number> { return this._dayIndexRange }
  set dayIndexRange(value: Array<number>) {
    if (deepEqual(value, this._dayIndexRange) === false) {
      this._dayRangeValueInject.next(value)
    }
  }

  private readonly _dayRangeValueInject = new Subject<Array<number>>()

  participants: Array<IUserDbEntity>

  constructor(
    private api: ResearchApiService,
    public configuration: ResearchVisualizationQueryConfigurationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private changeDetector: ChangeDetectorRef) {
  }

  ngOnInit() {
    console.log("initialize the experiment overview.")
    this._internalSubscriptions.add(
      this._dayRangeValueInject.pipe(debounceTime(200)).subscribe(
        range => {
          this.configuration.setDayIndexRange(range)
        }
      )
    )

    this._internalSubscriptions.add(
      this.configuration.scopeSubject.pipe(
        combineLatest(
          this.api.selectedExperimentService.pipe(
            flatMap(service => service.getActiveParticipants()),
            tap(participants => {
              this.isParticipantsExist = participants.length > 0
            })
          ), this.api.selectedExperimentService.pipe(flatMap(service => service.getExperiment())), (scope, participants, experimentInfo) => ({ scope: scope, participants: participants, experiment: experimentInfo }))).subscribe(
            project => {
              this.participants = project.participants

              let longestNumDays = null
              const today = moment().endOf("day").toDate()
              const end = Math.min((project.experiment.finishDate || today).getTime(), today.getTime())

              project.participants.forEach(participant => {
                const momentStart = moment(participant.participationInfo.experimentRange.from).startOf('day')
                const numDays = diffDaysBetweenTwoMoments(moment(end), momentStart, project.scope.includeWeekends, participant.participationInfo.excludedDays)

                if (!longestNumDays) { longestNumDays = numDays } else {
                  longestNumDays = Math.max(longestNumDays, numDays)
                }
              })

              if (longestNumDays != null) {
                this.dayIndexMax = Math.max(1, longestNumDays)
              }

              this.changeDetector.markForCheck()
            }
          )
    )

    this._internalSubscriptions.add(
      this.configuration.dayIndexRange().subscribe(
        dayIndexRange => {
          this._dayIndexRange = dayIndexRange
          this.changeDetector.markForCheck()
        }
      )
    )
  }

  includeWeekendsChanged(include: boolean) {
    this.configuration.setIncludeWeekends(include)
  }

  onDayIndexSliderChanged(newRange) {
  }

  onFilteredParticipantToggle(participantId: string, checked: boolean) {
    this.configuration.setParticipantFiltered(participantId, !checked)
  }

  goToGroupsPage() {
    this.router.navigate(["groups"], { relativeTo: this.activatedRoute.parent })
  }

  goToInvitationPage() {

    this.router.navigate(["invitations"], { relativeTo: this.activatedRoute.parent })
  }

  goToStudyAppsPage() {

    this.router.navigate(["study-apps"], { relativeTo: this.activatedRoute.parent })
  }
}
