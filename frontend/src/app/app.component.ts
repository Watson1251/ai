/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit } from '@angular/core';
import { NbSpinnerService } from '@nebular/theme';
import { AuthService } from './services/auth.services';
import { MENU_ITEMS } from './components/pages/pages-menu';

@Component({
  selector: 'ngx-app',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {

  menu = MENU_ITEMS;

  isAuth: boolean = false;

  constructor(
    private authService: AuthService,
    private spinner$: NbSpinnerService
  ) { }

  ngOnInit(): void {
    // this.spinner$.load();
    this.authService.autoAuthUser();
    this.isAuth = this.authService.getIsAuth();
    console.log(this.isAuth);
  }
}
