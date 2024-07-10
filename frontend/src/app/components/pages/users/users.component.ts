import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { SnackbarService } from '../../../services/snackbar.service';
import { Helper } from '../../shared/helpers';
import { User } from '../../../models/user.model';
import { UsersService } from '../../../services/users.services';
import { UserDialogInterface } from './user-dialog/user-dialog-interface';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { Role } from '../../../models/role.model';
import { RolesService } from '../../../services/roles.services';

interface RowData {
  id: number,
  userId: string,
  name: string,
  username: string,
  role: string,
}

@Component({
  selector: 'ngx-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  providers: [
    {provide: MAT_DATE_LOCALE, useValue: 'ar'},
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    {provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS},
  ],
})
export class UsersComponent {
  
  Helper = Helper;

  shownRows: RowData[] = [];

  displayedColumns: string[] = ['select', 'id', 'name', 'username', 'role'];

  dataSource: MatTableDataSource<RowData>;
  selection = new SelectionModel<RowData>(true, []);

  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  @ViewChild(MatSort, { static: false }) set setSort(content: any) {
    if (content) {
      setTimeout(() => {
        this.sort = content;
        this.dataSource.sort = this.sort as MatSort;
      });
    }
  }

  private rolesSub?: Subscription;
  private usersSub?: Subscription;

  searchValue: string = "";

  roles: Role[] = [];
  users: User[] = [];
  sortedUsers: User[] = [];
  selectedUser: User = {
    id: '',
    name: '',
    username: '',
    roleId: ''
  };

  constructor(
    public dialog: MatDialog,
    public rolesService: RolesService,
    public usersService: UsersService,
    private snackbarService: SnackbarService
  ) {
    this.shownRows = this.generateRows();
    this.dataSource = new MatTableDataSource(this.shownRows);
    this.dataSource.sort = this.sort as MatSort;
  }

  ngOnInit() {

    this.rolesService.getRoles();
    this.rolesSub = this.rolesService.getRolesUpdateListener().subscribe((rolesData: any) => {
      this.roles = rolesData;

      this.usersService.getUsers();
      this.usersSub = this.usersService.getUsersUpdateListener().subscribe((usersData: any) => {
        this.users = usersData;
        this.sortedUsers = this.users.slice();
  
        this.shownRows = this.generateRows();
        this.dataSource = new MatTableDataSource(this.shownRows);
        this.dataSource.sort = this.sort as MatSort;
      });

    });
  }

  ngOnDestroy() {
    this.usersSub?.unsubscribe();
    this.rolesSub?.unsubscribe();
  }

  generateRows() {
    var rowData: RowData[] = [];

    for (let i = 1; i <= this.sortedUsers.length; i++) {
      const user = this.sortedUsers[i-1];
      const role: Role = this.roles.find(object => object.id == user.roleId) as Role;
      
      const data: RowData = {
        id: i,
        userId: user.id,
        name: user.name,
        username: user.username,
        role: role != null ? role.role : "لم يتم تحديده"
      };

      rowData.push(data);
    }

    return rowData;
  }

  sortData(sort: Sort) {
    Helper.sortData(sort, this.users, this.sortedUsers)
  }

  getRoleById(id: string) {
    const obj = this.roles.find(item => item.id === id);
    return obj ? obj['role'] : undefined;
  }

  openDialog(status: string) {

    const dialogData: UserDialogInterface = {
      status: status,
      selectedUser: this.selectedUser,
      users: this.users,
      roles: this.roles,
    }

    const dialogRef = this.dialog.open(UserDialogComponent, {
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result == 'success') {
        this.selectedUser = {
          id: '',
          name: '',
          username: '',
          roleId: ''
        };

        if (status == "add") {
          this.snackbarService.openSnackBar('تم إضافة مستخدم جديد بنجاح.', 'success');
        } else if (status == "edit") {
          this.snackbarService.openSnackBar('تم تعديل المستخدم بنجاح.', 'success');
        } else if (status == "delete") {
          this.snackbarService.openSnackBar('تم حذف المستخدم بنجاح.', 'success');
        }
      }
    });
  }

  isSelected(row: any) {
    var isSelected = this.selection.isSelected(row);
    this.selection.clear();

    if (isSelected) {
      this.selection.deselect(row);
      this.selectedUser = {
        id: '',
        name: '',
        username: '',
        roleId: ''
      };
    } else {
      this.selection.select(row);

      var user = this.users.find(a => a.id == row.userId);

      if (user) {
        this.selectedUser = user;
      }
    }
  }

  applyFilter(event: Event) {
    if (!this.dataSource) {
      return;
    }

    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isAllowed(action: string): boolean {
    switch (action) {
      case "add-empty":
        return this.users.length == 0;

      case "add":
        return this.users.length > 0;

      case "edit":
        return (this.users.length > 0) && (this.selectedUser.id != "");

      case "delete":
        return (this.users.length > 0) && (this.selectedUser.id != "");

      case "view":
        return this.users.length > 0;

      default:
        return false;
    }
  }
}
