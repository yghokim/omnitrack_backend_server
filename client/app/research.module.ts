import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SharedModule } from "./shared/shared.module";
import { InstallationWizardComponent } from "./installation/installation-wizard/installation-wizard.component";
import { HttpMethodTestingComponent } from "./test/http-method-testing/http-method-testing.component";
import { NgxJsonViewerModule } from 'ngx-json-viewer';

@NgModule({
  imports: [
    CommonModule, 
    SharedModule, 
    NgxJsonViewerModule,
  ],
    
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    InstallationWizardComponent,
    HttpMethodTestingComponent
  ],
})
export class ResearchModule {}
