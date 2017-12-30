import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatTabsModule, MatCheckboxModule, MatRadioModule, MatMenuModule, MatIconRegistry } from '@angular/material';
import { YesNoDialogComponent } from './dialogs/yes-no-dialog/yes-no-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatCheckboxModule,
    MatRadioModule,
    MatMenuModule
  ],
  exports: [
    MatDialogModule,
    MatTabsModule,
    MatCheckboxModule,
    MatRadioModule,
    MatMenuModule
  ],
  providers: [
    MatIconRegistry]
})
export class MaterialDesignModule { }
