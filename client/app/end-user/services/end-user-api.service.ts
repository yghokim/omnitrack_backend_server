import { Injectable, OnDestroy } from "@angular/core";
import { AngularFireAuth } from "angularfire2/auth";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Subscription } from "rxjs/Subscription";
import {
  ITrackerDbEntity,
  IItemDbEntity
} from "../../../../omnitrack/core/db-entity-types";
import { Http, Headers, RequestOptions } from "@angular/http";
import { Observable } from "rxjs/Observable";

@Injectable()
export class EndUserApiService implements OnDestroy {
  private readonly _internalSubscriptions = new Subscription();

  readonly trackers = new BehaviorSubject<Array<ITrackerDbEntity>>([]);
  readonly triggers = new BehaviorSubject<Array<ITrackerDbEntity>>([]);

  private readonly itemsPerTrackerDict = new Map<
    string,
    BehaviorSubject<Array<IItemDbEntity>>
  >();

  private tokenHeaders: Headers;
  private authorizedOptions: RequestOptions;

  constructor(private auth: AngularFireAuth, private http: Http) {
    this._internalSubscriptions.add(
      auth.idToken.subscribe(token => {
        if (token) {
          this.tokenHeaders = new Headers({ Authorization: "Bearer " + token });
          this.authorizedOptions = new RequestOptions({
            headers: this.tokenHeaders
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe();
  }

  private loadChildren<T>(path: string, subject: BehaviorSubject<T>) {
    this._internalSubscriptions.add(
      this.auth.authState
        .flatMap(user => {
          if (user) {
            return this.http
              .get("/api/" + path, this.authorizedOptions)
              .map(res => res.json());
          } else {
            return Observable.of([]);
          }
        })
        .subscribe(children => {
          console.log(children);
          subject.next(children);
        })
    );
  }

  loadTrackers() {
    this.loadChildren("trackers", this.trackers);
  }

  loadTriggers() {
    this.loadChildren("triggers", this.triggers);
  }

  loadItemsofTracker(trackerId: string){
    this._internalSubscriptions.add(
      this.auth.authState
        .flatMap(user => {
          if (user) {
            return this.http
              .get("/api/trackers/" + trackerId + "/items", this.authorizedOptions)
              .map(res => res.json());
          } else {
            return Observable.of([]);
          }
        })
        .subscribe(children => {
          console.log(children);
          (this.getItemsOfTracker(trackerId) as BehaviorSubject<Array<IItemDbEntity>>).next(children)
        })
    );
  }

  getItemsOfTracker(trackerId: string): Observable<Array<IItemDbEntity>>{
    if(this.itemsPerTrackerDict.has(trackerId)){
      return this.itemsPerTrackerDict.get(trackerId)
    }
    else{
      const newSubject = new BehaviorSubject<Array<IItemDbEntity>>([])
      this.itemsPerTrackerDict.set(trackerId, newSubject)
      return newSubject
    }
  }
}
