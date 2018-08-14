import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { ClientBuildService } from '../../services/client-build.service';
import { Subscription, empty, of, defer, Observable } from 'rxjs';
import { tap, flatMap } from 'rxjs/operators';
import { EClientBuildStatus } from '../../../../omnitrack/core/research/socket';
import { deepclone, parseProperties } from '../../../../shared_lib/utils';
import deepEqual from 'deep-equal';
import { IClientBuildConfigBase, APP_THIRD_PARTY_KEYSTORE_KEYS } from '../../../../omnitrack/core/research/db-entity-types';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../dialogs/yes-no-dialog/yes-no-dialog.component';

@Component({
  selector: 'app-platform-config-panel',
  templateUrl: './platform-config-panel.component.html',
  styleUrls: ['./platform-config-panel.component.scss']
})
export class PlatformConfigPanelComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  public panelStep = 1

  public platform: string = null

  public originalConfig: IClientBuildConfigBase<any>
  public changedConfig: IClientBuildConfigBase<any>

  public isLoading = true
  public isInitialized = false
  public selectedNewApiKey: string = null
  public newApiKeyValue: string = null
  public isBuilding = undefined
  public localFiles: any = {}

  public isLoadingBinaries = true
  public binaries: Array<any>

  @Input("platform") set _platform(platform: string) {
    if (this.platform !== platform) {
      this.platform = platform
      this._internalSubscriptions.add(
        this.clientBuildService.latestConfigOfPlatform(platform).subscribe(
          config => {
            this.isLoading = false
            if (config) {
              this.isInitialized = true
              this.originalConfig = config
              this.changedConfig = deepclone(config)
            } else {
              this.isInitialized = false
              this.originalConfig = null
              this.changedConfig = null
            }
          }
        )
      )

      this._internalSubscriptions.add(
        this.clientBuildService.latestBuildStatusOfPlatform(this.platform).subscribe(
          statusList => {
            console.log(statusList)
            if (statusList.find(s => s.status === EClientBuildStatus.BUILDING)) {
              this.isBuilding = true
            } else {
              this.isBuilding = false
              this.reloadBinaries()
            }
          }
        )
      )

      this.reloadBinaries()
    }
  }

  constructor(private api: ResearchApiService, public clientBuildService: ClientBuildService, private dialog: MatDialog) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }


  onClosedPanel(index: number) {
    if (index === 0) {
      this.panelStep = 1
    } else { this.panelStep = 0 }
  }

  private reloadBinaries() {
    this.isLoadingBinaries = true
    this._internalSubscriptions.add(
      this.api.getClientBinaries(this.clientBuildService.currentExperimentId, this.platform).subscribe(
        binaryGroup => {
          console.log(binaryGroup)
          if (binaryGroup != null && binaryGroup.length > 0) {
            const group = binaryGroup.find(g => g._id === this.platform)
            if (group) {
              this.binaries = group.binaries
            }
          }
        },
        err => {

        },
        () => {
          this.isLoadingBinaries = false
          if (!this.binaries || this.binaries.length === 0) {
            this.panelStep = 0
          }
        }
      )
    )
  }

  matchPlatforms(index: number, platformEntry: any) {
    return platformEntry
  }

  onInitializeClicked(p) {
    this.isLoading = true
    this._internalSubscriptions.add(
      this.clientBuildService.initializePlatformDefault(this.platform).subscribe(

      )
    )
  }

  onDiscardChangedClicked() {
    this.localFiles = {}
    this.changedConfig = deepclone(this.originalConfig)
    $('input[type="file"]').val('')
  }

  onSaveClicked() {
    this.isLoading = true
    this._internalSubscriptions.add(
      this.applyChanges().subscribe(
        () => {

        },
        err => {

        },
        () => {
          this.isLoading = false
        }
      )
    )
  }

  private applyChanges(): Observable<IClientBuildConfigBase<any>> {
    return defer(() => {
      const files = []
      for (const key of Object.keys(this.localFiles)) {
        if (this.localFiles[key]) {
          files.push({ key: key, file: this.localFiles[key] })
        }
      }
      this.localFiles = {}
      return this.clientBuildService.updateConfig(this.changedConfig, files)
    })
  }

  isConfigChanged(originalConfig: IClientBuildConfigBase<any>, changedConfig: IClientBuildConfigBase<any>): boolean {
    return !deepEqual(originalConfig, changedConfig)
  }

  getOriginalApiKeyValue(key: string): string {
    if (this.originalConfig.apiKeys) {
      const match = this.originalConfig.apiKeys.find(e => e.key === key)
      if (match) {
        return match.value
      } else { return null }
    } else { return null }
  }

  getSelectableApiKeyKeys(): Array<string> {
    if (this.changedConfig.apiKeys && this.changedConfig.apiKeys.length > 0) {
      const keys = APP_THIRD_PARTY_KEYSTORE_KEYS.slice()
      this.changedConfig.apiKeys.forEach(entry => {
        const index = keys.indexOf(entry.key)
        if (index !== -1) {
          keys.splice(index, 1)
        }
      })
      return keys
    } else { return APP_THIRD_PARTY_KEYSTORE_KEYS }
  }

  onSelectedNewApiKeyChanged(key: string) {
    this.selectedNewApiKey = key
  }

  onAddApiKeyClicked() {
    if (this.selectedNewApiKey) {
      const newEntry = { key: this.selectedNewApiKey.toString(), value: this.newApiKeyValue ? this.newApiKeyValue.toString() : null }
      if (this.changedConfig.apiKeys) {
        const matchIndex = this.changedConfig.apiKeys.findIndex(e => e.key === newEntry.key)
        if (matchIndex === -1) {
          this.changedConfig.apiKeys.push(newEntry)
        } else {
          this.changedConfig.apiKeys[matchIndex].value = newEntry.value
        }
      } else {
        this.changedConfig.apiKeys = [newEntry]
      }
      this.selectedNewApiKey = null
      this.newApiKeyValue = null

      console.log(this.changedConfig.apiKeys)
    }
  }

  onApiKeyPropertiesFileChanged(files: Array<File>) {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const properties = parseProperties((e as any).target.result)

        const keys = Object.keys(properties)
        if (keys.length > 0) {
          if (!this.changedConfig.apiKeys) {
            this.changedConfig.apiKeys = []
          }

          for (const key of keys) {
            const matchIndex = this.changedConfig.apiKeys.findIndex(a => a.key === key)
            if (matchIndex === -1) {
              this.changedConfig.apiKeys.push({ key: key, value: properties[key] })
            } else {
              this.changedConfig.apiKeys[matchIndex].value = properties[key]
            }
          }
        }
      } catch (e) {
        console.log(e)
      }
    }
    fileReader.readAsText(files[0])
  }

  onStartBuildClicked() {
    if (this.isBuilding === false) {
      this.isLoading = true
      this._internalSubscriptions.add(
        defer(() => {
          if (this.isConfigChanged(this.originalConfig, this.changedConfig) === true) {
            // apply change first
            return this.applyChanges()
          } else { return of(null) }
        }).pipe(
          flatMap(() => this.clientBuildService.startBuild(this.originalConfig))
        ).subscribe(
          () => {
            this.isBuilding = true
          },
          (err) => {
            console.log(err)
            if (err.code === EClientBuildStatus.FAILED) {
              this._internalSubscriptions.add(
                this.dialog.open(YesNoDialogComponent, {
                  data: {
                    title: "Warning",
                    message: "You have already been failed with the same configuration. Do you want to start build anyway?", positiveLabel: "Build Anyway", positiveColor: "primary", negativeColor: "accent", negativeLabel: "Cancel"
                  }
                }).afterClosed().pipe(
                  tap(yes => {
                    if (yes === true) {
                      this.isLoading = true
                    }
                  }),
                  flatMap(yes => {
                    if (yes === true) {
                      return this.clientBuildService.startBuild(this.originalConfig, true)
                    } else { return empty() }
                  })
                ).subscribe(() => { }, () => { }, () => { this.isLoading = false })
              )
            }
          },
          () => {
            this.isLoading = false
          }
        )
      )
    } else {
      this._internalSubscriptions.add(
        this.dialog.open(YesNoDialogComponent, {
          data: {
            title: "Cancel build",
            message: "Do you want to cancel the build process?", positiveLabel: "Cancel Build", positiveColor: "warn", negativeColor: "primary", negativeLabel: "No"
          }
        }).afterClosed().pipe(
          flatMap(yes => {
            if (yes === true) {
              return this.clientBuildService.cancelBuild(this.originalConfig)
            } else { return empty() }
          })
        ).subscribe()
      )
    }
  }
}
