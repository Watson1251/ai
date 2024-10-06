import { Component, Inject } from "@angular/core";
import { NbDialogRef } from "@nebular/theme";

@Component({
  selector: "ngx-compare-images",
  templateUrl: "./compare-images.component.html",
  styleUrls: ["./compare-images.component.scss"],
})
export class CompareImagesComponent {
  // These will hold the data passed in
  selectedFace: any;
  clickedFace: any;

  constructor(protected dialogRef: NbDialogRef<CompareImagesComponent>) {}

  ngOnInit(): void {
    // Access context data passed into the dialog via dialogRef
    const context = this.dialogRef.componentRef.instance;
    this.selectedFace = context.selectedFace;
    this.clickedFace = context.clickedFace;
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
