import { HostListener } from "@angular/core";

export abstract class ChangeCheckComponent {

  abstract canDeactivate(): boolean;

  abstract deactivationCheckMessage: string

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (!this.canDeactivate()) {
      $event.returnValue = true;
    }
  }
}