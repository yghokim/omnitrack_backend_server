import { Component, OnInit } from '@angular/core';
import { ResearcherAuthService } from '../services/researcher.auth.service';

@Component({
  selector: 'app-research-home-frame',
  templateUrl: './research-home-frame.component.html',
  styleUrls: ['./research-home-frame.component.scss']
})
export class ResearchHomeFrameComponent implements OnInit {

  mainGnbs=[
    {
      url: 'experiments',
      name: 'Experiments',
      secure: true
    }
  ]

  constructor(private auth: ResearcherAuthService) {
  }

  ngOnInit() {
  }

}
