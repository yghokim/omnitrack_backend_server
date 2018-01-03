import {Injectable} from '@angular/core';
import {CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import { ResearcherAuthService } from './researcher.auth.service';

@Injectable()
export class ResearcherAuthGuardMain implements CanActivate {

  constructor(public auth: ResearcherAuthService, private router: Router) {}

  canActivate() {
    if (this.auth.isSignedIn()) {
      this.router.navigate(['/research/dashboard'])
    }
    return true
  }

}
