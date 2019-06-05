import { ResearcherAuthService } from './researcher.auth.service';
import { ResearchApiService } from './research-api.service';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription, Subject, of } from 'rxjs';
import { map, filter, tap, combineLatest } from 'rxjs/operators';
import { SocketService } from './socket.service';
import { SocketConstants } from '../../../omnitrack/core/research/socket'
import { NotificationService } from './notification.service';
import { ExperimentPermissions } from '../../../omnitrack/core/research/experiment'

import { VisualizationConfigs } from '../../../omnitrack/core/research/configs';
import { TrackingDataService } from './tracking-data.service';
import { IResearchMessage } from '../../../omnitrack/core/research/messaging';
import { IUserDbEntity, IUsageLogDbEntity, getIdPopulateCompat, ITriggerDbEntity, ITrackerDbEntity } from '../../../omnitrack/core/db-entity-types';
import { IExperimentDbEntity, IResearcherDbEntity, IExperimentTrackingPlanDbEntity, IExperimentGroupDbEntity } from '../../../omnitrack/core/research/db-entity-types';
import * as moment from 'moment';

export class ExperimentService {

  private readonly experimentInfo = new BehaviorSubject<IExperimentDbEntity>(null)
  private readonly managerInfo = new BehaviorSubject<IResearcherDbEntity>(null)
  private readonly invitationList = new BehaviorSubject<Array<any>>(null)
  private readonly participantList = new BehaviorSubject<Array<IUserDbEntity>>(null)
  private readonly messageList = new BehaviorSubject<Array<IResearchMessage>>(null)

  private readonly _internalSubscriptions = new Subscription()

  public readonly trackingDataService: TrackingDataService

  private readonly _onExperimentInvalid = new Subject<void>()

  public get experimentInvalidated(): Observable<void> {
    return this._onExperimentInvalid
  }

  constructor(
    readonly experimentId: string,
    private http: HttpClient,
    private authService: ResearcherAuthService,
    private researchApi: ResearchApiService,
    private socketService: SocketService,
    private notificationService: NotificationService
  ) {

    console.log("initialized experiment service.")

    this.trackingDataService = new TrackingDataService(http, socketService, this.researchApi, this)
    this.trackingDataService.ngOnInit()

    this.loadExperimentInfo()
    this.loadInvitationList()
    this.loadManagerInfo()
    this.loadParticipantList()
    this.loadMessageList()

    this._internalSubscriptions.add(
      socketService.onServerReset.subscribe(
        socket => {
          console.log("server reset. subscribe experiment-specitic socket events.")
          socket.emit(SocketConstants.SERVER_EVENT_SUBSCRIBE_EXPERIMENT, { experimentId: this.experimentId })
        }
      )
    )

    this._internalSubscriptions.add(
      socketService.onConnected.subscribe(
        socket => {
          console.log("connect new experiment service to websocket.")
          socket.on(SocketConstants.SOCKET_MESSAGE_UPDATED_EXPERIMENT, (data) => {
            console.log("received updated/experiment websocket event.")
            console.log(data)
            if (data instanceof Array) {
              data.forEach(datum => {
                if (datum.model) {
                  switch (datum.model) {
                    case SocketConstants.MODEL_INVITATION:
                      this.loadInvitationList()
                      this.researchApi.loadUserPool()
                      switch (datum.event) {
                        case SocketConstants.EVENT_REMOVED:
                          this.loadParticipantList()
                          break;
                      }
                      break;
                    case SocketConstants.MODEL_USER:
                      this.loadParticipantList()
                      this.loadInvitationList()
                      this.researchApi.loadUserPool()
                      switch (datum.event) {
                        case SocketConstants.EVENT_APPROVED:
                          this.notificationService.pushSnackBarMessage({
                            message: "A user started participating in the experiment."
                          })
                          break;
                        case SocketConstants.EVENT_DROPPED:
                          this.notificationService.pushSnackBarMessage({
                            message: "A participant dropped out the experiment."
                          })
                          break;
                      }
                      break;
                    case SocketConstants.MODEL_EXPERIMENT:
                      this.loadExperimentInfo()
                      switch (datum.event) {
                        case SocketConstants.EVENT_REMOVED:
                          this.researchApi.loadExperimentList()
                          this.notificationService.pushSnackBarMessage({
                            message: "The Experiment was deleted."
                          })
                          this._onExperimentInvalid.next()
                          break;
                      }
                      break;

                    case SocketConstants.MODEL_RESEARCH_MESSAGE:
                      this.loadMessageList()
                      break;
                  }
                }
              })
            }
          })
        })
    )
  }

