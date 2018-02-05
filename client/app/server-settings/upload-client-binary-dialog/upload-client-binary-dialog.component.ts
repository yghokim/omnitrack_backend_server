import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { UploadEvent } from 'ngx-file-drop';
import * as PkgReader from 'isomorphic-apk-reader';
import * as AndroidVersionName from 'android-versions';
import { getExtensionFromPath } from '../../../../shared_lib/utils';

@Component({
  selector: 'app-upload-client-binary-dialog',
  templateUrl: './upload-client-binary-dialog.component.html',
  styleUrls: ['./upload-client-binary-dialog.component.scss']
})
export class UploadClientBinaryDialogComponent implements OnInit {

  supportedExtensions = ['apk'];

  isBusy: boolean = false
  loadedFile: File
  parsedPackageInfo: any = null
  errorMessage: string = null

  constructor(private dialogRef: MatDialogRef<UploadClientBinaryDialogComponent>) { }

  ngOnInit(): void {

  }

  dropped(event: UploadEvent): void{
    console.log(event)
    this.isBusy = true
    this.parsedPackageInfo = null
    this.errorMessage = null

    const filteredList = event.files.filter(f=>f.fileEntry.isFile === true && this.supportedExtensions.indexOf(getExtensionFromPath(f.fileEntry.name)) != -1)

    if(filteredList.length > 0)
    {
      const fileEntry = event.files[0]
      console.log(fileEntry)
      const extension = getExtensionFromPath(fileEntry.fileEntry.name)

      fileEntry.fileEntry.file(file=>{
        new PkgReader(file, extension, {withIcon: true}).parse((err, packageInfo)=>{
          this.isBusy = false
          if(!err){
            switch(extension){
              case "apk":
              packageInfo.platform = "Android"
              break;
              case "ipa":
              packageInfo.platform = "iOS"
              break;
            }
            console.log(packageInfo)
            this.loadedFile = file
            this.parsedPackageInfo = packageInfo
          }
          else{
            console.log(err)
            this.errorMessage = "Failed to read the app information. Did you put the right file?"
          }
        })
      })
    }else{
      this.isBusy = false
    }
  }

  cancelFile(){
    this.parsedPackageInfo = null
    this.loadedFile = null
    this.errorMessage = null
    this.isBusy = false
  }

  onCancelClicked(){
    this.dialogRef.close()
  }

  getMinimumOSVersionString():string{
    switch(this.parsedPackageInfo.platform)
    {
      case "Android":
      const minSdk = AndroidVersionName.get(
        this.parsedPackageInfo.usesSdk.minSdkVersion)
      return "Android " + minSdk.semver + " (" + minSdk.name + ")"
    }
  }


  getCompiledOSVersionString():string{
    switch(this.parsedPackageInfo.platform)
    {
      case "Android":
      const compiledSdk = AndroidVersionName.get(
        this.parsedPackageInfo.usesSdk.targetSdkVersion)
      return "Android " + compiledSdk.semver + " (" + compiledSdk.name + ")"
    }
  }

}
