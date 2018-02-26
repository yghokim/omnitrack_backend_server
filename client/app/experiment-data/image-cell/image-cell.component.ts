import { Component, OnInit, Input } from '@angular/core';
import { ITrackerDbEntity, IAttributeDbEntity } from '../../../../omnitrack/core/db-entity-types';
import { ResearchApiService } from '../../services/research-api.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-image-cell',
  templateUrl: './image-cell.component.html',
  styleUrls: ['./image-cell.component.scss']
})
export class ImageCellComponent implements OnInit {

  private _internalSubscriptions = new Subscription();

  @Input("mediaInfo")
  set _mediaInfo(info: {trackerId: string, attributeLocalId: string, itemId: string }){
    console.log("load image media")
    console.log(info.itemId)
    this._internalSubscriptions.add(
      this.api.getMedia(info.trackerId, info.attributeLocalId, info.itemId, "original").subscribe(response => {
        console.log(response)
      }, err => {
        console.log("image media load error: " + err)
      })
    )
  }

  constructor(private api: ResearchApiService) { }

  ngOnInit() {
  }

}
