import { AccountService } from '../../account.service';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MustMatch } from '../../../../shared/helpers/must-match.validator'; 
import { HttpParams, HttpClientModule } from '@angular/common/http';

@Component({
    selector: 'app-page-password',
    templateUrl: './page-password.component.html',
    styleUrls: ['./page-password.component.sass']
})
export class PagePasswordComponent {
    changePasswordForm: FormGroup;
    public isSubmittedForm = false;

    showAlert: any = false;
    display_changePassword: any = "";
    constructor(
        private fb: FormBuilder,
        public service: AccountService, 
    ) { }


    ngOnInit() {

        this.changePasswordForm = this.fb.group({
            old_password: ['', [Validators.required, Validators.minLength(6)]],
            newPassword: ['', Validators.required],
            confirm_password: ['', [Validators.required]]
        }, {
            validator: MustMatch('newPassword', 'confirm_password')
        }
        );
    }

    get form() {
        return this.changePasswordForm.controls;
    }
    submitChangePassword() {
        this.isSubmittedForm = true;
        if (this.changePasswordForm.invalid) {
            return;
        }
       var custKey =  localStorage.getItem('CustomerMasterKey')
        var formData: any = new FormData(); 
        formData.append("CustomerMasterKey",custKey); 
        formData.append("OldPassword", this.form.old_password.value);
        formData.append("NewPassword", this.form.newPassword.value);
        this.service.Pos_CustomerPasswordChange(formData).subscribe((res: any) => { 
            if(res.success != false){
                this.showAlert = true;
                this.display_changePassword = res['message'];
                this.changePasswordForm.reset();
                this.isSubmittedForm = false;
            }else{
                this.showAlert = true;
                this.display_changePassword = res['message'];
        
            }
         
            
        });



    }
}
