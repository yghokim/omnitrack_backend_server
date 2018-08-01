import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { filter, flatMap } from 'rxjs/operators';

@Component({
  selector: 'app-client-binary-list',
  templateUrl: './client-binary-list.component.html',
  styleUrls: ['./client-binary-list.component.scss']
})
export class ClientBinaryListComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  @Input() experimentId: string
  @Input() useConfirmColumn: boolean
  @Input() binaries: Array<any>

  constructor(private api: ResearchApiService, private dialog: MatDialog) { }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  onRemoveBinaryClicked(binaryId: string) {
    this._internalSubscriptions.add(
      this.dialog.open(YesNoDialogComponent, { data: { title: "Remove File", message: "Do you want to remove this file?<br>This process cannot be undone.", positiveLabel: "Delete", positiveColor: "warn", negativeColor: "primary" } }).beforeClose().pipe(
        filter(confirm => confirm === true),
        flatMap(() =>
          this.api.removeClientBinary(binaryId))
      ).subscribe(
        changed => {
          if (changed === true) {
            var index = -1
            index = this.binaries.findIndex(b => b._id === binaryId)
            if (index != -1) {
              this.binaries.splice(index, 1)
            }
          }
        }
      )
    )
  }

  onPublishClicked(binaryId: string) {
    this._internalSubscriptions.add(
      this.api.publishClientBinary(binaryId).subscribe(
        changed => {
          if (changed === true) {
            this.binaries.find(b => b._id === binaryId).needsConfirm = false
          }
        })
    )
  }

  hasBinariesToPublish(): boolean {
    if (this.binaries) {
      if(this.binaries.find(b => b.needsConfirm === true)){
        return true
      }
    } else return false
  }

}
