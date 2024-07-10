import { NgModule } from '@angular/core';
import { NbCardModule, NbIconModule, NbInputModule, NbTreeGridModule } from '@nebular/theme';
import { AngularMaterialModule } from '../../../angular-material.module';
import { ThemeModule } from '../../../@theme/theme.module';
import { PrivilegesComponent } from './privileges.component';
import { PaginatorModule } from '../../shared/paginator/paginator.module';

@NgModule({
  imports: [
    NbCardModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    ThemeModule,
    AngularMaterialModule,
    PaginatorModule
  ],
  declarations: [
    PrivilegesComponent
  ],
})
export class PrivilegesModule { }
