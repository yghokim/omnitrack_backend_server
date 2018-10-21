import { Component, OnInit, OnDestroy } from "@angular/core";
import { ResearcherAuthService } from "../services/researcher.auth.service";
import { Subscription } from "rxjs";
import { ResearcherPrevilages } from "../../../omnitrack/core/research/researcher";
import { templateJitUrl } from "@angular/compiler";
import { Router, RouteConfigLoadStart, RouteConfigLoadEnd } from "@angular/router";

@Component({
  selector: "app-research-home-frame",
  templateUrl: "./research-home-frame.component.html",
  styleUrls: ["./research-home-frame.component.scss"]
})
export class ResearchHomeFrameComponent implements OnInit, OnDestroy {
  private readonly internalSubscriptions = new Subscription();

  private gnbElements = [
    {
      url: ["/research", "experiments"],
      name: "Experiments",
      secure: true
    },
    {
      url: ["/research", "status"],
      name: "Status",
      secure: true,
      minimumPermission: ResearcherPrevilages.ADMIN
    },
    {
      url: ["/research", "settings"],
      name: "Settings",
      secure: true,
      minimumPermission: ResearcherPrevilages.ADMIN
    }
  ];

  public mainGnbs: Array<any>;

  public isLoadingModule = false

  constructor(private auth: ResearcherAuthService, private router: Router) {}

  ngOnInit() {
    this.internalSubscriptions.add(
      this.auth.currentResearcher.subscribe(researcher => {
        if (researcher && researcher.tokenInfo) {
          console.log("refresh researcher");
          this.mainGnbs = this.gnbElements.filter((e: any) => {
            console.log("researcher previlage: " + researcher.previlage);
            return (
              (e.minimumPermission || ResearcherPrevilages.NORMAL) <=
              researcher.previlage
            );
          });
        }
      })
    );

    this.internalSubscriptions.add(
      this.router.events.subscribe(
        event => {
          if(event instanceof RouteConfigLoadStart){
            console.log("loading the module...")
            this.isLoadingModule = true
          } else if (event instanceof RouteConfigLoadEnd) {
            console.log("module was loaded.")
            this.isLoadingModule = false
          }         
        }
      )
      );
  }

  ngOnDestroy() {
    this.internalSubscriptions.unsubscribe();
  }
}
