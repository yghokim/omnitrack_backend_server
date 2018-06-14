import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Http } from '@angular/http';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PreventReinstallationGuard implements CanActivate {

  constructor(private http: Http, private router: Router){}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    return this.http.get('/api/installation/status').pipe(
      map(res=>res.json()),
      map(installed => {
        if(installed === false) return true
        else return false
      }),
      catchError(err => {
        console.log("installation already done.")
        this.router.navigate(["research"])
        return of(false)
      })
    )
  }
}
