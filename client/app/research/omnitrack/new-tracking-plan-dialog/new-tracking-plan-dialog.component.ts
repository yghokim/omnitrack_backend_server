import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ResearchApiService } from '../../../services/research-api.service';

@Component({
  selector: 'app-new-tracking-plan-dialog',
  templateUrl: './new-tracking-plan-dialog.component.html'
})
export class NewTrackingPlanDialogComponent implements OnInit, OnDestroy {

  trackingPlanName: string
  _trackingPlan: any

  public selectedLoadType: string = 'file'

  public shareCode: string = null
  public loadingSharedTrackingPlan: boolean = false

  get trackingPlan(): any {
    return this._trackingPlan
  }

  set trackingPlan(value: any) {
    if (this._trackingPlan !== value) {
      this._trackingPlan = value
      this.trackingPlanJsonString = value != null ? JSON.stringify(value, null, 2) : null
    }
  }

  private api: ResearchApiService

  private readonly internalSubscription = new Subscription()
  private readonly trackingPlanJsonStringSubject: BehaviorSubject<string> = new BehaviorSubject(null)
  set trackingPlanJsonString(jsonString: string) {
    this.trackingPlanJsonStringSubject.next(jsonString.toString())
  }

  get trackingPlanJsonString(): string {
    return this.trackingPlanJsonStringSubject.value
  }

  constructor(private dialogRef: MatDialogRef<NewTrackingPlanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) { }

  ngOnInit() {

    this.api = this.data.api

    this.internalSubscription.add(
      this.trackingPlanJsonStringSubject.pipe(
        debounceTime(400),
        distinctUntilChanged()
      ).subscribe(
        text => {
          try {
            this.trackingPlan = JSON.parse(text)
          } catch (err) {
            this.trackingPlan = null
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
    return this.trackingPlanName != null && (this.trackingPlanName.length > 0) && this.trackingPlan != null
  }

  onYesClick() {
    this.dialogRef.close({
      name: this.trackingPlanName,
      data: this.trackingPlan
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

  onPlanJsonFileChanged(files) {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        this.trackingPlan = JSON.parse((e as any).target.result)
      } catch (e) {
        console.log(e)
      }
    }
    fileReader.readAsText(files[0])
  }

  onGetFromInstantShareClicked() {
    if (this.shareCode) {
      this.loadingSharedTrackingPlan = true
      this.api.loadInstantShareTrackingPlan(this.shareCode).subscribe(
        packageJson => {
          this.trackingPlan = packageJson
        },
        err => {

        },
        ()=>{
          this.loadingSharedTrackingPlan = false
        }
      )
    }
  }

}
