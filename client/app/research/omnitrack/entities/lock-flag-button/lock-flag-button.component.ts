import { Component, OnInit, Input, Output, ViewChild, ElementRef, ChangeDetectorRef, EventEmitter } from '@angular/core';
import {MatBottomSheet} from '@angular/material';
import {LockConfigurationSheetComponent, ConfigurationSheetData} from './lock-configuration-sheet/lock-configuration-sheet.component';
import { Subscription } from 'rxjs';
import { DependencyLevel } from '../../../../../../omnitrack/core/functionality-locks/omnitrack-dependency-graph';
import { TrackingPlanService } from '../../tracking-plan.service';

@Component({
  selector: 'app-lock-flag-button',
  templateUrl: './lock-flag-button.component.html',
  styleUrls: ['./lock-flag-button.component.scss', '../entity-styles.scss']
})
export class LockFlagButtonComponent implements OnInit {

  private readonly _internalSubscriptions = new Subscription()

  @Input() model: any

  @Input() lockType: DependencyLevel

  @Output() flagChange: EventEmitter<void> = new EventEmitter()

  @ViewChild("tooltipParent") buttonElm: ElementRef

  constructor(private bottomSheet: MatBottomSheet, private changeDetection: ChangeDetectorRef, private trackingPlanManager: TrackingPlanService) { }

  ngOnInit() {
    ($(this.buttonElm.nativeElement) as any).tooltip({boundary: 'window'});
  }

  propertyKeyList(): Array<string> {
    if (this.model && this.model.lockedProperties) {
      return Object.keys(this.model.lockedProperties)
    } else return []
  }

  getLockedPropertyNames(): Array<string> {
    if (this.model && this.model.lockedProperties) {
      return this.propertyKeyList().filter(key => this.model.lockedProperties[key] === true)
    } else return []
  }

  tooltipContent(): string{
    const lockedNames = this.getLockedPropertyNames()
    if(lockedNames.length === 0){
      return "No locks. Click to restrict the entity modification."
    }
    else return "Locked: " + lockedNames.join(", ")
  }

  onClicked(){
    this._internalSubscriptions.add(
      this.bottomSheet.open(LockConfigurationSheetComponent, {data: {level: this.lockType, model: this.model, trackingPlanManager: this.trackingPlanManager} as ConfigurationSheetData, panelClass: "bottom-sheet"}).afterDismissed().subscribe(
        flags=>{
          if(flags){
            this.model.lockedProperties = flags
            this.changeDetection.markForCheck()
            this.flagChange.emit()
          }
        }
      )
    )
  }

}
