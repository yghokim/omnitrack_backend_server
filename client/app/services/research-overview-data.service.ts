import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { TrackingDataService } from './tracking-data.service';

@Injectable()
export class ResearchOverviewDataService implements OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  private readonly _scopeSubject = new BehaviorSubject(null)

  constructor(
    private trackingDataService: TrackingDataService
  ) {

  }

  ngOnInit(){
  }

  ngOnDestroy(){
    this._internalSubscriptions.unsubscribe()
  }

  set scope(range: IDateRange){
    if(this._scopeSubject.value) // value exists
    {
      if(range){
        //TODO isDifferent
          this._scopeSubject.next(range)
        
      }
      else{
        this._scopeSubject.next(range)
      }
    }
    else{
      if(range){
        this._scopeSubject.next(range)
      }
    }
  }

  get scopeSubject(): Observable<IDateRange>{
    return this._scopeSubject.filter(range => range != null)
  }

}

export interface IDateRange{
  getRange(participant): {from: number, to: number}
}