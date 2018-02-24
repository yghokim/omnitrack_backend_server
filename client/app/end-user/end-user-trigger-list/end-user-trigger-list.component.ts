import { Component, OnInit } from '@angular/core';
import { EndUserApiService } from '../services/end-user-api.service';

@Component({
  selector: 'app-end-user-trigger-list',
  templateUrl: './end-user-trigger-list.component.html',
  styleUrls: ['./end-user-trigger-list.component.scss']
})
export class EndUserTriggerListComponent implements OnInit {

  constructor(private api: EndUserApiService) {

   }

  ngOnInit() {
    this.api.loadTriggers()
  }

}
