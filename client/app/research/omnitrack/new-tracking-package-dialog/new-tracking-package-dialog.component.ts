import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-new-tracking-package-dialog',
  templateUrl: './new-tracking-package-dialog.component.html',
  styleUrls: ['./new-tracking-package-dialog.component.scss']
})
export class NewTrackingPackageDialogComponent implements OnInit, OnDestroy {

  trackingPackageName: string
  trackingPackage: any

  private readonly internalSubscription = new Subscription()
  private readonly trackingPackageJsonStringSubject: BehaviorSubject<string> = new BehaviorSubject(null)
  set trackingPackageJsonString(jsonString: string) {
    this.trackingPackageJsonStringSubject.next(jsonString.toString())
  }
  
  get trackingPackageJsonString(): string{
    return this.trackingPackageJsonStringSubject.value
  }

  constructor(private dialogRef: MatDialogRef<NewTrackingPackageDialogComponent>) { }

  ngOnInit() {
    console.log("subscribe to string")
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

  onNoClick(){
    this.dialogRef.close(null)
  }

  isValid(): boolean {
    return this.trackingPackageName != null && (this.trackingPackageName.length > 0) && this.trackingPackage != null
  }

  onYesClick(){
    this.dialogRef.close({
      name: this.trackingPackageName,
      data: this.trackingPackage
    })
  }

}
