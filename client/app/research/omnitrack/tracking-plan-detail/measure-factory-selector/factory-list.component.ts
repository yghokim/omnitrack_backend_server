import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AMeasureFactory } from "../../../../../../omnitrack/core/value-connection/measure-factory";

@Component({
  selector: 'app-factory-list',
  templateUrl: './factory-list.component.html',
  styleUrls: ['./factory-list.component.scss', './measure-factory-selector.component.scss']
})
export class FactoryListComponent {

  factories: Array<AMeasureFactory>

  constructor(private dialogRef: MatDialogRef<FactoryListComponent>, @Inject(MAT_DIALOG_DATA) data: any) {
    if (data) {
      this.factories = data.factories || []
    }
  }

  onFactoryClicked(factory: AMeasureFactory){
    this.dialogRef.close(factory)
  }
}