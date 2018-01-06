import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class SocketService {

  public readonly socket: SocketIOClient.Socket

  public readonly _onConnected = new BehaviorSubject<SocketIOClient.Socket>(null)

  get onConnected(): Observable<SocketIOClient.Socket>{
    return this._onConnected.filter(socket => socket!=null)
  }

  constructor() {

    this.socket = io("http://localhost:3000")
    this.socket.connect()

    this.socket.on(
      "server/reset", ()=>{
        console.log("refresh sockets.")
        this._onConnected.next(this.socket)
      }
    )

    console.log(this.socket)
    this._onConnected.next(this.socket)
  }


}
