import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelper } from 'angular2-jwt';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';

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
    if (token && this.jwtHelper.isTokenExpired(token) == false) {
      this.decodeAndSaveResearcherFromToken(token);
    }
  }

  isSignedIn(): boolean{
    const token = localStorage.getItem('omnitrack_researcher_token');
    return (token && this.jwtHelper.isTokenExpired(token) == false)
  }

  private decodeAndSaveResearcherFromToken(token){
    const decoded = this.jwtHelper.decodeToken(token)
    this.currentResearcher.uid = decoded.uid
    this.currentResearcher.email = decoded.email
    this.currentResearcher.alias = decoded.alias
  }

  register(info): Observable<any> {
    console.log(info)
    return this.http.post('/api/research/auth/register', JSON.stringify(info), this.jsonOptions)
    .map(res =>{
      const token = res.json().token
      if(token!=null)
      { 
        localStorage.setItem('omnitrack_researcher_token', token)
        this.decodeAndSaveResearcherFromToken(token)
      }
      return token
    })
  }

  signOut(): Observable<any>{
    return Observable.defer(()=>{
      localStorage.removeItem("omnitrack_researcher_token")
      return Observable.of(true)
    })
  }

  authorize(email: string, password: string): Observable<any>{
    const requestBody = {
      grant_type: "password",
      username: email,
      password: password
    }
    return this.http.post('/api/research/auth/authenticate', JSON.stringify(requestBody), this.jsonOptions)
    .map(res=>{
      const token = res.json().token
      if(token!=null)
      {
        localStorage.setItem('omnitrack_researcher_token', token)
        this.decodeAndSaveResearcherFromToken(token)
      }
      return token
    })
  }

}
