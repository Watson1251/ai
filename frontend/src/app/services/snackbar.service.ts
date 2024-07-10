import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {

  constructor(private snackBar: MatSnackBar) { }

  openSnackBar(message: string, status: string ): void {
    this.snackBar.open(message, "إخفاء", {
      duration: 5000,
      panelClass: [status],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    })
  }
}