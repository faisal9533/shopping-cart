import { Component } from '@angular/core'
import { Router } from '@angular/router'

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.sass'],
})
export class LayoutComponent {
  links: { label: string; url: string }[] = [
    { label: 'Dashboard', url: './dashboard' },
    { label: 'Edit Profile', url: './profile' },
    { label: 'Order History', url: './orders' },
    // { label: 'Order Details', url: './orders/5' },
    { label: 'Addresses', url: './addresses' },
    // { label: 'Edit Address', url: './addresses/0' },
    { label: 'Password', url: './password' },
    { label: 'Logout', url: './login' },
  ]

  constructor(private router: Router) {}

  buttonClick(name: any) {
    if (name == './login') {
      localStorage.removeItem('USER_KEY')
      localStorage.removeItem('CustomerMasterKey')
      this.router.navigate(['/account/login']).then(() => {
        window.location.reload()
      })
    }
  }
}
