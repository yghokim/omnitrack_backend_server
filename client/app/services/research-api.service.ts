import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { ResearcherAuthService } from './researcher.auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/publishReplay';
import ExperimentInfo from '../models/experiment-info';
import { ExperimentService } from './experiment.service';

@Injectable()
export class ResearchApiService {

  private tokenHeaders = new Headers({ 'Authorization': 'Bearer ' + this.authService.token() });
  public authorizedOptions = new RequestOptions({ headers: this.tokenHeaders });

  private selectedExperimentId: string = null

  private experimentInfoQuery: Observable<Array<ExperimentInfo>> = null

  private _experimentService: ExperimentService = null
  constructor(private http: Http, private authService: ResearcherAuthService) { }

  getExperimentInfos(): Observable<Array<ExperimentInfo>> {
    if (!this.experimentInfoQuery) {
      this.experimentInfoQuery = this.http.get('/api/research/experiments/all', this.authorizedOptions).map(res => {
        return res.json().map(
          exp => {
            const info = new ExperimentInfo()
            info.id = exp._id
            info.name = exp.name
            info.isAdmin = exp.manager == this.authService.currentResearcher.uid
            return info
          }
        )
      }).publishReplay(1).refCount()
    }
    return this.experimentInfoQuery
  }

  getSelectedExperimentId(): string {
    return this.selectedExperimentId
  }

  
  selectedExperimentService(): ExperimentService{
    if(this._experimentService==null)
    {
      this._experimentService = new ExperimentService(this.selectedExperimentId, this.http, this.authService, this)
    }
    return this._experimentService
  }

  setSelectedExperimentId(id: string): Observable<any> {
    return Observable.defer(() => {
      if (this.selectedExperimentId != id) {
        this.selectedExperimentId = id
        this._experimentService = null
      }
      return Observable.of(this.selectedExperimentService())
    }).flatMap(expService=>expService.reloadExperiment())
  }


}
