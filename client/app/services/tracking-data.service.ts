import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { Http } from '@angular/http';
import { ResearchApiService } from './research-api.service';
import { ExperimentService } from './experiment.service';
import { SocketService } from './socket.service';
import { Subscription } from 'rxjs/Subscription'; 
import 'rxjs/add/operator/combineLatest';
import { SocketConstants } from '../../../omnitrack/core/research/socket';
import { ITrackerDbEntity, IItemDbEntity, ITriggerDbEntity } from '../../../omnitrack/core/db-entity-types';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class TrackingDataService implements OnInit, OnDestroy{

  private readonly _internalSubscriptions = new Subscription()
  private readonly dataConsumerTags = new Set<string>()

  readonly trackers = new BehaviorSubject<Array<ITrackerDbEntity>>([])
  readonly triggers = new BehaviorSubject<Array<ITriggerDbEntity>>([])
  readonly items = new BehaviorSubject<Array<ITrackerDbEntity>>([])
  

  get hasConsumers(): boolean{
    return this.dataConsumerTags.size > 0
  }

  constructor(
    private http: Http,
    private socketService: SocketService,
    private api: ResearchApiService,
    private experimentService: ExperimentService){
  }

  ngOnInit(): void {
    this._internalSubscriptions.add(
      this.socketService.onConnected.combineLatest(
        this.experimentService.getParticipants(), (socket, participants) => {
          if(participants.length > 0)
          {
            socket.emit(SocketConstants.SERVER_EVENT_RESUBSCRIBE_PARTICIPANT_TRACKING_DATA, {experimentId: this.experimentService.experimentId, userIds: participants.map(p => p.user._id)})
          }else{
            socket.emit(SocketConstants.SERVER_EVENT_UNSUBSCRIBE_PARTICIPANT_TRACKING_DATA, {experiment: this.experimentService.experimentId})
          }
        }).subscribe(
        result => {
          console.log("websocket subscription updated with participants.")
        }
      )
    )
  }
  
  ngOnDestroy(): void {
    this.socketService.socket.emit(SocketConstants.SERVER_EVENT_UNSUBSCRIBE_PARTICIPANT_TRACKING_DATA, {experimentId: this.experimentService.experimentId})

    this._internalSubscriptions.unsubscribe()
  }
  
  registerConsumer(tag: string):boolean{
    const needRefresh = this.dataConsumerTags.size == 0
    const appendedThisTime = !this.dataConsumerTags.has(tag)
    this.dataConsumerTags.add(tag)

    if(needRefresh)
    {
      //perform load
      
    }

    return appendedThisTime
  }

  unregisterConsumer(tag: string): boolean{
    const removedThisTime = this.dataConsumerTags.delete(tag)
    return removedThisTime
  }

  reloadTrackers(){
    this._internalSubscriptions.add(
      this.http
    )
  }

  reloadItems(){

  }

  reloadTriggers(){

  }
  
}