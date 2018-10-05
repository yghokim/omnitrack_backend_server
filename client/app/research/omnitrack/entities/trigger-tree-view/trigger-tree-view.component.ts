import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ITriggerDbEntity, ITrackerDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../../../../omnitrack/core/trigger-constants';
import * as moment from 'moment-timezone';

@Component({
  selector: 'app-trigger-tree-view',
  templateUrl: './trigger-tree-view.component.html',
  styleUrls: ['./trigger-tree-view.component.scss']
})
export class TriggerTreeViewComponent implements OnInit {

  @Input() isReminder: boolean = false
  @Input() oppendCascadingLevel: number = 0
  @Input() trigger: ITriggerDbEntity
  @Input() trackers: Array<ITrackerDbEntity>
  @Output() treeItemClick = new EventEmitter<{type: string, obj: any}>()

  constructor() { }

  ngOnInit() {
  }

  public onElementClicked(ev: {type: string, obj: any}){
    this.treeItemClick.emit(ev)
  }

  public getType(): string {
    switch(this.trigger.actionType){
      case TriggerConstants.ACTION_TYPE_LOG:
      return "Trigger"
      case TriggerConstants.ACTION_TYPE_REMIND:
      return "Reminder"
    }
  }

  public makeShortenConditionString(): string{
    switch(this.trigger.conditionType){
      case TriggerConstants.CONDITION_TYPE_TIME:
      switch(this.trigger.condition.cType){
        case TriggerConstants.TIME_CONDITION_ALARM:
        return "Alarm (" + this.makeAlarmTimeString(this.trigger.condition.aHr, this.trigger.condition.aMin) + ")"
        case TriggerConstants.TIME_CONDITION_INTERVAL:
        return "Interval (every " + this.trigger.condition.iSec + " secs)"
        case TriggerConstants.TIME_CONDITION_SAMPLING:
        return "Sampling (" + this.trigger.condition.esmCount + " pings)"
      }
      break;
    }
  }

  private makeAlarmTimeString(hr: number, min: number): string{
    return moment().hour(hr).minute(min).format("hh:mm a")
  }
}
