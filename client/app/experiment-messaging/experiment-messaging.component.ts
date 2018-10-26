import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog, MatTableDataSource, MatSort } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { ResearchApiService } from '../services/research-api.service';
import { Subscription } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { IResearchMessage } from '../../../omnitrack/core/research/messaging';

@Component({
  selector: 'app-experiment-messaging',
  templateUrl: './experiment-messaging.component.html',
  styleUrls: ['./experiment-messaging.component.scss']
})
export class ExperimentMessagingComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  public messageList: Array<IResearchMessage>

  public messageDataSource: MatTableDataSource<IResearchMessage>
  public draftDataSource: MatTableDataSource<IResearchMessage>
  @ViewChild(MatSort) messageSort: MatSort;
  @ViewChild('draftTable', { read: MatSort }) draftSort: MatSort;

  constructor(private api: ResearchApiService, private dialog: MatDialog, private router: Router, private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(service => service.getMessageList())).subscribe(
        messages => {
          this.messageList = messages
          this.messageDataSource = new MatTableDataSource(this.getMessageList())
          this.draftDataSource = new MatTableDataSource(this.getDraftList())
          this.messageDataSource.sort = this.messageSort
          this.draftDataSource.sort = this.draftSort
          this.setSorts();
        }
      )
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  getDraftList(): Array<IResearchMessage> {
    if (this.messageList)
      return this.messageList.filter(m => m.isDraft === true)
    else return []
  }

  getMessageList(): Array<IResearchMessage> {
    if (this.messageList)
      return this.messageList.filter(m => m.isDraft !== true)
    else return []
  }

  makeReceiversText(message: IResearchMessage): string {
    if (!message.receivers || message.receivers.length == 0) {
      return "No receivers."
    } else if (message.receivers.length > 5) {
      return message.receivers[0].alias + " and " + (message.receivers.length - 1)
    }
    else {
      return message.receivers.map(r => r.alias).join(", ")
    }
  }

  onTabChanged(event) {
    console.log(event.index)
  }

  onNewMessageClicked() {
    this.router.navigate(['./new'], { relativeTo: this.activatedRoute })
  }

  setSorts(): void {
    this.messageDataSource.sortingDataAccessor = (data: IResearchMessage, sortHeaderId: string) => {
      if (data) {
        if (sortHeaderId === "receivers") {
          return this.makeReceiversText(data) || ''
        }
        else if (sortHeaderId === "receiverRule") {
          if (data.receiverRule) return data.receiverRule.type || ''
        }
        else {
          return data[sortHeaderId] || ''
        }
      }
      else return '';
    }
    this.draftDataSource.sortingDataAccessor = this.messageDataSource.sortingDataAccessor;
  }

}
