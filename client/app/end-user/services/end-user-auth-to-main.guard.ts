import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AngularFireAuth } from 'angularfire2/auth';

@Injectable()
export class EndUserAuthToMainGuard implements CanActivate {
  constructor(private auth: AngularFireAuth, private router: Router){

  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.auth.authState.pipe(map(user=>{
      if(user != null){
        if(state.url != "/tracking"){
          this.router.navigate(["/tracking"])
        }
      }
      return true
    }))
  }
}
