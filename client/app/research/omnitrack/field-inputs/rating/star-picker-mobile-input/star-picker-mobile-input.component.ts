import { Component, Input, OnInit } from '@angular/core';

enum EStarMode {
  Empty = 'empty',
  Half = 'half',
  Full = 'full'
}

@Component({
  selector: 'app-star-picker-mobile-input',
  templateUrl: './star-picker-mobile-input.component.html',
  styleUrls: ['./star-picker-mobile-input.component.scss']
})
export class StarPickerMobileInputComponent implements OnInit {

  //0 ~ 1
  @Input() score: number = 0.5

  @Input() numStars: number = 5

  @Input() allowMidpoint = true

  constructor() { }

  ngOnInit() {
  }

  get numStarsArray() {
    return Array(this.numStars)
  }

  getStartModeAt(index: number): EStarMode {
    if (Math.round(this.score * this.numStars) === index + 1) {
      if (this.allowMidpoint === true)
        return EStarMode.Half
      else return EStarMode.Full
    } else if (this.score * this.numStars < index + 1) {
      return EStarMode.Empty
    } else { return EStarMode.Full }
  }

}
