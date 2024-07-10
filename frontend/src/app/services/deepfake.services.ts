import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subject, throwError } from "rxjs";

import { environment } from "../../environments/environment";
import { User } from "../models/user.model";
import { catchError } from "rxjs/operators";
import { SnackbarService } from "./snackbar.service";

const BACKEND_URL = environment.apiUrl + '/deep-fake/';

@Injectable({ providedIn: "root" })
export class DeepfakeService {

  private users: User[] = [];
  private usersUpdated = new Subject<any>();

  constructor(
    private http: HttpClient,
    private snackbarService: SnackbarService
  ) {}

  predictVideo(fileId: string) {
    return this.http
      .post<any>(
        BACKEND_URL + 'predict/',
        {
          fileId: fileId
        },
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  getUsers() {
    this.http
      .get<{message: string, users: any}>(
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

            var fetchedUsers = response.body.users;
            var tempUsers: User[] = [];

            fetchedUsers.forEach((item: any) => {
                const user: User = {
                    id: item._id,
                    name: item.name,
                    username: item.username,
                    roleId: item.roleId,
                }
                tempUsers.push(user);
            });

            this.users = tempUsers;
            this.usersUpdated.next(this.users);
        }
      });
  }

  getUser(id: string) {
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

  createUser(user: User) {
    return this.http
      .post<any>(
        BACKEND_URL + 'create/',
        user,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  updateUser(user: User) {
    return this.http
      .post<any>(
        BACKEND_URL + 'update/',
        user,
        {observe: 'response'}
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
            return this.handleError(error);
        })
      );
  }

  deleteUser(user: User) {
    return this.http
      .post<any>(
        BACKEND_URL + 'delete/',
        user,
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

  getUsersUpdateListener() {
    return this.usersUpdated.asObservable();
  }

}
