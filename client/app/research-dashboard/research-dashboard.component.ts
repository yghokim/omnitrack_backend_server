import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { ResearchApiService } from '../services/research-api.service';
import ExperimentInfo from '../models/experiment-info';
import { MatDialog, MatIconRegistry } from '@angular/material';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';

@Component({
  selector: 'app-research-dashboard',
  templateUrl: './research-dashboard.component.html',
  styleUrls: ['./research-dashboard.component.scss']
})
export class ResearchDashboardComponent implements OnInit {

  isLoadingSelectedExperiment = true;
  isLoadingExperiments = true;

  headerTitle;
  upperHeaderTitle;
  backNavigationUrl;
  selectedExperimentName;

  experimentInfos: Array<ExperimentInfo> = [];

  dashboardNavigationGroups = [
    {
      name: 'Research',
      menus: [
        {
          name: 'Overview',
          key: 'overview',
          icon: 'timeline'
        },
        {
          name: 'Self-Tracking Data',
          key: 'tracking-data',
          icon: 'view_list'
        },
        {
          name: 'Participants',
          key: 'participants',
          icon: 'person'
        },
        {
          name: 'Messaging',
          key: 'messaging',
          icon: 'sms'
        }
      ]
    },
    {
      name: 'Design',
      menus: [
        {
          name: 'Groups',
          key: 'groups',
          icon: 'group'
        },
        {
          name: 'OmniTrack',
          key: 'omnitrack',
          icon: 'tune'
          //svgIcon: 'omnitrack',
          // iconPath: '/assets/ic_omnitrack_24px.svg'
        }
      ]
    },
    {
      name: 'Settings',
      menus: [
        {
          name: 'Invitations',
          key: 'invitations',
          icon: 'mail'
        },
        {
          name: 'Experiment Settings',
          key: 'settings',
          icon: 'settings'
        }
      ]
    }

  ];

  constructor(
    public api: ResearchApiService,
    public authService: ResearcherAuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private iconRegistry: MatIconRegistry
  ) {
    iconRegistry.addSvgIcon("omnitrack", sanitizer.bypassSecurityTrustResourceUrl("/assets/ic_omnitrack_24px.svg"))

    this.router.events.filter(ev => ev instanceof NavigationEnd)
      .map(_ => this.router.routerState.root)
      .map(route => {
        while (route.firstChild) { route = route.firstChild; }
        return route;
      })
      .flatMap(route => route.data)
      .subscribe(data => {
        this.headerTitle = data['title'];
        this.upperHeaderTitle = data['backTitle'];
        this.backNavigationUrl = data['backNavigationUrl'];
      })
  }

  ngOnInit() {
    // init experiment infos
    this.activatedRoute.paramMap.subscribe(paramMap => {
      const paramExpId = paramMap.get('experimentId')
      if (paramExpId) {
        console.log('mount an experiment : ' + paramExpId)
        localStorage.setItem('selectedExperiment', paramExpId)
        this.onExperimentSelected(paramExpId)
      } else {
        this.api.getExperimentInfos().subscribe(experiments => {
          this.isLoadingExperiments = false
          this.experimentInfos = experiments
          if (this.experimentInfos.length > 0) {
            let selectedId = localStorage.getItem('selectedExperiment') || this.experimentInfos[0].id
            if (this.experimentInfos.findIndex(exp => exp.id === selectedId) === -1) {
              selectedId = this.experimentInfos[0].id
            }
            this.router.navigate(['research/dashboard', selectedId])
          }
        })
      }
    })

    console.log('load experiments of user')
    this.api.getExperimentInfos().subscribe(experiments => {
      console.log('experiments were loaded.')
      this.isLoadingExperiments = false
      this.experimentInfos = experiments
    })
  }

  onExperimentSelected(id) {
    this.isLoadingSelectedExperiment = true
    this.api.setSelectedExperimentId(id).subscribe((exp) => {
      console.log(exp)
      this.selectedExperimentName = exp.name
      this.isLoadingSelectedExperiment = false
    })
  }

  onSignOutClicked() {
    const dialogRef = this.dialog.open(YesNoDialogComponent, {
      data: {
        title: 'Sign Out', message: 'Do you want to sign out?',
      }
    })
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.signOut()
      }
    })
  }

  signOut() {
    this.authService.signOut().subscribe((signedOut) => {
      console.log('successfully signed out.');
      this.goToSignIn();
    });
  }

  goToSignIn() {
    this.router.navigate(['/research/login']);
  }

}
