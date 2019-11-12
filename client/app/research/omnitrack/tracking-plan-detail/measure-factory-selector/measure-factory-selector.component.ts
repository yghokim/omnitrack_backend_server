import { Component, Input, EventEmitter, Output, ChangeDetectorRef } from "@angular/core";
import { AMeasureFactory } from "../../../../../../omnitrack/core/value-connection/measure-factory";
import { MatDialog } from "@angular/material";
import { Subscription } from "rxjs";
import { FactoryListComponent } from "./factory-list.component";

@Component({
  selector: 'app-measure-factory-selector',
  templateUrl: './measure-factory-selector.component.html',
  styleUrls: ['./measure-factory-selector.component.scss'],
})
export class MeasureFactorySelectorComponent {

  private _internalSubscriptions = new Subscription()

  @Input()
  factories: Array<AMeasureFactory>

  @Input()
  selectedFactory: AMeasureFactory

  @Output()
  selectedFactoryChange = new EventEmitter<AMeasureFactory>()

  constructor(private dialog: MatDialog, private changeDetector: ChangeDetectorRef) {

  }

  onButtonClicked() {
    this._internalSubscriptions.add(
      this.dialog.open(FactoryListComponent, { data: { factories: this.factories } }).afterClosed().subscribe(factory => {
        if(factory != null){
          if(this.selectedFactory !== factory){
            this.selectedFactory = factory
            this.selectedFactoryChange.emit(factory)
            this.changeDetector.markForCheck()
          }
        }
      })
    )
  }
}