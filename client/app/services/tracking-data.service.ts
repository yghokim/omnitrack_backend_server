import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { Http } from '@angular/http';
import { ResearchApiService } from './research-api.service';
import { ExperimentService } from './experiment.service';
import { SocketService } from './socket.service';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription'; 
import 'rxjs/add/operator/combineLatest';
import { SocketConstants } from '../../../omnitrack/core/research/socket';
import { ITrackerDbEntity, IItemDbEntity, ITriggerDbEntity, IAttributeDbEntity } from '../../../omnitrack/core/db-entity-types';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class TrackingDataService implements OnInit, OnDestroy{

  private readonly _internalSubscriptions = new Subscription()
  private readonly dataConsumerTags = new Set<string>()

  readonly trackers = new BehaviorSubject<Array<ITrackerDbEntity>>([])
  readonly triggers = new BehaviorSubject<Array<ITriggerDbEntity>>([])
  readonly items = new BehaviorSubject<Array<IItemDbEntity>>([])
  
  readonly lastSynchronizedAt = new BehaviorSubject<number>(null)

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
          this.lastSynchronizedAt.next(new Date().getTime())
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

  reloadAll(){
    this.reloadTrackers()
    this.reloadItems()
    this.reloadTriggers()
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

  setItemColumnValue(attribute: IAttributeDbEntity, item: IItemDbEntity, newSerializedValue: string): Observable<{success: boolean, error?: any, changedItem?:IItemDbEntity}>
  {
    console.log("body:")
    console.log({attrLocalId: attribute.localId, itemQuery: {_id: item._id}, serializedValue: newSerializedValue})
    return this.http.post("/api/research/tracking/update/item_column", {attrLocalId: attribute.localId, itemQuery: {_id: item._id}, serializedValue: newSerializedValue}, 
    this.api.authorizedOptions).map(r=>r.json()).do(result=>{
      if(result.changedItem){
        if(this.items.value){
          const matchIndex = this.items.value.findIndex(i => i._id === result.changedItem._id)
          if(matchIndex != -1){
            this.items.value[matchIndex] = result.changedItem
          }
          else{
            this.items.value.push(result.changedItem)
          }

          this.items.next(this.items.value)
        }
      }
    })
  }

  setItemTimestamp(item: IItemDbEntity, newTimestamp: number, newTimezone: String): Observable<{success: boolean, error?: any, changedItem?:IItemDbEntity}>{
    return this.http.post('/api/research/tracking/update/item_timestamp', {itemQuery: {_id: item._id}, timestamp: newTimestamp, timezone: newTimezone}, this.api.authorizedOptions).map(r=>r.json()).do(result=>{
      if(result.changedItem){
        if(this.items.value){
          const matchIndex = this.items.value.findIndex(i => i._id === result.changedItem._id)
          if(matchIndex != -1){
            this.items.value[matchIndex] = result.changedItem
          }
          else{
            this.items.value.push(result.changedItem)
          }

          this.items.next(this.items.value)
        }
      }
    })
  }
}