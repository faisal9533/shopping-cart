import { Component, OnDestroy, OnInit } from '@angular/core'
import { takeUntil } from 'rxjs/operators'
import { Subject, Observable } from 'rxjs'
import { MobileMenuService } from '../../../../shared/services/mobile-menu.service'
import { mobileMenu } from '../../../../../data/mobile-menu'
import { MobileMenuItem } from '../../../../shared/interfaces/mobile-menu-item'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../../../environments/environment'
import * as _ from 'lodash'

@Component({
  selector: 'app-mobile-menu',
  templateUrl: './mobile-menu.component.html',
  styleUrls: ['./mobile-menu.component.scss'],
})
export class MobileMenuComponent implements OnDestroy, OnInit {
  private destroy$: Subject<any> = new Subject()
  apptype: any = environment.apptype
  isOpen = true;
  links: MobileMenuItem[] = mobileMenu

  constructor(public mobilemenu: MobileMenuService, private http: HttpClient) {}

  ngOnInit(): void {
    this.mobilemenu.isOpen$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOpen) => (this.isOpen = isOpen))
    this.dashboardAPI().subscribe((response: any) => {
      if (response && response.data ) {
        if( this.apptype=="one"){
        this.links = [{
          type: 'link',
          url: '',
          label: 'Categories',
          children: this.getMobileMenu({ menus: response.data }),
        }];
      }
        let accountChildren: any = []
        let customerKey = localStorage.getItem('CustomerMasterKey')
        if (customerKey) {
          accountChildren.push(
                   
                              {type: 'link', label: 'Dashboard',       url: '/account/dashboard'},
                              {type: 'link', label: 'Edit Profile',    url: '/account/profile'},
                              {type: 'link', label: 'Order History',   url: '/account/orders'},
                              {type: 'link', label: 'Address',    url: '/account/addresses'},
                              {type: 'link', label: 'Change Password', url: '/account/password'},
                              {type: 'link',url: '/account/login',label: 'Logout',},
         )
        
        } else {
          accountChildren.push({
            type: 'link',
            url: '/account/login',
            label: 'Login',
          })
        }
        this.links.push({
          type: 'link',
          url: '',
          label: 'Account',
          children: accountChildren,
        })
      }
    })
  }
  dashboardAPI(): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/POS/ProductCatAndSubCatGet`,
      JSON.stringify({}),
    )
  }
  getMobileMenu(data: any): any {
    let categories = data.menus
    let menuItems: any = []
    categories.forEach((category: any) => {
      let subCategories: any = []
      if (category.LstCategoryDetail) {
        category.LstCategoryDetail.forEach((subCategory: any) => {
          let products: any = []
          if (subCategory.LstProduct) {
            subCategory.LstProduct.forEach((product: any) => {
              let productSlug = product.ProductName.toLowerCase().replace(
                / /g,
                '',
              )
              products.push({
                type: 'link',
                label: product.ProductName,
                url: `/shop/products/${productSlug}`,
                ...product,
              })
            })
          }
          let slug = subCategory.SubCategoryName.toLowerCase().replace(/ /g, '')
          subCategories.push({
            type: 'link',
            label: subCategory.SubCategoryName,
            ...subCategory,
            children: products,
          })
        })
      }
      let catslug = category.CategoryName.toLowerCase().replace(/ /g, '')
      menuItems.push({
        type: 'link',
        label: category.CategoryName,
        url: `/shop/catalog/${catslug}`,
        children: subCategories,
      })
    })
    return menuItems
  }
  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  onItemClick(event: MobileMenuItem): void {
    if (event.type === 'link') {
      this.mobilemenu.close()
    }
  }
}
