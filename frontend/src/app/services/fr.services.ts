import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Subject, throwError } from "rxjs";

import { environment } from "../../environments/environment";
import { User } from "../models/user.model";
import { catchError } from "rxjs/operators";
import { SnackbarService } from "./snackbar.service";

const BACKEND_URL = environment.apiUrl + "/fr/";

@Injectable({ providedIn: "root" })
export class FrService {
  constructor(
    private http: HttpClient,
    private snackbarService: SnackbarService
  ) {}

  extractFaces(fileId: string) {
    return this.http
      .post<any>(
        BACKEND_URL + "extract-faces/",
        {
          fileId: fileId,
        },
        { observe: "response" }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  searchFace(fileId: string) {
    console.log(fileId);
    return this.http
      .post<any>(
        BACKEND_URL + "search-face/",
        {
          fileId: fileId,
        },
        { observe: "response" }
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  handleError(error: HttpErrorResponse) {
    var message = "";

    // Client-side error occurred
    if (error.error instanceof ErrorEvent) {
      message = "حدث خطأ في العميل.";

      // Server-side error occurred
    } else {
      message = "حدث خطأ في المزود.";
    }

    if (error.error.message) {
      message += "\n";
      message += error.error.message;
    }

    this.snackbarService.openSnackBar(message, "failure");
    return throwError(message);
  }
}
