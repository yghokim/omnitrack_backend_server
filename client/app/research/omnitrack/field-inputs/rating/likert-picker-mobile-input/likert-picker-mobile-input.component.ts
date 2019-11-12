import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-likert-picker-mobile-input',
  templateUrl: './likert-picker-mobile-input.component.html',
  styleUrls: ['./likert-picker-mobile-input.component.scss']
})
export class LikertPickerMobileInputComponent implements OnInit {

  @Input()
  leftScore = 1

  @Input()
  rightScore = 5

  @Input()
  leftLabel = "strongly disagree"

  @Input()
  rightLabel = "strongly agree"

  @Input()
  midLabel = ""

  @Input()
  fractional = false

  @Input()
  score: number = null

  constructor() { }

  ngOnInit() {
  }

  get numPointsArray() {
    return Array(this.rightScore - this.leftScore + 1)
  }

}
