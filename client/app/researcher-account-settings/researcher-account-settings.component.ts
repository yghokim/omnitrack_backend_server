import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
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
  newPasswordForm = new FormControl('')
  newPasswordConfirmForm = new FormControl('')
  originalPasswordForm = new FormControl('')
  aliasForm = new FormControl('', [Validators.required])

  private isValid: boolean = false

  accountForm: FormGroup

  constructor(private formBuilder: FormBuilder,
    private authService: ResearcherAuthService
  ) { }

  ngOnInit() {

    this.accountForm = this.formBuilder.group({
      alias: this.aliasForm,
      newPassword: this.newPasswordForm,
      confirmNewPassword: this.newPasswordConfirmForm,
      originalPassword: this.originalPasswordForm
    }, { validator: (group: FormGroup) => {
      if(this.originalResearcher)
      {
        console.log(this.aliasForm.value)
        console.log(this.originalResearcher.alias)
        console.log(this.aliasForm.value !== this.originalResearcher.alias)
        if((this.aliasForm.value !== this.originalResearcher.alias))
        {
          console.log("validation success")
          return null
        }
        else return group.setErrors({sameWithOriginal: true})
      }
      else return group.setErrors({notInitialized: true})
    }})

    this.accountForm.statusChanges.subscribe(status=>{
      console.log(status)
      console.log("valid: " +this.accountForm.valid)
      this.isValid = this.accountForm.valid
    })

    this._internalSubscriptions.add(
      this.authService.currentResearcher.subscribe(
        researcher => {
          this.originalResearcher = researcher
          console.log("received researcher: ")
          console.log(this.originalResearcher)
          this.accountForm.patchValue({
            "alias": deepclone(researcher.alias),
            "newPassword": null,
            "newPasswordConfirm": null
          })

        }
      )
    )
  }

  ngOnDestroy(){
    this._internalSubscriptions.unsubscribe()
  }

}
