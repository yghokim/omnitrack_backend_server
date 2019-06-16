import { Component, OnInit, Input } from '@angular/core';
import { ITriggerDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { TriggerConstants } from '../../../../../../omnitrack/core/trigger/trigger-constants';
import { TimeCondition } from '../../../../../../omnitrack/core/trigger/trigger-condition';
import { merge } from '../../../../../../shared_lib/utils';
import * as moment from 'moment';

@Component({
  selector: 'app-trigger-detail-panel',
  templateUrl: './trigger-detail-panel.component.html',
  styleUrls: ['./trigger-detail-panel.component.scss', '../tracking-plan-detail.component.scss']
})
export class TriggerDetailPanelComponent implements OnInit {
  private _trigger: ITriggerDbEntity

  @Input()
  set trigger(trigger: ITriggerDbEntity) {
    this._trigger = trigger
  }

  get trigger(): ITriggerDbEntity {
    return this._trigger
  }

  get entityType(): string {
    switch (this.trigger.actionType) {
      case TriggerConstants.ACTION_TYPE_LOG: return "trigger"
      case TriggerConstants.ACTION_TYPE_REMIND: return "reminder"
    }
  }

  ngOnInit() {
  }

  onTimeConditionTypeChanged(cType: number){
    this.trigger.condition.cType = cType
    this.trigger.condition = merge(new TimeCondition(), this.trigger.condition, true, true)
  }

  getNextDay(): Date{
    return moment().add(1, 'day').startOf('day').toDate()
  }

  getEndDate(): Date{
    return new Date(this.trigger.condition.endAt)
  }
}
