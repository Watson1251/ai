import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import {
  NbLayoutModule,
  NbSidebarModule,
  NbActionsModule,
  NbAlertModule,
  NbCardModule,
  NbIconModule,
  NbInputModule,
  NbPopoverModule,
  NbSearchModule,
  NbTreeGridModule,
  NbThemeModule,
  NbTooltipModule,
  NbTabsetModule,
  NbDialogModule,
  NbSpinnerModule,
} from "@nebular/theme";

import { ThemeModule } from "../../../@theme/theme.module";
import { FrRoutingModule } from "./fr-routing.module";
import { FrComponent } from "./fr.component";
import { FrSearchComponent } from "./fr-search/fr-search.component";

import { NgxDropzoneModule } from "ngx-dropzone";
import { AngularMaterialModule } from "../../../angular-material.module";
import { PaginatorModule } from "../../shared/paginator/paginator.module";
import { CompareImagesComponent } from "./compare-images/compare-images.component";
import { FrCompareComponent } from "./fr-compare/fr-compare.component";

const components = [
  FrComponent,
  FrSearchComponent,
  FrCompareComponent,
  CompareImagesComponent,
];

@NgModule({
  imports: [
    NbLayoutModule,
    NbSidebarModule,
    NbCardModule,
    NbPopoverModule,
    NbSearchModule,
    NbIconModule,
    NbAlertModule,
    NbActionsModule,
    ThemeModule,
    FrRoutingModule,
    NgxDropzoneModule,
    NbTreeGridModule,
    NbInputModule,
    AngularMaterialModule,
    PaginatorModule,
    NbTooltipModule,
    NbTabsetModule,
    NbDialogModule.forRoot(),
    NbSpinnerModule,
  ],
  declarations: [...components],
})
export class FrModule {}
