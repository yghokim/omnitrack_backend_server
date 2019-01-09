import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-backend-not-respond',
  templateUrl: './backend-not-respond.component.html',
  styleUrls: ['./backend-not-respond.component.scss']
})
export class BackendNotRespondComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  onRetryClicked(){
    this.router.navigate(['/'])
  }
}
