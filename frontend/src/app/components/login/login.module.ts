import { NgModule } from '@angular/core';
import { NbCardModule, NbIconModule, NbInputModule, NbLayoutModule, NbTreeGridModule } from '@nebular/theme';
import { ThemeModule } from '../../@theme/theme.module';
import { AngularMaterialModule } from '../../angular-material.module';
import { PaginatorModule } from '../shared/paginator/paginator.module';
import { LoginComponent } from './login.component';

@NgModule({
  imports: [
    NbCardModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    ThemeModule,
    NbLayoutModule,
    AngularMaterialModule,
    PaginatorModule
  ],
  declarations: [
    LoginComponent
  ],
})
export class LoginModule { }
