import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatTabsModule, MatCheckboxModule, MatRadioModule, MatMenuModule, MatIconRegistry, MatButtonModule, MatSelectModule, MatInputModule, MatTooltipModule, MatDatepickerModule, MatNativeDateModule, MatSnackBarModule, MatProgressBarModule, MatProgressSpinnerModule, MatAutocompleteModule, MatChipsModule, MatGridListModule, MatCardModule, MatSlideToggleModule } from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatTabsModule,
    MatCheckboxModule,
    MatRadioModule,
    MatMenuModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatGridListModule,
    MatCardModule,
    MatSlideToggleModule
  ],
  exports: [
    MatDialogModule,
    MatTabsModule,
    MatCheckboxModule,
    MatRadioModule,
    MatMenuModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatChipsModule,
    MatGridListModule,
    MatCardModule,
    MatSlideToggleModule
  ],
   providers: [
    MatIconRegistry]
})
export class MaterialDesignModule { }
