import { ResearcherAuthService } from './researcher.auth.service';
import { ResearchApiService } from './research-api.service';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/publishReplay';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SocketService } from './socket.service';
import { SocketConstants } from '../../../omnitrack/core/research/socket'
import { NotificationService } from './notification.service';

export class ExperimentService {

  private readonly experimentInfo = new BehaviorSubject<any>(null)
  private readonly managerInfo = new BehaviorSubject<any>(null)
  private readonly invitationList = new BehaviorSubject<Array<any>>([])
  private readonly participantList = new BehaviorSubject<Array<any>>([])

  constructor(
    readonly experimentId: string,
    private http: Http,
    private authService: ResearcherAuthService,
    private researchApi: ResearchApiService,
    private socketService: SocketService,
    private notificationService: NotificationService
  ) {

    console.log("initialized experiment service.")

    this.loadExperimentInfo()
    this.loadInvitationList()
    this.loadManagerInfo()
    this.loadParticipantList()

    socketService.onConnected.subscribe(
      socket => {
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
                    break;
                  case SocketConstants.MODEL_PARTICIPANT:
                    this.loadParticipantList()
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
                    break;
                }
              }
            })
          }
        })
      }
    )
  }

  dispose() {
    this.socketService.socket.emit(SocketConstants.SERVER_EVENT_UNSUBSCRIBE_EXPERIMENT, { experimentId: this.experimentId }, () => {
      console.log("unsubscribed experiment from websocket.")
      this.socketService.socket.removeListener(SocketConstants.SOCKET_MESSAGE_UPDATED_EXPERIMENT)
    })
  }

  loadExperimentInfo() {
    this.notificationService.registerGlobalBusyTag("experimentList")
    this.http.get('/api/research/experiments/' + this.experimentId, this.researchApi.authorizedOptions)
      .map(res => {
        return res.json()
      }).subscribe(
      experimentInfo => {
        this.notificationService.unregisterGlobalBusyTag("experimentList")
        this.experimentInfo.next(experimentInfo)
      }
      )
  }

  loadManagerInfo() {
    this.notificationService.registerGlobalBusyTag("managerInfo")
    this.http
      .get('/api/research/experiments/manager/' + this.experimentId, this.researchApi.authorizedOptions)
      .map(res => {
        return res.json()
      }).subscribe(
      manager => {

        this.notificationService.unregisterGlobalBusyTag("managerInfo")
        this.managerInfo.next(manager)
      })
  }

  loadInvitationList() {
    this.notificationService.registerGlobalBusyTag("invitationList")
    this.http
      .get('/api/research/experiments/' + this.experimentId + "/invitations", this.researchApi.authorizedOptions)
      .map(res => {
        return res.json()
      }).subscribe(
      list => {
        this.notificationService.unregisterGlobalBusyTag("invitationList")
        this.invitationList.next(list)
      })
  }

  loadParticipantList() {
    this.notificationService.registerGlobalBusyTag("participantList")
    this.http.get("/api/research/experiments/" + this.experimentId + '/participants', this.researchApi.authorizedOptions).map(
      res => res.json()
    ).subscribe(
      list => {
        this.notificationService.unregisterGlobalBusyTag("participantList")
        this.participantList.next(list)
      })
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
}
