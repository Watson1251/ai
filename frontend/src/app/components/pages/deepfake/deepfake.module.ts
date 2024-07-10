import { NgModule } from '@angular/core';
import { NbActionsModule, NbAlertModule, NbCardModule, NbIconModule, NbInputModule, NbPopoverModule, NbSearchModule, NbTreeGridModule } from '@nebular/theme';

import { ThemeModule } from '../../../@theme/theme.module';
import { DeepfakeRoutingModule } from './deepfake-routing.module';
import { DeepfakeComponent } from './deepfake.component';
import { DeepfakeDetectionComponent } from './deepfake-detection/deepfake-detection.component';

import { NgxDropzoneModule } from 'ngx-dropzone';
import { AngularMaterialModule } from '../../../angular-material.module';
import { PaginatorModule } from '../../shared/paginator/paginator.module';

const components = [
  DeepfakeComponent,
  DeepfakeDetectionComponent,
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
    DeepfakeRoutingModule,
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
export class DeepfakeModule { }
