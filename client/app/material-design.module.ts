import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material';
import { YesNoDialogComponent } from './dialogs/yes-no-dialog/yes-no-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
  ],
  exports: [
    MatDialogModule,
  ],
  declarations: []
})
export class MaterialDesignModule { }
