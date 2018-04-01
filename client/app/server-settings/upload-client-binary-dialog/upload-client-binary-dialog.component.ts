import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { UploadEvent } from 'ngx-file-drop';
import * as PkgReader from 'isomorphic-apk-reader';
import { getExtensionFromPath } from '../../../../shared_lib/utils';
import { ClientBinaryUtil } from '../../../../omnitrack/core/client_binary_utils';
import * as AndroidVersionName from 'android-versions';
import { FileSystemFileEntry } from 'ngx-file-drop/src/lib/ngx-drop/dom.types';

@Component({
  selector: 'app-upload-client-binary-dialog',
  templateUrl: './upload-client-binary-dialog.component.html',
  styleUrls: ['./upload-client-binary-dialog.component.scss']
})
export class UploadClientBinaryDialogComponent implements OnInit {

  supportedExtensions = ['apk'];

  isBusy: boolean = false
  loadedFile: File = null
  loadedFileName: string = null
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
      const uploadFile = event.files[0]
      const extension = getExtensionFromPath(uploadFile.fileEntry.name)

      const entry: FileSystemFileEntry = uploadFile.fileEntry as any
      entry.file(file=>{
        this.loadedFile = file
        this.loadedFileName = file.name
        new PkgReader(file, extension, {withIcon: true}).parse((err, packageInfo)=>{
          if(!err){
            switch(extension){
              case "apk":
              packageInfo.platform = "Android"
              break;
              case "ipa":
              packageInfo.platform = "iOS"
              break;
            }
            this.parsedPackageInfo = packageInfo
            this.isBusy = false
            console.log("done reading package file.")
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

  onUploadClicked(){
    this.dialogRef.close(this.loadedFile)
  }

  getMinimumOSVersionString():string{
    return ClientBinaryUtil.getMinimumOSVersionString(this.parsedPackageInfo)
  }

  getAppVersionName(): string{
    return ClientBinaryUtil.getAppVersionName(this.parsedPackageInfo)
  }

  getAppVersionCode(): number{
    return ClientBinaryUtil.getAppVersionCode(this.parsedPackageInfo)
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
