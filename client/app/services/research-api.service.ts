import { Injectable, OnDestroy } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { ResearcherAuthService } from './researcher.auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/publishReplay';
import { Subscription } from 'rxjs/Subscription';
import { SocketService } from './socket.service';
import ExperimentInfo from '../models/experiment-info';
import { ExperimentService } from './experiment.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SocketConstants } from '../../../omnitrack/core/research/socket';
import { NotificationService } from './notification.service';
import { ExampleExperimentInfo } from '../../../omnitrack/core/research/experiment';

@Injectable()
export class ResearchApiService implements OnDestroy {

  private tokenHeaders: Headers

  public authorizedOptions: RequestOptions

  private selectedExperimentId: string = null

  private readonly _selectedExperimentService = new BehaviorSubject<ExperimentService>(null)

  public readonly selectedExperimentService: Observable<ExperimentService> = this._selectedExperimentService.filter(s => { return s != null })

  get selectedExperimentServiceSync(): ExperimentService{
    return this._selectedExperimentService.getValue()
  }

  private readonly _experimentListSubject = new BehaviorSubject<Array<ExperimentInfo>>([])
  private readonly _userPoolSubject = new BehaviorSubject<Array<any>>([])

  private readonly _internalSubscriptions = new Subscription()

  constructor(private http: Http, private authService: ResearcherAuthService, private socketService: SocketService, private notificationService: NotificationService) {

    this._internalSubscriptions.add(
      this.authService.tokenSubject.subscribe(token => {
        if (token) {
          this.tokenHeaders = new Headers({ 'Authorization': 'Bearer ' + token });
          this.authorizedOptions = new RequestOptions({ headers: this.tokenHeaders });

          this.loadExperimentList()
          this.loadUserPool()
        }
      })
    )

    this._internalSubscriptions.add(
      this.socketService.onConnected
      .combineLatest(this.authService.tokenSubject, (socket, token) => { return { token: token, socket: socket } })
      .subscribe(
        res => {
          console.log("socket or token was refreshed.")
          res.socket.emit(SocketConstants.SERVER_EVENT_SUBSCRIBE_SERVER_GLOBAL)

          res.socket.on(SocketConstants.SERVER_EVENT_UPDATED_GLOBAL, (data) => {
            console.log(data)
            if (data instanceof Array) {
              data.forEach(datum => {
                switch (datum.model) {
                  case SocketConstants.MODEL_USER:
                    this.loadUserPool()
                    switch (datum.event) {
                      case SocketConstants.EVENT_REMOVED:
                        this.notificationService.pushSnackBarMessage({ message: "A user account was removed." })
                        break;
                    }
                    break;
                  
                    case SocketConstants.MODEL_EXPERIMENT:
                    this.loadExperimentList()
                    break;
                }
              })
            }
          })

          res.socket.on(SocketConstants.SOCKET_MESSAGE_UPDATED_RESEARCHER, (data)=>{
            console.log("received update researcher socket event.")
            if(data instanceof Array){
              data.forEach(datum => {
                switch(datum.model){
                  case SocketConstants.MODEL_EXPERIMENT:
                    this.loadExperimentList()  
                  break;
                }
              })
            }
          })
        })
    )
  }

  ngOnDestroy() {
    this.socketService.socket.emit(SocketConstants.SERVER_EVENT_UNSUBSCRIBE_SERVER_GLOBAL)
    this.socketService.socket.removeListener(SocketConstants.SERVER_EVENT_UPDATED_GLOBAL)
    this._internalSubscriptions.unsubscribe()
  }

  loadExperimentList() {
    this.notificationService.registerGlobalBusyTag("experimentInfo")
    this._internalSubscriptions.add(
    this.http.get('/api/research/experiments/all', this.authorizedOptions).flatMap(res => {
      return this.authService.currentResearcher.map(researcher => {
        return res.json()
      })
    }).subscribe(
      list => {
        this.notificationService.unregisterGlobalBusyTag("experimentInfo")
        this._experimentListSubject.next(list)
      })
    )
  }

  loadUserPool() {
    this.notificationService.registerGlobalBusyTag("userPool")
    this._internalSubscriptions.add(
    this.http.get("/api/research/users/all", this.authorizedOptions).map(res => {
      return res.json()
    }).subscribe(
      list => {
        this.notificationService.unregisterGlobalBusyTag("userPool")
        this._userPoolSubject.next(list)
      }
      )
    )
  }

  getExperimentInfos(): Observable<Array<ExperimentInfo>> {
    return this._experimentListSubject.filter(res => res != null)
  }

  getExampleExperimentList(): Observable<Array<ExampleExperimentInfo>>{
    return this.http.get("/api/research/experiments/examples").map(res => { console.log(res.json()); return res.json() })
  }

  addExampleExperimentAndGetId(key: string): Observable<string>{
    console.log(this.authorizedOptions)
    return this.http.post("/api/research/experiments/examples", {exampleKey: key}, this.authorizedOptions).map(res =>res.json())
  }

  getSelectedExperimentId(): string {
    return this.selectedExperimentId
  }

  setSelectedExperimentId(id: string) {
    if (this.selectedExperimentId !== id) {
      if (this._selectedExperimentService.value) {
        this._selectedExperimentService.value.dispose()
      }
      this.selectedExperimentId = id
      this._selectedExperimentService.next(new ExperimentService(this.selectedExperimentId, this.http, this.authService, this, this.socketService, this.notificationService))
    }
  }

  getUserPool(): Observable<Array<any>> {
    return this._userPoolSubject.filter(res => res != null)
  }

  deleteUserAccount(userId: string, removeData: boolean): Observable<boolean> {
    return this.http.delete('/api/research/users/' + userId, new RequestOptions({ headers: this.tokenHeaders, params: { removeData: removeData } }))
      .map(res => {
        return true
      }).do(result => {
        if (result === true) {
        }
      })
  }

  createExperiment(info: any): Observable<any>{
    return this.http.post("/api/research/experiments/new", info, this.authorizedOptions)
      .map(res=>{
        return res.json()
      })
  }

  removeExperiment(experimentId: string): Observable<boolean>{
    return this.http.delete("/api/research/experiments/" + experimentId, this.authorizedOptions).map(res=>res.json())
  }

  searchResearchers(term: string, excludeSelf): Observable<Array<{_id: string, email: string, alias: string}>>{
    return this.http.get("/api/research/researchers/search", {headers: this.tokenHeaders, params: { term: term, excludeSelf: excludeSelf }}).map(res => res.json())
  }

  makeAuthorizedRequestOptions(query: any): RequestOptions{
    return  new RequestOptions({ headers: this.tokenHeaders, params: query })
  }

  updateExperiment(experimentId: string, update: any): Observable<boolean>{
    return this.http.post("api/research/experiments/" + experimentId + "/update", update, this.authorizedOptions).map(res=>res.json().updated)
  }

  uploadClientBinary(file: File): Observable<boolean>{
    const formData: FormData = new FormData()
    formData.append("file", file, file.name)
    return this.http.post("api/research/clients/upload", formData, this.authorizedOptions).map(res=>res.json())
  }

  getClientBinaries(): Observable<Array<any>>{
    return this.http.get("api/clients/all").map(res=>res.json())
  }

  removeClientBinary(binaryId: string): Observable<boolean>{
    return this.http.delete("api/research/clients/" + binaryId, this.authorizedOptions)  .map(res => res.json())
  }
}
