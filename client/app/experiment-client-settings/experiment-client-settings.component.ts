import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClientBuildService } from '../services/client-build.service';
import { ResearchApiService } from '../services/research-api.service';
import { deepclone } from '../../../shared_lib/utils';
import deepEqual from 'deep-equal';
import { IClientBuildConfigBase } from '../../../omnitrack/core/research/db-entity-types';

interface ConfigState{
  isInitialized: boolean,

}

@Component({
  selector: 'app-experiment-client-settings',
  templateUrl: './experiment-client-settings.component.html',
  styleUrls: ['./experiment-client-settings.component.scss'],
  providers: [ClientBuildService]
})
export class ExperimentClientSettingsComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  public supportedPlatforms = [{
    platform: "Android",
    isLoading: true,
    isInitialized: false,
    originalConfig: null,
    changedConfig: null,
    localFiles: {}
  }]

  constructor(private api: ResearchApiService, private clientBuildService: ClientBuildService) {

  }

  ngOnInit() {
    this.clientBuildService.initialize(this.api.getSelectedExperimentId())
    this.supportedPlatforms.forEach(platform => {
      this._internalSubscriptions.add(
        this.clientBuildService.latestConfigOfPlatform(platform.platform).subscribe(
          config => {
            platform.isLoading = false
            if(config){
              platform.isInitialized = true
              platform.originalConfig = config
              platform.changedConfig = deepclone(config)
            }else{
              platform.isInitialized = false
              platform.originalConfig = null
              platform.changedConfig = null
            }
          }
        )
      )
    })
    
  }

  matchPlatforms(index: number, platformEntry: any){
    return platformEntry.platform
  }

  onInitializeClicked(p){
    p.isLoading = true
    this._internalSubscriptions.add(
      this.clientBuildService.initializePlatformDefault(p.platform).subscribe(

      )
    )
  }

  onSaveClicked(p){
    p.isLoading = true

    const files = []
    for(let key of Object.keys(p.localFiles)){
      if(p.localFiles.key){
        files.push({key: key, file: p.localFiles.key})
      }
    }

    this._internalSubscriptions.add(
      this.clientBuildService.updateConfig(p.changedConfig, files).subscribe(
        ()=>{

        },
        err=>{

        },
        ()=>{
          p.isLoading = false
        }
      )
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  isConfigChanged(originalConfig: IClientBuildConfigBase<any>, changedConfig: IClientBuildConfigBase<any>): boolean{
    return !deepEqual(originalConfig, changedConfig)
  }

}