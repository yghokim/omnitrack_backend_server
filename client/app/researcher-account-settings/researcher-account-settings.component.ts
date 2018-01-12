import { Component, OnInit, OnDestroy } from '@angular/core';
import { ResearcherAuthService } from '../services/researcher.auth.service';
import { deepclone, isNullOrBlank, isNullOrEmpty } from '../../../shared_lib/utils';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-researcher-account-settings',
  templateUrl: './researcher-account-settings.component.html',
  styleUrls: ['./researcher-account-settings.component.scss']
})
export class ResearcherAccountSettingsComponent implements OnInit, OnDestroy {

  private _internalSubscriptions = new Subscription()

  private originalResearcher: any

  private alias: string = null
  private newPassword: string = null
  private newPasswordConfirm: string = null
  private originalPassword: string = null

  constructor(private authService: ResearcherAuthService
  ) { }

  ngOnInit() {

    this._internalSubscriptions.add(
      this.authService.currentResearcher.subscribe(
        researcher => {
          this.originalResearcher = researcher
          this.alias = deepclone(researcher.alias)
          this.originalPassword = null
          this.newPassword = null
          this.newPasswordConfirm = null
        }
      )
    )
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  isValid(): boolean {
    if (isNullOrBlank(this.newPassword)) {
      //alias should be different
      return !isNullOrBlank(this.alias) && this.originalResearcher.alias !== this.alias
    }
    else {
      return this.newPassword.length >= 6 && this.newPassword === this.newPasswordConfirm && this.originalPassword && this.originalPassword.length > 0
    }
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
