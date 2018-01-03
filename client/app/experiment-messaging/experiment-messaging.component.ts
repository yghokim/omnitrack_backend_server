import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-experiment-messaging',
  templateUrl: './experiment-messaging.component.html',
  styleUrls: ['./experiment-messaging.component.scss']
})
export class ExperimentMessagingComponent implements OnInit {

  constructor(private dialog: MatDialog, private router: Router, private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
  }

  onTabChanged(event) {
    console.log(event.index)
  }

  onNewMessageClicked() {
    this.router.navigate(['./new'], { relativeTo: this.activatedRoute })
  }

}
