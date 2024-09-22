import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FrComponent } from './fr.component';
import { FrSearchComponent } from './fr-search/fr-search.component';

const routes: Routes = [{
  path: '',
  component: FrComponent,
  children: [ {
    path: 'search',
    component: FrSearchComponent,
  }],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FrRoutingModule { }
