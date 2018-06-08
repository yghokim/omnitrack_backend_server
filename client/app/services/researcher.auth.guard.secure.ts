import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import { ResearcherAuthService } from './researcher.auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResearcherAuthGuardSecure implements CanActivate {



  constructor(public auth: ResearcherAuthService, private router: Router, private activatedRoute: ActivatedRoute ) { }

  canActivate(route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> {
    console.log("canActivate in ResearchAuthGuardSecure")
    return this.auth.verifySignedInStatus().pipe(map(verified => {
      if( verified === true){
        console.log(this.activatedRoute)
        if(this.auth.currentResearcher.getValue().approved !== true){
          if(state.url !== "/research/account")
            this.router.navigate(["/research/account"])
        }
      }
      else{
        if(state.url !== "/research/login")
          this.router.navigate(['/research/login'])
      }
      return true
    }))
  }

}
