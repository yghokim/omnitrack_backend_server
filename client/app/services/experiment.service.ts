import { ResearcherAuthService } from './researcher.auth.service';
import { ResearchApiService } from './research-api.service';
import { Http } from '@angular/http';
import { Observable, BehaviorSubject, Subscription, Subject } from 'rxjs';
import { map, filter, tap, combineLatest } from 'rxjs/operators';
import { SocketService } from './socket.service';
import { SocketConstants } from '../../../omnitrack/core/research/socket'
import { NotificationService } from './notification.service';
import { ExperimentPermissions } from '../../../omnitrack/core/research/experiment'

import { VisualizationConfigs } from '../../../omnitrack/core/research/configs';
import { TrackingDataService } from './tracking-data.service';
import { IResearchMessage } from '../../../omnitrack/core/research/messaging';
import { IParticipantDbEntity, IUsageLogDbEntity, getIdPopulateCompat } from '../../../omnitrack/core/db-entity-types';
import { IExperimentDbEntity, IResearcherDbEntity, IExperimentTrackingPackgeDbEntity, IExperimentGroupDbEntity } from '../../../omnitrack/core/research/db-entity-types';
import { once } from 'cluster';

export class ExperimentService {

  private readonly experimentInfo = new BehaviorSubject<IExperimentDbEntity>(null)
  private readonly managerInfo = new BehaviorSubject<IResearcherDbEntity>(null)
  private readonly invitationList = new BehaviorSubject<Array<any>>([])
  private readonly participantList = new BehaviorSubject<Array<IParticipantDbEntity>>([])
  private readonly messageList = new BehaviorSubject<Array<IResearchMessage>>([])

  private readonly _internalSubscriptions = new Subscription()

  public readonly trackingDataService: TrackingDataService

  private readonly _onExperimentInvalid = new Subject<void>()

  public get experimentInvalidated(): Observable<void> {
    return this._onExperimentInvalid
  }

