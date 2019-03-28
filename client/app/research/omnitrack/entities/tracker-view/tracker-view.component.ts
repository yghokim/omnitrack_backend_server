import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy, Input } from '@angular/core';
import { ITrackerDbEntity, ITriggerDbEntity, IAttributeDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { getTrackerColorString } from '../../omnitrack-helper';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { TextInputDialogComponent } from '../../../../dialogs/text-input-dialog/text-input-dialog.component';
import * as isUrl from 'is-url';
import AttributeManager from '../../../../../../omnitrack/core/attributes/attribute.manager';

@Component({
  selector: 'app-tracker-view',
  templateUrl: './tracker-view.component.html',
  host: { 'class': 'card card-sm card-component card-entity' },
  styleUrls: ['./tracker-view.component.scss', '../entity-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackerViewComponent implements OnInit {

  private readonly _internalSubscriptions = new Subscription()

  @Input() tracker: ITrackerDbEntity

  @Input() reminders: Array<ITriggerDbEntity>

  @Output() trackerChange: EventEmitter<void> = new EventEmitter()

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  getTrackerColorString(tracker: any): string {
    return getTrackerColorString(tracker)
  }

  onFlagChanged() {
    this.trackerChange.emit()
  }

  onRedirectUrlButtonClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(TextInputDialogComponent, {
        data: {
          title: "Change Redirect Url",
          message: "Instert the redirect url which will forward the user after logging each tracker item. Mostly starts with http:// or https://",
          placeholder: "Enter URL",
          validator: (text) => { return text == null ? true : (text.length > 0 ? isUrl(text) : true) },
          prefill: this.tracker.redirectUrl
        }
      }).afterClosed().subscribe(text => {
        if (text != null) {
          const newChange = text.length > 0 ? text : null
          if(this.tracker.redirectUrl !== newChange){
            this.tracker.redirectUrl = newChange
            this.trackerChange.emit()
          }
        }
      })
    )
  }

  getRedirectUrlHostName(){
    if(this.tracker && this.tracker.redirectUrl && this.tracker.redirectUrl.length > 0){
      try{
      return new URL(this.tracker.redirectUrl).hostname
      }catch(ex){
        console.log(ex)
        return null
      }
    }else return null
  }

  getAttributeIconName(attr: IAttributeDbEntity): string{
    const helper = AttributeManager.getHelper(attr.type)
    if(helper!=null){
      return helper.getSmallIconType(attr)
    }else return null
  }

}
