/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component, OnInit, OnDestroy } from "@angular/core";
import { NbSpinnerService } from "@nebular/theme";
import { AuthService } from "./services/auth.services";
import { Subscription } from "rxjs";
import { MENU_ITEMS } from "./components/pages/pages-menu";

@Component({
  selector: "ngx-app",
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit, OnDestroy {
  menu = MENU_ITEMS;

  isAuth: boolean = false;
  private authStatusSub?: Subscription;

  constructor(
    private authService: AuthService,
    private spinner$: NbSpinnerService
  ) {}

  ngOnInit(): void {
    // this.spinner$.load();
    this.authService.autoAuthUser();

    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe((authStatus) => {
        this.isAuth = authStatus;
      });
  }

  ngOnDestroy(): void {
    this.authStatusSub?.unsubscribe();
  }
}
