import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatTableModule, MatSortModule, MatTabsModule, MatCheckboxModule, MatRadioModule, MatMenuModule, MatIconRegistry, MatButtonModule, MatSelectModule, MatInputModule, MatTooltipModule, MatDatepickerModule, MatNativeDateModule, MatSnackBarModule, MatProgressBarModule, MatProgressSpinnerModule, MatAutocompleteModule, MatChipsModule, MatGridListModule, MatCardModule, MatSlideToggleModule, MatDividerModule } from '@angular/material';

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
    MatDividerModule,
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
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule
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
    MatSlideToggleModule,
    MatTableModule,
    MatSortModule,
    MatDividerModule
  ],
   providers: [
    MatIconRegistry]
})
export class MaterialDesignModule { }
