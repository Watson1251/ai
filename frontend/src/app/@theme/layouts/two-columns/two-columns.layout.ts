import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'ngx-two-columns-layout',
  styleUrls: ['./two-columns.layout.scss'],
  template: `
    <nb-layout windowMode>

      <!-- Header -->
      <nb-layout-header fixed>
        <ngx-header></ngx-header>
      </nb-layout-header>

      <!-- Menu -->
      <nb-sidebar class="menu-sidebar" tag="menu-sidebar" responsive start>
        <ng-content select="nb-menu"></ng-content>
      </nb-sidebar>

      <!-- Content -->
      <nb-layout-column class="small" fixed [ngStyle]="{'margin-left.px': fixedColumnWidth}">
        <ng-content select="router-outlet"></ng-content>
      </nb-layout-column>

      <!-- Fixed Column Left-->
      <nb-layout-column class="fixed-column" [ngStyle]="{'width.px': fixedColumnWidth}">
        <h1>Fixed Column</h1>
      </nb-layout-column>

      <!-- Footer -->
      <nb-layout-footer fixed>
        <ngx-footer></ngx-footer>
      </nb-layout-footer>

    </nb-layout>
  `,
})
export class TwoColumnsLayoutComponent {

  fixedColumnWidth = 300;

}
