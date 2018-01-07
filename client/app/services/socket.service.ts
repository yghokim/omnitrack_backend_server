import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import {SocketConstants} from '../../../omnitrack/core/research/socket'

@Injectable()
export class SocketService {

  public readonly socket: SocketIOClient.Socket

  public readonly _onConnected = new BehaviorSubject<SocketIOClient.Socket>(null)

  get onConnected(): Observable<SocketIOClient.Socket>{
    return this._onConnected.filter(socket => socket!=null)
  }

  constructor() {

    this.socket = io(window.location.protocol + "//" + window.location.hostname + ":3000")
    this.socket.connect()

    this.socket.on(
      SocketConstants.SERVER_EVENT_RESET, ()=>{
        console.log("refresh sockets.")
        this._onConnected.next(this.socket)
      }
    )

    console.log(this.socket)
    this._onConnected.next(this.socket)
  }


}
