import { Injectable } from "@angular/core";
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from "@angular/router";
import { Observable, of } from "rxjs";
import { Http } from "@angular/http";
import { map, catchError, tap } from "rxjs/operators";

@Injectable({
  providedIn: "root"
})
export class CheckInstallationGuard implements CanActivate {
  constructor(private http: Http, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.http.get("/api/installation/status").pipe(
      map(res => res.json()),
      catchError(err => {
        try {
          const errorJson = err.json();
          if (errorJson.error === "AlreadyInstalled") {
            return of(true);
          }
        } catch (ex) {
          if (err.status === 404) {
            // Server respond, but installation router is not initialized because of the installation flag.
            return of(true);
          }
        }
        return of(false);
      }),
      tap(installed => {
        if (installed === false) {
          this.router.navigate(["install"]);
        }
      })
    );
  }
}
