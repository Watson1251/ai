import { Component, Inject } from '@angular/core';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RoleDialogInterface } from './role-dialog-interface';
import { FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RolesService } from '../../../../services/roles.services';
import { Role } from '../../../../models/role.model';

@Component({
  selector: 'app-role-dialog',
  templateUrl: './role-dialog.component.html',
  styleUrls: ['./role-dialog.component.css'],
  standalone: true,
  imports: [AngularMaterialModule, CommonModule]
})
export class RoleDialogComponent {

  title = '';
  label = '';
  errorMessage = '';

  isDelete: boolean = false;

  submitButton = '';
  cancelButton = 'إلغاء';

  formValidator = new FormControl('', [Validators.required]);

  constructor(
    public rolesService: RolesService,
    public dialogRef: MatDialogRef<RoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RoleDialogInterface,
  ) {}

  ngOnInit() {
    if (this.data.status == "add") {
      this.title = 'إضافة دور جديد';
      this.label = 'الدور المضاف';
      this.submitButton = 'إضافة';
    } else if (this.data.status == "edit") {
      this.title = 'تعديل مسمى دور "' + this.data.targetRole.role + '"';
      this.label = this.data.targetRole.role;
      this.submitButton = 'تعديل';
    } else if (this.data.status == "delete") {
      this.title = 'هل أنت متأكد من حذف دور "' + this.data.targetRole.role + '"';
      this.isDelete = true;
      this.submitButton = 'حذف';
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onYesClick() {

    if (this.data.status == 'delete') {

      const index = this.data.roles.indexOf(this.data.targetRole);
      if (index > -1) {
        this.rolesService.deleteRole(this.data.targetRole).subscribe((response: any) => {
          if (response.status == 200 || response.status == 201) {
            this.rolesService.getRoles();
            this.dialogRef.close('success');
          }
        });
      }

    } else {

      if (this.isInvalid() || this.formValidator.value == null) {
        return;
      }

      if (this.data.status == 'add') {

        const role: Role = {
          id: '',
          role: this.formValidator.value,
          permissions: []
        }

        this.rolesService.createRole(role).subscribe((response: any) => {
          if (response.status == 200 || response.status == 201) {
            this.rolesService.getRoles();
            this.dialogRef.close('success');
          }
        });

      } else if (this.data.status == 'edit') {

        const index = this.data.roles.indexOf(this.data.targetRole);
        if (index > -1) {

          const role: Role = {
            id: this.data.targetRole.id,
            role: this.formValidator.value,
            permissions: this.data.targetRole.permissions
          }

          this.rolesService.updateRole(role).subscribe((response: any) => {
            if (response.status == 200 || response.status == 201) {
              this.rolesService.getRoles();
              this.dialogRef.close('success');
            }
          });
        }

      }

    }
    
  }

  isInvalid() {
    this.formValidator.updateValueAndValidity();
    this.errorMessage = '';

    if (this.formValidator.invalid || this.formValidator.value == null) {
      this.errorMessage = 'الرجاء كتابة الدور في الحقل';
      return true;
    }

    if (this.data.roles.some(obj => obj.role === this.formValidator.value)) {
      this.errorMessage = 'الدور موجود بالفعل بقائمة الأدوار';
      this.formValidator.setErrors({ isInList: true });
      return true;
    }

    return false;
  }
}

