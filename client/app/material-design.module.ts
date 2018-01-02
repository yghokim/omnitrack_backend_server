import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatTabsModule, MatCheckboxModule, MatRadioModule, MatMenuModule, MatIconRegistry, MatButtonModule } from '@angular/material';
import { YesNoDialogComponent } from './dialogs/yes-no-dialog/yes-no-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatCheckboxModule,
    MatRadioModule,
    MatMenuModule,
    MatButtonModule
  ],
  exports: [
    MatDialogModule,
    MatTabsModule,
    MatCheckboxModule,
    MatRadioModule,
    MatMenuModule,
    MatButtonModule
  ],
  providers: [
    MatIconRegistry]
})
export class MaterialDesignModule { }
