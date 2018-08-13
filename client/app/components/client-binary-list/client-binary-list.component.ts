import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { Subscription, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { filter, flatMap } from 'rxjs/operators';
import { Http } from '@angular/http';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-client-binary-list',
  templateUrl: './client-binary-list.component.html',
  styleUrls: ['./client-binary-list.component.scss']
})
export class ClientBinaryListComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  @Input() hideChangelogs: boolean = false
  @Input() experimentId: string
  @Input() useConfirmColumn: boolean
  @Input() binaries: Array<any>

  constructor(private api: ResearchApiService, private notificationService: NotificationService, private dialog: MatDialog, private http: Http) { }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  makeBinaryDownloadUrl(binary: any): string {
    return '/api/clients/download?platform=' + binary.platform + '&version=' + binary.version + (this.experimentId ? ('&experimentId=' + this.experimentId) : '')
  }

  retrieveShortUrl(binary: any): Observable<string> {
    const url = window.location.protocol + "//" + window.location.host + this.makeBinaryDownloadUrl(binary)
    return this.http.get('http://tinyurl.com/api-create.php?url=' + encodeURIComponent(url)).pipe(
      map(res => res.text()),
      catchError(err => {
        console.error(err)
        this.notificationService.pushSnackBarMessage({ message: "An error occurred retrieving a short url." })
        throw err
      })
    )
  }

  onShortUrlCopied(binary: any){
    this.notificationService.pushSnackBarMessage({ message: "A shorted URL was copied to clipboard." })
  }

  onRetrieveLinkClicked(binary: any) {
    const url = window.location.protocol + "//" + window.location.host + this.makeBinaryDownloadUrl(binary)
    this._internalSubscriptions.add(
      this.http.get('http://tinyurl.com/api-create.php?url=' + encodeURIComponent(url)).subscribe(shorten => {
        console.log(shorten)
      },
        err => {
          console.error(err)
          this.notificationService.pushSnackBarMessage({ message: "An error occurred retrieving a short url." })
        }
      )
    )

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
      if (this.binaries.find(b => b.needsConfirm === true)) {
        return true
      }
    } else return false
  }

}
