import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelper } from 'angular2-jwt';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import { SocketService } from './socket.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';

export class ResearcherAuthInfo {
  constructor(
    public readonly signedIn: boolean,
    public readonly uid: string,
    public readonly email: string,
    public readonly alias: string
  ) { }
}

@Injectable()
export class ResearcherAuthService {
  private jsonHeaders = new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' });
  private formHeaders = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded', 'charset': 'UTF-8' });

  private jsonOptions = new RequestOptions({ headers: this.jsonHeaders });
  private formOptions = new RequestOptions({ headers: this.formHeaders });

  jwtHelper: JwtHelper = new JwtHelper();

  readonly currentResearcher = new BehaviorSubject<ResearcherAuthInfo>({ signedIn: false, uid: '', email: '', alias: '' });

  readonly tokenSubject = new BehaviorSubject<string>(null)

  constructor(private http: Http, private socketService: SocketService) {

    const token = localStorage.getItem('omnitrack_researcher_token');
    if (token && this.jwtHelper.isTokenExpired(token) === false) {
      this.tokenSubject.next(token)
      this.decodeAndSaveResearcherFromToken(token);
    }

    this.socketService.onConnected.subscribe(
      socket=>{
        console.log("websocket connected.")
        if(socket != null)
        {
          this.currentResearcher.subscribe(researcher => {
            if (researcher.signedIn == true) {
              socket.emit("subscribe_researcher", { uid: researcher.uid }, () => {
                console.log("subscribed as a researcher")
                
              })
              socket.on("updated/researcher", (data) => {
                console.log("received a updated/researcher websocket event")
                console.log(data)
              })
            }
            else {
              socket.emit("unsubscribe_researcher", { uid: researcher.uid }, () => {
                console.log("unsubscribed")
                socket.removeListener("updated/researcher")
              })
            }
          })
        }
      }
    )
  }

  token(): string {
    return localStorage.getItem('omnitrack_researcher_token')
  }

  public isTokenAvailable(): boolean {
    const token = localStorage.getItem('omnitrack_researcher_token');
    return (token && this.jwtHelper.isTokenExpired(token) === false)
  }

  public verifySignedInStatus(): Observable<boolean> {
    if (this.isTokenAvailable() == false) {
      return Observable.of(false)
    }

    const tokenHeaders = new Headers({ 'Authorization': 'Bearer ' + this.token() });
    const authorizedOptions = new RequestOptions({ headers: tokenHeaders });

    return this.http.post("/api/research/auth/verify", null, authorizedOptions).map(result => result.json()).catch(err => {
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

  private decodeAndSaveResearcherFromToken(token) {
    const decoded = this.jwtHelper.decodeToken(token)
    const decodedResearcher = new ResearcherAuthInfo(true, decoded.uid, decoded.email, decoded.alias)
    this.currentResearcher.next(decodedResearcher)
  }

  public register(info): Observable<any> {
    return this.http.post('/api/research/auth/register', JSON.stringify(info), this.jsonOptions)
      .map(res => {
        const token = res.json().token
        if (token != null) {
          localStorage.setItem('omnitrack_researcher_token', token)
          this.tokenSubject.next(token)
          this.decodeAndSaveResearcherFromToken(token)
        }
        return token
      })
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
          localStorage.setItem('omnitrack_researcher_token', token)
          this.tokenSubject.next(token)
          this.decodeAndSaveResearcherFromToken(token)
        }
        return token
      })
  }

}
