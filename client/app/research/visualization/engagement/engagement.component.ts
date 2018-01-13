import { Component, OnInit } from '@angular/core';
import { VisualizationBaseComponent } from '../visualization-base.component';

@Component({
  selector: 'app-engagement',
  templateUrl: './engagement.component.html',
  styleUrls: ['./engagement.component.scss']
})
export class EngagementComponent extends VisualizationBaseComponent<EngagementData> implements OnInit {

  isBusy = true

  constructor() {
    super();
    
   }

  ngOnInit() {
  }

}

export interface EngagementData{

}
