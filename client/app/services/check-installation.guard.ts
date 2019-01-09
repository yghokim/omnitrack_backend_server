import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanLoad,
  Route
} from "@angular/router";
import { Observable, of } from "rxjs";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { map, catchError, tap } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class CheckInstallationGuard implements CanLoad, CanActivate {
  
  constructor(private http: HttpClient, private router: Router) { }

  private can(): Observable<boolean>{
    return this.http.get<boolean>("/api/installation/status").pipe(
      catchError((err: HttpErrorResponse) => {
        console.log(err)
        if(err.status === 404){
          console.error("404 - server do not respond")
          return of(null); // return null
        } else if (err.error instanceof ErrorEvent) {
          return of(false);
        } else {
          if (err.error === "AlreadyInstalled") {
            return of(true);
          } else return of(false);
        }
      }),
      tap(installed => {
        if(installed == null){
          //server not respond.
          this.router.navigate(["backend_not_respond"]);
        }else if (installed === false) {
          this.router.navigate(["install"]);
        }
      })
    );
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.can()
  }

  
  canLoad(route: Route): boolean | Observable<boolean> | Promise<boolean> {
    return this.can()
  }
}
