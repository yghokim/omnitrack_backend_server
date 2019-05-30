import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";

@Component({
  selector: "app-update-item-cell-value-dialog",
  templateUrl: "./update-item-cell-value-dialog.component.html",
  styleUrls: ["./update-item-cell-value-dialog.component.scss"]
})
export class UpdateItemCellValueDialogComponent implements OnInit {
  public info;
  public currentSerializedValue;

  constructor(
    public dialogRef: MatDialogRef<UpdateItemCellValueDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.info = data.info;
  }

  ngOnInit() {}

  onYesClick() {
    this.dialogRef.close({ value: this.currentSerializedValue });
  }

  onNoClick() {
    this.dialogRef.close();
  }
}
