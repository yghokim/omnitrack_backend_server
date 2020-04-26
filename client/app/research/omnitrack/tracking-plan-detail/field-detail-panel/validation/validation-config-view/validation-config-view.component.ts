import { Component, OnInit, Input, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { IFieldValidationDbEntity } from '../../../../../../../../omnitrack/core/db-entity-types';
import { PropertyViewBase } from '../../../properties/property-view-base';
import { ValidatorSpec, ValidatorType, getValidatorSpec } from '../../../../../../../../omnitrack/core/fields/validators/validation-helper';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { YesNoDialogComponent } from '../../../../../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { NewValidationRuleDialogComponent } from '../new-validation-rule-dialog/new-validation-rule-dialog.component';

@Component({
  selector: 'app-validation-config-view',
  templateUrl: './validation-config-view.component.html',
  styleUrls: ['./validation-config-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValidationConfigViewComponent extends PropertyViewBase<[IFieldValidationDbEntity]> implements OnDestroy {

  @Input()
  supportedValidatorSpecs: Array<ValidatorSpec>

  private _internalSubscriptions = new Subscription()

  constructor(private matDialog: MatDialog, private changeDetector: ChangeDetectorRef) {
    super()
  }

  ngOnDestroy(): void {
    this._internalSubscriptions.unsubscribe()
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.propertyValue, event.previousIndex, event.currentIndex);
    this.propertyValueChange.emit(this.propertyValue)
  }

  getValidationSpec(type: ValidatorType): ValidatorSpec {
    return getValidatorSpec(type)
  }

  onEditClicked(index: number) {

  }

  onRemoveClicked(index: number) {
    this._internalSubscriptions.add(
      this.matDialog.open(YesNoDialogComponent, {
        data: {
          title: "Remove Rule",
          message: "Do you want to remove this rule?"
        }
      }).afterClosed().subscribe(result => {
        if (result === true) {
          this.propertyValue.splice(index, 1)
          this.propertyValueChange.emit(this.propertyValue)
        }
      })
    )
  }

  onAddClicked() {
    this._internalSubscriptions.add(
      this.matDialog.open(NewValidationRuleDialogComponent, {
        data: {
          supportedValidatorSpecs: this.supportedValidatorSpecs
        }
      }).afterClosed().subscribe(
        (newValidator: IFieldValidationDbEntity) => {
          if (newValidator) {

            if (this.propertyValue) {
              this.propertyValue.push(newValidator)
            } else {
              this.propertyValue = [newValidator]
            }

            this.propertyValueChange.emit(this.propertyValue)
            this.changeDetector.markForCheck()
          }
        }
      ))
  }

}
