import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ResearcherAuthService } from './researcher.auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResearcherAuthGuardMain implements CanActivate {

  constructor(public auth: ResearcherAuthService, private router: Router) { }

  canActivate(activatedRoute: ActivatedRouteSnapshot, routerState: RouterStateSnapshot): Observable<boolean> {
    return this.auth.verifySignedInStatus().pipe(map(success => {
      if (success === true) {
        this.router.navigate(['/research/experiments'])
      }
      return true
    }))
  }

}
