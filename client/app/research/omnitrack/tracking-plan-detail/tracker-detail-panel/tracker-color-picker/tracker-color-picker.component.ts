import { Component, Inject, AfterViewInit, ViewChild, ElementRef } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import * as AColorPicker from 'a-color-picker';
import * as color from 'color';

@Component({
  selector: 'app-tracker-color-picker',
  styleUrls: ['./tracker-color-picker.component.scss'],
  templateUrl: './tracker-color-picker.component.html'
})
export class TrackerColorPickerComponent implements AfterViewInit {

  private colorPicker: AColorPicker.ACPController

  @ViewChild("pickerBody") pickerBody: ElementRef

  initialColor: any

  constructor(private dialogRef: MatDialogRef<TrackerColorPickerComponent>,
    @Inject(MAT_DIALOG_DATA) private initialColorRaw: any) {
      this.initialColor = color(initialColorRaw).hex()
  }

  ngAfterViewInit(): void {
    this.colorPicker = AColorPicker.createPicker(this.pickerBody.nativeElement,{
      showAlpha: false,
      showHSL: false,
      color: this.initialColor
    })
  }

  onCancel(){
    this.dialogRef.close(null)
  }

  onOk(){
    if(this.colorPicker!=null){
      this.dialogRef.close(this.colorPicker.color)
    }
  }

}
