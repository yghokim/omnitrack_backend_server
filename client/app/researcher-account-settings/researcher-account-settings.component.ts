import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { deepclone, isNullOrBlank, isNullOrEmpty } from '../../../shared_lib/utils';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-researcher-account-settings',
  templateUrl: './researcher-account-settings.component.html',
  styleUrls: ['./researcher-account-settings.component.scss']
})
export class ResearcherAccountSettingsComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  private originalResearcher: any

  public alias: string = null
  public newPassword: string = null
  private newPasswordConfirm: string = null
  private originalPassword: string = null

  isAccountApproved: boolean

  constructor(private authService: ResearcherAuthService
  ) { }

  ngOnInit() {

    this._internalSubscriptions.add(
      this.authService.currentResearcher.subscribe(
        researcher => {
          this.originalResearcher = researcher.tokenInfo

          if (researcher.tokenInfo) {
            this.alias = deepclone(researcher.tokenInfo.alias)
            this.originalPassword = null
            this.newPassword = null
            this.newPasswordConfirm = null

            this.isAccountApproved = researcher.tokenInfo.approved
          }
        }
      )
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  isValid(): boolean {
    if (this.originalResearcher) {
      if (isNullOrBlank(this.newPassword)) {
        //alias should be different
        return !isNullOrBlank(this.alias) && this.originalResearcher.alias !== this.alias
      }
      else {
        return this.newPassword.length >= 6 && this.newPassword === this.newPasswordConfirm && this.originalPassword && this.originalPassword.length > 0
      }
    }
    else return false
  }

  onSubmitClicked() {
    if (this.isValid()) {
      this._internalSubscriptions.add(
        this.authService.updateInfo(this.alias, this.newPassword, this.originalPassword).subscribe(newResearcher => {
          console.log(newResearcher)

        })
      )
    }
  }

}
