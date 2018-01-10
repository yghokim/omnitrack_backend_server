import { Component, OnInit, trigger, state, style, transition, animate, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { ResearchApiService } from '../services/research-api.service';
import { NotificationService } from '../services/notification.service';
import ExperimentInfo from '../models/experiment-info';
import { MatDialog, MatIconRegistry, MatSnackBar } from '@angular/material';
import { YesNoDialogComponent } from '../dialogs/yes-no-dialog/yes-no-dialog.component';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { ExperimentPermissions } from '../../../omnitrack/core/research/experiment';

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
export class ResearchDashboardComponent implements OnInit, OnDestroy {

  isLoadingSelectedExperiment = true;
  isLoadingExperiments = true;

  headerTitle;
  upperHeaderTitle;
  backNavigationUrl;
  selectedExperimentName;

  private readonly _internalSubscriptions = new Subscription()

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

  private experimentPermissions: ExperimentPermissions

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

    this._internalSubscriptions.add(
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
    )

    this._internalSubscriptions.add(
      this.notificationService.snackBarMessageQueue.subscribe(
        message => {
          console.log(message)
          if (message.action) {
            this.snackBar.open(message.message, message.action.label, { duration: 3000 })
          }
          else this.snackBar.open(message.message, null, { duration: 3000 })
        })
    )
  }

  ngOnInit() {
    // init experiment infos
    this._internalSubscriptions.add(
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
              let selectedId = localStorage.getItem('selectedExperiment') || this.experimentInfos[0]._id
              if (this.experimentInfos.findIndex(exp => exp._id === selectedId) === -1) {
                selectedId = this.experimentInfos[0]._id
              }
              this.router.navigate(['research/dashboard', selectedId])
            }
          })
        }
      })
    )

    console.log('load experiments of user')
    this._internalSubscriptions.add(
      this.api.getExperimentInfos().subscribe(experiments => {
        console.log('experiments were loaded.')
        this.isLoadingExperiments = false
        this.experimentInfos = experiments
      })
    )

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.filter(expService => expService != null).do(expService => {
        this.isLoadingSelectedExperiment = true;
      }).flatMap(expService =>
        expService.getExperiment()).subscribe(
        experimentInfo => {
          if (experimentInfo) {
            this.isLoadingSelectedExperiment = false
            this.selectedExperimentName = experimentInfo.name
          }
        })
    )

    this._internalSubscriptions.add(
      this.api.selectedExperimentService.flatMap(expService => expService.getMyPermissions()).filter(p=>p!=null).subscribe(
        permissions => {
          if(permissions && this.experimentPermissions != permissions)
          {
            this.experimentPermissions = permissions
            this.applyPermissions(permissions)
          }
        }
      )
    )
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  private applyPermissions(permissions: ExperimentPermissions)
  {
    console.log("apply experiment permissions")
    console.log(permissions)
    this.dashboardNavigationGroups.forEach(group => {
      group.menus.forEach(menu => {
        const pagePermission = permissions.allowedPages[menu.key]
        if(pagePermission)
        {
          if(pagePermission instanceof Boolean)
          {
            menu["disabled"] = pagePermission
          }else{

          }
        }
        else{
          menu["disabled"] = true
        }
      })
    })
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
    this._internalSubscriptions.add(
      dialogRef.afterClosed().subscribe(result => {
        if (result === true) {
          this.signOut()
        }
      })
    )
  }

  signOut() {
    this._internalSubscriptions.add(
      this.authService.signOut().subscribe((signedOut) => {
        console.log('successfully signed out.');
        this.goToSignIn();
      })
    )
  }

  goToSignIn() {
    this.router.navigate(['/research/login']).then(
      onFulfilled => {
        if (onFulfilled == true) {
          this.snackBar.open("Signed out from the research dashboard.", null, { duration: 3000 })
        }
      }
    )
  }

  getMyRole(): Observable<string>{
    return this.api.selectedExperimentService.flatMap(service => service.getMyRole())
  }
}
