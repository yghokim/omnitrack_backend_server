import { Component, OnInit, Inject } from '@angular/core';
import { IAttributeDbEntity } from '../../../../../../omnitrack/core/db-entity-types';
import AttributeManager from '../../../../../../omnitrack/core/attributes/attribute.manager';
import AttributeHelper from '../../../../../../omnitrack/core/attributes/attribute.helper';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export class PresetFormat { 
  constructor(
  public fieldType: number,
  public iconName: string, 
  public label: string, 
  public description: string,
  public generator?: (field: IAttributeDbEntity) => void ){}
}

export interface FieldPresetDialogData {
  formats: Array<PresetFormat>
}

@Component({
  selector: 'app-field-preset-picker',
  templateUrl: './field-preset-picker.component.html',
  styleUrls: ['./field-preset-picker.component.scss']
})
export class FieldPresetPickerComponent implements OnInit {

  formats: Array<PresetFormat> = []

  constructor(private dialogRef: MatDialogRef<FieldPresetPickerComponent>, @Inject(MAT_DIALOG_DATA) data: FieldPresetDialogData) {
    this.formats = data.formats
  }

  ngOnInit(): void {

  }

}