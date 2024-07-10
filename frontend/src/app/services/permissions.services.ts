import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subject, throwError } from "rxjs";

import { environment } from "../../environments/environment";
import { Permission } from "../models/permission.model";
import { catchError } from "rxjs/operators";

const BACKEND_URL = environment.apiUrl + '/permissions/';

@Injectable({ providedIn: "root" })
export class PermissionsService {

  private permissions: Permission[] = [];
  private permissionsUpdated = new Subject<any>();

  constructor(private http: HttpClient) {}

  getPermissions() {
    this.http
      .get<{message: string, permissions: any}>(
        BACKEND_URL,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      )
      .subscribe((response: any) => {
        if (response.status == 200 || response.status == 201) {
            if (response.body == null) {
                return;
            }

            var fetchedPermissions = response.body.permissions;
            var tempPermissions: Permission[] = [];

            fetchedPermissions.forEach((item: any) => {
                const permission: Permission = {
                    id: item._id,
                    permission: item.permission
                }
                tempPermissions.push(permission);
            });

            this.permissions = tempPermissions;
            this.permissionsUpdated.next(this.permissions);
        }
      });
  }

  getPermission(id: string) {
    return this.http
      .get<any>(
        BACKEND_URL + id,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  createPermission(permission: Permission) {
    return this.http
      .post<any>(
        BACKEND_URL + 'create/',
        permission,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  updatePermission(permission: Permission) {
    return this.http
      .post<any>(
        BACKEND_URL + 'update/',
        permission,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  deletePermission(permission: Permission) {
    return this.http
      .post<any>(
        BACKEND_URL + 'delete/',
        permission,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
        // Client-side error occurred
        console.error('Client-side error:', error.error.message);
    } else {
        // Server-side error occurred
        console.error('Server-side error:', error.status, error.error);
    }
    return throwError('Something went wrong. Please try again later.');
  }

  getPermissionsUpdateListener() {
    return this.permissionsUpdated.asObservable();
  }

}
