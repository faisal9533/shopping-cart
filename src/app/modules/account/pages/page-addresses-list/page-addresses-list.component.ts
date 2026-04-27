import { Component } from '@angular/core'

import { AccountService } from '../../account.service'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { Router } from '@angular/router'

@Component({
  selector: 'app-page-addresses-list',
  templateUrl: './page-addresses-list.component.html',
  styleUrls: ['./page-addresses-list.component.sass'],
})
export class PageAddressesListComponent {
  constructor(
    private fb: FormBuilder,
    public service: AccountService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.getAddressList()
  }

  public address_list: any
  getAddressList() {
    var formData: any = new FormData()
    formData.append('CustomerKey', localStorage.getItem('CustomerMasterKey'))
    formData.append('AddressKey', '0')
    this.service.POSAddressesEntryGet_WEB(formData).subscribe((res: any) => {
      this.address_list = res['data']
    })
  }

  removeAddress(delete_id: any) {
    if (confirm('Are you sure to delete?')) {
      var formData: any = new FormData()
      formData.append('MODE', 'DELETE')
      formData.append('AddressKey', delete_id)
      this.service.POSAddressesEntrySAVE_WEB(formData).subscribe((res: any) => {
        this.getAddressList()
      })
    }
  }
}
