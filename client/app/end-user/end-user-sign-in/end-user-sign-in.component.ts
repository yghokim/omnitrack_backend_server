import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';

@Component({
  selector: 'app-end-user-sign-in',
  templateUrl: './end-user-sign-in.component.html',
  styleUrls: ['./end-user-sign-in.component.scss']
})
export class EndUserSignInComponent implements OnInit, OnDestroy, AfterViewInit {

  private readonly _internalSubscriptions = new Subscription()

  constructor(private router: Router, private authService: AngularFireAuth ) {
    this._internalSubscriptions.add(
      authService.authState.subscribe(user => {
        if(user){
          console.log(user)
          router.navigate(["tracking"])
        }
      })
    )
  }

  login() {
    this.authService.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(
      result=>{
        console.log("signin popup result:")
        console.log(result)
      }
    )
  }
  logout() {
    this.authService.auth.signOut();
  }

  ngAfterViewInit(){
  }

  ngOnInit() {
  }

  ngOnDestroy(){
    this._internalSubscriptions.unsubscribe()
  }

}
