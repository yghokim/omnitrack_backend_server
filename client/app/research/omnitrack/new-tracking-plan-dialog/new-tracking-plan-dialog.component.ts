import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BehaviorSubject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ResearchApiService } from '../../../services/research-api.service';
import { TrackingPlan } from '../../../../../omnitrack/core/tracking-plan';

@Component({
  selector: 'app-new-tracking-plan-dialog',
  templateUrl: './new-tracking-plan-dialog.component.html'
})
export class NewTrackingPlanDialogComponent implements OnInit, OnDestroy {

  trackingPlanName: string
  _trackingPlan: TrackingPlan

  private _selectedCreationType: string = 'empty'
  public get selectedCreationType(): string{
    return this._selectedCreationType
  }

  public set selectedCreationType(type: string){
    this._selectedCreationType = type
    if(type === 'empty'){
      this.trackingPlan = new TrackingPlan([], []).toJson()
    }
  }

  public selectedLoadType: string = 'file'

  public shareCode: string = null
  public loadingSharedTrackingPlan: boolean = false

  get trackingPlan(): TrackingPlan {
    return this._trackingPlan
  }

  set trackingPlan(value: TrackingPlan) {
    if (this._trackingPlan !== value) {
      this._trackingPlan = value
      this.trackingPlanJsonString = value != null ? JSON.stringify(value, null, 2) : null
    }
  }

  private api: ResearchApiService

  private readonly internalSubscription = new Subscription()
  private readonly trackingPlanJsonStringSubject: BehaviorSubject<string> = new BehaviorSubject(null)
  set trackingPlanJsonString(jsonString: string) {
    this.trackingPlanJsonStringSubject.next(jsonString != null? jsonString.toString() : null)
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
          console.log(text)
          try {
            this.trackingPlan = JSON.parse(text)
          } catch (err) {
            this.trackingPlan = null
          }
        }
      )
    )

    this.selectedCreationType = 'empty'
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
