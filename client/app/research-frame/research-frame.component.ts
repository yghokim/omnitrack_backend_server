import { Component, OnInit } from '@angular/core';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { NotificationService } from '../services/notification.service';
import { Router } from '@angular/router';
import { ResearchApiService } from '../services/research-api.service';

@Component({
  selector: 'app-research-frame',
  templateUrl: './research-frame.component.html',
  styleUrls: ['./research-frame.component.scss']
})
export class ResearchFrameComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
}
