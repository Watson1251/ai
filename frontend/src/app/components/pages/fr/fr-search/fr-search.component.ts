import { basename, extname } from "path";
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from "@angular/core";
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

interface FilePreview {
  status: string;
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
  imageSrc: string = "assets/images/fr-icon.png";

  targetFixedColumnWidth = 330;
  fixedColumnWidth = 0;

  Helper = Helper;

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
          status: "",
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
    this.searchFace(this.selectedFilePreview, this.selectedFilePreview.filsId);
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

  searchFace(filePreview: FilePreview, fileId: string) {
    filePreview.status = "جاري تحليل الملف...";
    this.frService.searchFace(fileId).subscribe((response) => {
      if (response.status === 200 || response.status === 201) {
        if (response.body.results) {
          filePreview.status = "تم تحليل الملف!";
          const results = response.body.results;

          filePreview.selectedFace.results = [];

          for (let i = 0; i < results.length; i++) {
            const tempRecord = results[i];

            var _,
              counter = this.getFileNameAndCounter(tempRecord.image_path);
            var photoServer = "http://172.16.109.91:3000/image/";
            const url = photoServer + tempRecord.image_id + "/" + counter;
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
    this.filePreviews.forEach((filePreview) => {
      if (filePreview.file) {
        this.uploadAndAnalyzeFile(filePreview);
      }
    });
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
    filePreview.status = "جاري تحليل الملف...";
    this.frService.extractFaces(fileId).subscribe((response) => {
      if (response.status === 200 || response.status === 201) {
        if (response.body.result) {
          filePreview.status = "تم تحليل الملف!";
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
            this.cropFaces(filePreview);

            // first face is to be set as selected face
            filePreview.selectedFace = filePreview.faces[0];

            this.searchFace(filePreview, fileId);
          } else {
            // remove image preview if no faces detected
            this.onRemove(filePreview);
            this.snackbarService.openSnackBar(
              "لم يتم العثور على وجوه في الصورة: " + filePreview.file.name,
              "failure"
            );
          }
          // this.onFileAnalyzed(filePreview, response.body.result);
        }
      }
    });
  }

  // Draws the image and rectangles once the image is loaded
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

  cropFaces(filePreview: FilePreview) {
    const img = new Image();
    img.src = filePreview.url.toString();

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
    };
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
