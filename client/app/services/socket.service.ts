import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter } from "rxjs/operators";
import { SocketConstants } from '../../../omnitrack/core/research/socket'
import deepEqual from 'deep-equal';

@Injectable()
export class SocketService {

  public readonly socket: SocketIOClient.Socket

  private readonly _onConnected = new BehaviorSubject<SocketIOClient.Socket>(null)
  private readonly _onServerReset = new BehaviorSubject<SocketIOClient.Socket>(null)

  private readonly _serverDiagnosticsEventSubject = new BehaviorSubject<any>(null)

  get onConnected(): Observable<SocketIOClient.Socket> {
    return this._onConnected.pipe(filter(socket => socket != null))
  }

  get onServerReset(): Observable<SocketIOClient.Socket> {
    return this._onServerReset.pipe(filter(socket => socket != null))
  }

  get serverDiagnosticsEvent(): Observable<any>{
    return this._serverDiagnosticsEventSubject.pipe(filter(r => r != null))
  }

  constructor() {

    this.socket = io(window.location.protocol + "//" + window.location.hostname + ":3000", {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })
    this.socket.connect()

    this.socket.on(
      SocketConstants.SERVER_EVENT_RESET, () => {
        console.log("refresh sockets.")
        this._onServerReset.next(this.socket)
      }
    )

    this.socket.on(
      SocketConstants.SERVER_EVENT_BACKEND_DIAGNOSTICS, args => {
        if(!deepEqual(this._serverDiagnosticsEventSubject.value, args)){
          this._serverDiagnosticsEventSubject.next(args)
        }
      }
    )

    this.socket.on("disconnect", () => {
      console.log('socket disconnected from server. retry after 3 seconds..');
      window.setTimeout(() => { this.socket.connect() }, 3000)
    })

    this.socket.on("reconnect", () => {
      console.log("socket reconnected.")
    })

    console.log("websocket initialized.")
    this._onConnected.next(this.socket)
  }


}
