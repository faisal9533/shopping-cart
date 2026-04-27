import { Component } from '@angular/core'
import { theme } from '../../../data/theme'
import { Router } from '@angular/router'

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  theme = theme
  links: any = []
  constructor(private router: Router) {}
  ngOnInit(): void {
    this.links = [

      { label: 'Wish List', url: '/shop/wishlist' },
      { label: 'Compare', url: '/shop/compare' },
      
    ]
    let customerKey = localStorage.getItem('CustomerMasterKey')
    if (customerKey) {
      this.links.push({ label: 'Account', url: '/account/dashboard' })
      this.links.push({ label: 'Logout', url: '/account/login' })
    } else {
      this.links.push({ label: 'Login', url: '/account/login' })
    }
  }
  logOut() {
    let customerKey = localStorage.getItem('CustomerMasterKey')
    if (customerKey) {
      localStorage.removeItem('CustomerMasterKey')
      localStorage.removeItem('cartItems')
      localStorage.removeItem('wishListItems')
      localStorage.removeItem('wishlistItems')
      localStorage.removeItem('addresskey')
    }
    this.router.navigate(['/account/login']).then(() => {
      window.location.reload()
    })
  }
}
