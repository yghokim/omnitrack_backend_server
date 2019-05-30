import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { Subject, Subscription, of } from "rxjs";
import { debounceTime, distinctUntilChanged, flatMap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { ExperimentPermissions } from '../../../../omnitrack/core/research/experiment';

@Component({
  selector: 'app-researcher-search',
  templateUrl: './researcher-search.component.html',
  styleUrls: ['./researcher-search.component.scss']
})
export class ResearcherSearchComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()
  private readonly searchTerm = new Subject<string>()

  public readonly formControl = new FormControl()

  public searchResults = []

  constructor(private api: ResearchApiService) {

  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.searchTerm.asObservable().pipe(
        debounceTime(400),
        distinctUntilChanged(),
        flatMap(
          term => {
            console.log(term)
            if (term) {
              if (term.trim().length > 0) {
                return this.api.searchResearchers(term, true)
              }
            }
            return of([])
          }
        )
      )
        .subscribe(
          list => {
            console.log(list)
            this.searchResults = list
          }
        )
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  onInput(value: string) {

    this.searchTerm.next(value)
  }

  isAdditionValid(): boolean {
    return this.searchResults.find(r => r.email == this.formControl.value)
  }

  onAddCollaboratorClicked() {
    const collaborator = this.searchResults.find(r => r.email == this.formControl.value)
    if (collaborator) {
      this._internalSubscriptions.add(
        this.api.selectedExperimentService.pipe(flatMap(
          service => service.addCollaborator(collaborator._id, ExperimentPermissions.makeCollaboratorDefaultPermissions())
        )).subscribe(
          success => {
            
          }
        )
      )
    }
  }

}
