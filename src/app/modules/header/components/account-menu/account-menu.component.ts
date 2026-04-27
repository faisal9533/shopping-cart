import { Component, EventEmitter, Output } from '@angular/core'
import { Router } from '@angular/router'
const USER_KEY = 'auth-user'
import { AccountService } from '../../../account/account.service'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'

@Component({
  selector: 'app-account-menu',
  templateUrl: './account-menu.component.html',
  styleUrls: ['./account-menu.component.scss'],
})
export class AccountMenuComponent {
  @Output() closeMenu: EventEmitter<void> = new EventEmitter<void>()
  loginForm: FormGroup
  showAlert: any = false
  display_register_login_page: any = ''
  constructor(
    private fb: FormBuilder,  
    private router: Router,
    private accountService: AccountService,
  ) {}
  public isShowLoginForm = true
  public login_user_data = {
    $id: '',
    Button: '',
    CustomerDOB: null,
    CustomerEmail: '',
    CustomerFullName: '',
    CustomerImagePath: '',
    CustomerMasterKey: 0,
    CustomerPassword: '',
    CustomerPhone: '',
    Offers: true,
    PIN: 0,
    RegisteredDate: '',
    RowIndex: 0,
    UID: null,
  }
  ngOnInit() {
    let CustomerMasterKey: any = localStorage.getItem('CustomerMasterKey')
    this.isShowLoginForm = CustomerMasterKey ? false : this.isShowLoginForm
    var formData: any = new FormData()
    formData.append(
      'CustomerMasterKey',
      localStorage.getItem('CustomerMasterKey'),
    )
    this.accountService.Pos_CustomerEntryGET(formData).subscribe((res: any) => {
      Object.assign(this.login_user_data, res['data'][0])
    })
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
  logOut() {
    let customerKey = localStorage.getItem('CustomerMasterKey')
    if (customerKey) {
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem('CustomerMasterKey')
      localStorage.removeItem('cartItems')
      localStorage.removeItem('wishListItems')
      localStorage.removeItem('wishlistItems')
      localStorage.removeItem("addresskey")
    }
    this.router.navigate(['/account/login']).then(() => {
      window.location.reload();
    });
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
    this.accountService.login(body).subscribe(
      (res: any) => {
        this.showAlert = true
        this.display_register_login_page = res['message']
        if (res && res.data && res.data.CustomerMasterKey) {
          // Add code to store loggedin user data in session
          localStorage.removeItem(USER_KEY)
          localStorage.setItem(
            'CustomerMasterKey',
            res['data']['CustomerMasterKey'],
          )
          localStorage.setItem(USER_KEY, JSON.stringify(res.data))
          this.closeMenu.emit()
          this.router.navigate(['/account/dashboard']).then(() => {
            window.location.reload();
          });
        }
      },
      (err: any) => {
        console.log('error', err)
      },
    )
  }
}
