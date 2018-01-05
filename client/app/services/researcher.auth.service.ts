import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelper } from 'angular2-jwt';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/map';

@Injectable()
export class ResearcherAuthService {
  private jsonHeaders = new Headers({ 'Content-Type': 'application/json', 'charset': 'UTF-8' });
  private formHeaders = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded', 'charset': 'UTF-8' });

  private jsonOptions = new RequestOptions({ headers: this.jsonHeaders });
  private formOptions = new RequestOptions({ headers: this.formHeaders });

  jwtHelper: JwtHelper = new JwtHelper();

  currentResearcher = { uid: '', email: '', alias: '' };

  constructor(private http: Http) {
    const token = localStorage.getItem('omnitrack_researcher_token');
    if (token && this.jwtHelper.isTokenExpired(token) === false) {
      this.decodeAndSaveResearcherFromToken(token);
    }
  }

  token(): string {
    return localStorage.getItem('omnitrack_researcher_token')
  }

  public isSignedIn(): boolean {
    const token = localStorage.getItem('omnitrack_researcher_token');
    return (token && this.jwtHelper.isTokenExpired(token) === false)
  }

  public verifySignedInStatus(): Observable<boolean>{
    
    const tokenHeaders = new Headers({ 'Authorization': 'Bearer ' + this.token() });
    const authorizedOptions = new RequestOptions({ headers: tokenHeaders });

    return this.http.post("/api/research/auth/verify", null, authorizedOptions).map( result => result.json()).catch(err => Observable.of(false)).flatMap( verified => {
      if(verified == false)
      {
        //sign out
        return this.signOut().map(r => false)
      }
      else return Observable.of(true)
    } )
  }

  private decodeAndSaveResearcherFromToken(token) {
    const decoded = this.jwtHelper.decodeToken(token)
    this.currentResearcher.uid = decoded.uid
    this.currentResearcher.email = decoded.email
    this.currentResearcher.alias = decoded.alias
  }

  public register(info): Observable<any> {
    console.log(info)
    return this.http.post('/api/research/auth/register', JSON.stringify(info), this.jsonOptions)
    .map(res => {
      const token = res.json().token
      if (token != null) {
        localStorage.setItem('omnitrack_researcher_token', token)
        this.decodeAndSaveResearcherFromToken(token)
      }
      return token
    })
  }

  public signOut(): Observable<boolean> {
    return Observable.defer(() => {
      localStorage.removeItem("omnitrack_researcher_token")
      this.currentResearcher = { uid: '', email: '', alias: '' };
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
        this.decodeAndSaveResearcherFromToken(token)
      }
      return token
    })
  }

}
