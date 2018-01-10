import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from './research-api.service';
import { ExperimentService } from './experiment.service';


export class TrackingDataService implements OnInit, OnDestroy{


  constructor(private api: ResearchApiService, private experimentService: ExperimentService){

  }

  ngOnInit(): void {

  }
  
  ngOnDestroy(): void {

  }
  
  
}