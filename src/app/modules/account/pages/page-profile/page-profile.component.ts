import { AccountService } from '../../account.service'
import { Component } from '@angular/core'
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms'
import { Router } from '@angular/router'

@Component({
  selector: 'app-page-profile',
  templateUrl: './page-profile.component.html',
  styleUrls: ['./page-profile.component.sass'],
})
export class PageProfileComponent {
  editProfileForm: FormGroup = new FormGroup({})
  imageSrc: string = ''
  constructor(
    private fb: FormBuilder,
    public service: AccountService,
    private router: Router,
  ) {}

  public login_user_data = {
    file: '',
    CustomerImage: '',
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
    VatNo: '',
    RegisteredDate: '',
    RowIndex: 0,
    UID: null,
  }

  ngOnInit() {
    this.editProfileForm = this.fb.group({
      fileSource: new FormControl(''),
      file: new FormControl(''),
      CustomerImage: [''],
      $id: [''],
      Button: [''],
      CustomerDOB: [''],
      CustomerEmail: [''],
      CustomerFullName: ['', [Validators.required]],
      CustomerImagePath: [''],
      CustomerMasterKey: [''],
      CustomerPassword: ['', [Validators.required, Validators.minLength(6)]],
      CustomerPhone: [''],
      Offers: [''],
      VatNo: [''],
      RegisteredDate: [''],
      RowIndex: [''],
      UID: [''],
    })

    var formData: any = new FormData()
    formData.append(
      'CustomerMasterKey',
      localStorage.getItem('CustomerMasterKey'),
    )
    this.service.Pos_CustomerEntryGET(formData).subscribe((res: any) => {
      let data = Object.assign(this.login_user_data, res['data'][0])
      this.editProfileForm.patchValue(data)
    })
  }
  onFileChange(event: any) {
    const reader = new FileReader()

    if (event.target.files && event.target.files.length) {
      const [file] = event.target.files

      reader.readAsDataURL(file)

      reader.onload = () => {
        this.imageSrc = reader.result as string
        console.log('imageSrc', this.imageSrc)
        this.editProfileForm.patchValue({
          fileSource: reader.result,
        })
      }
    }
  }
  get form() {
    return this.editProfileForm.controls
  }

  public showAlert = false
  public display_msg_update_profile = ''
  public isSubmittedProfileUpdate = false
  submitUpdateProfile() { 
    this.isSubmittedProfileUpdate = true
    if (this.editProfileForm.invalid) {
      return
    }
    var formData: any = new FormData()
    formData.append('CustomerFullName', this.form.CustomerFullName.value)
    formData.append('CustomerPhone', this.form.CustomerPhone.value)
    formData.append('CustomerEmail', this.form.CustomerEmail.value)
    formData.append('CustomerPassword', this.form.CustomerPassword.value)
    formData.append('VatNo', this.form.VatNo.value)
    formData.append('CustomerDOB', this.form.CustomerDOB.value)
    // formData.append('CustomerImage', this.form.CustomerImage.value)
    // formData.append('CustomerImage', this.form.fileSource)
    formData.append('CustomerImage', this.imageSrc)
    //formData.append("CustomerImage",this.form.CustomerDOB.value);
    formData.append('Offers', 0)
    formData.append(
      'CustomerMasterKey',
      localStorage.getItem('CustomerMasterKey'),
    )
    //formData.append("CompanyID",1);
    // formData.append("VatNo",1);
    // formData.append("Tax/Vat No",1);
    // formData.append("UID",1);
    // formData.append("CustomerCompanyName",1);
    this.service.CustomerEntrySAVE(formData).subscribe((res: any) => {
      this.showAlert = true
      this.display_msg_update_profile = res['message']
    })
  }
}
