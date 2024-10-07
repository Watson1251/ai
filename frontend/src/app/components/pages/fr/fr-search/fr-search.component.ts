import { Component, ElementRef, ViewChild } from "@angular/core";
import {
  NbComponentSize,
  NbDialogService,
  NbMediaBreakpointsService,
  NbThemeService,
} from "@nebular/theme";
import { SnackbarService } from "../../../../services/snackbar.service";
import { UploadFileService } from "../../../../services/upload-file.service";
import { map } from "rxjs/operators";
import { Helper } from "../../../shared/helpers";
import { MatDialog } from "@angular/material/dialog";
import { RolesService } from "../../../../services/roles.services";
import { UsersService } from "../../../../services/users.services";
import { Role } from "../../../../models/role.model";
import { User } from "../../../../models/user.model";
import { Subscription } from "rxjs";
import { DeepfakeService } from "../../../../services/deepfake.services";
import { FrService } from "../../../../services/fr.services";
import { CompareImagesComponent } from "../compare-images/compare-images.component";
import { environment } from "../../../../../environments/environment";

const IS_DEV = true;
const PHOTOSERVER_URL = environment.photoServer;

interface FilePreview {
  file: File;
  url: URL;
  progress: number;
  faces: Face[];
  selectedFace: Face;
  filsId: string;
}

interface Face {
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
  name: string;
  results: Record[];
}

interface Record {
  image_id: string;
  image_path: string;
  url: string;
  nameAr: string;
  nameEn: string;
  nationality: string;
  birthdate: string;
  index: number;
  score: number;
  isHovered: boolean;
}

@Component({
  selector: "ngx-fr-search",
  styleUrls: ["./fr-search.component.scss"],
  templateUrl: "./fr-search.component.html",
})
export class FrSearchComponent {
  targetFixedColumnWidth = 330;
  fixedColumnWidth = 0;

  Helper = Helper;

  isProcessing: boolean = false;

  private rolesSub?: Subscription;
  private usersSub?: Subscription;

  searchValue: string = "";

  roles: Role[] = [];
  users: User[] = [];

  @ViewChild("imageElement") imageElement: ElementRef<HTMLImageElement>;
  @ViewChild("canvasElement") canvasElement: ElementRef<HTMLCanvasElement>;

  constructor(
    private themeService: NbThemeService,
    private breakpointService: NbMediaBreakpointsService,
    private uploadFileService: UploadFileService,
    public dialog: MatDialog,
    public rolesService: RolesService,
    public usersService: UsersService,
    public deepfakeService: DeepfakeService,
    public frService: FrService,
    private snackbarService: SnackbarService,
    private dialogService: NbDialogService
  ) {}

  openDialog(clickedFace: any) {
    // Open the dialog and pass context (selectedFace and clickedFace)
    this.dialogService.open(CompareImagesComponent, {
      context: {
        selectedFace: this.selectedFilePreview.selectedFace, // Pass the selected face
        clickedFace: clickedFace, // Pass the clicked face
      },
      hasBackdrop: true,
      closeOnBackdropClick: true,
      dialogClass: "large-dialog",
    });
  }

  filePreviews: FilePreview[] = [];
  currentExperiments: FilePreview[] = [];
  actionSize: NbComponentSize = "medium";
  isAnalyzing: boolean = false;

  isDragOver: boolean = false;
  showImagePreview = false;

  selectedFilePreview: FilePreview = undefined;

  ngOnInit() {
    // Add event listeners to handle drag and drop anywhere on the page
    window.addEventListener("dragover", this.onDragOver.bind(this), false);
    window.addEventListener("drop", this.onDrop.bind(this), false);
    window.addEventListener("dragleave", this.onDragLeave.bind(this), false);

    this.rolesService.getRoles();
    this.rolesSub = this.rolesService
      .getRolesUpdateListener()
      .subscribe((rolesData: any) => {
        this.roles = rolesData;

        this.usersService.getUsers();
        this.usersSub = this.usersService
          .getUsersUpdateListener()
          .subscribe((usersData: any) => {
            this.users = usersData;
          });
      });

    const breakpoints = this.breakpointService.getBreakpointsMap();
    this.themeService
      .onMediaQueryChange()
      .pipe(map(([, breakpoint]) => breakpoint.width))
      .subscribe((width: number) => {
        this.actionSize = width > breakpoints.md ? "medium" : "small";
      });
  }

