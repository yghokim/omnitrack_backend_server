import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, BehaviorSubject } from 'rxjs';
import { flatMap, map, tap } from 'rxjs/operators';
import { ResearchApiService } from '../services/research-api.service';
import { DiffEditorModel } from 'ngx-monaco-editor';
import * as marked from 'marked';
import { IExperimentDbEntity } from '../../../omnitrack/core/research/db-entity-types';

@Component({
  selector: 'app-experiment-consent-editor',
  templateUrl: './experiment-consent-editor.component.html',
  styleUrls: ['../code-editor.scss', './experiment-consent-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExperimentConsentEditorComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  public readonly editorOptions = {
    theme: 'vs-dark', language: 'markdown',
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

  public originalConsent: string = null
  public currentConsent: string = null

  private experimentInfo: IExperimentDbEntity

  constructor(private api: ResearchApiService, private router: Router, private activatedRoute: ActivatedRoute, private detector: ChangeDetectorRef) {

  }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(
        flatMap((expService) => expService.getExperiment()),
        tap(experimentInfo => {
          this.experimentInfo = experimentInfo
        }),
        map(experimentInfo => experimentInfo.consent)
      ).subscribe(consent => {
        this.originalConsent = (consent || "")

        if (consent == null) {
          this.currentConsent = "### Writing an Informed Consent Form\n\n---\n\n*Remove this content* and write your own consent form here.\n\nUse **Markdown syntax** which is Github-flavored. See [this guide](https://guides.github.com/features/mastering-markdown/) for detailed guide to Markdown."
        } else this.currentConsent = consent.toString()
        
      })
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
    this._internalSubscriptions.add(
      this.api.updateExperiment(this.api.getSelectedExperimentId(), { consent: this.currentConsent }).subscribe(
        changed => {
          if (changed === true) {
            this.experimentInfo.consent = this.currentConsent
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
        language: 'markdown',
        code: this.originalConsent
      }
      this.changedModel = {
        language: 'markdown',
        code: this.currentConsent
      }
    }
  }

  transformMarkdownToHtml(markdown: string): string {
    return marked(markdown)
  }
}
