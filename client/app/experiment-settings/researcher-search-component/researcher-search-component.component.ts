import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ResearchApiService } from '../../services/research-api.service';
import { Subject } from "rxjs/Subject";
import { Observable } from "rxjs/Observable";
import {Subscription } from 'rxjs/Subscription';
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";
import { MatMenuTrigger } from '@angular/material';
import {FormControl} from '@angular/forms';
import { CollaboratorExperimentPermissions } from '../../../../omnitrack/core/research/experiment';

@Component({
  selector: 'app-researcher-search-component',
  templateUrl: './researcher-search-component.component.html',
  styleUrls: ['./researcher-search-component.component.scss']
})
export class ResearcherSearchComponentComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()
  private readonly searchTerm = new Subject<string>()

  private readonly formControl = new FormControl()

  private searchResults = []

  constructor(private api: ResearchApiService) { 

  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.searchTerm.asObservable()
        .debounceTime(400)
        .distinctUntilChanged()
        .flatMap(
          term => {
            console.log(term)
            if(term)
            {
              if(term.trim().length > 0)
              {
                return this.api.searchResearchers(term, true)
              }
            }
            return Observable.of([])
          }
        )
        .subscribe(
          list=>{
            console.log(list)
            this.searchResults = list
          }
        )
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  onInput(value:string){
    
    this.searchTerm.next(value)
  }

  isAdditionValid():boolean{
    return this.searchResults.find(r=>r.email == this.formControl.value)
  }  

  onAddCollaboratorClicked(){
    const collaborator = this.searchResults.find(r=>r.email == this.formControl.value)
    if(collaborator)
    {
       this._internalSubscriptions.add(
         this.api.selectedExperimentService.flatMap(
           service=>service.addCollaborator(collaborator._id, new CollaboratorExperimentPermissions())
         ).subscribe(
           success=>{
             console.log(success)
           }
         )
       )
    }
  }

}
