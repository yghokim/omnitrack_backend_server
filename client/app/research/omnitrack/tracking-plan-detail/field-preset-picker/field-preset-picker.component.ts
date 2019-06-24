import { Component, OnInit, Inject } from '@angular/core';
import { IFieldDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import FieldManager from '../../../../../../omnitrack/core/fields/field.manager';
import FieldHelper from '../../../../../../omnitrack/core/fields/field.helper';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material';
import { trigger, state, style, transition, animate } from '@angular/animations';

export class PresetFormat {
  constructor(
    public fieldType: number,
    public iconName: string,
    public label: string,
    public description: string,
    public generator?: (field: IFieldDbEntity) => void) { }
}

export interface FieldPresetDialogData {
  formats: Array<PresetFormat>
}

@Component({
  selector: 'app-field-preset-picker',
  templateUrl: './field-preset-picker.component.html',
  styleUrls: ['./field-preset-picker.component.scss'],
  animations: [
    trigger('tileBackgroundHover', [
      state('*', style({
        "background-color": "rgba(255,255,255,0)",
      })),
      state('hover', style({
        "background-color": 'rgba(255,255,255,0.1)',
      })),
      transition('* => hover', [animate('250ms ease-out')]),
      transition('hover => *', [animate('150ms ease-out')])
    ]),
  ]
})
export class FieldPresetPickerComponent implements OnInit {

  formats: Array<PresetFormat> = []

  hoverIndex = -1

  constructor(private bottomSheetRef: MatBottomSheetRef<FieldPresetPickerComponent>, @Inject(MAT_BOTTOM_SHEET_DATA) data: FieldPresetDialogData) {
    this.formats = data.formats
  }

  ngOnInit(): void {

  }

  onPresetClicked(preset: PresetFormat) {
    this.bottomSheetRef.dismiss(preset)
  }

}