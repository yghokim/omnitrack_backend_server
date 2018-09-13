import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServiceBase } from "./service-base";
import { ResearchApiService } from "./research-api.service";
import { IClientBuildConfigBase } from "../../../omnitrack/core/research/db-entity-types";
import { BehaviorSubject, Observable } from "rxjs";
import { filter, map, tap, catchError } from 'rxjs/operators';
import { ClientBuildStatus, SocketConstants } from '../../../omnitrack/core/research/socket';
import { SocketService } from './socket.service';

@Injectable()
export class ClientBuildService extends ServiceBase {

  private _researcherMode: boolean = false
  private _currentExperimentId: string

  private _buildConfigBehaviorSubject = new BehaviorSubject<Array<IClientBuildConfigBase<any>>>(null)
  public get buildConfigsSubject(): Observable<Array<IClientBuildConfigBase<any>>> {
    return this._buildConfigBehaviorSubject.pipe(filter(l => l != null))
  }
  public get currentExperimentId(): string { return this._currentExperimentId }
  public get clientBuildConfigs(): Array<IClientBuildConfigBase<any>> {
    return this._buildConfigBehaviorSubject.value
  }

  public get researcherMode(): boolean { return this._researcherMode }

  private readonly _initializedSubject = new BehaviorSubject<boolean>(false)
  public get isInitialized(): Observable<boolean> { return this._initializedSubject }

  private readonly _buildStatusBehaviorSubject = new BehaviorSubject<Array<ClientBuildStatus>>(null)
  public get buildStatusSubject(): Observable<Array<ClientBuildStatus>> {
    return this._buildStatusBehaviorSubject.pipe(filter(l => l != null))
  }

  private readonly socketListener = (data: ClientBuildStatus) => {
    if ((this.researcherMode === false && data.experimentId === this._currentExperimentId) || (this.researcherMode === true && data.researcherMode === true)) {
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

  constructor(private api: ResearchApiService, private http: HttpClient, private socketService: SocketService) {
    super()

    this._internalSubscriptions.add(
      socketService.onConnected.subscribe(socket => {
        socket.on(SocketConstants.SOCKET_MESSAGE_CLIENT_BUILD_STATUS, this.socketListener)
      })
    )
  }

  // tslint:disable-next-line:use-life-cycle-interface
  ngOnDestroy() {
    super.ngOnDestroy()
    this.socketService.socket.off(SocketConstants.SOCKET_MESSAGE_CLIENT_BUILD_STATUS, this.socketListener)
  }

  initializeExperimentMode(experimentId: string) {
    if (this._currentExperimentId !== experimentId) {
      this._currentExperimentId = experimentId
      this._buildConfigBehaviorSubject.next(null)
      this.reloadBuildConfigs()
      this._initializedSubject.next(true)
    }
  }

  initializeResearcherMode() {
    if (this._researcherMode === false) {
      this._researcherMode = true
      this._buildConfigBehaviorSubject.next(null)
      this.reloadBuildConfigs()
      this._initializedSubject.next(true)
    }
  }

  reloadBuildConfigs() {
    this._internalSubscriptions.add(
      this.http.get<Array<IClientBuildConfigBase<any>>>("/api/research/build/configs/all" + (this.researcherMode === true ? "" : ("/" + this._currentExperimentId)), this.api.authorizedOptions).subscribe(
        result => {
          this._buildConfigBehaviorSubject.next(result)
        },
        err => {
          console.error("BuildConfig loading error:")
          console.error(err)
        }
      ))
  }

  reloadBuildStatus() {
    this._internalSubscriptions.add(
      this.http.get<ClientBuildStatus[]>("/api/research/build/status",
        this.researcherMode === true ? this.api.authorizedOptions : this.api.makeAuthorizedRequestOptions({ experimentId: this._currentExperimentId })
      ).subscribe(
        result => {
          this._buildStatusBehaviorSubject.next(result)
        },
        err => {
          console.error("Build Status loading error:")
          console.error(err)
        }
      )
    )
  }

  latestConfigOfPlatform(platform: string): Observable<IClientBuildConfigBase<any>> {
    return this.buildConfigsSubject.pipe(
      map(list => list.find(c => c.platform === platform))
    )
  }

  latestBuildStatusOfPlatform(platform: string): Observable<Array<ClientBuildStatus>> {
    return this.buildStatusSubject.pipe(
      map(list => list.filter(l => l.platform === platform))
    )
  }

  initializePlatformDefault(platform: string): Observable<IClientBuildConfigBase<any>> {
    return this.http.post<IClientBuildConfigBase<any>>("/api/research/build/configs/initialize", {
      platform: platform,
      experimentId: (this.researcherMode === true ? null : this._currentExperimentId)
    }, this.api.authorizedOptions).pipe(tap(newConfig => {
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

    return this.http.post<IClientBuildConfigBase<any>>("/api/research/build/configs/update" + (config.researcherMode===true? "" : "/" + config.experiment) , body, this.api.authorizedOptions).pipe(
      tap(uploadedConfig => {
        this.replaceNewConfigWithId(uploadedConfig)
      })
    )
  }

  validateSignature(config: IClientBuildConfigBase<any>): Observable<string> {
    return this.http.get<string>("/api/research/build/configs/" + config._id + "/validate_signature", this.api.makeAuthorizedRequestOptions(null, 'text')).pipe(
      tap(res => {
        console.log(res)
      })
    )
  }

  generateJavaKeystore(args: any): Observable<Blob> {
    return this.http.post<Blob>("/api/research/build/generate_keystore", args, this.api.makeAuthorizedRequestOptions(null, 'blob'))
  }

  startBuild(config: IClientBuildConfigBase<any>, force: boolean = false): Observable<boolean> {
    return this.http.post<boolean>("/api/research/build/start", {
      configId: config._id,
      force: force
    }, this.api.authorizedOptions).pipe(
      tap((buildSuccess) => {
        if (buildSuccess === true) {
          this.reloadBuildStatus()
        }
      })
    )
  }

  cancelBuild(config: IClientBuildConfigBase<any>): Observable<boolean> {
    return this.http.post<boolean>("/api/research/build/cancel", {
      configId: config._id
    }, this.api.authorizedOptions).pipe(
      tap(applied => {
        if (applied === true) {
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