import { Component, OnInit, Inject } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { LOCKED_PROPERTY_KEYS_TRACKER, LOCKED_PROPERTY_KEYS_TRIGGER, LOCKED_PROPERTY_KEYS_ATTRIBUTE, LOCKED_PROPERTY_KEYS_COMMON, LockDefinition, TRACKER_LOCK_DEFINITION, LOGGING_TRIGGER_LOCK_DEFINITION, REMINDER_LOCK_DEFINITION, ATTRIBUTE_LOCK_DEFINITION } from '../../../../../../../omnitrack/core/locked_properties';
import { deepclone } from '../../../../../../../shared_lib/utils';
import * as deepEqual from 'deep-equal';
const snakeCase = require('snake-case');

@Component({
  selector: 'app-lock-configuration-sheet',
  templateUrl: './lock-configuration-sheet.component.html',
  styleUrls: ['./lock-configuration-sheet.component.scss']
})
export class LockConfigurationSheetComponent implements OnInit {

  public lockType: string
  public flags: any
  public originalFlags: any
  public lockDefinition: LockDefinition

  constructor(private bottomSheetRef: MatBottomSheetRef<LockConfigurationSheetComponent>, @Inject(MAT_BOTTOM_SHEET_DATA) data: any) {
    this.lockType = data.type? data.type : "normal"
    this.originalFlags = data.lockedProperties? deepclone(data.lockedProperties) : {}
    this.flags = deepclone(this.originalFlags)
      
    switch(this.lockType){
      case "tracker":
      this.lockDefinition = TRACKER_LOCK_DEFINITION
      break;
      case "trigger":
      this.lockDefinition = LOGGING_TRIGGER_LOCK_DEFINITION
      break;
      case "reminder":
      this.lockDefinition = REMINDER_LOCK_DEFINITION
      break;
      case "attribute":
      this.lockDefinition = ATTRIBUTE_LOCK_DEFINITION
      break;
    }
  }

  isChanged(): boolean{
    return !deepEqual(this.originalFlags, this.flags)
  }

  isFlagChanged(key: string): boolean{
    return this.isFlagLocked(key, this.originalFlags) !== this.isFlagLocked(key, this.flags)
  }

  isFlagLocked(key: string, flags: any = this.flags): boolean{
    return flags[key] === true
  }

  setFlag(key: string, locked: boolean){
    console.log("key:", key, "locked: ", locked)
    if(locked===true){
      this.flags[key] = true
    }else{
      delete this.flags[key]
    }
  }

  getFlagName(key: string): string{
    return this.lockDefinition.flags.find(f => f.name === key).display
  }

  ngOnInit() {
  }

  onApplyClicked(){
    this.bottomSheetRef.dismiss(this.flags)
  }

}
