import { NgModule } from '@angular/core';
import { NbActionsModule, NbAlertModule, NbCardModule, NbIconModule, NbInputModule, NbPopoverModule, NbSearchModule, NbTreeGridModule } from '@nebular/theme';

import { ThemeModule } from '../../../@theme/theme.module';
import { FrRoutingModule } from './fr-routing.module';
import { FrComponent } from './fr.component';
import { FrSearchComponent } from './fr-search/fr-search.component';

import { NgxDropzoneModule } from 'ngx-dropzone';
import { AngularMaterialModule } from '../../../angular-material.module';
import { PaginatorModule } from '../../shared/paginator/paginator.module';

const components = [
  FrComponent,
  FrSearchComponent,
];

@NgModule({
  imports: [
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
    PaginatorModule
  ],
  declarations: [
    ...components,
  ],
})
export class FrModule { }
