import { AccountService } from '../../account.service'
import { Component } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { MustMatch } from '../../../../shared/helpers/must-match.validator'
import { Router } from '@angular/router'
import { HttpParams, HttpClientModule } from '@angular/common/http'
const USER_KEY = 'auth-user'

@Component({
  selector: 'app-login',
  templateUrl: './page-login.component.html',
  styleUrls: ['./page-login.component.scss'],
})
export class PageLoginComponent {
  showAlert: any = false
  display_register_login_page: any = ''
  signupForm: FormGroup = new FormGroup({});
  loginForm: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
    public service: AccountService,
    private router: Router,
  ) {}

  ngOnInit() {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('CustomerMasterKey')
    // reg_email: ['', [Validators.required, Validators.email]],
    this.signupForm = this.fb.group(
      {
        CustomerFullName: ['', [Validators.required]],
        reg_email: [''],
        reg_mobile: [
          '',
          [
            Validators.required,
            Validators.pattern('^[0-9]*$'),
            Validators.minLength(10),
            Validators.maxLength(10),
          ],
        ],
        reg_otp: [''],
        reg_password: ['', [Validators.required, Validators.minLength(6)]],
        reg_confirm_password: ['', [Validators.required]],
      },
      {
        validator: MustMatch('reg_password', 'reg_confirm_password'),
      },
    )

    this.loginForm = this.fb.group({
      customerLoginMobile: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]*$'),
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
      customerLoginPassword: ['', [Validators.required]],
    })
  }

  resetRegisterForm() {
    this.signupForm.reset()
    this.isSubmittedRegister = false
    this.display_register_otp = false
  }

  get form() {
    return this.signupForm.controls
  }

  public isSubmittedRegister = false
  public register_otp = ''
  public display_register_otp = false
  public otp_failed = false
  submitRegister() {
    this.isSubmittedRegister = true
    if (this.signupForm.invalid) {
      return
    }
    if (this.display_register_otp) {
      if (this.form.reg_otp.value == this.register_otp) {
        var formData: any = new FormData()
        formData.append('CustomerFullName', this.form.CustomerFullName.value)
        formData.append('CustomerEmail', this.form.reg_email.value)
        formData.append('CustomerPhone', this.form.reg_mobile.value)
        formData.append(
          'CustomerPassword',
          this.form.reg_confirm_password.value,
        )
        this.service.CustomerEntrySAVE(formData).subscribe((res: any) => {
          if (res['data'] != undefined) {
            localStorage.setItem(
              'CustomerMasterKey',
              res['data'][0]['CustomerMasterKey'],
            )
          }
          this.otp_failed = false
          this.showAlert = true
          this.display_register_login_page = res['message']
          this.resetRegisterForm()
          this.router.navigate(['/account/dashboard'])
        })
      } else {
        this.otp_failed = true
      }
    } else {
      var formData: any = new FormData()
      formData.append('MobileNo', this.form.reg_mobile.value)
      this.service.Pos_SentOTPToCustomer_WEB(formData).subscribe((res: any) => {
        this.display_register_otp = true
        this.register_otp = res['data']
        this.showAlert = true
        this.display_register_login_page = res['message']
      })
    }
  }

  get loginFormData() {
    return this.loginForm.controls
  }

  public isSubmittedLogin = false
  submitLogin() {
    this.isSubmittedLogin = true
    if (this.loginForm.invalid) {
      return
    }
    let grant_type = 'password'
    let UserName = this.loginFormData.customerLoginMobile.value
    let password = this.loginFormData.customerLoginPassword.value
    let body =
      'grant_type=' +
      grant_type +
      '&username=' +
      UserName +
      '&password=' +
      password
    this.service.login(body).subscribe(
      (res: any) => {
        if (res && res.data && res.data.CustomerMasterKey) {
          // Add code to store loggedin user data in session
          // sessionStorage.removeItem(USER_KEY);
          // sessionStorage.setItem(USER_KEY, JSON.stringify(res.data));
          localStorage.removeItem(USER_KEY)
          localStorage.setItem(
            'CustomerMasterKey',
            res['data']['CustomerMasterKey'],
          )
          localStorage.setItem(USER_KEY, JSON.stringify(res.data))
          this.router.navigate(['/account/dashboard']).then(() => {
            window.location.reload()
          })
        }
        this.showAlert = true
        this.display_register_login_page = 'Something went wrong. Try again!'
      },
      (err: any) => {
        this.showAlert = true
        this.display_register_login_page = err['error']['error_description']
      },
    )
  }
  gotToforgotPassword() {
    this.router.navigate(['/account/forgotPassword'])
  }
}
