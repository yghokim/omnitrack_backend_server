import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';


@Injectable()
export class NotificationService {

  private readonly _snackBarMessageQueue = new Subject<SnackBarMessageInfo>()
  public readonly snackBarMessageQueue = this._snackBarMessageQueue.pipe(filter(message => message != null))

  private readonly _globalBusyTags = new Set<string>()

  private readonly _globalBusyQueue = new BehaviorSubject<boolean>(false)

  public get globalBusyFlag(): Observable<boolean> {
    return this._globalBusyQueue
  }

  constructor() { }

  pushSnackBarMessage(message: SnackBarMessageInfo) {
    this._snackBarMessageQueue.next(message)
  }

  sendGlobalBusyFlag(isBusy: boolean) {
    if (this._globalBusyQueue.getValue() !== isBusy) {
      this._globalBusyQueue.next(isBusy)
    }
  }

  registerGlobalBusyTag(badge: string) {
    this._globalBusyTags.add(badge)
    this.sendGlobalBusyFlag(true)
  }

  unregisterGlobalBusyTag(badge: string) {
    if (this._globalBusyTags.delete(badge)) {
      this.sendGlobalBusyFlag(this._globalBusyTags.size > 0)
    }
  }


}

export interface SnackBarMessageInfo {
  message: string,
  action?: { label: string, navigate: string }
}
