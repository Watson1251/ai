import { Component, Inject } from '@angular/core';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserDialogInterface } from './user-dialog-interface';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { UsersService } from '../../../../services/users.services';
import { Role } from '../../../../models/role.model';

@Component({
  selector: 'app-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.css'],
  standalone: true,
  imports: [AngularMaterialModule, CommonModule]
})
export class UserDialogComponent {

  title = '';
  errorMessage = '';

  isDelete: boolean = false;

  submitButton = '';
  cancelButton = 'إلغاء';

  nameLabel = 'الاسم الأول والقبيلة';
  usernameLabel = 'اسم المستخدم';
  passwordLabel = 'كلمة المرور';
  genderLabel = 'الجنس';
  roleLabel = 'دور المستخدم';

  nameError = "الرجاء كتابة الاسم والقبيلة";
  usernameError = "الرجاء كتابة اسم المستخدم";
  passwordError = "الرجاء ادخال كلمة المرور";
  roleError = "الرجاء اختيار دور المستخدم";
  genderError = "الرجاء اختيار الجنس";

  isUsernameFound = false;

  isPasswordHide: boolean = true;

  formValidator: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    username: new FormControl('', [Validators.required ]),
    password: new FormControl('', [Validators.required ]),
    role: new FormControl('', [Validators.required ]),
  });

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogInterface,
    public usersService: UsersService,
  ) {}

  ngOnInit() {

    if (this.data.status == "add") {
      this.title = 'إضافة مستخدم جديد';
      this.submitButton = 'إضافة';
    } else if (this.data.status == "edit") {
      this.title = 'تعديل المستخدم "' + this.data.selectedUser.username + '"';
      const role: Role = this.data.roles.find(object => object.id == this.data.selectedUser.roleId) as Role;

      this.formValidator.setControl('password', new FormControl('', []));

      this.formValidator.get('name')?.setValue(this.data.selectedUser.name);
      this.formValidator.get('username')?.setValue(this.data.selectedUser.username);
      this.formValidator.get('role')?.setValue(role.role);

      this.submitButton = 'تعديل';
    } else if (this.data.status == "delete") {
      this.title = 'هل أنت متأكد من حذف "' + this.data.selectedUser.username + '"';
      this.isDelete = true;
      this.submitButton = 'حذف';
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onYesClick() {

    if (this.data.status == 'delete') {

      const index = this.data.users.indexOf(this.data.selectedUser);
      if (index > -1) {
        this.usersService.deleteUser(this.data.selectedUser).subscribe(response => {
          if (response.status == 200 || response.status == 201) {
            this.usersService.getUsers();
            this.dialogRef.close('success');
          }
        });
      }

    } else {

      if (this.isInvalid('all') || this.formValidator.value == null) {
        return;
      }

      const role: Role = this.data.roles.find(object => object.role == this.formValidator.get('role')?.value) as Role;
      const user = {
        id: '',
        name: this.formValidator.get('name')?.value,
        username: this.formValidator.get('username')?.value,
        password: this.formValidator.get('password')?.value,
        roleId: role.id
      }

      if (this.data.status == 'add') {

        this.usersService.createUser(user).subscribe(response => {
          if (response.status == 200 || response.status == 201) {
            this.usersService.getUsers();
            this.dialogRef.close('success');
          }
        });

      } else if (this.data.status == 'edit') {

        const index = this.data.users.indexOf(this.data.selectedUser);

        if (index > -1) {

          user.id = this.data.selectedUser.id;

          this.usersService.updateUser(user).subscribe(response => {
            if (response.status == 200 || response.status == 201) {
              this.usersService.getUsers();
              this.dialogRef.close('success');
            }
          });
        }

      }

    }

  }

  isInvalid(formName: string) {
    this.formValidator.updateValueAndValidity();


    if (formName == 'all') {

      if (this.formValidator.invalid || this.formValidator.value == null) {
        return true;
      }

    } else {

      if (this.formValidator.get(formName)?.invalid || this.formValidator.get(formName)?.value == null) {

        if (this.data.status != 'edit') {
          switch (formName) {
            case 'name':
              this.nameError = "الرجاء كتابة الاسم والقبيلة";
              break;
            case 'username':
              this.usernameError = "الرجاء كتابة اسم المستخدم";
              break;
            case 'password':
              this.passwordError = "الرجاء ادخال كلمة مرور صحيحة";
              break;
            case 'role':
              this.roleError = "الرجاء اختيار دور المستخدم";
              break;
          }
        }

        return true;
      }

      if (formName == "username" && this.data.status != 'edit') {

        if (this.data.users.some(object => object.username == this.formValidator.get(formName)?.value)) {
          this.formValidator.get(formName)?.setErrors({ isInList: true });
          this.isUsernameFound = true;
          return true;
        } else {
          this.isUsernameFound = false;
        }
      }

      if (formName == "password") {
        const value = this.formValidator.get(formName)?.value;
        if (value != '' && value.length < 6) {
          this.formValidator.get(formName)?.setErrors({ isInvalid: true });
          return true;
        }
      }

    }

    return false;
  }
}

