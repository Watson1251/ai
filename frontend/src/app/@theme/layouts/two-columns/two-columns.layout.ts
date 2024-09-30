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
      <nb-layout-column class="small" fixed>
        <ng-content select="router-outlet"></ng-content>
      </nb-layout-column>

      <!-- Footer -->
      <nb-layout-footer fixed>
        <ngx-footer></ngx-footer>
      </nb-layout-footer>

    </nb-layout>
  `,
})
export class TwoColumnsLayoutComponent {
}
