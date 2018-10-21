import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  Router,
  RouteConfigLoadStart,
  RouteConfigLoadEnd
} from "@angular/router";
import { Subscription } from "rxjs/internal/Subscription";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly _internalSubscriptions = new Subscription();

  public isLoadingModule = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this._internalSubscriptions.add(
      this.router.events.subscribe(event => {
        if (event instanceof RouteConfigLoadStart) {
          console.log("loading the module...");
          this.isLoadingModule = true;
        } else if (event instanceof RouteConfigLoadEnd) {
          console.log("module was loaded.");
          this.isLoadingModule = false;
        }
      })
    );
  }
  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }
}
