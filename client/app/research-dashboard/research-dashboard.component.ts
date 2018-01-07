import { Component, OnInit, trigger, state, style, transition, animate } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { ResearchApiService } from '../services/research-api.service';
import { NotificationService } from '../services/notification.service';
import ExperimentInfo from '../models/experiment-info';
import { MatDialog, MatIconRegistry, MatSnackBar } from '@angular/material';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';

@Component({
  selector: 'app-research-dashboard',
  templateUrl: './research-dashboard.component.html',
  styleUrls: ['./research-dashboard.component.scss'],
  animations: [
    trigger('ySlide', [
      state('false', style({ transform: "translate(0, -100%)" })),
      transition("true => false", animate('700ms ease-in'))
    ])
  ]
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
    private notificationService: NotificationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private iconRegistry: MatIconRegistry,
    private snackBar: MatSnackBar
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

    this.notificationService.snackBarMessageQueue.subscribe(
      message=>{
        console.log(message)
        if(message.action)
        {
          this.snackBar.open(message.message, message.action.label, {duration : 3000})
        }
        else this.snackBar.open(message.message, null, { duration : 3000 })
      }
    )
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

    this.api.selectedExperimentService.filter(expService => expService!=null).do(expService => {
      this.isLoadingSelectedExperiment = true;
    }).flatMap( expService => 
      expService.getExperiment()).subscribe(
        experimentInfo => {
          if(experimentInfo)
          {
            this.isLoadingSelectedExperiment = false
            this.selectedExperimentName = experimentInfo.name
          }
        }
      )
  }


  onExperimentSelected(id) {
    this.api.setSelectedExperimentId(id)
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
    this.router.navigate(['/research/login']).then(
      onFulfilled => {
        if(onFulfilled==true)
        {
          this.snackBar.open("Signed out from the research dashboard.", null, {duration: 3000})
        }
      }
    )
  }

}
