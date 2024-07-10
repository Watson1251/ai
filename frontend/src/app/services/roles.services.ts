import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subject, throwError } from "rxjs";
import { Router } from "@angular/router";

import { environment } from "../../environments/environment";
import { Role } from "../models/role.model";
import { PermissionsService } from "./permissions.services";
import { Permission } from "../models/permission.model";
import { catchError } from "rxjs/operators";
import { SnackbarService } from "./snackbar.service";

const BACKEND_URL = environment.apiUrl + '/roles/';

@Injectable({ providedIn: "root" })
export class RolesService {

  private roles: Role[] = [];
  private rolesUpdated = new Subject<any>();

  constructor(
    private http: HttpClient,
    public permissionsService: PermissionsService,
    private snackbarService: SnackbarService
  ) {}

  getRoles() {
    this.http
      .get<{message: string, roles: any}>(
        BACKEND_URL,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      )
      .subscribe(response => {
        if (response.status == 200 || response.status == 201) {
            if (response.body == null) {
                return;
            }

            var fetchedRoles = response.body.roles;
            var tempRoles: Role[] = [];

            fetchedRoles.forEach((item: any) => {
                const role: Role = {
                  id: item._id,
                  role: item.role,
                  permissions: item.permissions,
                };
                tempRoles.push(role);
            });

            this.roles = tempRoles;
            this.rolesUpdated.next(this.roles);
        }
      });
  }

  // getRole(id: string) {
  //   console.log(id);
  //   return this.http
  //     .get<any>(
  //       BACKEND_URL + id,
  //       {observe: 'response'}
  //     )
  //     .pipe(
  //       catchError((error: HttpErrorResponse) => {
  //           return this.handleError(error);
  //       })
  //     );
  // }

  createRole(role: Role) {
    return this.http
      .post<any>(
        BACKEND_URL + 'create/',
        role,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  updateRole(role: Role) {
    return this.http
      .post<any>(
        BACKEND_URL + 'update/',
        role,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  deleteRole(role: Role) {
    return this.http
      .post<any>(
        BACKEND_URL + 'delete/',
        role,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  handleError(error: HttpErrorResponse) {
    var message = '';
    
    // Client-side error occurred
    if (error.error instanceof ErrorEvent) {
      message = 'حدث خطأ في العميل.';
    
    // Server-side error occurred
    } else {
      message = 'حدث خطأ في المزود.';
    }

    if (error.error.message) {
      message += "\n";
      message += error.error.message;
    }

    this.snackbarService.openSnackBar(message, 'failure');
    return throwError(message);
  }

  getRolesUpdateListener() {
    return this.rolesUpdated.asObservable();
  }

}