  dispose() {
    this.socketService.socket.emit(SocketConstants.SERVER_EVENT_UNSUBSCRIBE_EXPERIMENT, { experimentId: this.experimentId }, () => {
      console.log("unsubscribed experiment from websocket.")
      this.socketService.socket.removeListener(SocketConstants.SOCKET_MESSAGE_UPDATED_EXPERIMENT)
    })
    this._internalSubscriptions.unsubscribe()
    this.trackingDataService.ngOnDestroy()
  }

  private processExperimentInfo(info: IExperimentDbEntity): IExperimentDbEntity {
    info.createdAt = moment(info.createdAt).toDate()
    info.updatedAt = moment(info.updatedAt).toDate()
    if (info.finishDate != null) {
      info.finishDate = moment(info.finishDate).toDate()
    }
    return info
  }

  loadMessageList() {
    this.notificationService.registerGlobalBusyTag("messageList")
    this._internalSubscriptions.add(
      this.http.get<Array<any>>("/api/research/experiments/" + this.experimentId + "/messages", this.researchApi.authorizedOptions)
        .subscribe(
          messages => {
            if (messages instanceof Array) {
              this.messageList.next(messages)
            }
          },
          (err) => {
            console.error(err)
          },
          () => {
            this.notificationService.unregisterGlobalBusyTag("messageList")
          }
        )
    )
  }

  loadExperimentInfo() {
    this.notificationService.registerGlobalBusyTag("experimentList")
    this._internalSubscriptions.add(
      this.http.get<IExperimentDbEntity>('/api/research/experiments/' + this.experimentId, this.researchApi.authorizedOptions).subscribe(
        experimentInfo => {
          if (experimentInfo) {
            this.experimentInfo.next(this.processExperimentInfo(experimentInfo))
          } else this.experimentInfo.next(null)
        },
        err => {
          console.error(err)
        },
        () => {
          this.notificationService.unregisterGlobalBusyTag("experimentList")
        }
      )
    )
  }

  loadManagerInfo() {
    this.notificationService.registerGlobalBusyTag("managerInfo")
    this._internalSubscriptions.add(
      this.http
        .get<IResearcherDbEntity>('/api/research/experiments/manager/' + this.experimentId, this.researchApi.authorizedOptions)
        .subscribe(
          manager => {
            this.managerInfo.next(manager)
          },
          (err) => {
            console.error(err)
          },
          () => {
            this.notificationService.unregisterGlobalBusyTag("managerInfo")
          }
        )
    )
  }

  loadInvitationList() {
    this.notificationService.registerGlobalBusyTag("invitationList")
    this._internalSubscriptions.add(
      this.http
        .get<Array<any>>('/api/research/experiments/' + this.experimentId + "/invitations", this.researchApi.authorizedOptions)
        .subscribe(
          list => {
            this.invitationList.next(list)
          },
          (err) => {
            console.error(err)
          },
          () => {
            this.notificationService.unregisterGlobalBusyTag("invitationList")
          }
        )
    )
  }

  loadParticipantList() {
    this.notificationService.registerGlobalBusyTag("participantList")
    this._internalSubscriptions.add(
      this.http.get<Array<IUserDbEntity>>("/api/research/experiments/" + this.experimentId + '/participants', this.researchApi.authorizedOptions).subscribe(
        list => {
          this.participantList.next(list)
        },
        err => {
          console.error(err)
        },
        () => {
          this.notificationService.unregisterGlobalBusyTag("participantList")
        })
    )
  }

  getExperiment(): Observable<IExperimentDbEntity> {
    return this.experimentInfo.pipe(filter(res => res != null))
  }

  getManagerInfo(): Observable<IResearcherDbEntity> {
    return this.managerInfo.pipe(filter(res => res != null))
  }

  getInvitations(): Observable<Array<any>> {
    return this.invitationList.pipe(filter(res => res != null))
  }

  getParticipants(): Observable<Array<IUserDbEntity>> {
    return this.participantList.pipe(filter(res => res != null))
  }

  getActiveParticipants(): Observable<Array<IUserDbEntity>> {
    return this.participantList.pipe(
      filter(res => res != null),
      map(participants => participants.filter(p => p.participationInfo.dropped === false))
    )
  }

  getMessageList(): Observable<Array<IResearchMessage>> {
    return this.messageList.pipe(filter(res => res != null))
  }

