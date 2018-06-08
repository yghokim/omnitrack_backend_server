import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { Subject, Observable, Subscription, of } from "rxjs";
import { debounceTime, distinctUntilChanged, flatMap } from 'rxjs/operators';
import { MatMenuTrigger } from '@angular/material';
import { FormControl } from '@angular/forms';
import { ExperimentPermissions } from '../../../../omnitrack/core/research/experiment';

@Component({
  selector: 'app-researcher-search-component',
  templateUrl: './researcher-search-component.component.html',
  styleUrls: ['./researcher-search-component.component.scss']
})
export class ResearcherSearchComponentComponent implements OnInit, OnDestroy {

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
            console.log(success)
          }
        )
      )
    }
  }

}
