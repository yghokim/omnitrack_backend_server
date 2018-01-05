import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ResearcherAuthService } from './researcher.auth.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ResearcherAuthGuardSecure implements CanActivate {

  constructor(public auth: ResearcherAuthService, private router: Router) { }

  canActivate(): Observable<boolean> {
    return this.auth.verifySignedInStatus().do(success => {
      if (!success) {
        this.router.navigate(['/research/login'])
      }
      return true
    })
  }

}
