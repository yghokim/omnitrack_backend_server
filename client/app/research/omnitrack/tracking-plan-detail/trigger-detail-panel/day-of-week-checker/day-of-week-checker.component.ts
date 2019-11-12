import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { TriggerConstants } from '../../../../../../../omnitrack/core/trigger/trigger-constants';

@Component({
  selector: 'app-day-of-week-checker',
  templateUrl: './day-of-week-checker.component.html',
  styleUrls: ['./day-of-week-checker.component.scss'],
  animations: [
    trigger('dowShowHide', [
      transition(':enter', [
        style({ transform: 'scale(0)' }),
        animate('0.2s ease-in-out', style({ transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('0.3s ease-in-out', style({ transform: 'scale(0)' }))
      ])
    ])
  ]
})
export class DayOfWeekCheckerComponent implements OnInit {

  static DOW_NAME = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  @Input()
  set checkedDaysInteger(integer: number) {
    this.checkedDays = TriggerConstants.FLAGS.map(
      flag => {
        return (integer & flag) !== 0
      }
    )
  }

  @Input()
  checkedDays = [true, true, true, true, true, true, true]

  @Output()
  checkedDaysIntegerChange = new EventEmitter<number>()

  constructor() {

  }

  ngOnInit(): void {

  }

  onCheckedChanged(index: number) {
    this.checkedDays[index] = !this.checkedDays[index]

    let integer = 0
    this.checkedDays.forEach((flag, i) => {
      if (flag === true) {
        integer = integer | (1 << (6 - i))
      }
    })
    console.log(integer)

    this.checkedDaysIntegerChange.emit(
      integer
    )
  }

  getDowName(index: number): string {
    return DayOfWeekCheckerComponent.DOW_NAME[index]
  }

  trackByIndex(index, obj) {
    return index
  }

}