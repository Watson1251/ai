import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { FrComponent } from "./fr.component";
import { FrSearchComponent } from "./fr-search/fr-search.component";
import { FrCompareComponent } from "./fr-compare/fr-compare.component";

const routes: Routes = [
  {
    path: "",
    component: FrComponent,
    children: [
      {
        path: "search",
        component: FrSearchComponent,
      },
      {
        path: "compare",
        component: FrCompareComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FrRoutingModule {}
