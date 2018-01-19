import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelper } from 'angular2-jwt';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import { SocketService } from './socket.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
import { Subscription } from 'rxjs/Subscription';
import { isNullOrBlank } from '../../../shared_lib/utils';
import { SocketConstants } from '../../../omnitrack/core/research/socket';

export class ResearcherAuthInfo {
  constructor(
    public readonly signedIn: boolean,
    public readonly uid: string,
    public readonly email: string,
    public readonly alias: string
  ) { }
}

@Injectable()
export class ResearcherAuthService implements OnDestroy {
  private readonly jsonHeaders = new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' });
  private readonly formHeaders = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded', 'charset': 'UTF-8' });

  private readonly jsonOptions = new RequestOptions({ headers: this.jsonHeaders });
  private readonly formOptions = new RequestOptions({ headers: this.formHeaders });

  private readonly _internalSubscriptions = new Subscription()

  jwtHelper: JwtHelper = new JwtHelper();

  readonly currentResearcher = new BehaviorSubject<ResearcherAuthInfo>({ signedIn: false, uid: '', email: '', alias: '' });

  readonly tokenSubject = new BehaviorSubject<string>(null)

  constructor(private http: Http, private socketService: SocketService) {

    const token = localStorage.getItem('omnitrack_researcher_token');
    if (token && this.jwtHelper.isTokenExpired(token) === false) {
      this.tokenSubject.next(token)
      this.decodeAndSaveResearcherFromToken(token);
    }

    this._internalSubscriptions.add(
      this.socketService.onConnected.combineLatest(this.currentResearcher, (socket, researcher)=>{return {socket: socket, researcher: researcher}}).subscribe(
        project => {
          console.log("auth service : websocket connected.")
          if (project.socket !== null) {
             if (project.researcher.signedIn === true) {
               console.log("subscribe websocket as a researcher: " + project.researcher.uid)
                project.socket.emit(SocketConstants.SERVER_EVENT_SUBSCRIBE_RESEARCHER, { uid: project.researcher.uid }, () => {
                  console.log("subscribed as a researcher")

                })
                project.socket.on(SocketConstants.SOCKET_MESSAGE_UPDATED_RESEARCHER, (data) => {
                  console.log("received a updated/researcher websocket event")
                  console.log(data)
                })
              }
              else {
                project.socket.emit(SocketConstants.SERVER_EVENT_UNSUBSCRIBE_RESEARCHER, { uid: project.researcher.uid }, () => {
                  console.log("unsubscribed")
                  project.socket.removeListener(SocketConstants.SOCKET_MESSAGE_UPDATED_RESEARCHER)
                })
              }
          }
        })
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  token(): string {
    return localStorage.getItem('omnitrack_researcher_token')
  }

  makeAuthorizedOptions(): RequestOptions {
    const tokenHeaders = new Headers({ 'Authorization': 'Bearer ' + this.token() });
    return new RequestOptions({ headers: tokenHeaders });
  }

  public isTokenAvailable(): boolean {
    const token = localStorage.getItem('omnitrack_researcher_token');
    return (token && this.jwtHelper.isTokenExpired(token) === false)
  }

  public verifySignedInStatus(): Observable<boolean> {
    if (this.isTokenAvailable() == false) {
      return Observable.of(false)
    }

    return this.http.post("/api/research/auth/verify", null, this.makeAuthorizedOptions()).map(result => result.json()).catch(err => {
      return Observable.of(false)
    }).flatMap(verified => {
      if (verified == false) {
        console.log("token verification was failed. sign out and return false")
        //sign out
        return this.signOut().map(r => false)
      }
      else return Observable.of(true)
    })
  }

  private decodeAndSaveResearcherFromToken(token): any {
    const decoded = this.jwtHelper.decodeToken(token)
    const decodedResearcher = new ResearcherAuthInfo(true, decoded.uid, decoded.email, decoded.alias)
    this.currentResearcher.next(decodedResearcher)
    return decodedResearcher
  }

  public register(info): Observable<any> {
    return this.http.post('/api/research/auth/register', JSON.stringify(info), this.jsonOptions)
      .map(res => {
        const token = res.json().token
        if (token != null) {
          this.setNewToken(token)
        }
        return token
      })
  }

  private setNewToken(token): any {
    localStorage.setItem('omnitrack_researcher_token', token)
    this.tokenSubject.next(token)
    return this.decodeAndSaveResearcherFromToken(token)
  }

  public signOut(): Observable<boolean> {
    return Observable.defer(() => {
      localStorage.removeItem("omnitrack_researcher_token")
      this.tokenSubject.next(null)
      this.currentResearcher.next({ signedIn: false, uid: '', email: '', alias: '' });
      return Observable.of(true)
    })
  }

  public authorize(email: string, password: string): Observable<any> {
    const requestBody = {
      grant_type: "password",
      username: email,
      password: password
    }
    return this.http.post('/api/research/auth/authenticate', JSON.stringify(requestBody), this.jsonOptions)
      .map(res => {
        const token = res.json().token
        if (token != null) {
          this.setNewToken(token)
        }
        return token
      })
  }

  public updateInfo(alias?: string, newPassword?: string, originalPassword?: string): Observable<any> {
    if (newPassword && !originalPassword) {
      throw new Error("You should insert the original password.")
    }
    else {
      const body: any = {}
      if (alias) {
        body.alias = alias
      }
      if (newPassword) {
        body.newPassword = newPassword
      }
      if (originalPassword) {
        body.originalPassword = originalPassword
      }

      if (Object.keys(body).length > 0) {
        return this.http.post("/api/research/auth/update", body, this.makeAuthorizedOptions()).map(res => res.json()).map(
          res => {
            if (!isNullOrBlank(res.token)) {
              return this.setNewToken(res.token)
            }else throw new Error("No token retrieved.")
          }
        )
      }
      else {
        throw new Error("Set either alias or passwords.")
      }
    }
  }

}
