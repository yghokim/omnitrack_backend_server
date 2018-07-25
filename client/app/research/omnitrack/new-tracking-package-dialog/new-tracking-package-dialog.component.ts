import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ResearchApiService } from '../../../services/research-api.service';

@Component({
  selector: 'app-new-tracking-package-dialog',
  templateUrl: './new-tracking-package-dialog.component.html',
  styleUrls: ['./new-tracking-package-dialog.component.scss']
})
export class NewTrackingPackageDialogComponent implements OnInit, OnDestroy {

  trackingPackageName: string
  _trackingPackage: any

  public selectedLoadType: string = 'file'

  public shareCode: string = null
  public loadingSharedTrackingPackage: boolean = false

  get trackingPackage(): any {
    return this._trackingPackage
  }

  set trackingPackage(value: any) {
    if (this._trackingPackage !== value) {
      this._trackingPackage = value
      this.trackingPackageJsonString = value != null ? JSON.stringify(value, null, 2) : null
    }
  }

  private api: ResearchApiService

  private readonly internalSubscription = new Subscription()
  private readonly trackingPackageJsonStringSubject: BehaviorSubject<string> = new BehaviorSubject(null)
  set trackingPackageJsonString(jsonString: string) {
    this.trackingPackageJsonStringSubject.next(jsonString.toString())
  }

  get trackingPackageJsonString(): string {
    return this.trackingPackageJsonStringSubject.value
  }

  constructor(private dialogRef: MatDialogRef<NewTrackingPackageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) { }

  ngOnInit() {

    this.api = this.data.api

    this.internalSubscription.add(
      this.trackingPackageJsonStringSubject.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ).subscribe(
        text => {
          try {
            this.trackingPackage = JSON.parse(text)
            console.log("parsed package: ")
            console.log(this.trackingPackage)
          } catch (err) {
            this.trackingPackage = null
          }
        }
      )
    )
  }

  ngOnDestroy(): void {
    this.internalSubscription.unsubscribe()
  }

  onNoClick() {
    this.dialogRef.close(null)
  }

  isValid(): boolean {
    return this.trackingPackageName != null && (this.trackingPackageName.length > 0) && this.trackingPackage != null
  }

  onYesClick() {
    this.dialogRef.close({
      name: this.trackingPackageName,
      data: this.trackingPackage
    })
  }

  onSelectedTabChanged(tabEvent: any) {
    switch (tabEvent.index) {
      case 0:
        this.selectedLoadType = 'file'
        break;
      case 1:
        this.selectedLoadType = 'instantShare'
        break;
      case 2:
        this.selectedLoadType = 'manual'
        break;
    }
  }

  onPackageJsonFileChanged(files) {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        this.trackingPackage = JSON.parse((e as any).target.result)
      } catch (e) {
        console.log(e)
      }
    }
    fileReader.readAsText(files[0])
  }

  onGetFromInstantShareClicked() {
    if (this.shareCode) {
      this.loadingSharedTrackingPackage = true
      this.api.loadInstantShareTrackingPackage(this.shareCode).subscribe(
        packageJson => {
          this.trackingPackage = packageJson
        },
        err => {

        },
        ()=>{
          this.loadingSharedTrackingPackage = false
        }
      )
    }
  }

}
