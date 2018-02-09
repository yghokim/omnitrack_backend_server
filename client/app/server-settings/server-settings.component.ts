import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from "rxjs/Subscription";
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { ResearchApiService } from '../services/research-api.service';
import { MatDialog } from '@angular/material';
import { UploadClientBinaryDialogComponent } from './upload-client-binary-dialog/upload-client-binary-dialog.component';
import { NotificationService } from '../services/notification.service';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';

@Component({
  selector: 'app-server-settings',
  templateUrl: './server-settings.component.html',
  styleUrls: ['./server-settings.component.scss']
})
export class ServerSettingsComponent implements OnInit, OnDestroy {

  private readonly internalSubscriptions = new Subscription()
  selectedOperatingSystemIndex: number = 0
  binaryGroupList: Array<{_id: string, binaries: Array<any>}>

  myId: string

  researchers: Array<any>

  constructor(
    private auth: ResearcherAuthService,
    private api: ResearchApiService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.internalSubscriptions.add(
      this.auth.currentResearcher.subscribe(
        researcher=>{
          this.myId = researcher.uid
          console.log("my id: " + this.myId)
        }
      )
    )

    this.reloadClientBinaries()
    this.reloadResearchers()
  }

  private reloadClientBinaries() {
    this.internalSubscriptions.add(
      this.api.getClientBinaries().subscribe(
        binaryGroups => {
          console.log(binaryGroups)
          this.binaryGroupList = binaryGroups
        }
      )
    )
  }

  private reloadResearchers() {
    this.internalSubscriptions.add(
      this.api.getAllResearchers().subscribe(
        researchers => {
          console.log(researchers)
          this.researchers = researchers
        }
      )
    )
  }

  ngOnDestroy(): void {
    this.internalSubscriptions.unsubscribe()
  }

  onSetResearcherApprovedStatus(researcherId: string, status: boolean){
    this.internalSubscriptions.add(
      this.api.setResearcherAccountApproval(researcherId, status).subscribe(
        changed=>{
          console.log(changed)
          if(changed === true){
            console.log("reload researchers")
            this.reloadResearchers()
          }
        }
      )
    )
  }

  onUploadClicked() {
    this.internalSubscriptions.add(
      this.dialog.open(UploadClientBinaryDialogComponent, { data: {} }).afterClosed().filter(f => f).flatMap(
        file => {
          console.log("upload file:")
          return this.api.uploadClientBinary(file)
        }
      ).subscribe(
        success => {
          this.reloadClientBinaries()
          console.log("upload client: " + success)
        }, error => {
          console.log(error.json())
          switch (error.json().error) {
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

  onRemoveBinaryClicked(binaryId: string){
    this.internalSubscriptions.add(
      this.dialog.open(YesNoDialogComponent, { data: { title: "Remove File", message: "Do you want to remove this file?<br>This process cannot be undone.", positiveLabel: "Delete", positiveColor: "warn", negativeColor: "primary" } }).beforeClose().filter(confirm => confirm === true).flatMap(()=>  
      this.api.removeClientBinary(binaryId)).subscribe(
        changed=>{
          this.reloadClientBinaries()
        }
      )
    )
  }

  isEmpty(): boolean{
    if(this.binaryGroupList){
      if(this.binaryGroupList[this.selectedOperatingSystemIndex]){
        if(this.binaryGroupList[this.selectedOperatingSystemIndex].binaries.length > 0){
          return false
        }
      }
    }
    return true
  }

  onTabChanged(event) {
  }



}
