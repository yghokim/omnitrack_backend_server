import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { IClientBuildConfigBase } from '../../../../omnitrack/core/research/db-entity-types';
import { deepclone } from '../../../../shared_lib/utils';
import * as deepEqual from 'deep-equal';
import * as md5 from 'md5';

@Component({
  selector: 'app-config-variable-row',
  templateUrl: './config-variable-row.component.html',
  styleUrls: ['./config-variable-row.component.scss', '../platform-config-panel/platform-config-panel.component.scss']
})
export class ConfigVariableRowComponent implements OnInit {

  @Input() originalValue: any = null
  @Input() type = "boolean"
  @Input() config: IClientBuildConfigBase<any> = null
  @Input() label: string = null
  @Input() variableName: string = null
  @Input() hintText: string = null
  @Input() inverseBoolean: boolean = false

  @Input() validationFailedMessage: string[] = null

  @Output() binaryFileChanged = new EventEmitter<File>()

  constructor() { }

  ngOnInit() {
  }

  isInvalid(): boolean{
    return this.validationFailedMessage != null && this.validationFailedMessage.length > 0
  }

  getFallbackBooleanValue(): boolean{
    const value = this.config[this.variableName]? this.config[this.variableName] : false
    return this.inverseBoolean===true? !value : value
  }
  
  onTextChanged(value) {
    if (value.trim().length === 0) {
      this.config[this.variableName] = null
    } else {
      this.config[this.variableName] = value
    }
  }

  onJsonFileChanged(files) {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        this.config[this.variableName] = JSON.parse((e as any).target.result)
      } catch (e) {
        console.log(e)
      }
    }
    fileReader.readAsText(files[0])
  }

  onAndroidKeystoreFileChanged(files) {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        this.config[this.variableName] = md5((e as any).target.result)

        if (this.isValueChanged() === true) {
          this.binaryFileChanged.emit(files[0])
        }
      } catch (e) {
        console.log(e)
      }
    }
    fileReader.readAsBinaryString(files[0])
  }

  jsonObjToString(obj): string {
    return JSON.stringify(obj, null, 2)
  }

  rollback() {
    this.config[this.variableName] = this.originalValue === undefined ? null : deepclone(this.originalValue)
    $('input[type="file"]').val('')
    this.binaryFileChanged.emit(null)
  }

  compareValues(v1: any, v2: any): boolean {
    return deepEqual(v1, v2)
  }

  isValueChanged(): boolean {
    return !this.compareValues(this.originalValue, this.config[this.variableName])
  }

  sourceCodeTypeChanged(type: string) {
    if (this.config[this.variableName]) {
      this.config[this.variableName].sourceType = type
    } else {
      this.config[this.variableName] = {
        sourceType: type,
        data: {}
      }
    }
  }

  onSourceCodeUseOfficialChecked(checked: boolean) {
    if (this.config[this.variableName].data == null) {
      this.config[this.variableName].data = {
        useOfficial: checked
      }
    } else {
      this.config[this.variableName].data.useOfficial = checked
    }
  }

  onSourceCodeZipFileChanged(files: Array<File>) {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        if (this.config[this.variableName] == null) {
          this.config[this.variableName] = {
            sourceType: 'file',
            data: {}
          }
        }

        if (this.config[this.variableName].data == null) {
          this.config[this.variableName].data = {}
        }

        this.config[this.variableName].data.zipFileHash = md5((e as any).target.result)

        if (this.isValueChanged() === true) {
          this.binaryFileChanged.emit(files[0])
        }

      } catch (e) {
        console.log(e)
      }
    }
    fileReader.readAsBinaryString(files[0])
  }

  onSourceCodeRepositoryChanged(repository: String) {
    if (this.config[this.variableName].data) {
      this.config[this.variableName].data.repository = repository
    } else {
      this.config[this.variableName].data = {
        repository: repository
      }
    }
  }
}
