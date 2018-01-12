import {Injectable} from '@angular/core';
import {CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import { ResearcherAuthService } from './researcher.auth.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ResearcherAuthGuardMain implements CanActivate {

  constructor(public auth: ResearcherAuthService, private router: Router) {}

  canActivate(activatedRoute: ActivatedRouteSnapshot, routerState: RouterStateSnapshot): Observable<boolean> {
    console.log(activatedRoute.url)
    return this.auth.verifySignedInStatus().map(success => {
      console.log("verified: " + success)
      if (success==true) {
        this.router.navigate(['/research/experiments'])
      }
      return true
    })
  }

}
