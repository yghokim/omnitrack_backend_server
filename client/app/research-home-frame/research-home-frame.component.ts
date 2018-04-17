import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { Subscription } from 'rxjs/Subscription';
import { ResearcherPrevilages } from '../../../omnitrack/core/research/researcher';
import { templateJitUrl } from '@angular/compiler';

@Component({
  selector: 'app-research-home-frame',
  templateUrl: './research-home-frame.component.html',
  styleUrls: ['./research-home-frame.component.scss']
})
export class ResearchHomeFrameComponent implements OnInit, OnDestroy {

  private readonly internalSubscriptions = new Subscription()

  private gnbElements = [
    {
      url: ["/research", "experiments"],
      name: 'Experiments',
      secure: true
    },
    {
      url: ['/research', 'settings'],
      name: 'Server Settings',
      secure: true,
      minimumPermission: ResearcherPrevilages.ADMIN
    }
  ]

  public mainGnbs: Array<any>

  constructor(private auth: ResearcherAuthService) {
  }

  ngOnInit() {
    this.internalSubscriptions.add(
      this.auth.currentResearcher.subscribe(researcher => {
        if (researcher && researcher.tokenInfo) {
          console.log("refresh researcher")
          this.mainGnbs = this.gnbElements.filter((e: any) => {
            console.log("researcher previlage: " + researcher.previlage)
            return (e.minimumPermission || ResearcherPrevilages.NORMAL) <= researcher.previlage
          })
        }
      })
    )
  }

  ngOnDestroy() {
    this.internalSubscriptions.unsubscribe()
  }

}
