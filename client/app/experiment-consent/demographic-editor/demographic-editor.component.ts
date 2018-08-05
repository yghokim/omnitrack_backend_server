import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';
import { flatMap, tap, map, filter, combineLatest, debounceTime } from 'rxjs/operators';
import { DiffEditorModel } from 'ngx-monaco-editor';
import { IExperimentDbEntity } from '../../../../omnitrack/core/research/db-entity-types';
import { ResearchApiService } from '../../services/research-api.service';
import * as deepEqual from 'deep-equal';

@Component({
  selector: 'app-demographic-editor',
  templateUrl: './demographic-editor.component.html',
  styleUrls: ['../../../styles-questionnaires.scss', '../../code-editor.scss', './demographic-editor.component.scss']
})
export class DemographicEditorComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  private exampleSchema = {
    schema: {
            gender: {
              type: "string",
              title: "Gender",
              required: true,
              enum: [ "male", "female", "unspecified" ]
            },
            age: {
              type: "integer",
              required: true,
              title: "Age"
            },
            occupation: {
              type: "array",
              required: true,
              title: "What motivated you to participate in this experiment? Check all that apply",
              items: {
                type: "string",
                enum: [
                "directive",
                "documentary",
                "track",
                "diagnostic",
                "self-knowledge",
                "social",
                "fetishised"
                ]
              }
            }
    },
    form: [
      {
        key: "age",
        type: "number"
      },
      {
        key: "gender",
        type: "radios",
        titleMap: {
          male: "Male",
          female: "Female",
          unspecified: "Prefer not to answer"
        }
      },
      {
        key: "occupation",
        type:"checkboxes",
        titleMap: {
          directive: "To record health-related info",
          documentary: "For document reviews or diaries",
          track: "To keep track of habits or routines",
          diagnostic: "To find causes of problems of myself",
          "self-knowledge": "To understand myself better",
          social: "To track something together with other people",
          fetishised: "Just for technological curiosity"
        }
      }
    ]
  }

  public readonly editorOptions = {
    theme: 'vs-dark', language: 'json',
    automaticLayout: true,
    wordWrap: 'on',
    fontSize: 14,
    minimap: {
      enabled: false
    }
  };

  public readonly diffOptions = {
    theme: 'vs-dark',
  }

  public diffMode = false
  public originalModel: DiffEditorModel = null
  public changedModel: DiffEditorModel = null

  public readonly editorRef = new BehaviorSubject<any>(null)
  public editorReady: boolean = false

  private readonly currentSchemaSubjectForPreview = new BehaviorSubject<any>(null)

  public originalSchema: any = null
  public currentSchema: any = null

  public isSchemaChanged: boolean = false

  public isCodeValid: boolean = false

  private _schemaCode: string
  public get schemaCode(): string { return this._schemaCode }
  public set schemaCode(code: string) {
    this._schemaCode = code
    try {
      const json = JSON.parse(code)
      this.isCodeValid = true
      this.isSchemaChanged = !deepEqual(this.originalSchema, json)
      this.currentSchema = json
      this.currentSchemaSubjectForPreview.next(this.currentSchema)
    } catch (e) {
      console.error(e)
      this.isCodeValid = false
      this.currentSchemaSubjectForPreview.next(null)
    }
  }

  private experimentInfo: IExperimentDbEntity

  constructor(private api: ResearchApiService, private router: Router, private activatedRoute: ActivatedRoute) {

  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(
        flatMap((expService) => expService.getExperiment()),
        tap(experimentInfo => {
          this.experimentInfo = experimentInfo
        }),
        map(experimentInfo => experimentInfo.demographicFormSchema),
        combineLatest(this.editorRef.pipe(filter(e => e != null)), (schema, editor) => ({ schema: schema, editor: editor }))
      ).subscribe(result => {
        this.originalSchema = result.schema || {}

        this.schemaCode = JSON.stringify(result.schema != null ? this.originalSchema : this.exampleSchema, null, "\t")
        result.editor.setValue(this.schemaCode)
      })
    )

    this._internalSubscriptions.add(
      this.currentSchemaSubjectForPreview.pipe(
        debounceTime(300)
      ).subscribe(
        schema => {
          $('.jsonform-container').html("")
          if(schema != null){
            ($('.jsonform-container') as any).jsonForm(schema)
          }else{
            $('.jsonform-container').html("Illegal Schema")
          }
        }
      )
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  onInitCodeEditor(editor) {
    this.editorReady = true
    this.editorRef.next(editor)
  }

  onSaveClicked() {

    console.log(this.currentSchema)
    this._internalSubscriptions.add(
      this.api.updateExperiment(this.api.getSelectedExperimentId(), { demographicFormSchema: this.currentSchema }).subscribe(
        changed => {
          if (changed === true) {
            this.experimentInfo.demographicFormSchema = this.currentSchema
          }
          this.router.navigate(['./consent'], { relativeTo: this.activatedRoute.parent })
        }
      )
    )
  }

  onShowDiffClicked() {
    this.diffMode = !this.diffMode
    if (this.diffMode === true) {
      this.originalModel = {
        language: 'json',
        code: this.schemaCode
      }
      this.changedModel = {
        language: 'json',
        code: JSON.stringify(this.originalSchema, null, "\t")
      }
    }
  }
}
