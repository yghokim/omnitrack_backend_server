import { Component, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { PropertyViewBase } from '../property-view-base';
import { UniqueStringEntryList } from '../../../../../../../omnitrack/core/datatypes/unique-string-entry-list';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material';
import { YesNoDialogComponent } from '../../../../../dialogs/yes-no-dialog/yes-no-dialog.component';
import { TextInputDialogComponent } from '../../../../../dialogs/text-input-dialog/text-input-dialog.component';

@Component({
  selector: 'app-entry-list-property-view',
  templateUrl: './entry-list-property-view.component.html',
  styleUrls: ['./entry-list-property-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntryListPropertyViewComponent extends PropertyViewBase<UniqueStringEntryList> implements OnDestroy {

  private _internalSubscriptions = new Subscription()

  get idList(): Array<number>{
    return this.propertyValue.entries.map(e => e.id)
  }

  constructor(private matDialog: MatDialog, private changeDetector: ChangeDetectorRef) {
    super()
  }

  ngOnDestroy() {
    this._internalSubscriptions.unsubscribe()
  }

  drop(event: CdkDragDrop<any[]>) {
    const newIdList = this.idList.slice(0)
    moveItemInArray(newIdList, event.previousIndex, event.currentIndex);
    this.propertyValue.entries = newIdList.map(id => this.propertyValue.entries.find(e => e.id === id))
    this.propertyValueChange.emit(this.propertyValue)
  }

  getEntryName(id: number) {
    const match = this.propertyValue.entries.find(e => e.id === id)
    if (match) { return match.val } else { return null }
  }


  onAddClicked() {
    this._internalSubscriptions.add(
      this.matDialog.open(TextInputDialogComponent, {
        data: {
          title: "Add New Entry",
          prefill: "",
          placeholder: "Insert entry text",
          positiveLabel: "Add",
          negativeLabel: "Cancel",
          validator: ((value:string) => {
            return value && value.length > 0 && this.propertyValue.entries.find(e => e.val === value) == null
          })
        }
      }).afterClosed().subscribe(
        (text: string) => {
          if (text) {

            const newEntry = {
              id: ++this.propertyValue.seed,
              val: text.trim()
            }
            this.propertyValue.entries.push(newEntry)
            this.propertyValueChange.emit(this.propertyValue)
            this.changeDetector.markForCheck()
          }
        }
      ))
  }

  onEditClicked(entryId: number) {
    const entry = this.propertyValue.entries.find(e => e.id === entryId)
    if (entry != null) {
      this._internalSubscriptions.add(
        this.matDialog.open(TextInputDialogComponent, {
          data: {
            title: "Edit Entry",
            message: null,
            prefill: entry.val,
            placeholder: "Insert entry text",
            positiveLabel: "Apply",
            negativeLabel: "Cancel",
            validator: ((value) => {
              return value !== entry.val && this.propertyValue.entries.find(e => e.val === value) == null
            })
          }
        }).afterClosed().subscribe(
          text => {
            if (text) {
              const entryToEdit = this.propertyValue.entries.find(e => e.id === entryId)
              entryToEdit.val = text
              this.propertyValueChange.emit(this.propertyValue)
              this.changeDetector.markForCheck()
            }
          }
        ))
    }
  }

  onRemoveClicked(entryId: number) {
    this._internalSubscriptions.add(
      this.matDialog.open(YesNoDialogComponent, {
        data: {
          title: "Remove Entry",
          message: "Do you want to remove the entry?"
        }
      }).afterClosed().subscribe(result => {
        if (result === true) {

          const index = this.propertyValue.entries.findIndex(e => e.id === entryId)
          if (index >= 0) {
            this.propertyValue.entries.splice(index, 1)
            this.propertyValueChange.emit(this.propertyValue)
          }
        }
      })
    )
  }
}
