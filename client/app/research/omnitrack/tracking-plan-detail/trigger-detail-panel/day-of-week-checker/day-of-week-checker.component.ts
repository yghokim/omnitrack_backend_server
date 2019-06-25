import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

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
  static FLAG_SUNDAY = 0b1000000
  static FLAG_MONDAY = 0b0100000
  static FLAG_TUESDAY = 0b0010000
  static FLAG_WEDNESDAY = 0b0001000
  static FLAG_THURSDAY = 0b0000100
  static FLAG_FRIDAY = 0b0000010
  static FLAG_SATURDAY = 0b0000001
  static FLAGS = [
    DayOfWeekCheckerComponent.FLAG_SUNDAY,
    DayOfWeekCheckerComponent.FLAG_MONDAY,
    DayOfWeekCheckerComponent.FLAG_TUESDAY,
    DayOfWeekCheckerComponent.FLAG_WEDNESDAY,
    DayOfWeekCheckerComponent.FLAG_THURSDAY,
    DayOfWeekCheckerComponent.FLAG_FRIDAY,
    DayOfWeekCheckerComponent.FLAG_SATURDAY
  ]

  @Input()
  set checkedDaysInteger(integer: number) {
    this.checkedDays = DayOfWeekCheckerComponent.FLAGS.map(
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