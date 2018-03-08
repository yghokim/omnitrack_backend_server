import { Injectable, OnDestroy } from "@angular/core";
import { AngularFireAuth } from "angularfire2/auth";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Subscription } from "rxjs/Subscription";
import {
  ITrackerDbEntity,
  IItemDbEntity
} from "../../../../omnitrack/core/db-entity-types";
import 'rxjs/add/operator/combineLatest';
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
  private authorizedOptions = new BehaviorSubject<RequestOptions>(null);

  private authRequestOptions = this.auth.authState.combineLatest(this.authorizedOptions.filter(o => o != null), (user, options) => { return { user: user, options: options } })

  constructor(private auth: AngularFireAuth, private http: Http) {
    this._internalSubscriptions.add(
      auth.idToken.subscribe(token => {
        if (token) {
          this.tokenHeaders = new Headers({ Authorization: "Bearer " + token });
          this.authorizedOptions.next(new RequestOptions({
            headers: this.tokenHeaders
          }))
        } else {
          this.tokenHeaders = null
          this.authorizedOptions = null
        }
      })
    );
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe();
  }

  private loadChildren<T>(path: string, subject: BehaviorSubject<T>) {
    this._internalSubscriptions.add(
      this.authRequestOptions
        .flatMap(result => {
          if (result.user) {
            return this.http
              .get("/api/" + path, result.options)
              .map(res => res.json().filter(t => t.removed !== true));
          } else {
            return Observable.of([]);
          }
        })
        .subscribe(children => {
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

  loadItemsofTracker(trackerId: string) {
    this._internalSubscriptions.add(
      this.authRequestOptions
        .flatMap(result => {
          if (result.user) {
            return this.http
              .get("/api/trackers/" + trackerId + "/items", result.options)
              .map(res => res.json().filter(t => t.removed !== true));
          } else {
            return Observable.of([]);
          }
        })
        .subscribe(children => {
          (this.getItemsOfTracker(trackerId) as BehaviorSubject<Array<IItemDbEntity>>).next(children)
        })
    );
  }

  getItemsOfTracker(trackerId: string): Observable<Array<IItemDbEntity>> {
    if (this.itemsPerTrackerDict.has(trackerId)) {
      return this.itemsPerTrackerDict.get(trackerId)
    }
    else {
      const newSubject = new BehaviorSubject<Array<IItemDbEntity>>([])
      this.itemsPerTrackerDict.set(trackerId, newSubject)
      return newSubject
    }
  }

  getExperimentParticipationList(): Observable<Array<any>> {
    return this.authRequestOptions.flatMap(result => {
      if (result.user) {
        return this.http.get('/api/research/experiments/history', result.options).map(list => list.json())
      }
      else return Observable.of([])
    })
  }
}