  ngOnDestroy() {
    // Remove event listeners when the component is destroyed
    window.removeEventListener("dragover", this.onDragOver.bind(this), false);
    window.removeEventListener("drop", this.onDrop.bind(this), false);
    window.removeEventListener("dragleave", this.onDragLeave.bind(this), false);

    this.usersSub?.unsubscribe();
    this.rolesSub?.unsubscribe();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Prevent default to allow drop
    this.isDragOver = true;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.addingFiles(event.dataTransfer.files);
    }
  }

  onDragLeave(event: DragEvent) {
    this.isDragOver = false;
  }

  addingFiles(files: FileList | File[]) {
    Array.from(files).forEach((file: File) => {
      if (!file.type.startsWith("image/")) {
        this.snackbarService.openSnackBar(
          "غير مسموح بهذا النوع من الملفات",
          "failure"
        );
        return;
      }

      if (
        !this.filePreviews.some(
          (f) =>
            f.file.name === file.name &&
            f.file.size === file.size &&
            f.file.type === file.type
        )
      ) {
        var fileUrl = null;
        if (file) {
          fileUrl = URL.createObjectURL(file);
        }

        const preview: FilePreview = {
          file: file,
          url: fileUrl,
          progress: 0,
          faces: [],
          selectedFace: undefined,
          filsId: "",
        };
        this.filePreviews.push(preview);

        this.showImagePreview = this.filePreviews.length > 0;

        if (this.showImagePreview) {
          this.selectedFilePreview =
            this.filePreviews[this.filePreviews.length - 1];

          this.fixedColumnWidth = this.targetFixedColumnWidth;
        } else {
          this.fixedColumnWidth = 0;
        }

        this.analyzeFiles();
      } else {
        this.snackbarService.openSnackBar(
          "يوجد ملف مُضاف بنفس الاسم. الرجاء حذفه أو تغيير اسمه.",
          "failure"
        );
      }
    });
  }

  selectFilePreview(filePreview: FilePreview) {
    this.selectedFilePreview = filePreview;
  }

  adjustSelectedFace(face: Face) {
    this.selectedFilePreview.selectedFace = face;
    this.onImageLoad(null);
    // Wait for the face cropping process to finish before searching the face
    this.cropSelectedFace(this.selectedFilePreview, face).then(() => {
      this.searchFace(this.selectedFilePreview, face);
    });
  }

  cropSelectedFace(filePreview: FilePreview, face: Face): Promise<void> {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = filePreview.url.toString();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        // Set canvas dimensions to the face's width and height
        canvas.width = face.width;
        canvas.height = face.height;

        // Draw the cropped face onto the canvas
        context?.drawImage(
          img,
          face.x,
          face.y,
          face.width,
          face.height, // Source coordinates and dimensions
          0,
          0,
          face.width,
          face.height // Destination coordinates and dimensions
        );

        // Convert the canvas to a base64 URL and store it in face.url
        const croppedImageUrl = canvas.toDataURL();
        face.url = croppedImageUrl;

        // Trigger change detection after cropping the face
        this.onImageLoad(null);

        // Resolve the promise to indicate that cropping is complete
        resolve();
      };
    });
  }

  getFileNameAndCounter(filePath: string): { name: string; counter: number } {
    // Extract the file name without the extension
    const fileName = filePath
      .substring(filePath.lastIndexOf("/") + 1)
      .split(".")
      .slice(0, -1)
      .join(".");

    // Check if the file name ends with "_{i}" (underscore followed by a number)
    const underscoreIndex = fileName.lastIndexOf("_");
    const possibleCounter = fileName.substring(underscoreIndex + 1);

    // Check if the part after the underscore is a valid number
    if (underscoreIndex !== -1 && !isNaN(Number(possibleCounter))) {
      return {
        name: fileName.substring(0, underscoreIndex),
        counter: parseInt(possibleCounter, 10),
      };
    } else {
      // If no counter is found, return the file name with a counter of 0
      return { name: fileName, counter: 0 };
    }
  }

  searchFace(filePreview: FilePreview, face: Face) {
    // convert the face's base64 URL to a file and give it a unique file name
    // generate a unique string as a filename
    const uniqueId = Date.now().toString();
    const file = this.base64ToFile(face.url, uniqueId + "_face.jpg");

    this.isProcessing = true;
    this.uploadFileService.upload(file).subscribe((fileuploadData: any) => {
      if (fileuploadData.result.id) {
        const fileId = fileuploadData.result.id;

        this.frService.searchFace(fileId).subscribe((response) => {
          if (response.status === 200 || response.status === 201) {
            if (response.body.results) {
              console.log("Searching...");
              const results = response.body.results;

              filePreview.selectedFace.results = [];

              for (let i = 0; i < results.length; i++) {
                const tempRecord = results[i];

                var nameAndCounter = this.getFileNameAndCounter(
                  tempRecord.image_path
                );

                var name = nameAndCounter.name;
                var counter = nameAndCounter.counter;
                var url = PHOTOSERVER_URL + tempRecord.image_id + "/" + counter;
                if (IS_DEV) {
                  url = this.selectedFilePreview.url.toString();
                }

                const record: Record = {
                  image_id: tempRecord.image_id,
                  image_path: tempRecord.image_path,
                  nameAr: tempRecord.nameAr,
                  nameEn: tempRecord.nameEn,
                  nationality: tempRecord.nationality,
                  birthdate: tempRecord.birthdate,
                  index: tempRecord.index,
                  score: tempRecord.similarity_score,
                  isHovered: false,
                  url: url,
                };

                filePreview.selectedFace.results.push(record);
              }
              this.showResults(filePreview);
            }
          }
          this.isProcessing = false;
        });
      }
    });
  }

  showResults(filePreview: FilePreview) {
    for (let i = 0; i < filePreview.selectedFace.results.length; i++) {
      const record = filePreview.selectedFace.results[i];
      // console.log(record.index);
    }
  }

  onRemove(filePreview?: FilePreview) {
    // remove from both filePreviews and currentExperiments
    this.filePreviews = this.filePreviews.filter(
      (preview) => preview !== filePreview
    );
    this.currentExperiments = this.currentExperiments.filter(
      (preview) => preview !== filePreview
    );

    if (this.filePreviews.length > 0) {
      this.selectedFilePreview =
        this.filePreviews[this.filePreviews.length - 1];
    } else {
      this.filePreviews = [];
      this.selectedFilePreview = undefined;
    }

    this.showImagePreview = this.filePreviews.length > 0;

    if (this.showImagePreview) {
      this.fixedColumnWidth = this.targetFixedColumnWidth;
    } else {
      this.fixedColumnWidth = 0;
    }
  }

  analyzeFiles() {
    this.isProcessing = true;
    this.filePreviews.forEach((filePreview) => {
      if (filePreview.file) {
        this.uploadAndAnalyzeFile(filePreview);
      }
    });
    this.isProcessing = false;
  }

  uploadAndAnalyzeFile(filePreview: any) {
    this.uploadFileService
      .upload(filePreview.file)
      .subscribe((fileuploadData: any) => {
        this.updateUploadProgress(filePreview, fileuploadData);

        if (fileuploadData.result.id) {
          this.onFileUploaded(filePreview, fileuploadData.result.id);
        }
      });
  }

  updateUploadProgress(filePreview: any, fileuploadData: any) {
    filePreview.status = "جاري رفع الملف...";
    filePreview.progress = fileuploadData.progress;
  }

  onFileUploaded(filePreview: any, fileId: string) {
    filePreview.status = "تم رفع الملف!";
    filePreview.progress = 100;
    filePreview.isUploaded = true;
    filePreview.filsId = fileId;

    if (
      this.filePreviews.some(
        (preview) => preview.file.name === filePreview.file.name
      ) &&
      !this.currentExperiments.some(
        (preview) => preview.file.name === filePreview.file.name
      )
    ) {
      // this.filePreviews.splice(this.filePreviews.indexOf(filePreview), 1);
      this.currentExperiments.push(filePreview);

      this.extractFaces(filePreview, fileId);
    }
  }

  extractFaces(filePreview: FilePreview, fileId: string) {
    this.isProcessing = true;
    this.frService.extractFaces(fileId).subscribe(async (response) => {
      if (response.status === 200 || response.status === 201) {
        if (response.body.result) {
          const faces = response.body.result;

          if (faces.length > 0) {
            for (let i = 0; i < faces.length; i++) {
              const tempFace = faces[i];

              const { x, y, w, h } = tempFace.facial_area;
              const face: Face = {
                x: x,
                y: y,
                width: w,
                height: h,
                url: "",
                name: Helper.enToAr("وجه " + parseInt((i + 1).toString())),
                results: [],
              };

              filePreview.faces.push(face);
              this.onImageLoad(null);
            }

            // Now that faces have been detected, crop them
            await this.cropFaces(filePreview);

            // First face is to be set as selected face
            filePreview.selectedFace = filePreview.faces[0];

            // After cropping all faces, start searching the first face
            this.searchFace(filePreview, filePreview.selectedFace);
          } else {
            // Remove image preview if no faces detected
            this.onRemove(filePreview);
            this.snackbarService.openSnackBar(
              "لم يتم العثور على وجوه في الصورة: " + filePreview.file.name,
              "failure"
            );
          }

          this.isProcessing = false;
        }
      }
    });
  }

  cropFaces(filePreview: FilePreview): Promise<void> {
    const img = new Image();
    img.src = filePreview.url.toString();

    return new Promise<void>((resolve) => {
      img.onload = () => {
        filePreview.faces.forEach((face) => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          // Set canvas dimensions to the face's width and height
          canvas.width = face.width;
          canvas.height = face.height;

          // Draw the cropped face onto the canvas
          context?.drawImage(
            img,
            face.x,
            face.y,
            face.width,
            face.height, // Source coordinates and dimensions
            0,
            0,
            face.width,
            face.height // Destination coordinates and dimensions
          );

          // Convert the canvas to a base64 URL and store it in face.url
          const croppedImageUrl = canvas.toDataURL();
          face.url = croppedImageUrl;

          // Trigger change detection after each face is cropped
          this.onImageLoad(null);
        });

        // Final change detection to ensure the view is updated after all faces are cropped
        this.onImageLoad(null);
        resolve(); // Resolve when all faces are cropped
      };
    });
  }

  enhanceImage(face: Face) {
    const uniqueId = Date.now().toString();
    const file = this.base64ToFile(face.url, uniqueId + "_face.jpg");

    this.isProcessing = true;
    this.uploadFileService.upload(file).subscribe((fileuploadData: any) => {
      if (fileuploadData.result.id) {
        this.frService
          .enhanceFace(fileuploadData.result.id)
          .subscribe((imageBlob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              face.url = reader.result as string;

              this.isProcessing = false;

              this.searchFace(this.selectedFilePreview, face);
            };
            reader.readAsDataURL(imageBlob);
          });
      }
    });
  }

  base64ToFile(base64Data: string, fileName: string): File | null {
    if (
      !base64Data ||
      typeof base64Data !== "string" ||
      !base64Data.includes(",")
    ) {
      console.error("Invalid base64Data:", base64Data);
      return null; // Handle invalid base64 input gracefully
    }

    // Split the base64 string to remove the metadata
    const arr = base64Data.split(",");

    // Ensure there is valid data after the comma
    if (arr.length < 2) {
      console.error("Invalid base64 data:", base64Data);
      return null;
    }

    // Extract the MIME type and base64-encoded string
    const mimeTypeMatch = arr[0].match(/:(.*?);/);
    const base64String = arr[1];

    // Ensure mimeType is correctly matched
    if (!mimeTypeMatch || mimeTypeMatch.length < 2) {
      console.error("Invalid MIME type in base64Data:", base64Data);
      return null;
    }

    const mimeType = mimeTypeMatch[1]; // Get the MIME type
    const bstr = atob(base64String); // Decode Base64 into a binary string
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    // Convert the binary string into a byte array
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    // Create a File from the byte array
    return new File([u8arr], fileName, { type: mimeType });
  }

  onImageLoad(event: Event): void {
    const image = this.imageElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext("2d");

    if (context) {
      // Set canvas size to match the image's real size
      canvas.width = image.offsetWidth;
      canvas.height = image.offsetHeight;

      // Clear any previous drawing
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the image onto the canvas
      context.drawImage(image, 0, 0, image.offsetWidth, image.offsetHeight);

      // Calculate the scaling factor in case the image is scaled
      const scaleX = image.offsetWidth / image.naturalWidth;
      const scaleY = image.offsetHeight / image.naturalHeight;

      // Draw rectangles for each face
      this.selectedFilePreview.faces.forEach((face) => {
        context.beginPath();
        context.rect(
          face.x * scaleX, // Adjust x position based on scaling
          face.y * scaleY, // Adjust y position based on scaling
          face.width * scaleX, // Adjust width based on scaling
          face.height * scaleY // Adjust height based on scaling
        );
        context.lineWidth = 2;
        context.strokeStyle = "red";
        context.stroke();
      });
    }
  }

  clearFiles() {
    if (this.isAnalyzing) return;
    this.filePreviews.splice(0, this.filePreviews.length);
  }

  getRoleById(id: string) {
    const obj = this.roles.find((item) => item.id === id);
    return obj ? obj["role"] : undefined;
  }
}
