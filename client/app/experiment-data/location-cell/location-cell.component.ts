import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { LatLng } from '../../../../omnitrack/core/datatypes/field_datatypes';

@Component({
  selector: 'app-location-cell',
  templateUrl: './location-cell.component.html',
  styleUrls: ['./location-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationCellComponent implements OnInit {

  @Input("value")
  public latLng: LatLng

  constructor() { }

  ngOnInit() {
  }

  makeMapExternalUrl(): string{
    return "https://maps.google.com/?ll=" + this.latLng.latitude +","+this.latLng.longitude + "&q=" + this.latLng.latitude +","+this.latLng.longitude + "&z=17"
  }

}
