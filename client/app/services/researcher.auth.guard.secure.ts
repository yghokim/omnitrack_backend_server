import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot, CanLoad, Route, UrlSegment } from '@angular/router';
import { ResearcherAuthService } from './researcher.auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { state } from '@angular/animations';

@Injectable()
export class ResearcherAuthGuardSecure implements CanActivate, CanLoad {

  constructor(public auth: ResearcherAuthService, private router: Router, private activatedRoute: ActivatedRoute) { }

  canActivate(route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {
    return this.auth.verifySignedInStatus().pipe(map(verified => {
      if (verified === true) {
        if (this.auth.currentResearcher.getValue().approved !== true) {
          if (state.url !== "/research/account") {
            this.router.navigate(["/research/account"])
          }
        }
      } else {
        if (state.url !== "/research/login") {
          this.router.navigate(['/research/login'])
        }
      }
      return true
    }))
  }

  
  canLoad(route: Route, segments?: UrlSegment[]): Observable<boolean> {
    return this.auth.verifySignedInStatus().pipe(map(verified => {
      if (verified === true) {
        if (this.auth.currentResearcher.getValue().approved !== true) {
          
            this.router.navigate(["/research/account"])
        }
      } else {
          this.router.navigate(['/research/login'])
      }
      return true
    }))
  }

}
