import { AccountService } from '../../account.service';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MustMatch } from '../../../../shared/helpers/must-match.validator';
import { Router } from '@angular/router';
import { HttpParams, HttpClientModule } from '@angular/common/http';
const USER_KEY = 'auth-user';

@Component({
    selector: 'app-forgot-password',
    templateUrl: './page-forgot-password.component.html',
    styleUrls: ['./page-forgot-password.component.scss']
})
export class PageForgotPasswordComponent {
    public isSubmittedForm = false; 
    showAlert: any = false;
    display_forgotPassword: any = "";
    display_pin:any="";
    forgotForm: FormGroup; 

    constructor(
        private fb: FormBuilder,
        public service: AccountService,
        private router: Router,
    ) { }

    ngOnInit() { 

        this.forgotForm = this.fb.group({
            mobileNo: ['', [Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(10), Validators.maxLength(10)]],
            
        });
    } 

    get form() {
        return this.forgotForm.controls;
    }
 
    submitForgotPassword() {
        this.isSubmittedForm = true;
        if (this.forgotForm.invalid) {
            return;
        } 
        var formData: any = new FormData(); 
         
        formData.append("MobileNo", this.form.mobileNo.value);
        this.service.Pos_ForgotPassword(formData).subscribe((res: any) => { 
            if(res.success != false){
                this.showAlert = true;
                this.display_forgotPassword = res['message'];
                this.display_pin = res['data'];
                this.forgotForm.reset();
                this.isSubmittedForm = false;
            }else{
                this.showAlert = true;
                this.display_forgotPassword = res['message']; 
            } 
            
        });   
    }  
}
