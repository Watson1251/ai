import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbIconLibraries, NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService } from '@nebular/theme';

import { UserData } from '../../../@core/data/users';
import { LayoutService } from '../../../@core/utils';
import { map, takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { RippleService } from '../../../@core/utils/ripple.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.services';
import { UsersService } from '../../../services/users.services';
import { User } from '../../../models/user.model';

interface TempUser {
  name: string;
  picture: string;
}


@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {

  private destroy$: Subject<void> = new Subject<void>();
  public readonly materialTheme$: Observable<boolean>;
  userPictureOnly: boolean = false;
  tempUser: TempUser = {
    name: '',
    picture: ''
  };
  returnedUser: User = {
    id: '',
    name: '',
    username: '',
    roleId: ''
  };

  currentTheme = 'default';

  userMenu = [ { title: 'تسجيل الخروج' } ];

  public constructor(
    private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private layoutService: LayoutService,
    private breakpointService: NbMediaBreakpointsService,
    private iconLibraries: NbIconLibraries,
    private router: Router,
    private rippleService: RippleService,
    private authService: AuthService,
    private userService: UsersService
  ) {
    this.iconLibraries.registerFontPack('font-awesome', { packClass: 'fa', iconClassPrefix: 'fa' });
  }

  ngOnInit() {
    this.menuService.onItemClick().subscribe(( event ) => {
      this.onMenuItemClick(event.item.title);
    })

    const userID = this.authService.getUserId();
    this.userService.getUser(userID).subscribe((userData: any) => {
      this.returnedUser.id = userData.body._id;
      this.returnedUser.name = userData.body.name;
      this.returnedUser.username = userData.body.username;
      this.returnedUser.roleId = userData.body.roleId;

      this.tempUser.name = this.returnedUser.name;
    });;

    const { xl } = this.breakpointService.getBreakpointsMap();
    this.themeService.onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$),
      )
      .subscribe((isLessThanXl: boolean) => this.userPictureOnly = isLessThanXl);
    
    this.themeService.onThemeChange()
      .pipe(
        map(({ name }) => name),
        takeUntil(this.destroy$),
      )
      .subscribe(themeName => {
        this.currentTheme = themeName;
        this.rippleService.toggle(themeName?.startsWith('material'));
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToUsers() {
    this.router.navigate(['/pages/users']);
  }

  goToPermissions() {
    this.router.navigate(['/pages/privileges']);
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    this.layoutService.changeLayoutSize();

    return false;
  }

  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }

  onMenuItemClick(event) {
    switch (event) {
      case 'تسجيل الخروج':
        this.authService.logout();
        break;
      
      default:
        break;
    }
  }
}
