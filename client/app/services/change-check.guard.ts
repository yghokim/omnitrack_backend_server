import { Injectable } from "@angular/core";
import { CanDeactivate } from "@angular/router";
import { ChangeCheckComponent } from "../components/change-check.component";

@Injectable()
export class ChangeCheckGuard implements CanDeactivate<ChangeCheckComponent> {
  canDeactivate(component: ChangeCheckComponent): boolean {
   
    if(!component.canDeactivate()){
        if (confirm(component.deactivationCheckMessage)) {
            return true;
        } else {
            return false;
        }
    }
    return true;
  }
}