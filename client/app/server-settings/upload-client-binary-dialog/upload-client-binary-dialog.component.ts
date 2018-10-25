import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { UploadEvent } from 'ngx-file-drop';
import { getExtensionFromPath } from '../../../../shared_lib/utils';
import { ClientBinaryUtil } from '../../../../omnitrack/core/client_binary_utils';
import { IPackageMetadata, OperatingSystem } from 'app-metadata';
import { FileSystemFileEntry } from 'ngx-file-drop/src/lib/ngx-drop/dom.types';
import { BinaryXmlParser } from './binary-xml-parser';
const Unzip = require('isomorphic-unzip');
var Buffer = require('buffer/').Buffer

@Component({
  selector: 'app-upload-client-binary-dialog',
  templateUrl: './upload-client-binary-dialog.component.html',
  styleUrls: ['./upload-client-binary-dialog.component.scss'],
})
export class UploadClientBinaryDialogComponent implements OnInit {

  supportedExtensions = ['apk'];

  public isBusy: boolean = false
  loadedFile: File = null
  loadedFileName: string = null
  public parsedPackageInfo: IPackageMetadata = null
  errorMessage: string = null

  private changelog: Array<string> = []

  get changelogString(): string {
    return this.changelog.join("\n")
  }

  set changelogString(value) {
    this.changelog = value.split("\n")
  }

  constructor(private dialogRef: MatDialogRef<UploadClientBinaryDialogComponent>) { }

  ngOnInit(): void {

  }

  dropped(event: UploadEvent): void {
    this.isBusy = true
    this.parsedPackageInfo = null
    this.errorMessage = null

    const filteredList = event.files.filter(f => f.fileEntry.isFile === true && this.supportedExtensions.indexOf(getExtensionFromPath(f.fileEntry.name)) != -1)

    if (filteredList.length > 0) {
      const uploadFile = event.files[0]

      const entry: FileSystemFileEntry = uploadFile.fileEntry as any
      entry.file(file => {
        this.loadedFile = file
        this.loadedFileName = file.name
        const unzip = new Unzip(file)
        unzip.getEntries((err, entries) => {
          if (err) {
            this.errorMessage = "Failed to read the app information. Did you put the right file?"
            return;
          }

          const manifestEntry = entries.find(entry => entry.filename == 'AndroidManifest.xml')
          if (manifestEntry == null) {
            this.errorMessage = "Failed to read the app information. Did you put the right file?"
            return;
          }

          Unzip.getEntryData(manifestEntry, (err, blob) => {
            var reader = new FileReader()

            const onLoadEnd = (e) => {
              reader.removeEventListener('loadend', onLoadEnd, false)
              const parser = new BinaryXmlParser(Buffer.from(reader.result))
              const obj = parser.parse()
              console.log(obj)

              const sdkNode = obj.childNodes.find(node=>node.nodeName=== "uses-sdk")

              const metadata: IPackageMetadata = {
                /*
                operatingSystem: OperatingSystem;
                originalFileName: string;
                displayName: string;
                name: string;
                version: string; 
                buildVersion: string;
                uniqueIdentifier: string; 
                minimumOsVersion: string;
                executableName: string;
                deviceFamily: any;
                languages: string[];
                iconFullPath: string;
                iconName: string;
                icon: ArrayBuffer;
                fingerprint: string;
                size: number;
                hasProvisioning: boolean;
                 */
                operatingSystem: OperatingSystem.Android,
                originalFileName: file.name,
                displayName: "",
                name: "",
                version: obj.attributes.find(attr=>attr.name === "versionName").value,
                buildVersion: obj.attributes.find(attr=>attr.name === "versionCode").typedValue.value.toString(),
                uniqueIdentifier: obj.attributes.find(attr=>attr.name === "package").value,
                minimumOsVersion: sdkNode.attributes.find(attr=>attr.nodeName==="minSdkVersion").typedValue.value.toString(),
                executableName: "",
                deviceFamily: "android",
                languages: [],
                iconFullPath: "",
                iconName: "",
                icon: null,
                fingerprint: "",
                size: file.size,
                hasProvisioning: false
              }

              this.parsedPackageInfo = metadata
              this.isBusy = false
              console.log(this.parsedPackageInfo)
              console.log("done reading package file.")
            }

            reader.addEventListener('loadend', onLoadEnd, false)
            reader.readAsArrayBuffer(blob)
          })
        })
      })
    } else {
      this.isBusy = false
    }
  }

  cancelFile() {
    this.parsedPackageInfo = null
    this.loadedFile = null
    this.errorMessage = null
    this.isBusy = false
  }

  onCancelClicked() {
    this.dialogRef.close()
  }

  onUploadClicked() {
    this.dialogRef.close({ file: this.loadedFile, changelog: this.changelog })
  }

  getPlatformName(): string{
    return ClientBinaryUtil.getOsName(this.parsedPackageInfo)
  }

  getMinimumOSVersionString(): string {
    return ClientBinaryUtil.getMinimumOSVersionString(this.parsedPackageInfo)
  }

  getAppVersionName(): string {
    return ClientBinaryUtil.getAppVersionName(this.parsedPackageInfo)
  }

  getAppVersionCode(): number {
    return ClientBinaryUtil.getAppVersionCode(this.parsedPackageInfo)
  }
}
