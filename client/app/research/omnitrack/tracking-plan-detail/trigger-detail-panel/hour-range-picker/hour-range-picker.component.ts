import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-hour-range-picker',
  templateUrl: './hour-range-picker.component.html',
  styleUrls: ['./hour-range-picker.component.scss']
})
export class HourRangePickerComponent implements OnInit {

  @Input()
  from: number

  @Input()
  to: number

  @Output()
  fromChange = new EventEmitter<number>()

  @Output()
  toChange = new EventEmitter<number>()

  ngOnInit(): void {

  }

  formatHour(hour: number): string {
    return moment({ hour: hour, minute: 0, second: 0 }).format('HH:00')
  }

  onUp(time: string) {
    switch (time) {
      case 'from':
        this.from++
        if (this.from > 23) {
          this.from = 0
        }
        this.fromChange.emit(this.from)
        break;
      case 'to':
        this.to++
        if (this.to > 23) {
          this.to = 0
        }
        this.toChange.emit(this.to)
        break;
    }
  }

  onDown(time: string) {
    switch (time) {
      case 'from':
        this.from--
        if(this.from < 0){
          this.from = 23
        }
        this.fromChange.emit(this.from)
        break;
      case 'to':
        this.to--
        if(this.to < 0){
          this.to = 23
        }
        this.toChange.emit(this.to)
        break;
    }
  }
}