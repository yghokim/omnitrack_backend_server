import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AngularFireAuth } from 'angularfire2/auth';

@Injectable()
export class EndUserAuthCheckGuard implements CanActivate {

  constructor(private router: Router, private auth: AngularFireAuth){

  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.auth.authState.pipe(map(user => {
      console.log("Check the end-user auth status:")
      if(user==null){
        if(state.url != "/tracking/login")
        {
          this.router.navigate(["/tracking/login"])
        }
      }
      return true
    }))
  }
}
