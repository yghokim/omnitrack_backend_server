import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { IParticipantDbEntity, ISessionUsageLog } from '../../../../../../omnitrack/core/db-entity-types';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { getExperimentDateSequenceOfParticipant, isSessionLog } from '../../../../../../omnitrack/experiment-utils';
import * as moment from 'moment';
import * as d3 from 'd3';

@Component({
  selector: 'app-sessions',
  templateUrl: './sessions.component.html',
  styleUrls: ['./sessions.component.scss']
})
export class SessionsComponent implements OnInit, OnDestroy {

  readonly SESSIONS = ["ChartViewActivity", "ItemBrowserActivity"]
  readonly colorPalette = [
    "rgb(46, 198, 198)",
    "rgb(200, 227, 112)",
    "rgba(255, 209, 102, 1)",
    "rgba(14, 16, 20, 1)",
    "rgba(32, 43, 55, 1)"]

  public numDays = 14
  public engagementThreshold = 5000

  public readonly sessionLogsDictSubject = new BehaviorSubject<Array<{user: string, logs: Array<ISessionUsageLog>}>>([])
  public readonly participantsSubject = new BehaviorSubject<Array<IParticipantDbEntity>>([])

  public processedData: ProcessedData

  public sessionStatistics: Array<SessionOrientedSummaryRow>

  @Input("data")
  public set setSessionLogDict(data: Array<{user: string, logs: Array<ISessionUsageLog>}>) {
    this.sessionLogsDictSubject.next(data)
  }

  @Input("participants")
  public set setParticipants(participants: Array<IParticipantDbEntity>) {
    this.participantsSubject.next(participants)
  }

  private readonly _internalSubscriptions = new Subscription()

  constructor() {
    this._internalSubscriptions.add(
      this.processedDataObservable().subscribe(data => {
        this.processedData = data
        this.sessionStatistics = this.SESSIONS.map(session => {
          const sessionInfos = data.filter(v => v.sessionData).map(
            v => {
              const sessionRow = v.sessionData.find(s => s.session === session)
              return {days: sessionRow.engagedDays, duration: sessionRow.totalDuration}
            }
          )
          return {session: session, n: sessionInfos.length,
            meanDayCount: d3.mean(sessionInfos, s => s.days),
            sdDayCount: d3.deviation(sessionInfos, s => s.days),
            minDayCount: d3.min(sessionInfos, s => s.days),
            maxDayCount: d3.max(sessionInfos, s => s.days),
            meanDuration: d3.mean(sessionInfos, s => s.duration),
            sdDuration: d3.deviation(sessionInfos, s => s.duration),
            minDuration: d3.min(sessionInfos, s => s.duration),
            maxDuration: d3.max(sessionInfos, s => s.duration),
          }
        })
      })
    )
   }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  ngOnInit() {
  }

  public getSessionColor(session: string): string {
    return this.colorPalette[Math.max(0, this.SESSIONS.indexOf(session)) % this.colorPalette.length]
  }

  public getNumberSequence(): Array<number> {
    return d3.range(this.numDays)
  }

  private processedDataObservable(): Observable<ProcessedData> {
    return this.sessionLogsDictSubject.filter(dict => dict !== null).combineLatest(this.participantsSubject.filter(p => p !== null), (dict, participants) => {
      return {sessionLogsDict: dict, participants: participants}
    }).map(
      project => {
        const processed = project.participants.map(
          participant => {
            const userEntry = project.sessionLogsDict.find(d => d.user === participant.user._id)
            let userLogs: Array<ISessionUsageLog>

            if (!userEntry) {
              return {participant: participant, sessionData: null, engagedDays: 0}
            }

            userLogs = userEntry.logs
            const sequence = getExperimentDateSequenceOfParticipant(participant, new Date(), true).slice(0, this.numDays)
            const data = this.SESSIONS.map(session => {
              const rows = sequence.map((date, dayIndex) => {
                const logs = userLogs.filter(log => {
                  return moment(log.endedAt).isSame(moment(date), 'day') && log.session === session
                })
                return {
                  dayIndex: dayIndex,
                  actualDate: date,
                  totalDuration: d3.sum(logs, (l) => l.duration),
                  logs: logs
                }
              })
              return {
                session: session,
                rows: rows,
                engagedDays: rows.filter(r => r.totalDuration > this.engagementThreshold).length,
                totalDuration: d3.sum(rows, r => r.totalDuration)
              }
            })
            return {
              participant: participant,
              sessionData: data
            }
          }
        )

        processed.sort((a, b) => {
          if (a.sessionData === null) { return 1 }
          if (b.sessionData === null) { return -1 }
          const sumA = d3.sum(a.sessionData, (d: any) => d.rows.filter(r => r.totalDuration > 0).length)
          const sumB = d3.sum(b.sessionData, (d: any) => d.rows.filter(r => r.totalDuration > 0).length)
          return sumB - sumA
        })

        return processed
      }
    )
  }

}

type ProcessedData = Array<{
  participant: IParticipantDbEntity,
  sessionData: Array<SessionRow>}>

interface SessionRow {
  session: string, rows: Array<SessionDayRow>,
  engagedDays: number,
  totalDuration: number,
}

interface SessionDayRow {
  dayIndex: number,
  actualDate: Date,
  totalDuration: number,
  logs: Array<ISessionUsageLog>
}

interface SessionOrientedSummaryRow {
  session: string,
  meanDayCount: number,
  sdDayCount: number,
  minDayCount: number,
  maxDayCount: number,
  meanDuration: number,
  sdDuration: number,
  minDuration: number,
  maxDuration: number,
  n: number
}