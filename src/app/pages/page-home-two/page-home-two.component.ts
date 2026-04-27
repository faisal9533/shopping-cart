import { Component, OnDestroy, OnInit, Input } from '@angular/core'
import { posts } from '../../../data/blog-posts'
import { ShopService } from '../../shared/api/shop.service'
import { takeUntil, tap, catchError, map } from 'rxjs/operators'
import { merge, Observable, Subject, of } from 'rxjs'
import { Brand } from '../../shared/interfaces/brand'
import { Product } from '../../shared/interfaces/product'
import { Category } from '../../shared/interfaces/category'
import { BlockHeaderGroup } from '../../shared/interfaces/block-header-group'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../environments/environment'
import { PageCategoryService } from '../../modules/shop/services/page-category.service'
import { CartService } from '../../shared/services/cart.service'

import * as _ from 'lodash'

interface ProductsCarouselGroup extends BlockHeaderGroup {
  products$: Observable<Product[]>
}

interface ProductsCarouselData {
  abort$: Subject<void>
  loading: boolean
  products: Product[]
  groups: ProductsCarouselGroup[]
}
export type Layout = 'grid' | 'grid-with-features' | 'list'

@Component({
  selector: 'app-page-home-two',
  templateUrl: './page-home-two.component.html',
  styleUrls: ['./page-home-two.component.scss'],
  providers: [{ provide: PageCategoryService, useClass: PageCategoryService }],
})
export class PageHomeTwoComponent implements OnInit, OnDestroy {
  @Input() layout: Layout = 'grid'
  @Input() grid: 'grid-3-sidebar' | 'grid-4-full' | 'grid-5-full' =
    'grid-3-sidebar'

  destroy$: Subject<void> = new Subject<void>()
  bestsellers$!: Observable<Product[]>
  brands$!: Observable<Brand[]>
  popularCategories$!: Observable<Category[]>

  columnTopRated$!: Observable<Product[]>
  columnSpecialOffers$!: Observable<Product[]>
 
  product: any = { name: 'test' }
  posts = posts

  featuredProducts!: ProductsCarouselData
  latestProducts!: ProductsCarouselData
  viewMode: 'grid' | 'grid-with-features' | 'list' = 'grid'
  cartItems: any

  constructor(
    private shop: ShopService,
    private http: HttpClient,
    public pageService: PageCategoryService,
    private cart: CartService,

  ) {}

