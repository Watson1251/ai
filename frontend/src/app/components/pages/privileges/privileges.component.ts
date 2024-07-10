import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { Role } from '../../../models/role.model';
import { RoleDialogInterface } from './role-dialog/role-dialog-interface';
import { RoleDialogComponent } from './role-dialog/role-dialog.component';
import { SnackbarService } from '../../../services/snackbar.service';
import { RolesService } from '../../../services/roles.services';
import { PermissionsService } from '../../../services/permissions.services';
import { Helper } from '../../shared/helpers';

interface RowData {
  id: number,
  roleId: string,
  role: string,
}

@Component({
  selector: 'ngx-privileges',
  templateUrl: './privileges.component.html',
  styleUrls: ['./privileges.component.scss'],
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
export class PrivilegesComponent {
  
  Helper = Helper;

  shownRows: RowData[] = [];

  displayedColumns: string[] = ['select', 'id', 'role'];

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

  searchValue: string = "";

  roles: Role[] = [];
  sortedRoles: Role[] = [];
  selectedRole: Role = {
    id: '',
    role: '',
    permissions: []
  };

  constructor(
    public dialog: MatDialog,
    public rolesService: RolesService,
    public permissionsService: PermissionsService,
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
      this.sortedRoles = this.roles.slice();

      this.shownRows = this.generateRows();
      this.dataSource = new MatTableDataSource(this.shownRows);
      this.dataSource.sort = this.sort as MatSort;
    });
  }

  ngOnDestroy() {
    this.rolesSub?.unsubscribe();
  }

  generateRows() {
    var rowData: RowData[] = [];

    for (let i = 1; i <= this.sortedRoles.length; i++) {
      const role = this.sortedRoles[i-1];
      const data: RowData = {
        id: i,
        roleId: role.id,
        role: role.role
      };
      rowData.push(data);
    }

    return rowData;
  }

  sortData(sort: Sort) {
    Helper.sortData(sort, this.roles, this.sortedRoles)
  }

  openDialog(status: string) {
    const dialogData: RoleDialogInterface = {
      status: status,
      roles: this.roles,
      targetRole: this.selectedRole
    }

    const dialogRef = this.dialog.open(RoleDialogComponent, {
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result == 'success') {
        this.selectedRole = {id: '', role: '', permissions: []};

        if (status == "add") {
          this.snackbarService.openSnackBar('تم إضافة دور جديد بنجاح.', 'success');
        } else if (status == "edit") {
          this.snackbarService.openSnackBar('تم تعديل الدور بنجاح.', 'success');
        } else if (status == "delete") {
          this.snackbarService.openSnackBar('تم حذف الدور بنجاح.', 'success');
        }
      }
    });
  }

  isSelected(row: any) {
    var isSelected = this.selection.isSelected(row);
    this.selection.clear();

    if (isSelected) {
      this.selection.deselect(row);
      this.selectedRole = {
        id: '',
        role: '',
        permissions: []
      };
    } else {
      this.selection.select(row);

      var role = this.roles.find(a => a.id == row.roleId);

      if (role) {
        this.selectedRole = role;
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
        return this.roles.length == 0;

      case "add":
        return this.roles.length > 0;

      case "edit":
        return (this.roles.length > 0) && (this.selectedRole.id != "");

      case "delete":
        return (this.roles.length > 0) && (this.selectedRole.id != "");

      case "view":
        return this.roles.length > 0;

      default:
        return false;
    }
  }
}