  enqueueMessage(messageInfo: IResearchMessage): Observable<any> {
    return this.http
      .post("/api/research/experiments/" + this.experimentId + "/messages/new", messageInfo, this.researchApi.authorizedOptions)
      .pipe(
        tap(newMessage => {
          if (this.messageList.value) {
            const currentList = this.messageList.value.slice()
            const matchIndex = currentList.findIndex(m => m._id === newMessage._id)
            if (matchIndex !== -1) {
              currentList[matchIndex] = newMessage
            } else {
              currentList.push(newMessage)
            }
            this.messageList.next(currentList)
          }
        })
      )
  }

  generateInvitation(information): Observable<any> {
    return this.http
      .post("/api/research/experiments/" + this.experimentId + '/invitations/new', information, this.researchApi.authorizedOptions)
      .pipe(
        tap(invitation => {
          if (this.invitationList.value) {
            const currentInvitationList = this.invitationList.value.slice()
            const matchIndex = currentInvitationList.findIndex(i => i._id === invitation._id)
            if (matchIndex > -1) {
              currentInvitationList[matchIndex] = invitation
            } else {
              currentInvitationList.push(invitation)
            }
            this.invitationList.next(currentInvitationList)
          }
        })
      )
  }

  removeInvitation(invitation): Observable<any> {
    return this.http
      .delete("/api/research/experiments/" + this.experimentId + '/invitations/' + invitation._id, this.researchApi.authorizedOptions)
      .pipe(
        tap(removed => {
          if (removed === true) {
            if (this.invitationList.value) {
              const currentInvitationList = this.invitationList.value.slice()
              const matchIndex = currentInvitationList.findIndex(i => i._id === invitation._id)
              if (matchIndex > -1) {
                currentInvitationList.splice(matchIndex, 1)
                this.invitationList.next(currentInvitationList)
              }
            }
          }
        })
      )
  }

  sendInvitation(invitationCode: string, userIds: Array<string>, force: boolean): Observable<Array<{
    invitationAlreadySent: boolean,
    participant: any
  }>> {
    return this.http
      .post<Array<{
        invitationAlreadySent: boolean,
        participant: any
      }>>("/api/research/experiments/" + this.experimentId + "/invitations/send", { invitationCode: invitationCode, userIds: userIds, force: force }, this.researchApi.authorizedOptions)
  }

  removeParticipant(participantId: string): Observable<any> {
    return this.http.delete("/api/research/participants/" + participantId, this.researchApi.authorizedOptions)
      .pipe(
        tap(removed => {
          if (removed === true && this.participantList.getValue() != null) {
            const newList = this.participantList.getValue().splice(0)
            const index = newList.findIndex(p => p._id === participantId)
            if (index !== -1) {
              newList.splice(index, 1)
              this.participantList.next(newList)
            }
          }
        })
      )
  }

  dropParticipant(participantId: string): Observable<any> {
    return this.http.post<any>("/api/research/participants/" + participantId + "/drop", {}, this.researchApi.authorizedOptions)
      .pipe(
        map(res => res.success),
        tap(success => {
          if (success === true) {
            const newList = this.participantList.getValue().splice(0)
            newList.find(p => p._id === participantId).participationInfo.dropped = true
            this.participantList.next(newList)
          }
        })
      )
  }

  changeParticipantAlias(participantId, alias): Observable<boolean> {
    return this.http.post<boolean>("/api/research/participants/" + participantId + "/alias", { alias: alias }, this.researchApi.authorizedOptions)
      .pipe(
        tap(result => {
          if (result === true) {
            const newList = this.participantList.getValue().splice(0)
            newList.find(p => p._id === participantId).participationInfo.alias = alias
            this.participantList.next(newList)
          }
        })
      )
  }

  createParticipantAccount(username: string, email: string, password: string, groupId: string, alias?: string): Observable<string> {
    return this.http.post<string>("/api/research/experiments/" + this.experimentId + "/participants/create", {
      username: username,
      password: password,
      email: email,
      groupId: groupId,
      alias: alias
    }, this.researchApi.authorizedOptions)
  }

  generateParticipantPasswordResetLink(userId: string): Observable<string> {
    return this.http.post<any>("/api/research/participants/" + userId + "/issue_reset_password", { userId: userId }, this.researchApi.authorizedOptions).pipe(
      map(passwordResetToken => {
        return window.location.protocol + "//" + window.location.host + "/user/reset_password?token=" + passwordResetToken.reset_token
      })
    )
  }

