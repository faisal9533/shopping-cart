import { Component, Inject, Input, PLATFORM_ID } from '@angular/core'
import { Product } from '../../interfaces/product'
import { FormControl } from '@angular/forms'
import { CartService } from '../../services/cart.service'
import { WishlistService } from '../../services/wishlist.service'
import { CompareService } from '../../services/compare.service'
import { RootService } from '../../services/root.service'
import { ProductService } from '../product.service'
import { Observable, of } from 'rxjs'
import { map } from 'rxjs/operators'

import { ActivatedRoute } from '@angular/router'
import * as _ from 'lodash'

export type ProductLayout = 'standard' | 'sidebar' | 'columnar' | 'quickview'

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
})
export class ProductComponent {
  @Input() layout: ProductLayout = 'standard'

  @Input() product!: any

  quantity: FormControl = new FormControl(0)

  addingToCart = false
  addingToWishlist = false
  addingToCompare = false
  availability=false;
  // product_data: Observable<any>;

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private cart: CartService,
    private wishlist: WishlistService,
    private compare: CompareService,
    public root: RootService,
    public apiService: ProductService,
    private activeRoute: ActivatedRoute,
  
  ) {}

  public product_data: any = {}

  ngOnInit(): void {
    const routeParams = this.activeRoute.snapshot.params
    this.activeRoute.params.subscribe((routeParams) => {
      if (routeParams.productSlug) {
        var formData: any = new FormData()
        formData.append('SkuName', routeParams.productSlug)
        this.apiService
          .ProductSKuDataGet_WEB(formData)
          .subscribe((res: any) => {
            this.product_data = res['data']
            console.error(this.product_data);
            this.availability=this.product_data.Stock>0?true:false;   
            
          })
      }
    })
    if (this.product && this.product.slug) {
      var formData: any = new FormData()
      formData.append('SkuName', this.product.slug)
      this.apiService.ProductSKuDataGet_WEB(formData).subscribe((res: any) => {
        this.product_data = res['data']
        this.product_data['slug']= this.product_data.SkuName.replace(/\s+/g, '').toLowerCase()
        let cartItems;
        (async () => {
          let customerKey = localStorage.getItem('CustomerMasterKey')
          if (customerKey) {
            cartItems = await this.getCartItems(customerKey).toPromise();
          } else {
            const cartItemsStr = localStorage.getItem('cartItems')
            if (cartItemsStr) {
              cartItems = JSON.parse(cartItemsStr)
            }
          }
          let isExist;
          isExist = _.find(cartItems, (item) => {
            return item.product && _.isEqual(item.product.SkuKey, this.product_data.SkuKey)
          })

          if (isExist && isExist.quantity) {
            this.quantity.setValue(isExist.quantity)
          }
        })()
      })
    }
  }
  public getCartItems(customerKey:any): Observable<any> {
    let cartItems: any = []
      var formData: any = new FormData()
      formData.append('CustomerKey', customerKey)
      return this.cart.getCart(formData).pipe(
        map((response: any) => {
          if (response && response.data) {  //product
            response.data.forEach((cart: any) => { 
              cartItems.push({
                product: {
                  name: cart.SkuName,
                  price: cart.SalesPrice,
                  mrp: cart.MRP,
                  images: [cart.SKUImage],
                  ...cart,
                },
                quantity: cart.Qty,
                options: [],
              })
            });
            return cartItems
          } else {
            return
          }
        }),
      )
    
  }
  addToCart(): void { 
    if (!this.addingToCart && this.product && this.quantity.value > 0) {
      this.addingToCart = true

      this.cart
        .add(this.product, this.quantity.value, [], false)
        .subscribe({ complete: () => (this.addingToCart = false) })
    }
  }

  addToWishlist(data: any): void {
    if (!this.addingToWishlist && data) {
      this.addingToWishlist = true
      this.wishlist
        .add(data)
        .subscribe({ complete: () => (this.addingToWishlist = false) })
      if (localStorage.getItem('CustomerMasterKey')) {
        var formData: any = new FormData()
        formData.append('FavKey', 0)
        formData.append(
          'CustomerKey',
          localStorage.getItem('CustomerMasterKey'),
        )
        formData.append('SkuKey', data.SkuKey) // Need to Add Dynamic Value
        formData.append('MODE', 'ADD')
        this.apiService
          .CustomerFavouriteSave_WEB(formData)
          .subscribe((res: any) => {})
      }
    }
  }

  addToCompare(): void {
    if (!this.addingToCompare && this.product) {
      this.addingToCompare = true

      this.compare
        .add(this.product)
        .subscribe({ complete: () => (this.addingToCompare = false) })
    }
  }
}