  constructor(
    readonly experimentId: string,
    private http: Http,
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
      socketService.onConnected.subscribe(
        socket => {
          console.log("connect new experiment service to websocket.")
          socket.emit(SocketConstants.SERVER_EVENT_SUBSCRIBE_EXPERIMENT, { experimentId: this.experimentId })

          socket.on(SocketConstants.SOCKET_MESSAGE_UPDATED_EXPERIMENT, (data) => {
            console.log("received updated/experiment websocket event.")
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
                    case SocketConstants.MODEL_PARTICIPANT:
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

  loadMessageList() {
    this.notificationService.registerGlobalBusyTag("messageList")
    this._internalSubscriptions.add(
      this.http.get("/api/research/experiments/" + this.experimentId + "/messages", this.researchApi.authorizedOptions)
        .pipe(map(res => res.json()))
        .subscribe(
          messages => {
            if (messages instanceof Array) {
              this.notificationService.unregisterGlobalBusyTag("messageList")
              this.messageList.next(messages)
            }
          }
        )
    )
  }

  loadExperimentInfo() {
    this.notificationService.registerGlobalBusyTag("experimentList")
    this._internalSubscriptions.add(
      this.http.get('/api/research/experiments/' + this.experimentId, this.researchApi.authorizedOptions)
        .pipe(map(res => {
          return res.json()
        })).subscribe(
          experimentInfo => {
            this.notificationService.unregisterGlobalBusyTag("experimentList")
            this.experimentInfo.next(experimentInfo)
          })
    )
  }

  loadManagerInfo() {
    this.notificationService.registerGlobalBusyTag("managerInfo")
    this._internalSubscriptions.add(
      this.http
        .get('/api/research/experiments/manager/' + this.experimentId, this.researchApi.authorizedOptions)
        .pipe(map(res => {
          return res.json()
        })).subscribe(
          manager => {

            this.notificationService.unregisterGlobalBusyTag("managerInfo")
            this.managerInfo.next(manager)
          })
    )
  }

  loadInvitationList() {
    this.notificationService.registerGlobalBusyTag("invitationList")
    this._internalSubscriptions.add(
      this.http
        .get('/api/research/experiments/' + this.experimentId + "/invitations", this.researchApi.authorizedOptions)
        .pipe(map(res => {
          return res.json()
        })).subscribe(
          list => {
            this.notificationService.unregisterGlobalBusyTag("invitationList")
            this.invitationList.next(list)
          })
    )
  }

  loadParticipantList() {
    this.notificationService.registerGlobalBusyTag("participantList")
    this._internalSubscriptions.add(
      this.http.get("/api/research/experiments/" + this.experimentId + '/participants', this.researchApi.authorizedOptions).pipe(map(
        res => res.json()
      )).subscribe(
        list => {
          this.notificationService.unregisterGlobalBusyTag("participantList")
          this.participantList.next(list)
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
    return this.invitationList.asObservable()
  }

  getParticipants(): Observable<Array<IParticipantDbEntity>> {
    return this.participantList.asObservable()
  }

  getMessageList(): Observable<Array<IResearchMessage>> {
    return this.messageList.pipe(filter(res => res != null))
  }

  enqueueMessage(messageInfo: IResearchMessage): Observable<boolean> {
    return this.http
      .post("/api/research/experiments/" + this.experimentId + "/messages/new", messageInfo, this.researchApi.authorizedOptions)
      .pipe(map(res => res.json()))
  }

  generateInvitation(information): Observable<any> {
    return this.http
      .post("/api/research/experiments/" + this.experimentId + '/invitations/new', information, this.researchApi.authorizedOptions)
      .pipe(map(res => res.json()))
  }

  removeInvitation(invitation): Observable<any> {
    return this.http
      .delete("/api/research/experiments/" + this.experimentId + '/invitations/' + invitation._id, this.researchApi.authorizedOptions).pipe(map(
        res => res.json()
      ))
  }

  sendInvitation(invitationCode: string, userIds: Array<string>, force: boolean): Observable<Array<{
    invitationAlreadySent: boolean,
    participant: any
  }>> {
    return this.http
      .post("/api/research/experiments/" + this.experimentId + "/invitations/send", { invitationCode: invitationCode, userIds: userIds, force: force }, this.researchApi.authorizedOptions)
      .pipe(map(res => res.json()))
  }

  removeParticipant(participantId): Observable<any> {
    return this.http.delete("/api/research/participants/" + participantId, this.researchApi.authorizedOptions)
      .pipe(map(res => res.json()))
  }

  dropParticipant(participantId): Observable<any> {
    return this.http.post("/api/research/participants/" + participantId + "/drop", this.researchApi.authorizedOptions)
      .pipe(map(res => res.json().success))
  }

  changeParticipantAlias(participantId, alias): Observable<boolean> {
    return this.http.post("/api/research/participants/" + participantId + "/alias", { alias: alias }, this.researchApi.authorizedOptions).pipe(map(res => res.json()))
  }

  updateParticipant(participantId, update): Observable<any> {
    return this.http.post("/api/research/participants/" + participantId + "/update", { update: update },
      this.researchApi.authorizedOptions).pipe(map(res => res.json()))
  }

  setParticipantExcludedDays(participantId: string, excludedDays: Array<Date>): Observable<any> {
    return this.http.post("/api/research/participants/" + participantId + "/excluded_days", { excludedDays: excludedDays }, this.researchApi.authorizedOptions).pipe(
      map(res => res.json()),
      tap(result => {
        if (result.success === true) {
          this.loadParticipantList()
        }
      })
    )
  }

  getOmniTrackPackages(): Observable<Array<IExperimentTrackingPackgeDbEntity>> {
    return this.experimentInfo.pipe(map(exp => {
      return exp.trackingPackages
    }))
  }

  getOmniTrackPackage(key: string): Observable<any> {
    return this.getOmniTrackPackages().pipe(map(list => {
      return list.find(l => l.key === key)
    }))
  }

  getNumParticipantsInGroup(groupId: string): Observable<number> {
    return this.participantList.pipe(
      filter(participants => participants != null),
      map(participants => {
        return participants.filter(p => p.groupId === groupId).length
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

  queryUsageLogsPerParticipant(filter: any = null, userIds: string | Array<string> = null): Observable<Array<{ user: string, logs: Array<IUsageLogDbEntity> }>> {
    return this.http.get("/api/research/usage_logs", this.researchApi.makeAuthorizedRequestOptions({
      experiment: this.experimentId,
      userIds: userIds,
      filter: JSON.stringify(filter)
    })).pipe(map(res => res.json()))
  }

  // commands====================

  addCollaborator(collaboratorId: string, permissions: ExperimentPermissions): Observable<boolean> {
    return this.http.post("api/research/experiments/" + this.experimentId + "/collaborators/new", {
      collaborator: collaboratorId,
      permissions: permissions
    }, this.researchApi.authorizedOptions)
      .pipe(
        map(res => res.json()),
        tap((changed) => {
          if (changed === true) {
            this.loadExperimentInfo()
          }
        })
      )
  }

  removeCollaborator(collaboratorId: string): Observable<boolean> {
    return this.http.delete('api/research/experiments/' + this.experimentId + "/collaborators/" + collaboratorId, this.researchApi.authorizedOptions).pipe(
      map(res => res.json()),
      tap(changed => {
        if(changed === true){
          this.loadExperimentInfo()
        }
      })
    )
  }

  addTrackingPackageJson(packageJson: any, name: string): Observable<boolean> {
    return this.http.post("api/research/experiments/" + this.experimentId + "/packages/update", {
      packageJson: packageJson,
      name: name
    }, this.researchApi.authorizedOptions).pipe(
      map(res => res.json()),
      tap(changed => {
        if(changed === true){
          this.loadExperimentInfo()
        }
      })
    )
  }

  updateTrackingPackageJson(packageKey: string, packageJson: any, name: string): Observable<boolean> {
    return this.http.post("api/research/experiments/" + this.experimentId + "/packages/update", {
      packageJson: packageJson,
      name: name,
      packageKey: packageKey
    }, this.researchApi.authorizedOptions).pipe(map(res => res.json()), tap(changed => {
      if (changed == true) {
        this.loadExperimentInfo()
      }
    }))
  }

  removeTrackingPackage(packageKey: string): Observable<boolean> {
    return this.http.delete("api/research/experiments/" + this.experimentId + "/packages/" + packageKey, this.researchApi.authorizedOptions).pipe(map(res => res.json()))
  }

  upsertExperimentGroup(values: {
    _id?: string,
    name?: string,
    trackingPackageKey?: string
  }): Observable<IExperimentGroupDbEntity> {
    return this.http.post("api/research/experiments/" + this.experimentId + "/groups/upsert", values, this.researchApi.authorizedOptions).pipe(map(r => r.json()))
  }

  deleteExperimentGroup(groupId: string) {
    return this.http.delete("api/research/experiments/" + this.experimentId + "/groups/" + groupId, this.researchApi.authorizedOptions).pipe(map(r => r.json()))
  }
}
