import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ServiceBase } from "./service-base";
import { ResearchApiService } from "./research-api.service";
import { IClientBuildConfigBase } from "../../../omnitrack/core/research/db-entity-types";
import { BehaviorSubject, Observable } from "rxjs";
import { filter, map, tap, catchError } from 'rxjs/operators';
import { ClientBuildStatus, SocketConstants } from '../../../omnitrack/core/research/socket';
import { SocketService } from './socket.service';

@Injectable()
export class ClientBuildService extends ServiceBase {

  private _currentExperimentId: string

  private _buildConfigBehaviorSubject = new BehaviorSubject<Array<IClientBuildConfigBase<any>>>(null)
  public get buildConfigsSubject(): Observable<Array<IClientBuildConfigBase<any>>> {
    return this._buildConfigBehaviorSubject.pipe(filter(l => l != null))
  }
  public get currentExperimentId(): string { return this._currentExperimentId }
  public get clientBuildConfigs(): Array<IClientBuildConfigBase<any>> {
    return this._buildConfigBehaviorSubject.value
  }

  private _buildStatusBehaviorSubject = new BehaviorSubject<Array<ClientBuildStatus>>(null)
  public get buildStatusSubject(): Observable<Array<ClientBuildStatus>> {
    return this._buildStatusBehaviorSubject.pipe(filter(l => l != null))
  }

  private readonly socketListener = (data: ClientBuildStatus) => {
    console.log(data)
    if (data.experimentId === this._currentExperimentId) {
      if (this._buildStatusBehaviorSubject.value) {
        const arr = this._buildStatusBehaviorSubject.value.slice()
        const matchIndex = arr.findIndex(e => e.configId === data.configId)
        if (matchIndex === -1) {
          arr.push(data)
        } else {
          arr[matchIndex] = data
        }
        this._buildStatusBehaviorSubject.next(arr)
      } else {
        this._buildStatusBehaviorSubject.next([data])
      }
    }
  }

  constructor(private api: ResearchApiService, private http: Http, private socketService: SocketService) {
    super()

    this._internalSubscriptions.add(
      socketService.onConnected.subscribe(socket => {
        socket.on(SocketConstants.SOCKET_MESSAGE_CLIENT_BUILD_STATUS, this.socketListener)
      })
    )
  }

  ngOnDestroy(){
    super.ngOnDestroy()
    this.socketService.socket.off(SocketConstants.SOCKET_MESSAGE_CLIENT_BUILD_STATUS, this.socketListener)
  }

  initialize(experimentId: string) {
    if (this._currentExperimentId !== experimentId) {
      this._currentExperimentId = experimentId
      this._buildConfigBehaviorSubject.next(null)
      this.reloadBuildConfigs()
    }
  }

  reloadBuildConfigs() {
    this._internalSubscriptions.add(
      this.http.get("/api/research/experiments/" + this._currentExperimentId + "/client_build_configs", this.api.authorizedOptions).pipe(map(res => res.json())).subscribe(
        result => {
          this._buildConfigBehaviorSubject.next(result)
        }
      ))
  }

  reloadBuildStatus() {
    this._internalSubscriptions.add(
      this.http.get("/api/research/experiments/" + this._currentExperimentId + "/client_build_configs/build/status", this.api.authorizedOptions).pipe(map(res => res.json())).subscribe(
        result => {
          this._buildStatusBehaviorSubject.next(result)
        }
      )
    )
  }

  latestConfigOfPlatform(platform: string): Observable<IClientBuildConfigBase<any>> {
    return this.buildConfigsSubject.pipe(
      map(list => list.find(c => c.platform === platform))
    )
  }

  latestBuildStatusOfPlatform(platform: string): Observable<Array<ClientBuildStatus>>{
    return this.buildStatusSubject.pipe(
      map(list => list.filter(l => l.platform === platform))
    )
  }

  initializePlatformDefault(platform: string): Observable<IClientBuildConfigBase<any>> {
    return this.http.post("/api/research/experiments/" + this._currentExperimentId + "/client_build_configs/initialize", { platform: platform }, this.api.authorizedOptions).pipe(map(res => res.json()), tap(newConfig => {
      const newArray = this.clientBuildConfigs.slice()
      const matchIndex = newArray.findIndex(c => c.platform === platform)
      if (matchIndex !== -1) {
        newArray[matchIndex] = newConfig
      } else {
        newArray.push(newConfig)
      }
      this._buildConfigBehaviorSubject.next(newArray)
    }))
  }

  updateConfig(config: IClientBuildConfigBase<any>, files: Array<{ key: string, file: File }> = []): Observable<IClientBuildConfigBase<any>> {

    let body
    if (files && files.length > 0) {
      const formData: FormData = new FormData()
      files.forEach(fileEntry => {
        formData.append(fileEntry.key, fileEntry.file, fileEntry.file.name)
        formData.append("fileKeys[]", fileEntry.key)
      })
      formData.set("config", JSON.stringify(config))
      body = formData
    } else {
      body = { config: config }
    }

    return this.http.post("/api/research/experiments/" + this._currentExperimentId + "/client_build_configs", body, this.api.authorizedOptions).pipe(
      map(res => res.json()),
      tap(uploadedConfig => {
        this.replaceNewConfigWithId(uploadedConfig)
      })
    )
  }

  startBuild(config: IClientBuildConfigBase<any>, force: boolean = false): Observable<boolean> {
    return this.http.post("/api/research/experiments/" + this._currentExperimentId + "/client_build_configs/build", { configId: config._id, force: force}, this.api.authorizedOptions).pipe(
      map(res => res.json()),
      catchError(err=> {throw err.json()})
    )
  }

  cancelBuild(config: IClientBuildConfigBase<any>): Observable<string>{
    return this.http.post("/api/research/experiments/" + this._currentExperimentId + "/client_build_configs/build/cancel", {configId: config._id}, this.api.authorizedOptions).pipe(
      map(res => res.json()),
      tap(applied => {
        if(applied === true){
          this.reloadBuildStatus()
        }
      })  
    )
  }

  private replaceNewConfigWithId(newConfig: IClientBuildConfigBase<any>) {
    const newArray = this.clientBuildConfigs.slice()
    const matchIndex = newArray.findIndex(c => c._id === newConfig._id)
    if (matchIndex !== -1) {
      newArray[matchIndex] = newConfig
    } else {
      newArray.push(newConfig)
    }
    this._buildConfigBehaviorSubject.next(newArray)
  }

}