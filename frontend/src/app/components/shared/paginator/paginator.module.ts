import { NgModule } from '@angular/core';
import { AngularMaterialModule } from '../../../angular-material.module';
import { ThemeModule } from '../../../@theme/theme.module';
import { PaginatorComponent } from './paginator.component';

@NgModule({
  imports: [
    ThemeModule,
    AngularMaterialModule
  ],
  declarations: [
    PaginatorComponent
  ],
  exports: [
    PaginatorComponent
  ]
})
export class PaginatorModule { }
