import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from "rxjs/Subscription";
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { ResearchApiService } from '../services/research-api.service';
import { MatDialog } from '@angular/material';
import { UploadClientBinaryDialogComponent } from './upload-client-binary-dialog/upload-client-binary-dialog.component';

@Component({
  selector: 'app-server-settings',
  templateUrl: './server-settings.component.html',
  styleUrls: ['./server-settings.component.scss']
})
export class ServerSettingsComponent implements OnInit, OnDestroy {

  private readonly internalSubscriptions = new Subscription()

  supportedOperatingSystems: Array<string>
  selectedOperatingSystemIndex: number = 0

  constructor(
    private auth: ResearcherAuthService,
    private api: ResearchApiService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {

  }

  ngOnDestroy(): void {
    this.internalSubscriptions.unsubscribe()
  }

  onUploadClicked(){
    this.internalSubscriptions.add(
      this.dialog.open(UploadClientBinaryDialogComponent, {data: {}}).afterClosed().filter(f=>f).flatMap(
        file=>{
            console.log("upload file:")
            console.log(file)
              return this.api.uploadClientBinary(file)
        }
      ).subscribe(
        success=>{
          console.log("upload client: " + success)
        }
      )
    )
  }

  onTabChanged(event){
  }



}