  updateParticipant(participantId, update): Observable<any> {
    return this.http.post("/api/research/participants/" + participantId + "/update", { update: update },
      this.researchApi.authorizedOptions)
  }

  setParticipantExcludedDays(participantId: string, excludedDays: Array<Date>): Observable<any> {
    return this.http.post("/api/research/participants/" + participantId + "/excluded_days", { excludedDays: excludedDays }, this.researchApi.authorizedOptions).pipe(
      tap(result => {
        if (result.success === true) {
          this.loadParticipantList()
        }
      })
    )
  }

  sendClientFullSyncMessages(participantId: string): Observable<any> {
    return this.http.post("/api/research/participants/" + participantId + "/ping_full_sync", {
      experimentId: this.experimentId
    }, this.researchApi.authorizedOptions)
  }

  getTrackingPlans(): Observable<Array<IExperimentTrackingPlanDbEntity>> {
    return this.experimentInfo.pipe(map(exp => {
      return exp.trackingPlans
    }))
  }

  getTrackingPlan(key: string): Observable<any> {
    return this.getTrackingPlans().pipe(map(list => {
      return list.find(l => l.key === key)
    }))
  }

  setFinishDate(date: Date): Observable<IExperimentDbEntity> {
    return this.http.post<IExperimentDbEntity>("/api/research/experiments/" + this.experimentId + "/finish", { date: date }, this.researchApi.authorizedOptions)
      .pipe(
        tap(refreshedExperiment => {
          if (refreshedExperiment) {
            this.experimentInfo.next(this.processExperimentInfo(refreshedExperiment))
          }
        })
      )
  }

  getNumParticipantsInGroup(groupId: string): Observable<number> {
    return this.participantList.pipe(
      filter(participants => participants != null),
      map(participants => {
        return participants.filter(p =>
          p.participationInfo.groupId === groupId && p.participationInfo.dropped === false).length
      })
    )
  }

  getVisualizationConfigs(): Observable<VisualizationConfigs> {
    return this.getExperiment().pipe(map(exp => VisualizationConfigs.fromJson(exp.visualizationConfigs)))
  }

  getMyRole(): Observable<string> {
    return this.getExperiment().pipe(combineLatest(this.authService.currentResearcher, (exp, researcher) => {
      if (getIdPopulateCompat(exp.manager) === researcher.uid) {
        return "manager"
      } else if (exp.experimenters.find(ex => getIdPopulateCompat(ex.researcher) === researcher.uid)) {
        return "collaborator"
      } else { return null }
    }))
  }

  getMyPermissions(): Observable<ExperimentPermissions> {
    return this.getExperiment().pipe(combineLatest(this.authService.currentResearcher, (exp, researcher) => {
      if (getIdPopulateCompat(exp.manager) === researcher.uid) {
        return ExperimentPermissions.makeMasterPermissions()
      } else {
        const col = exp.experimenters.find(ex => getIdPopulateCompat(ex.researcher) === researcher.uid)
        if (col) {
          return ExperimentPermissions.fromJson(col.permissions)
        }
      }

      return null
    }))
  }

  queryUsageLogsPerParticipant(mongooseFilter: any = null, userIds: string | Array<string> = null): Observable<Array<{ user: string, logs: Array<IUsageLogDbEntity> }>> {
    return this.http.get<Array<{ user: string, logs: Array<IUsageLogDbEntity> }>>("/api/research/diagnostics/logs/usage", this.researchApi.makeAuthorizedRequestOptions({
      experiment: this.experimentId,
      userIds: userIds,
      filter: JSON.stringify(mongooseFilter)
    }))
  }

  updateLatestTimestampsOfParticipants(selectUserIds?: Array<string>): Observable<void> {
    return this.http.get<Array<{ _id: string, logs: Array<{ _id: { user: string, name: string }, lastTimestamp: string }> }>>("/api/research/experiments/" + this.experimentId + "/session/summary", this.researchApi.makeAuthorizedRequestOptions({
      userIds: selectUserIds,
    })).pipe(map(result => {
      result.forEach(row => {
        const participant = this.participantList.value.find(p => p._id === row._id)
        if (participant) {
          row.logs.forEach(
            log => {
              switch (log._id.name) {
                case "session":
                  participant.lastSessionTimestamp = moment(log.lastTimestamp).valueOf()
                  break;
                case "data_sync":
                  participant.lastSyncTimestamp = moment(log.lastTimestamp).valueOf()
                  break;
              }
              participant.lastTimestampsUpdated = true
            }
          )
        }
      })
    }))
  }

