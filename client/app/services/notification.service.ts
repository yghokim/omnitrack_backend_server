import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/debounceTime';

@Injectable()
export class NotificationService {

  private readonly _snackBarMessageQueue = new Subject<SnackBarMessageInfo>()
  public readonly snackBarMessageQueue = this._snackBarMessageQueue.filter(message => message != null)

  constructor() { }

  pushSnackBarMessage(message: SnackBarMessageInfo){
    this._snackBarMessageQueue.next(message)
  }

}

export interface SnackBarMessageInfo{
  message: string,
  action?: {label: string, navigate: string} 
}
