import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable, BehaviorSubject, Subscription, of, defer } from 'rxjs';
import { map, flatMap, combineLatest, catchError } from 'rxjs/operators';
import { SocketService } from './socket.service';
import { isNullOrBlank } from '../../../shared_lib/utils';
import { SocketConstants } from '../../../omnitrack/core/research/socket';
import { ResearcherPrevilages, IResearcherToken } from '../../../omnitrack/core/research/researcher';

export class ResearcherAuthInfo {
  static readonly NOT_SIGNED_IN = new ResearcherAuthInfo(null)

  constructor(
    public readonly tokenInfo: IResearcherToken
  ) { }

  get signedIn(): boolean {
    return this.tokenInfo != null
  }

  get uid(): string {
    return this.tokenInfo ? this.tokenInfo.uid : null
  }

  get email(): string {
    return this.tokenInfo ? this.tokenInfo.email : null
  }

  get alias(): string {
    return this.tokenInfo ? this.tokenInfo.alias : null
  }

  get previlage(): number {
    return this.tokenInfo ? this.tokenInfo.previlage : -1
  }

  get approved(): boolean {
    return this.tokenInfo ? this.tokenInfo.approved : null
  }
}

@Injectable()
export class ResearcherAuthService implements OnDestroy {
  private readonly jsonHeaders = new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' });
  private readonly formHeaders = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded', 'charset': 'UTF-8' });

  private readonly jsonOptions = new RequestOptions({ headers: this.jsonHeaders });
  private readonly formOptions = new RequestOptions({ headers: this.formHeaders });

  private readonly _internalSubscriptions = new Subscription()

  readonly jwtHelper = new JwtHelperService();

  readonly currentResearcher = new BehaviorSubject<ResearcherAuthInfo>(ResearcherAuthInfo.NOT_SIGNED_IN);

  readonly tokenSubject = new BehaviorSubject<string>(null)

  constructor(private http: Http, private socketService: SocketService) {

    const token = localStorage.getItem('omnitrack_researcher_token');
    if (token && this.jwtHelper.isTokenExpired(token) === false) {
      if(this.tokenSubject.value!==token)
        this.tokenSubject.next(token)
      this.decodeAndSaveResearcherFromToken(token);
    }

    this._internalSubscriptions.add(
      this.socketService.onConnected.pipe(combineLatest(this.currentResearcher, (socket, researcher) => ({ socket: socket, researcher: researcher }))).subscribe(
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
              })
            } else {
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
    if (this.isTokenAvailable() === false) {
      return of(false)
    }

    return this.http.post("/api/research/auth/verify", null, this.makeAuthorizedOptions()).pipe(
      map(result => result.json()),
      catchError(err => {
        return of(false)
      }),
      flatMap(verified => {
        if (verified === false) {
          console.log("token verification was failed. sign out and return false")
          // sign out
          return this.signOut().pipe(map(r => false))
        } else { return of(true) }
      }))
  }

  private decodeAndSaveResearcherFromToken(token): any {
    const decoded = this.jwtHelper.decodeToken(token)
    const decodedResearcher = new ResearcherAuthInfo(decoded)
    this.currentResearcher.next(decodedResearcher)
    return decodedResearcher
  }

  public register(info): Observable<any> {
    return this.http.post('/api/research/auth/register', JSON.stringify(info), this.jsonOptions)
      .pipe(map(res => {
        const token = res.json().token
        if (token != null) {
          this.setNewToken(token)
        }
        return token
      }))
  }

  private setNewToken(token): any {
    localStorage.setItem('omnitrack_researcher_token', token)
    this.tokenSubject.next(token)
    return this.decodeAndSaveResearcherFromToken(token)
  }

  public signOut(): Observable<boolean> {
    return defer(() => {
      localStorage.removeItem("omnitrack_researcher_token")
      this.tokenSubject.next(null)
      this.currentResearcher.next(ResearcherAuthInfo.NOT_SIGNED_IN);
      return of(true)
    })
  }

  public authorize(email: string, password: string): Observable<any> {
    const requestBody = {
      grant_type: "password",
      username: email,
      password: password
    }
    return this.http.post('/api/research/auth/authenticate', JSON.stringify(requestBody), this.jsonOptions)
      .pipe(map(res => {
        const token = res.json().token
        if (token != null) {
          this.setNewToken(token)
        }
        return token
      }))
  }

  public updateInfo(alias?: string, newPassword?: string, originalPassword?: string): Observable<any> {
    if (newPassword && !originalPassword) {
      throw new Error("You should insert the original password.")
    } else {
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
        return this.http.post("/api/research/auth/update", body, this.makeAuthorizedOptions()).pipe(
          map(res => res.json()),
          map(
            res => {
              if (!isNullOrBlank(res.token)) {
                return this.setNewToken(res.token)
              } else { throw new Error("No token retrieved.") }
            }
          ))
      } else {
        throw new Error("Set either alias or passwords.")
      }
    }
  }

}
