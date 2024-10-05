import { ChangeDetectionStrategy, Component, ViewChild } from "@angular/core";
import {
  NbComponentSize,
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

interface FilePreview {
  file: File;
  url: URL;
  progress: number;
  isUploaded: boolean;
  isAnalyzed: boolean;
  status: string;
  videoAccuracy: number;
  audioAccuracy: number;
  accuracy: string;
  result: string;
}

@Component({
  selector: "ngx-fr-search",
  styleUrls: ["./fr-search.component.scss"],
  templateUrl: "./fr-search.component.html",
})
export class FrSearchComponent {
  fixedColumnWidth = 300;

  Helper = Helper;

  private rolesSub?: Subscription;
  private usersSub?: Subscription;

  searchValue: string = "";

  roles: Role[] = [];
  users: User[] = [];

  constructor(
    private themeService: NbThemeService,
    private breakpointService: NbMediaBreakpointsService,
    private uploadFileService: UploadFileService,
    public dialog: MatDialog,
    public rolesService: RolesService,
    public usersService: UsersService,
    public deepfakeService: DeepfakeService,
    private snackbarService: SnackbarService
  ) {}

  filePreviews: FilePreview[] = [];
  currentExperiments: FilePreview[] = [];
  actionSize: NbComponentSize = "medium";
  isAnalyzing: boolean = false;

  isDragOver: boolean = false;

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
          status: "",
          isUploaded: false,
          isAnalyzed: false,
          accuracy: "",
          result: "",
          videoAccuracy: 0,
          audioAccuracy: 0,
        };
        this.filePreviews.push(preview);
      } else {
        this.snackbarService.openSnackBar(
          "يوجد ملف مُضاف بنفس الاسم. الرجاء حذفه أو تغيير اسمه.",
          "failure"
        );
      }
    });
  }

  onRemove(event: any) {
    this.filePreviews.splice(this.filePreviews.indexOf(event), 1);
  }

  analyzeFiles() {
    if (this.isAnalyzing) return;

    this.isAnalyzing = true;
    this.filePreviews.forEach((filePreview) => {
      if (filePreview.file) {
        this.uploadAndAnalyzeFile(filePreview);
      }
    });
    this.isAnalyzing = false;
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

    if (
      this.filePreviews.some(
        (preview) => preview.file.name === filePreview.file.name
      )
    ) {
      this.filePreviews.splice(this.filePreviews.indexOf(filePreview), 1);
      this.currentExperiments.push(filePreview);

      // this.analyzeFile(filePreview, fileId);
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
