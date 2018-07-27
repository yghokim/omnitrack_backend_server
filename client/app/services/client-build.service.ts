import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ServiceBase } from "./service-base";
import { ResearchApiService } from "./research-api.service";
import { IClientBuildConfigBase } from "../../../omnitrack/core/research/db-entity-types";
import { BehaviorSubject, Observable } from "rxjs";
import { filter, map, tap } from 'rxjs/operators';

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

  constructor(private api: ResearchApiService, private http: Http) {
    super()
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

  latestConfigOfPlatform(platform: string): Observable<IClientBuildConfigBase<any>> {
    return this.buildConfigsSubject.pipe(
      map(list => list.find(c => c.platform === platform))
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