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
import { validateBuildConfig } from '../../../../omnitrack/core/research/build-config-utils';
import { NotificationService } from '../../services/notification.service';
import { SignatureValidationCompleteDialogComponent } from './signature-validation-complete-dialog/signature-validation-complete-dialog.component';
import { CreateNewJavaKeystoreDialogComponent } from './create-new-java-keystore-dialog/create-new-java-keystore-dialog.component';

@Component({
  selector: 'app-platform-config-panel',
  templateUrl: './platform-config-panel.component.html',
  styleUrls: ['./platform-config-panel.component.scss']
})
export class PlatformConfigPanelComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  public researcherMode: boolean = null

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

  public validationErrors: Array<{ key: string, message: string }>

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

  constructor(private api: ResearchApiService, public clientBuildService: ClientBuildService, private dialog: MatDialog, private notificationService: NotificationService) { }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.clientBuildService.isInitialized.subscribe(
        initialized => {
          if(initialized === true){
            if(this.clientBuildService.researcherMode === true){
              this.researcherMode = true
            }else this.researcherMode = false
          }
        }
      )
    )
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
        () => {
          this.validateConfig()
        }
      )
    )
  }

  onDiscardChangedClicked() {
    this.localFiles = {}
    this.changedConfig = deepclone(this.originalConfig)
    $('input[type="file"]').val('')
    this.validateConfig()
  }

  onSaveClicked() {
    this.isLoading = true
    this._internalSubscriptions.add(
      this.applyChanges().subscribe(
        () => {
          this.validateConfig()
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

  onCreateNewKeystoreClicked(){
    this.dialog.open(CreateNewJavaKeystoreDialogComponent, {data:{
      clientBuildService: this.clientBuildService
    }})
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

  validateConfig(): boolean {
    const errors = validateBuildConfig(this.originalConfig)
    this.validationErrors = errors
    return !errors || errors.length === 0
  }

  getValidationError(key: string): string {
    if (this.validationErrors) {
      const match = this.validationErrors.find(v => v.key === key)
      if (match) {
        return match.message
      } else return null
    } else {
      return null
    }
  }

  onValidateSignatureClicked(){
    this._internalSubscriptions.add(
      defer(()=>{
        if(this.isConfigChanged(this.originalConfig, this.changedConfig) === true){
          return this.applyChanges()
        }else return of(null)
      }).pipe(
        flatMap(()=>{
          return this.clientBuildService.validateSignature(this.originalConfig)
        }),
        tap(signature=>{
          this.validateConfig()
        })
      ).subscribe(signature => {
        this.dialog.open(SignatureValidationCompleteDialogComponent, {data: {
          packageName: this.originalConfig.packageName,
          signature: signature
        }})
      }, err => {
        console.log(err)
        if(err.code === "KeystoreError"){
          this.notificationService.pushSnackBarMessage({
            message: err.message
          })
        }else if(err.code === "IncompleteKeystoreInformation"){
          this.notificationService.pushSnackBarMessage({
            message: err.message
          })
        }
      })
    )
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
          flatMap(() => {
            if (this.validateConfig() === true) {
              return this.clientBuildService.startBuild(this.originalConfig)
            } else {
              throw { code: "ValidationFailed" }
            }
          })
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
            } else if (err.code === "ValidationFailed") {
              console.log(this.validationErrors)
              this.notificationService.pushSnackBarMessage({
                message: "Configuration is not valid or incomplete."
              })
              this.isLoading = false
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
