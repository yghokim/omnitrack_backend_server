import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { ResearchApiService } from '../services/research-api.service';
import { IExperimentDbEntity } from '../../../omnitrack/core/research/db-entity-types';
import * as marked from 'marked';

interface DemographicFieldInfo{
  name: string,
  type: string,
  title: string,
  required: boolean
}

@Component({
  selector: 'app-experiment-consent',
  templateUrl: './experiment-consent.component.html',
  styleUrls: ['./experiment-consent.component.scss']
})
export class ExperimentConsentComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  public experiment: IExperimentDbEntity

  public isConsentExpanded = false

  public demographicFields : Array<DemographicFieldInfo> = []

  constructor(private api: ResearchApiService, private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(flatMap(expService => expService.getExperiment())).subscribe(experiment => {
        this.experiment = experiment
        console.log(experiment)
        if(experiment.demographicFormSchema && experiment.demographicFormSchema.schema){
          if(experiment.demographicFormSchema.form){
            this.demographicFields = experiment.demographicFormSchema.form.map(
              f => {
                const schemaField = experiment.demographicFormSchema.schema[f.key]
                return {type: schemaField.type, name: f.key, title: schemaField.title, required: schemaField.required || false}
              }
            )
          }else{
            this.demographicFields = Object.keys(experiment.demographicFormSchema.schema).map(
              key => {
                const s = experiment.demographicFormSchema.schema[key]
                return {type: s.type, name: key, title: s.title, required: s.required || false}
              }
            )
          }
        }else{
          this.demographicFields = []
        }
      })
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  onAskConsentInAppToggled(value: boolean) {
    this._internalSubscriptions.add(
      this.api.updateExperiment(this.experiment._id, {
        receiveConsentInApp: value
      }).subscribe(
        changed => {
          if (changed === true) {
            this.experiment.receiveConsentInApp = value
          }
        }
      )
    )
  }

  isConsentFormContentAvailable(): boolean {
    return this.experiment.consent != null && this.experiment.consent.trim().length > 0
  }

  onEditConsentFormClicked() {
    this.router.navigate(["consent/edit"], { relativeTo: this.activatedRoute.parent })
  }

  getTransformedConsent(): string {
    return marked(this.experiment.consent)
  }

  isDemographicAvailable(): boolean {
    return this.experiment.demographicFormSchema != null && this.experiment.demographicFormSchema != {}
  }

  onEditDemographicClicked() {
    this.router.navigate(["consent/demographic"], { relativeTo: this.activatedRoute.parent })
  }

}
