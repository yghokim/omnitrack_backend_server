import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from "rxjs/Subscription";
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { ResearchApiService } from '../services/research-api.service';
import { MatDialog } from '@angular/material';
import { UploadClientBinaryDialogComponent } from './upload-client-binary-dialog/upload-client-binary-dialog.component';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-server-settings',
  templateUrl: './server-settings.component.html',
  styleUrls: ['./server-settings.component.scss']
})
export class ServerSettingsComponent implements OnInit, OnDestroy {

  private readonly internalSubscriptions = new Subscription()
  selectedOperatingSystemIndex: number = 0
  binaryGroupList: Array<{_id: string, binaries: Array<any>}>

  constructor(
    private auth: ResearcherAuthService,
    private api: ResearchApiService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.reloadClientBinaries()
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

  ngOnDestroy(): void {
    this.internalSubscriptions.unsubscribe()
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
