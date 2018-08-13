import { ServiceBase } from './service-base';
import { Injectable, OnDestroy } from '@angular/core';
import { Http, Headers, RequestOptions, Response, ResponseContentType } from '@angular/http';
import { ResearcherAuthService } from './researcher.auth.service';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { filter, combineLatest, flatMap, map, tap, distinctUntilChanged } from 'rxjs/operators';
import { SocketService } from './socket.service';
import { ExperimentService } from './experiment.service';
import { SocketConstants } from '../../../omnitrack/core/research/socket';
import { NotificationService } from './notification.service';
import { ExampleExperimentInfo } from '../../../omnitrack/core/research/experiment';
import { IUsageLogDbEntity } from '../../../omnitrack/core/db-entity-types';
import { IClientSignatureDbEntity, IExperimentDbEntity } from '../../../omnitrack/core/research/db-entity-types';

@Injectable()
export class ResearchApiService extends ServiceBase {

  private tokenHeaders: Headers

  public authorizedOptions: RequestOptions

  private selectedExperimentId: string = null

  private readonly _selectedExperimentService = new BehaviorSubject<ExperimentService>(null)

  public readonly selectedExperimentService: Observable<ExperimentService> = this._selectedExperimentService.pipe(filter(s => s != null))

  get selectedExperimentServiceSync(): ExperimentService {
    return this._selectedExperimentService.getValue()
  }

  private readonly _experimentListSubject = new BehaviorSubject<Array<IExperimentDbEntity>>([])
  private readonly _userPoolSubject = new BehaviorSubject<Array<any>>([])

  constructor(private http: Http, private authService: ResearcherAuthService, private socketService: SocketService, private notificationService: NotificationService) {
    super()
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
      this.socketService.onServerReset.pipe(
        combineLatest(this.authService.tokenSubject, (socket, token) => ({ token: token, socket: socket })),
        filter(res => res.socket != null && res.token != null)
      ).subscribe(
        res => {
          console.log("server initialized with a new pair of socket and token")
          res.socket.emit(SocketConstants.SERVER_EVENT_SUBSCRIBE_SERVER_GLOBAL)
        }
      )
    )

