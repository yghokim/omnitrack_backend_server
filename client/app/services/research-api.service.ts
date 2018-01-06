import { Injectable, OnDestroy } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { ResearcherAuthService } from './researcher.auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/publishReplay';
import { SocketService } from './socket.service';
import ExperimentInfo from '../models/experiment-info';
import { ExperimentService } from './experiment.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { SocketConstants } from '../../../omnitrack/core/research/socket';

@Injectable()
export class ResearchApiService implements OnDestroy {

  private tokenHeaders: Headers

  public authorizedOptions: RequestOptions

  private selectedExperimentId: string = null

  public readonly selectedExperimentService = new BehaviorSubject<ExperimentService>(null)

  private readonly _experimentListSubject = new BehaviorSubject<Array<ExperimentInfo>>([])
  private readonly _userPoolSubject = new BehaviorSubject<Array<any>>([])

  constructor(private http: Http, private authService: ResearcherAuthService, private socketService: SocketService) {

    this.authService.tokenSubject.subscribe(token => {
      if (token) {
        console.log(token)
        this.tokenHeaders = new Headers({ 'Authorization': 'Bearer ' + token });
        this.authorizedOptions = new RequestOptions({ headers: this.tokenHeaders });

        this.loadExperimentInfo()
        this.loadUserPool()
      }
    })

    this.socketService.onConnected.flatMap( socket => 
      this.authService.tokenSubject.map(token => {return {token: token, socket: socket}})
    ).subscribe(
      res => {
        res.socket.emit(SocketConstants.SERVER_EVENT_SUBSCRIBE_SERVER_GLOBAL)

        res.socket.on(SocketConstants.SERVER_EVENT_UPDATED_GLOBAL, (data) => {
          console.log(data)
          if(data instanceof Array){
            data.forEach(datum => {
              switch(datum.model){
                case SocketConstants.MODEL_USER:
                  this.loadUserPool()
                break;
              }
            })
          }
        })
      }
    )
  }

  ngOnDestroy(){
    this.socketService.socket.emit(SocketConstants.SERVER_EVENT_UNSUBSCRIBE_SERVER_GLOBAL)
    this.socketService.socket.removeListener(SocketConstants.SERVER_EVENT_UPDATED_GLOBAL)
  }

  loadExperimentInfo() {
    this.http.get('/api/research/experiments/all', this.authorizedOptions).flatMap(res => {
      return this.authService.currentResearcher.map(researcher => {
        return res.json().map(
          exp => {
            const info = new ExperimentInfo()
            info.id = exp._id
            info.name = exp.name
            info.isAdmin = exp.manager === researcher.uid
            return info
          }
        )
      })
    }).subscribe(
      list => {
        this._experimentListSubject.next(list)
      })
  }

  loadUserPool() {
    this.http.get("/api/research/users/all", this.authorizedOptions).map(res => {
      return res.json()
    }).subscribe(
      list => 
      {
        this._userPoolSubject.next(list)
      }
    )
  }

  getExperimentInfos(): Observable<Array<ExperimentInfo>> {
    return this._experimentListSubject.filter(res => res != null)
  }

  getSelectedExperimentId(): string {
    return this.selectedExperimentId
  }

  setSelectedExperimentId(id: string) {
    if (this.selectedExperimentId !== id) {
      if (this.selectedExperimentService.value) {
        this.selectedExperimentService.value.dispose()
      }
      this.selectedExperimentId = id
      this.selectedExperimentService.next(new ExperimentService(this.selectedExperimentId, this.http, this.authService, this, this.socketService))
    }
  }

  getUserPool(): Observable<Array<any>> {
    return this._userPoolSubject.filter(res => res != null)
  }

  deleteUserAccount(userId: string, removeData: boolean): Observable<boolean> {
    return this.http.delete('/api/research/users/' + userId, new RequestOptions({ headers: this.tokenHeaders, params: { removeData: removeData } }))
      .map(res => {
        console.log(res.json())
        return true
      }).do(result => {
        if (result === true) {
        }
      })
  }
}
