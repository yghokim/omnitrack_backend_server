import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, of } from "rxjs";
import { filter, flatMap } from 'rxjs/operators';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { ResearchApiService } from '../services/research-api.service';
import { MatDialog } from '@angular/material';
import { UploadClientBinaryDialogComponent } from './upload-client-binary-dialog/upload-client-binary-dialog.component';
import { NotificationService } from '../services/notification.service';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';
import { IClientSignatureDbEntity } from '../../../omnitrack/core/research/db-entity-types';
import { UpdateClientSignatureDialogComponent } from './update-client-signature-dialog/update-client-signature-dialog.component';
import { ClientBuildService } from '../services/client-build.service';
import { deepclone } from '../../../shared_lib/utils';

@Component({
  selector: 'app-server-settings',
  templateUrl: './server-settings.component.html',
  styleUrls: ['./server-settings.component.scss'],
  providers: [ClientBuildService]
})
export class ServerSettingsComponent implements OnInit, OnDestroy {

  public readonly supportedPlatforms = ["Android"]

  private readonly internalSubscriptions = new Subscription()

  clientSignatures: Array<IClientSignatureDbEntity>

  myId: string

  researchers: Array<any>

  isLoadingSignatures: boolean = true
  isLoadingResearchers: boolean = true

  constructor(
    private auth: ResearcherAuthService,
    private api: ResearchApiService,
    private clientBuildService: ClientBuildService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {

    this.clientBuildService.initializeResearcherMode();
    this.clientBuildService.reloadBuildStatus();

    this.internalSubscriptions.add(
      this.auth.currentResearcher.subscribe(
        researcher => {
          this.myId = researcher.uid
          console.log("my id: " + this.myId)
        }
      )
    )

    this.reloadSignatures()
    this.reloadResearchers()
  }

  private reloadSignatures() {
    this.isLoadingSignatures = true
    this.internalSubscriptions.add(
      this.api.getClientSignatures().subscribe(
        signatures => {
          this.clientSignatures = signatures
          this.isLoadingSignatures = false
        }
      )
    )
  }

  private reloadResearchers() {
    this.isLoadingResearchers = true
    this.internalSubscriptions.add(
      this.api.getAllResearchers().subscribe(
        researchers => {
          this.researchers = researchers
          this.isLoadingResearchers = false
        }
      )
    )
  }

  ngOnDestroy(): void {
    this.internalSubscriptions.unsubscribe()
  }

  onSetResearcherApprovedStatus(researcherId: string, status: boolean) {
    this.internalSubscriptions.add(
      this.api.setResearcherAccountApproval(researcherId, status).subscribe(
        changed => {
          console.log(changed)
          if (changed === true) {
            console.log("reload researchers")
            this.reloadResearchers()
          }
        }
      )
    )
  }

  onUploadClicked() {
    this.internalSubscriptions.add(
      this.dialog.open(UploadClientBinaryDialogComponent, { data: {} }).afterClosed().pipe(
        filter(r => r),
        flatMap(
          result => {
            return this.api.uploadClientBinary(result.file, result.changelog)
          }
        )
      ).subscribe(
        result => {
          //this.reloadClientBinaries()
          console.log("upload client: " + result)
          if (result.signatureUpdated === true) {
            this.reloadSignatures()
          }
        }, error => {
          console.log(error)
          switch (error.error.error) {
            case "InvalidPackage":
              this.notificationService.pushSnackBarMessage({ message: "The file is not a valid client installation file." })
              break;
            case "FileAlreadyExists":
              this.notificationService.pushSnackBarMessage({ message: "The file is already registered in the server." })
              break;
            default:
              this.notificationService.pushSnackBarMessage({ message: "The file was not registered because of the server error." })
              break;
          }
        }
      )
    )
  }


  onRemoveSignatureClicked(signatureId: string) {
    this.internalSubscriptions.add(
      this.dialog.open(YesNoDialogComponent, { data: { title: "Remove Signature", message: "Do you want to remove this signature?<br>Currently used clients with this signature will not be synchronized with this server.", positiveLabel: "Delete", positiveColor: "warn", negativeColor: "primary" } }).beforeClose().pipe(
        filter(confirm => confirm === true),
        flatMap(() =>
          this.api.removeClientSignature(signatureId))
      ).subscribe(
        changed => {
          if (changed === true) {
            const index = this.clientSignatures.findIndex(i => i._id === signatureId)
            if (index != -1) {
              this.clientSignatures.splice(index, 1)
            }
          }
        }
      )
    )
  }

  onEditSignatureClicked(signatureId: string) {
    var data = {}
    if (signatureId) {
      data = deepclone(this.clientSignatures.find(s => s._id === signatureId))
    }

    this.internalSubscriptions.add(

      this.api.getExperimentInfos().pipe(
        flatMap(experiments => {
          data["experiments"] = experiments
          return this.dialog.open(UpdateClientSignatureDialogComponent, {
            data: data
          }).beforeClose()
        }),
        flatMap(result => {
          if (result) {
            return this.api.upsertClientSignature(signatureId, result.key, result.package, result.alias, result.experiment)
          }
          else {
            return of(false)
          }
        })
      )
        .subscribe(
          changed => {
            if (changed === true) {
              this.reloadSignatures()
            }
          }
        )
    )
  }

  matchBinaryItem(index, binary: any) {
    if (binary == null) {
      return null
    } else return binary.version
  }

  matchBinaryGroup(index, group: any) {
    if (group == null) {
      return null
    } else return group._id
  }

}
