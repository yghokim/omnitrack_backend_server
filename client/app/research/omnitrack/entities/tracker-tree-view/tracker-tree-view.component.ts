import { Component, OnInit, Input, Output, ChangeDetectionStrategy, EventEmitter } from '@angular/core';
import { ITrackerDbEntity, ITriggerDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import { getTrackerColorString } from '../../omnitrack-helper';
import { TriggerConstants } from '../../../../../../omnitrack/core/trigger-constants';

@Component({
  selector: 'app-tracker-tree-view',
  templateUrl: './tracker-tree-view.component.html',
  styleUrls: ['./tracker-tree-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackerTreeViewComponent implements OnInit {

  @Input() triggers: Array<ITriggerDbEntity>
  @Input() tracker: ITrackerDbEntity

  @Output() treeItemClick = new EventEmitter<{type: string, obj: any}>()

  constructor() { }

  ngOnInit() {
  }

  onElementClicked(ev: {type: string, obj: any}){
    this.treeItemClick.emit(ev)
  }

  getTrackerColorString(tracker: ITrackerDbEntity): string {
    return getTrackerColorString(tracker)
  }

  getReminders(): Array<ITriggerDbEntity>{
    return (this.triggers!=null && this.tracker!=null)? this.triggers.filter(t => t.actionType === TriggerConstants.ACTION_TYPE_REMIND && t.trackers.findIndex(trackerId => trackerId === this.tracker._id) !== -1) : []
  }
}