  ngOnInit(): void {
    let customerKey = localStorage.getItem('CustomerMasterKey')
    if (customerKey) {
      this.getCartItems(customerKey).subscribe((response) => {
        this.cartItems = response
        this.dashBoard()
      })
    } else {
      const cartItemsStr = localStorage.getItem('cartItems')
      if (cartItemsStr) {
        this.cartItems = JSON.parse(cartItemsStr)
      }
      this.dashBoard()
    }
    

    this.latestProducts = {
      abort$: new Subject<void>(),
      loading: false,
      products: [],
      groups: [
        {
          name: 'All',
          current: true,
          products$: this.shop.getLatestProducts(null, 8),
        },
        {
          name: 'Power Tools',
          current: false,
          products$: this.shop.getLatestProducts('power-tools', 8),
        },
        {
          name: 'Hand Tools',
          current: false,
          products$: this.shop.getLatestProducts('hand-tools', 8),
        },
        {
          name: 'Plumbing',
          current: false,
          products$: this.shop.getLatestProducts('plumbing', 8),
        },
      ],
    }
    this.groupChange(this.latestProducts, this.latestProducts.groups[0])
  }
  public getCartItems(customerKey: any): Observable<any> {
    let cartItems: any = []
    var formData: any = new FormData()
    formData.append('CustomerKey', customerKey)
    return this.cart.getCart(formData).pipe(
      map((response: any) => {
        if (response && response.data) {
          response.data.forEach((cart: any) => {
            cartItems.push({
              product: {
                name: cart.SkuName,
                price: cart.SalesPrice,
                mrp : cart.MRP,
                images: [cart.SKUImage],
                ...cart,
              },
              quantity: cart.Qty,
              options: [],
            })
          })
          return cartItems
        } else {
          return
        }
      }),
    )
  }
  getProducts(data: any): Observable<any> {
    let category = data.category
    let limit = data.limit
    let products = data.products
    let updatedProducts: any = []
    products = _.find(products, (dt) => {
      return _.isEqual(dt.GroupName, category)
    })
    if (products && !_.isEmpty(products)) {
      products.LstDisplayDetail.forEach((product: any) => {
        let productObj: any = {
          id: product.$id,
          name: product.BannerName,
          sku: '83690/32',
          SkuKey: product.SkuKey ? product.SkuKey : '',
          slug: product.BannerName.replace(/\s+/g, '').toLowerCase(),
          price: product.SalesPrice ? product.SalesPrice : 0,
          SalesPrice: product.SalesPrice ? product.SalesPrice : 0,
          compareAtPrice: product.compareAtPrice || null,
          images: [product.BannerImage] ? [product.BannerImage].slice() : [],
          badges: 'new',
          rating: product.Rating,
          reviews: product.reviews || 12,
          availability: 'in-stock',
          brand: 'brandix',
          categories: [product.ProductCategoryName],
          attributes: [],
        }
        let isExist = _.find(this.cartItems, (item) => {
          return (
            item.product && _.isEqual(item.product.SkuKey, productObj.SkuKey)
          )
        })
        if (isExist && isExist.quantity) {
          //   this.quantity.setValue(isExist.quantity)
          productObj.cartQty = isExist.quantity
        }
        updatedProducts.push(productObj)
      })
    }
    return of(updatedProducts.slice(0, limit))
  }
  dashboardAPI(): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/WEB/PosDashBoardGet_WEB`,
      JSON.stringify({}),
    )
  }
  dashBoard() {
    this.dashboardAPI().subscribe((response) => { 
      this.bestsellers$ = this.getProducts({ 
        products: response.data,
        category: 'Best Seller',
        limit: 200,
      })

    
    })
  }
  getCategoryProducts(data: any): Observable<any> {
    let products = data.products
    let updatedProducts: any = []
    if (products && Array.isArray(products) && !_.isEmpty(products)) {
      products.forEach((product: any) => {
        let productObj:any = {
          id: product.$id,
          name: product.DisplayName,
          sku: '83690/32',
          SkuKey: product.SkuKey ? product.SkuKey : '',
          slug: product.DisplayName.replace(/\s+/g, '').toLowerCase(),
          price: product.SalesPrice ? product.SalesPrice : 0,
          SalesPrice: product.SalesPrice ? product.SalesPrice : 0,
          compareAtPrice: product.compareAtPrice || null,
          images: [product.ProductSmallImage]
            ? [product.ProductSmallImage].slice()
            : [],
          badges: '',
          rating: product.Rating,
          reviews: product.reviews || 12,
          availability: 'in-stock',
          brand: 'brandix',
          categories: [],
          attributes: [],
        }
        let isExist = _.find(this.cartItems, (item) => {
          return (
            item.product && _.isEqual(item.product.SkuKey, productObj.SkuKey)
          )
        })
        if (isExist && isExist.quantity) {
          //   this.quantity.setValue(isExist.quantity)
          productObj.cartQty = isExist.quantity
        }
        updatedProducts.push(productObj)
      })
    }
    return of(updatedProducts.slice())
  }
  getFeaturedProducts(data: any) {
    let products = data.products
    let featuredObj = {
      abort$: new Subject<void>(),
      loading: false,
      products: [],
      groups: <any>[],
    }
    if (products && !_.isEmpty(products)) {
      let groups = [{ name: 'All', current: true, products$: products }]
      //   categories.forEach((category: any) => {
      //     let categoryProducts = _.filter(
      //       products.LstDisplayDetail,
      //       (product) => {
      //         return _.isEqual(product.ProductCategoryName, category)
      //       },
      //     )
      //     let products$ = this.getCategoryProducts({ products: categoryProducts })
      //     groups.push({ name: category, current: false, products$: products$ })
      //   })
      featuredObj['groups'] = groups
    }
    return featuredObj
  }
  allProductAPI(): Observable<any> {
    var formData: any = new FormData()
    formData.append('CategoryName', 'selectall')
    formData.append('SentType', 'category')
    return this.http.post(
      `${environment.apiUrl}/WEB/ProductDisplayByCategory_WEB`,
      formData,
    )
  }
  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
  setLayout(value: Layout): void {
    this.layout = value
  }
  groupChange(carousel: ProductsCarouselData, group: BlockHeaderGroup): void {
    carousel.loading = true
    carousel.abort$.next()
    ;(group as ProductsCarouselGroup).products$
      .pipe(
        tap(() => (carousel.loading = false)),
        takeUntil(merge(this.destroy$, carousel.abort$)),
      )
      .subscribe((x) => (carousel.products = x))
  }
}
