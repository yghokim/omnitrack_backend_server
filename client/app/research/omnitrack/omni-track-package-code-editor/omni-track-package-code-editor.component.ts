import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { flatMap, combineLatest, filter, first } from 'rxjs/operators';
import { ResearchApiService } from '../../../services/research-api.service';
import deepEqual from 'deep-equal';
import { DiffEditorModel } from 'ngx-monaco-editor';

@Component({
  selector: 'app-omni-track-package-code-editor',
  templateUrl: './omni-track-package-code-editor.component.html',
  styleUrls: ['../../../code-editor.scss']
})
export class OmniTrackPackageCodeEditorComponent implements OnInit, OnDestroy {

  private readonly _internalSubscriptions = new Subscription()

  public readonly editorOptions = {
    theme: 'vs-dark', language: 'json',
    automaticLayout: true,
    wordWrap: 'on',
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

  _code = null

  private originalPackage: any
  private originalPackageCode: string

  public isCodeValid: boolean = false
  public isPackageChanged: boolean = false

  public readonly editorRef = new BehaviorSubject<any>(null)
  public editorReady: boolean = false

  public packageKey: string

  public get code(): string { return this._code }
  public set code(c: string) {
    this._code = c
    try {
      const json = JSON.parse(this._code)
      this.isCodeValid = true
      this.isPackageChanged = !deepEqual(this.originalPackage, json)
    } catch (e) {
      this.isCodeValid = false
    }
  }

  public get editorRefSingle(): Observable<any> {
    return this.editorRef.pipe(filter(e => e != null), first())
  }

  constructor(private api: ResearchApiService, private activatedRoute: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this._internalSubscriptions.add(
      this.activatedRoute.paramMap.pipe(
        flatMap(paramMap => {
          const packageKey = paramMap.get('packageKey')
          this.packageKey = packageKey
          return this.api.selectedExperimentService.pipe(
            flatMap(expService => {
              return expService.getOmniTrackPackage(packageKey)
            }),
            combineLatest(this.editorRefSingle, (packageInfo, editorRef) => ({ packageJson: packageInfo.data, editor: editorRef }))
          )
        })).subscribe((project: any) => {
          this.originalPackage = project.packageJson
          const stringValue = JSON.stringify(project.packageJson, null, "\t")
          this.originalPackageCode = stringValue
          project.editor.setValue(stringValue)
          this.code = stringValue
        })
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  onInitCodeEditor(editor: any) {
    this.editorRef.next(editor)
    this.editorReady = true
  }

  onReformatCodeClicked() {
    if (this.editorReady === true) {
      this._internalSubscriptions.add(
        this.editorRefSingle.subscribe(editor => {
          editor.getAction('editor.action.formatDocument').run();
        })
      )
    }
  }

  onSaveClicked() {
    this._internalSubscriptions.add(
      this.api.selectedExperimentService.pipe(
        flatMap(expService => expService.updateTrackingPackageJson(this.packageKey, JSON.parse(this.code), null))).subscribe(changed => {
          this.router.navigate([".."], { relativeTo: this.activatedRoute })
        })
    )
  }

  onShowDiffClicked() {
    this.diffMode = !this.diffMode
    if (this.diffMode == true) {
      this.originalModel = {
        code: this.originalPackageCode,
        language: 'json'
      }
      this.changedModel = {
        code: this.code,
        language: 'json'
      }

    }
  }

}
