import { OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";

export abstract class ServiceBase implements OnDestroy{

  protected readonly _internalSubscriptions = new Subscription()

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

}