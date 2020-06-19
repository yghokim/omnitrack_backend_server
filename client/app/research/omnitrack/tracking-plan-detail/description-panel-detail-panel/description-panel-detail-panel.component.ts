import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { IDescriptionPanelDbEntity } from "../../../../../../omnitrack/core/db-entity-types";

@Component({
  selector: 'app-description-panel-detail-panel',
  templateUrl: './description-panel-detail-panel.component.html',
  styleUrls: ['./description-panel-detail-panel.component.scss', '../tracking-plan-detail.component.scss', '../selectable-menu-item/selectable-menu-item.component.scss'],
  host: { class: 'sidepanel-container' }
})
export class DescriptionPanelDetailPanelComponent implements OnInit, OnDestroy {


  private _descriptionPanel: IDescriptionPanelDbEntity = null
  @Input('descriptionPanel')
  set setPanel(panel: IDescriptionPanelDbEntity) {
    if (this._descriptionPanel !== panel) {
      this._descriptionPanel = panel
    }
  }

  get descriptionPanel(): IDescriptionPanelDbEntity {
    return this._descriptionPanel
  }


  ngOnDestroy(): void {

  }

  ngOnInit(): void {

  }

}
