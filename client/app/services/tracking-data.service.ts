import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { Http } from '@angular/http';
import { ResearchApiService } from './research-api.service';
import { ExperimentService } from './experiment.service';
import { SocketService } from './socket.service';
import { Observable } from 'rxjs/Observable';
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
  readonly items = new BehaviorSubject<Array<IItemDbEntity>>([])
  

  get hasConsumers(): boolean{
    return this.dataConsumerTags.size > 0
  }

  constructor(
    private http: Http,
    private socketService: SocketService,
    private api: ResearchApiService,
    private experimentService: ExperimentService){
      console.log("initialized new trackingDataService of experiment " + this.experimentService.experimentId)
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
  
  registerConsumer(badge: string):boolean{
    console.log("try register tracking data consumer: " + badge)
    const needRefresh = this.dataConsumerTags.size == 0
    const appendedThisTime = !this.dataConsumerTags.has(badge)
    this.dataConsumerTags.add(badge)

    if(needRefresh)
    {
      //perform load
      this.reloadTrackers()
      this.reloadTriggers()
      this.reloadItems()
    }

    return appendedThisTime
  }

  unregisterConsumer(badge: string): boolean{
    console.log("try unregister tracking data consumer: " + badge)
    const removedThisTime = this.dataConsumerTags.delete(badge)
    return removedThisTime
  }

  private makeEntitiesQueryUrl(modelPath: string): string{
    return "/api/research/experiments/" + this.experimentService.experimentId + "/data/" + modelPath
  }

  reloadEntities(modelPath: string, subject: BehaviorSubject<any>, userId: string = null){
    this._internalSubscriptions.add(
      this.http.get(this.makeEntitiesQueryUrl(modelPath), this.api.makeAuthorizedRequestOptions({userId: userId})).subscribe(
        entities=>{
          subject.next(entities.json())
        }
      )
    )
  }

  reloadTrackers(){
    this.reloadEntities("trackers", this.trackers, null)
  }

  reloadItems(){
    this.reloadEntities("items", this.items, null)
  }

  reloadTriggers(){
    this.reloadEntities("triggers", this.triggers, null)
  }

  getTrackersOfUser(userId: string | Array<string>): Observable<Array<ITrackerDbEntity>>{
    return this.trackers.map( list => list.filter(t=>{
      if(userId instanceof Array){
        return userId.find(u=>u === t.user) != null
      }
      else{
        return t.user === userId
      }
    }).sort((a, b) => { 
      const aName = a.name.toUpperCase()
      const bName = b.name.toUpperCase()

      if(aName > bName) return 1
      else if(aName < bName) return -1
      else return 0
     }))
  }

  
  getTriggersOfUser(userId: string | Array<string>): Observable<Array<ITriggerDbEntity>>{
    return this.triggers.map( list => list.filter(t=>{
      if(userId instanceof Array){
        return userId.find(u=>u === t.user) != null
      }
      else return t.user === userId
    }))
  }

  
  getItemsOfUser(userId: string | Array<string>): Observable<Array<IItemDbEntity>>{
    return this.items.map( list => list.filter(t=>{
      if(userId instanceof Array){
        return userId.find(u=>u === t.user) != null
      }
      else return t.user === userId
    }))
  }

  getItemsOfTracker(trackerId: string | Array<string>): Observable<Array<IItemDbEntity>>{
    return this.items.map( list => list.filter(i => {
      if(trackerId instanceof Array){
        return trackerId.find(t=>t === i.tracker) != null
      }
      else return i.tracker === trackerId
    }))
  }
  
}