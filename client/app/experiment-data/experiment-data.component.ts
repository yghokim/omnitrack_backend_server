import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-experiment-data',
  templateUrl: './experiment-data.component.html',
  styleUrls: ['./experiment-data.component.scss']
})
export class ExperimentDataComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  constructor() { 

  }

  ngOnInit() {

  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

}