    this._internalSubscriptions.add(
      this.socketService.onConnected
        .pipe(
          combineLatest(this.authService.tokenSubject, (socket, token) => ({ token: token, socket: socket })),
          filter(res => res.socket != null && res.token != null)
        )
        .subscribe(
          res => {
            console.log("socket connected with a new pair of socket and token")
            res.socket.on(SocketConstants.SERVER_EVENT_UPDATED_GLOBAL, (data) => {
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

            res.socket.on(SocketConstants.SOCKET_MESSAGE_UPDATED_RESEARCHER, (data) => {
              console.log("received update researcher socket event.")
              if (data instanceof Array) {
                data.forEach(datum => {
                  switch (datum.model) {
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

  // tslint:disable-next-line:use-life-cycle-interface
  ngOnDestroy() {
    this.socketService.socket.emit(SocketConstants.SERVER_EVENT_UNSUBSCRIBE_SERVER_GLOBAL)
    this.socketService.socket.removeListener(SocketConstants.SERVER_EVENT_UPDATED_GLOBAL)
    super.ngOnDestroy()
  }

  loadExperimentList() {
    this.notificationService.registerGlobalBusyTag("experimentInfo")
    this._internalSubscriptions.add(
      this.http.get('/api/research/experiments/all', this.authorizedOptions).pipe(map(res => res.json())).subscribe(
        list => {
          this.notificationService.unregisterGlobalBusyTag("experimentInfo")
          this._experimentListSubject.next(list)
        })
    )
  }

  loadUserPool() {
    this.notificationService.registerGlobalBusyTag("userPool")
    this._internalSubscriptions.add(
      this.http.get("/api/research/users/all", this.authorizedOptions).pipe(map(res => {
        return res.json()
      })).subscribe(
        list => {
          this.notificationService.unregisterGlobalBusyTag("userPool")
          this._userPoolSubject.next(list)
        }
      )
    )
  }

  getExperimentInfos(): Observable<Array<IExperimentDbEntity>> {
    return this._experimentListSubject.pipe(filter(res => res != null))
  }

  getExampleExperimentList(): Observable<Array<ExampleExperimentInfo>> {
    return this.http.get("/api/research/experiments/examples").pipe(map(res => { console.log(res.json()); return res.json() }))
  }

  addExampleExperimentAndGetId(key: string): Observable<string> {
    console.log(this.authorizedOptions)
    return this.http.post("/api/research/experiments/examples", { exampleKey: key }, this.authorizedOptions).pipe(
      map(res => res.json()),
      tap(res => { this.loadExperimentList() })
    )
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
    return this._userPoolSubject.pipe(filter(res => res != null))
  }

  deleteUserAccount(userId: string, removeData: boolean): Observable<boolean> {
    return this.http.delete('/api/research/users/' + userId, new RequestOptions({ headers: this.tokenHeaders, params: { removeData: removeData } }))
      .pipe(
        map(res => {
          return true
        }),
        tap(result => {
          if (result === true) {
          }
        })
      )
  }

  createExperiment(info: any): Observable<IExperimentDbEntity> {
    return this.http.post("/api/research/experiments/new", info, this.authorizedOptions)
      .pipe(map(res => {
        return res.json()
      }),
        tap((exp) => {
          if (this._experimentListSubject.value) {
            const list = this._experimentListSubject.value.slice()
            const matchIndex = list.findIndex(f => f._id === exp._id)
            if (matchIndex === -1) {
              list.push(exp)
            } else {
              list[matchIndex] = exp
            }
            this._experimentListSubject.next(list)
          } else {
            this.loadExperimentList()
          }
        })
      )
  }

  removeExperiment(experimentId: string): Observable<boolean> {
    return this.http.delete("/api/research/experiments/" + experimentId, this.authorizedOptions).pipe(
      map(res => res.json()),
      tap(success => {
        if (success === true) {
          if (this._experimentListSubject.value) {
            const list = this._experimentListSubject.value.slice()
            const matchIndex = list.findIndex(e => e._id === experimentId)
            if (matchIndex !== -1) {
              list.splice(matchIndex, 1)
              this._experimentListSubject.next(list)
            }
          }
        }
      })
    )
  }

  searchResearchers(term: string, excludeSelf): Observable<Array<{ _id: string, email: string, alias: string }>> {
    return this.http.get("/api/research/researchers/search", { headers: this.tokenHeaders, params: { term: term, excludeSelf: excludeSelf } }).pipe(map(res => res.json()))
  }

  makeAuthorizedRequestOptions(query: any): RequestOptions {
    return new RequestOptions({ headers: this.tokenHeaders, params: query })
  }

  updateExperiment(experimentId: string, update: any): Observable<boolean> {
    return this.http.post("api/research/experiments/" + experimentId + "/update", update, this.authorizedOptions).pipe(map(res => res.json().updated))
  }

  getAllResearchers(): Observable<Array<any>> {
    return this.http.get("api/research/researchers/all", this.authorizedOptions).pipe(map(res => res.json()))
  }

  setResearcherAccountApproval(researcherId: string, approvedStatus: boolean): Observable<boolean> {
    return this.http.post("api/research/researchers/" + researcherId + "/approve", { approved: approvedStatus }, this.authorizedOptions).pipe(map(res => res.json()))
  }

  uploadClientBinary(file: File, changelog: Array<string>): Observable<{ success: boolean, signatureUpdated: boolean }> {
    const formData: FormData = new FormData()
    formData.append("file", file, file.name)
    return this.http.post("api/research/clients/upload", formData, this.makeAuthorizedRequestOptions({ changelog: changelog })).pipe(map(res => res.json()))
  }

  getClientBinaries(experimentId?: string, platform?: string): Observable<Array<any>> {
    let query: any = { experimentId: experimentId }

    if (platform != null) {
      if (!query) {
        query = { platform: platform }
      } else { query.platform = platform }
    }

    return this.http.get("api/clients/all", new RequestOptions({ params: query })).pipe(map(res => res.json()))
  }

  removeClientBinary(binaryId: string): Observable<boolean> {
    return this.http.delete("api/research/clients/" + binaryId, this.authorizedOptions).pipe(map(res => res.json()))
  }

  publishClientBinary(binaryId: string): Observable<boolean> {
    return this.http.post("api/research/clients/" + binaryId + "/publish", {}, this.authorizedOptions).pipe(map(res => res.json()))
  }

  getMedia(trackerId: string, attributeLocalId: string, itemId: string, processingType: string /*"original" | "thumb" | "thumb_retina" */): Observable<Blob> {
    // :trackerId/:itemId/:attrLocalId/:fileIdentifier
    return this.http.get("api/research/files/item_media/" + trackerId + "/" + itemId + "/" + attributeLocalId + "/" + "0" + "/" + processingType, new RequestOptions({ headers: this.tokenHeaders, responseType: ResponseContentType.Blob }))
      .pipe(map((res: Response) => res.blob()));
  }

  // tslint:disable-next-line:no-shadowed-variable
  queryUsageLogsAnonymized(filter: any = null, from: string = null, to: string = null): Observable<Array<{ user: string, logs: Array<IUsageLogDbEntity> }>> {
    return this.http.get("/api/research/usage_logs", this.makeAuthorizedRequestOptions({
      filter: JSON.stringify(filter),
      from: from,
      to: to
    })).pipe(map(res => res.json()))
  }

  getClientSignatures(): Observable<Array<IClientSignatureDbEntity>> {
    return this.http.get("/api/research/signatures/all", this.authorizedOptions).pipe(map(res => res.json()))
  }

  removeClientSignature(id: string): Observable<boolean> {
    return this.http.delete("/api/research/signatures/" + id, this.authorizedOptions).pipe(map(res => res.json()))
  }

  upsertClientSignature(id: string = null, key: string, packageName: string, alias: string): Observable<boolean> {
    return this.http.post("/api/research/signatures/update", { _id: id, key: key, package: packageName, alias: alias }, this.authorizedOptions).pipe(map(res => res.json()))
  }

  loadInstantShareTrackingPackage(code: string): Observable<any> {
    return this.http.get('/api/research/package/temporary/' + code, this.authorizedOptions).pipe(
      map(res => res.json())
    )
  }
}
