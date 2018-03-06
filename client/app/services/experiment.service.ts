import { ResearcherAuthService } from './researcher.auth.service';
import { ResearchApiService } from './research-api.service';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/publishReplay';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SocketService } from './socket.service';
import { SocketConstants } from '../../../omnitrack/core/research/socket'
import { NotificationService } from './notification.service';
import { ExperimentPermissions} from '../../../omnitrack/core/research/experiment'
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/combineLatest';
import { VisualizationConfigs } from '../../../omnitrack/core/research/configs';
import { TrackingDataService } from './tracking-data.service';
import { Subject } from 'rxjs/Subject';
import { IResearchMessage } from '../../../omnitrack/core/research/messaging';

export class ExperimentService {

  private readonly experimentInfo = new BehaviorSubject<any>(null)
  private readonly managerInfo = new BehaviorSubject<any>(null)
  private readonly invitationList = new BehaviorSubject<Array<any>>([])
  private readonly participantList = new BehaviorSubject<Array<any>>([])
  private readonly messageList = new BehaviorSubject<Array<IResearchMessage>>([])

  private readonly _internalSubscriptions = new Subscription()

  public readonly trackingDataService: TrackingDataService

  private readonly _onExperimentInvalid = new Subject<void>()

  public get experimentInvalidated(): Observable<void>{
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
                      switch(datum.event){
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

  loadMessageList(){
    this.notificationService.registerGlobalBusyTag("messageList")
    this._internalSubscriptions.add(
      this.http.get("/api/research/experiments/" + this.experimentId + "/messages", this.researchApi.authorizedOptions)
        .map(res=> res.json())
        .subscribe(
          messages=>{
            if(messages instanceof Array){
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
        .map(res => {
          return res.json()
        }).subscribe(
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
        .map(res => {
          return res.json()
        }).subscribe(
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
        .map(res => {
          return res.json()
        }).subscribe(
        list => {
          this.notificationService.unregisterGlobalBusyTag("invitationList")
          this.invitationList.next(list)
        })
    )
  }

  loadParticipantList() {
    this.notificationService.registerGlobalBusyTag("participantList")
    this._internalSubscriptions.add(
      this.http.get("/api/research/experiments/" + this.experimentId + '/participants', this.researchApi.authorizedOptions).map(
        res => res.json()
      ).subscribe(
        list => {
          this.notificationService.unregisterGlobalBusyTag("participantList")
          this.participantList.next(list)
        })
    )
  }

  getExperiment(): Observable<any> {
    return this.experimentInfo.filter(res => res != null)
  }

  getManagerInfo(): Observable<any> {
    return this.managerInfo.filter(res => res != null)
  }

  getInvitations(): Observable<Array<any>> {
    return this.invitationList.asObservable()
  }

  getParticipants(): Observable<Array<any>> {
    return this.participantList.asObservable()
  }

  getMessageList() : Observable<Array<IResearchMessage>>{
    return this.messageList.filter(res=>res != null)
  }

  enqueueMessage(messageInfo: IResearchMessage): Observable<boolean>{
    return this.http
      .post("/api/research/experiments/" + this.experimentId + "/messages/new", messageInfo, this.researchApi.authorizedOptions)
      .map(res=>res.json())
  }

  generateInvitation(information): Observable<any> {
    return this.http
      .post("/api/research/experiments/" + this.experimentId + '/invitations/new', information, this.researchApi.authorizedOptions)
      .map(res => res.json())
  }

  removeInvitation(invitation): Observable<any> {
    return this.http
      .delete("/api/research/experiments/" + this.experimentId + '/invitations/' + invitation._id, this.researchApi.authorizedOptions).map(
      res => res.json()
      )
  }

  sendInvitation(invitationCode: string, userIds: Array<string>, force: boolean): Observable<Array<{
    invitationAlreadySent: boolean,
    participant: any
  }>> {
    return this.http
      .post("/api/research/experiments/" + this.experimentId + "/invitations/send", { invitationCode: invitationCode, userIds: userIds, force: force }, this.researchApi.authorizedOptions)
      .map(res => res.json())
  }

  removeParticipant(participantId): Observable<any> {
    return this.http.delete("/api/research/participants/" + participantId, this.researchApi.authorizedOptions)
      .map(res => res.json())
  }

  dropParticipant(participantId): Observable<any> {
    return this.http.delete("/api/research/participants/" + participantId + "/drop", this.researchApi.authorizedOptions)
      .map(res => res.json().success)
  }

  changeParticipantAlias(participantId, alias): Observable<boolean>{
    return this.http.post("/api/research/participants/" + participantId  + "/alias", {alias: alias}, this.researchApi.authorizedOptions).map(res => res.json())
  }

  updateParticipant(participantId, update): Observable<any>{
    return this.http.post("/api/research/participants/" + participantId + "/update", {update: update},
    this.researchApi.authorizedOptions).map(res => res.json())
  }

  getOmniTrackPackages(): Observable<Array<any>> {
    return this.experimentInfo.map(exp => {
      return exp.trackingPackages
    })
  }

  getOmniTrackPackage(key: string): Observable<any> {
    return this.getOmniTrackPackages().map(list => {
      return list.find(l => l.key === key)
    })
  }

  getVisualizationConfigs(): Observable<VisualizationConfigs>{
    return this.getExperiment().map(exp => VisualizationConfigs.fromJson(exp.visualizationConfigs))
  }

  getMyRole(): Observable<string>{
    return this.getExperiment().combineLatest(this.authService.currentResearcher, (exp, researcher)=>{
      if(exp.manager._id === researcher.uid)
      {
        return "manager"
      }
      else if(exp.experimenters.find(ex=>ex.researcher.email === researcher.email)){
        return "collaborator"
      }
      else return null
    })
  }

  getMyPermissions(): Observable<ExperimentPermissions>{
    return this.getExperiment().combineLatest(this.authService.currentResearcher, (exp, researcher)=>{
      if(exp.manager._id === researcher.uid)
      {
        return ExperimentPermissions.makeMasterPermissions()
      }
      else{
        const col = exp.experimenters.find(ex=>ex.researcher.email === researcher.email)
        if(col){
          return ExperimentPermissions.fromJson(col.permissions)
        }
      }
      
      return null
    })
  }

  //commands====================

  addCollaborator(collaboratorId: string, permissions: ExperimentPermissions): Observable<boolean>{
    return this.http.post("api/research/experiments/" + this.experimentId + "/collaborators/new", {
      collaborator: collaboratorId,
      permissions: permissions
    },this.researchApi.authorizedOptions)
      .map(res => res.json())
  }


}
