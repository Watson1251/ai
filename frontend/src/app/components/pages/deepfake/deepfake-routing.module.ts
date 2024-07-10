import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DeepfakeComponent } from './deepfake.component';
import { DeepfakeDetectionComponent } from './deepfake-detection/deepfake-detection.component';

const routes: Routes = [{
  path: '',
  component: DeepfakeComponent,
  children: [ {
    path: 'detection',
    component: DeepfakeDetectionComponent,
  }],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DeepfakeRoutingModule { }
