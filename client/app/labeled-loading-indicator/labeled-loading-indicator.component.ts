import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-labeled-loading-indicator',
  templateUrl: './labeled-loading-indicator.component.html',
  styleUrls: ['./labeled-loading-indicator.component.scss']
})
export class LabeledLoadingIndicatorComponent implements OnInit {

  @Input() spinnerColor = "primary"

  constructor() { }

  ngOnInit() {
  }

}
