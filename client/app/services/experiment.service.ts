import { ResearcherAuthService } from './researcher.auth.service';
import { ResearchApiService } from './research-api.service';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/publishReplay';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SocketService } from './socket.service';

export class ExperimentService {

  /*
  private _loadExperimentQuery: Observable<any> = null
  private _loadManagerInfoQuery: Observable<any> = null
  private _loadInvitationListQuery: Observable<Array<any>> = null
  private _loadParticipantsQuery: Observable<Array<any>> = null
*/

  private readonly experimentInfo = new BehaviorSubject<any>(null)
  private readonly managerInfo = new BehaviorSubject<any>(null)
  private readonly invitationList = new BehaviorSubject<Array<any>>([])
  private readonly participantList = new BehaviorSubject<Array<any>>([])

  constructor(
    readonly experimentId: string,
    private http: Http,
    private authService: ResearcherAuthService,
    private researchApi: ResearchApiService,
    private socketService: SocketService) {

    this.loadExperimentInfo()
    this.loadInvitationList()
    this.loadManagerInfo()
    this.loadParticipantList()

    socketService.onConnected.subscribe(
      socket => {
        socket.emit("subscribe_experiment", { experimentId: this.experimentId })

        socket.on("updated/experiment", (data) => {
          console.log("received updated/experiment websocket event.")
          console.log(data)
          if (data.key) {
            switch (data.key) {
              case "invitation":
                this.loadInvitationList()
                break;
            }
          }
        })
      }
    )
  }

  dispose() {
    this.socketService.socket.emit("unsubscribe_experiment", { experimentId: this.experimentId }, () => {
      console.log("unsubscribed experiment from websocket.")
      this.socketService.socket.removeListener("updated/experiment")
    })
  }

  loadExperimentInfo() {
    this.http.get('/api/research/experiments/' + this.experimentId, this.researchApi.authorizedOptions)
      .map(res => {
        return res.json()
      }).subscribe(
      experimentInfo => this.experimentInfo.next(experimentInfo)
      )
  }

  loadManagerInfo() {
    this.http
      .get('/api/research/experiments/manager/' + this.experimentId, this.researchApi.authorizedOptions)
      .map(res => {
        return res.json()
      }).subscribe(
      manager => this.managerInfo.next(manager)
      )
  }

  loadInvitationList() {
    this.http
      .get('/api/research/experiments/' + this.experimentId + "/invitations", this.researchApi.authorizedOptions)
      .map(res => {
        return res.json()
      }).subscribe(
      list => this.invitationList.next(list)
      )
  }

  loadParticipantList() {
    this.http.get("/api/research/experiments/" + this.experimentId + '/participants', this.researchApi.authorizedOptions).map(
      res => res.json()
    ).subscribe(
      list => this.participantList.next(list)
      )
  }

  getExperiment(): Observable<any> {
    return this.experimentInfo.asObservable()
  }

  getManagerInfo(): Observable<any> {
    return this.managerInfo.asObservable()
  }

  getInvitations(): Observable<Array<any>> {
    return this.invitationList.asObservable()
  }

  getParticipants(): Observable<Array<any>> {
    return this.participantList.asObservable()
  }

  /*
    reloadExperiment(): Observable<any> {
      this._loadExperimentQuery = null
      return this.getExperiment()
    }
  
    getExperiment(): Observable<any> {
      if (this._loadExperimentQuery === null) {
        this._loadExperimentQuery = this.http.get('/api/research/experiments/' + this.experimentId, this.researchApi.authorizedOptions)
        .map(res => {
          return res.json()
        })
        .publishReplay(1).refCount()
      }
  
      return this._loadExperimentQuery
    }
  
    getManagerInfo(): Observable<any> {
      if (this._loadManagerInfoQuery == null) {
        this._loadManagerInfoQuery = this.http
        .get('/api/research/experiments/manager/' + this.experimentId, this.researchApi.authorizedOptions)
        .map(res => {
          return res.json()
        })
        .publishReplay(1).refCount()
      }
      return this._loadManagerInfoQuery
    }
  
    getInvitations(): Observable<Array<any>> {
      if (this._loadInvitationListQuery == null) {
        this._loadInvitationListQuery = this.http
        .get('/api/research/experiments/' + this.experimentId + "/invitations", this.researchApi.authorizedOptions)
          .map(res => {
            return res.json()
          })
          .publishReplay(1).refCount()
      }
      return this._loadInvitationListQuery
    }
  
    invalidateInvitations() {
      this._loadInvitationListQuery = null
    }
    
    getParticipants(): Observable<Array<any>> {
      if (!this._loadParticipantsQuery) {
        this._loadParticipantsQuery = this.http.get("/api/research/experiments/" + this.experimentId + '/participants', this.researchApi.authorizedOptions).map(
          res => res.json()
        ).publishReplay(1).refCount()
      }
  
      return this._loadParticipantsQuery
    }
  
    invalidateParticipants() {
      this._loadParticipantsQuery = null
    }
    */

  generateInvitation(information): Observable<any> {
    return this.http
      .post("/api/research/experiments/" + this.experimentId + '/invitations/new', information, this.researchApi.authorizedOptions)
      .map(res => res.json())
      .do(res => {
        this.loadInvitationList()
      })
  }

  removeInvitation(invitation): Observable<any> {
    return this.http
      .delete("/api/research/experiments/" + this.experimentId + '/invitations/' + invitation._id, this.researchApi.authorizedOptions).map(
      res => res.json()
      ).do(result => {
        this.loadInvitationList()
        this.loadParticipantList()
        this.researchApi.invalidateUserPool()
      })
  }

  sendInvitation(invitationCode: string, userIds: Array<string>, force: boolean): Observable<Array<{
    invitationAlreadySent: boolean,
    participant: any
  }>> {
    return this.http
      .post("/api/research/experiments/" + this.experimentId + "/invitations/send", { invitationCode: invitationCode, userIds: userIds, force: force }, this.researchApi.authorizedOptions)
      .map(res => res.json())
      .do(res => {
        this.researchApi.invalidateUserPool()
        this.loadParticipantList()
      })
  }

  removeParticipant(participantId): Observable<any> {
    return this.http.delete("/api/research/participants/" + participantId, this.researchApi.authorizedOptions)
      .map(res => res.json()).do(result => {
        if (result) {
          this.researchApi.invalidateUserPool()
          this.loadParticipantList()
        }
      })
  }

  dropParticipant(participantId): Observable<any> {
    return this.http.delete("/api/research/participants/" + participantId + "/drop", this.researchApi.authorizedOptions)
      .map(res => res.json().success).do(result => {
        if (result) {
          this.researchApi.invalidateUserPool()
          this.loadParticipantList()
        }
      })
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
