import { Component, OnInit, Input, Inject } from '@angular/core';
import { ITrackerDbEntity, IAttributeDbEntity } from '../../../../omnitrack/core/db-entity-types';
import { ResearchApiService } from '../../services/research-api.service';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ImageViewDialog } from './image-view-dialog/image-view-dialog.component';

@Component({
  selector: 'app-image-cell',
  templateUrl: './image-cell.component.html',
  styleUrls: ['./image-cell.component.scss']
})
export class ImageCellComponent implements OnInit {

  private _internalSubscriptions = new Subscription();
  public imageToShow: any;

  constructor(private api: ResearchApiService, public dialog: MatDialog) { }

  ngOnInit() {
  }

  @Input("mediaInfo")
  set _mediaInfo(info: {trackerId: string, attributeLocalId: string, itemId: string }){
    console.log("load image media")
    console.log(info.itemId)
    this._internalSubscriptions.add(
      this.api.getMedia(info.trackerId, info.attributeLocalId, info.itemId, "original").subscribe(response => {
        this.createImageFromBlob(response);
      }, err => {
        console.log("image media load error: " + err)
      })
    )
  }

  createImageFromBlob(image: Blob) {
    let reader = new FileReader();
    reader.addEventListener("load", () => {
       this.imageToShow = reader.result;
    }, false);

    if (image) {
       reader.readAsDataURL(image);
    }
  }

  openImage(): void {
    let dialogRef = this.dialog.open(ImageViewDialog, {
      width: 'auto',
      height: '100%',
      data: {image: this.imageToShow }
    });
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe();
  }
}

