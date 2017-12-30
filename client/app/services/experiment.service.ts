import { ResearcherAuthService } from './researcher.auth.service';
import { ResearchApiService } from './research-api.service';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/publishReplay';

export class ExperimentService {

  private _loadExperimentQuery: Observable<any> = null
  private _loadManagerInfoQuery: Observable<any> = null
  private _loadInvitationListQuery: Observable<Array<any>> = null

  constructor(readonly experimentId: string, private http: Http, private authService: ResearcherAuthService, private researchApi: ResearchApiService) {
    this.reloadExperiment()
  }

  reloadExperiment(): Observable<any>{
    this._loadExperimentQuery = null
    return this.getExperiment()
  }

  getExperiment(): Observable<any>{
    if(this._loadExperimentQuery==null)
    {
      this._loadExperimentQuery = this.http.get('/api/research/experiments/' + this.experimentId, this.researchApi.authorizedOptions)
      .map(res => {
        return res.json()
      })
      .publishReplay(1).refCount()
    }

    return this._loadExperimentQuery
  }

  getManagerInfo(): Observable<any>{
    if(this._loadManagerInfoQuery == null)
    {
      this._loadManagerInfoQuery = this.http.get('/api/research/experiments/manager/' + this.experimentId, this.researchApi.authorizedOptions)
      .map(res=>{
        return res.json()
      })
      .publishReplay(1).refCount()
    }
    return this._loadManagerInfoQuery
  }

  getInvitations(): Observable<Array<any>>{
    if(this._loadInvitationListQuery == null)
    {
      this._loadInvitationListQuery = this.http.get('/api/research/experiments/' + this.experimentId + "/invitations", this.researchApi.authorizedOptions)
        .map(res=>{
          return res.json()
        })
        .publishReplay(1).refCount()
    }
    return this._loadInvitationListQuery
  }

  invalidateInvitations(){
    this._loadInvitationListQuery = null
  }

  generateInvitation(information): Observable<any>{
    return this.http.post("/api/research/experiments/" + this.experimentId + '/invitations/new', information, this.researchApi.authorizedOptions).map(res=>res.json())
  }

  removeInvitation(invitation): Observable<any>{
    return this.http.delete("/api/research/experiments/" + this.experimentId + '/invitations/' + invitation._id, this.researchApi.authorizedOptions).map(
      res=>res.json()
    )
  }

  getOmniTrackPackages(): Observable<Array<any>>{
    return this.getExperiment().map(exp=>{
      return exp.trackingPackages
    })
  }

  getOmniTrackPackage(key: string): Observable<any>{
    return this.getOmniTrackPackages().map(list=>{
      return list.find(l=>l.key == key)
    })
  }
}
