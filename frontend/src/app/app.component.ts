/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit } from '@angular/core';
import { NbSpinnerService } from '@nebular/theme';
import { AuthService } from './services/auth.services';

@Component({
  selector: 'ngx-app',
  template: `
    <nb-layout windowMode>
      <nb-layout-column>
      <router-outlet></router-outlet>
      </nb-layout-column>
    </nb-layout>
  `,
})
export class AppComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private spinner$: NbSpinnerService
  ) { }

  ngOnInit(): void {
    // this.spinner$.load();
    this.authService.autoAuthUser();
  }
}
