import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { ResearcherAuthService } from './researcher.auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/publishReplay';
import ExperimentInfo from '../models/experiment-info';
import { ExperimentService } from './experiment.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Injectable()
export class ResearchApiService {

  private tokenHeaders = new Headers({ 'Authorization': 'Bearer ' + this.authService.token() });
  public authorizedOptions = new RequestOptions({ headers: this.tokenHeaders });

  private selectedExperimentId: string = null

  private experimentInfoQuery: Observable<Array<ExperimentInfo>> = null

  public readonly selectedExperimentService = new BehaviorSubject<ExperimentService>(null)

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

  setSelectedExperimentId(id: string): Observable<any> {
    if (this.selectedExperimentId != id) {
        this.selectedExperimentId = id
        this.selectedExperimentService.next(new ExperimentService(this.selectedExperimentId, this.http, this.authService, this))
    }
    
    return this.selectedExperimentService.flatMap(expService=> expService.reloadExperiment())
  }


}
