import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import * as moment from 'moment';

@Component({
  selector: 'app-participant-excluded-days-config-dialog',
  templateUrl: './participant-excluded-days-config-dialog.component.html',
  styleUrls: ['./participant-excluded-days-config-dialog.component.scss']
})
export class ParticipantExcludedDaysConfigDialogComponent implements OnInit {

  public list : Array<Date> = []

  public date: Date = new Date()

  constructor(private dialogRef: MatDialogRef<ParticipantExcludedDaysConfigDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.list = data.dates
   }

  ngOnInit() {
  }

  onAddClicked(){
    console.log(this.date)
    if(this.list.find(l=>l.getTime() === this.date.getTime())){

    }
    else{
      this.list.push(moment(this.date).toDate())
      this.list.sort((a, b)=>{
        return a.getTime() - b.getTime()
      })
    }
  }

  toDate(dateString): Date{
    return moment(dateString).toDate()
  }

  onRemoveClicked(index){
    this.list.splice(index, 1)
  }

  onNoClick(){
    this.dialogRef.close()
  }

  onYesClick(){
    this.dialogRef.close(this.list)
  }

}
