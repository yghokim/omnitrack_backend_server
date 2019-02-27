import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  Router,
  RouteConfigLoadStart,
  RouteConfigLoadEnd
} from "@angular/router";
import { Subscription } from "rxjs/internal/Subscription";
import { HttpClient } from "@angular/common/http";
import { SocketService } from "./services/socket.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly _internalSubscriptions = new Subscription();

  public isLoadingModule = false;

  public serverError: { message: string } = null

  constructor(private socketService: SocketService, private router: Router, private http: HttpClient) { }

  ngOnInit(): void {
    this._internalSubscriptions.add(
      this.router.events.subscribe(event => {
        if (event instanceof RouteConfigLoadStart) {
          this.isLoadingModule = true;
        } else if (event instanceof RouteConfigLoadEnd) {
          this.isLoadingModule = false;
        }
      })
    );

    this._internalSubscriptions.add(
      this.socketService.serverDiagnosticsEvent.subscribe(
        args => {
          this.reflectServerStatus(args)
        }
      )
    )

    this.checkServerStatus()
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  checkServerStatus() {
    this._internalSubscriptions.add(
      this.http.get<any>("/api/server_status").subscribe(
        res => {
          this.reflectServerStatus(res)
        }
      )
    )
  }

  private reflectServerStatus(statusArgs){
    if (statusArgs.mongodb_connected === false) {
      this.serverError = {
        message: "MongoDB is not connected to the backend server. Check at the server console."
      }
    }else{
      this.serverError = null
    }
  }
}
