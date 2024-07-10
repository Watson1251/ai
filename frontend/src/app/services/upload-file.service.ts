import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SnackbarService } from './snackbar.service';
import { environment } from '../../environments/environment';

const BACKEND_URL = environment.apiUrl + '/file-upload/';

@Injectable({
  providedIn: 'root'
})
export class UploadFileService {

  constructor(
    private http: HttpClient,
    private snackbarService: SnackbarService
  ) { }

  upload(file: File) {
    const formData: FormData = new FormData();
    formData.append('uploadedBy', "Watson");
    formData.append('file', file, file.name);


    return this.http
      .post<any>(
        BACKEND_URL + "create/",
        formData,
        {
          observe: 'events',
          reportProgress: true,
        }
      )
      .pipe(
        map(event => this.getEventMessage(event))
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleError(error);
        })
      );
  }

  private getEventMessage(event: HttpEvent<any>) {
    var result = {
      progress: 0,
      result: {}
    }
    switch (event.type) {
      case HttpEventType.UploadProgress:
        result.progress = event.total ? Math.round(100 * event.loaded / event.total) : 0;
      case HttpEventType.Response:
        result.progress = 100;
        if (event instanceof HttpResponse) {
          result.result = event.body.file;
        }
    }
    return result
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
}