  // commands====================

  addCollaborator(collaboratorId: string, permissions: ExperimentPermissions): Observable<boolean> {
    return this.http.post<boolean>("api/research/experiments/" + this.experimentId + "/collaborators/new", {
      collaborator: collaboratorId,
      permissions: permissions
    }, this.researchApi.authorizedOptions)
      .pipe(
        tap((changed) => {
          if (changed === true) {
            this.loadExperimentInfo()
          }
        })
      )
  }

  removeCollaborator(collaboratorId: string): Observable<boolean> {
    return this.http.delete<boolean>('api/research/experiments/' + this.experimentId + "/collaborators/" + collaboratorId, this.researchApi.authorizedOptions).pipe(
      tap(changed => {
        if (changed === true) {
          this.loadExperimentInfo()
        }
      })
    )
  }

  addTrackingPlanJson(planJson: any, name: string): Observable<boolean> {
    return this.http.post<boolean>("api/research/experiments/" + this.experimentId + "/packages/update", {
      packageJson: planJson,
      name: name
    }, this.researchApi.authorizedOptions).pipe(
      tap(changed => {
        if (changed === true) {
          this.loadExperimentInfo()
        }
      })
    )
  }

  updateTrackingPlanJson(packageKey: string, packageJson: any, name: string): Observable<boolean> {
    return this.http.post<boolean>("api/research/experiments/" + this.experimentId + "/packages/update", {
      packageJson: packageJson,
      name: name,
      packageKey: packageKey
    }, this.researchApi.authorizedOptions).pipe(tap(changed => {
      if (changed === true) {
        this.loadExperimentInfo()
      }
    }))
  }

  removeTrackingPlan(planKey: string): Observable<boolean> {
    return this.http.delete<boolean>("api/research/experiments/" + this.experimentId + "/packages/" + planKey, this.researchApi.authorizedOptions)
  }

  upsertExperimentGroup(values: {
    _id?: string,
    name?: string,
    trackingPlanKey?: string
  }): Observable<IExperimentGroupDbEntity> {
    return this.http.post<IExperimentGroupDbEntity>("api/research/experiments/" + this.experimentId + "/groups/upsert", values, this.researchApi.authorizedOptions)
  }

  deleteExperimentGroup(groupId: string) {
    return this.http.delete("api/research/experiments/" + this.experimentId + "/groups/" + groupId, this.researchApi.authorizedOptions)
  }

  getEntitiesOfUserInExperiment(userId: string): Observable<{ trackers: Array<ITrackerDbEntity>, triggers: Array<ITriggerDbEntity> }> {
    return this.http.get<{
      trackers: Array<ITrackerDbEntity>,
      triggers: Array<ITriggerDbEntity>
    }>(
      "/api/research/experiments/" + this.experimentId + "/entities/user/" + userId,
      this.researchApi.authorizedOptions
    )
  }

  updateTrigger(triggerId: string, update: any): Observable<{ updated: ITriggerDbEntity }> {
    return this.http.post<{ updated: ITriggerDbEntity }>(
      '/api/research/tracking/update/trigger',
      {
        experimentId: this.experimentId,
        triggerId: triggerId,
        update: update
      },
      this.researchApi.authorizedOptions
    )
  }

  updateTracker(trackerId: string, update: any): Observable<{ updated: ITrackerDbEntity }> {
    return this.http.post<{ updated: ITrackerDbEntity }>(
      '/api/research/tracking/update/tracker',
      {
        experimentId: this.experimentId,
        trackerId: trackerId,
        update: update
      },
      this.researchApi.authorizedOptions
    )
  }


  updateAttributeOfTracker(trackerId: string, attributeLocalId: string, update: any): Observable<{ updated: ITrackerDbEntity }> {
    return this.http.post<{ updated: ITrackerDbEntity }>(
      '/api/research/tracking/update/attribute',
      {
        experimentId: this.experimentId,
        trackerId: trackerId,
        attributeLocalId: attributeLocalId,
        update: update
      },
      this.researchApi.authorizedOptions
    )
  }

  sendTestPingOfTrigger(triggerId: string): Observable<boolean> {
    return this.http.post<boolean>('/api/research/experiments/' + this.experimentId + '/test/trigger_ping', { triggerId: triggerId }, this.researchApi.authorizedOptions)
  }
}
