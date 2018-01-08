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

  constructor(private authService: ResearcherAuthService, private router: Router) { }

  ngOnInit() {
  }

  signOut() {
    this.authService.signOut().subscribe((signedOut) => {
      console.log("successfully signed out.")
      this.goToSignIn()
    })
  }

  goToSignIn() {
    this.router.navigate(['/research/login'])
  }
}
