import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core'
import { Product } from '../../interfaces/product'
import { RootService } from '../../services/root.service'
import { FormBuilder, FormGroup, FormControl } from '@angular/forms'
import {
  debounceTime,
  map,
  switchMap,
  takeUntil,
  throttleTime,
  tap,
} from 'rxjs/operators'
import { fromEvent, of, Subject, asyncScheduler, Observable } from 'rxjs'
import { ShopService } from '../../api/shop.service'
import { Category } from '../../interfaces/category'
import { DOCUMENT } from '@angular/common'
import { CartService } from '../../services/cart.service'
import { Injectable } from '@angular/core'
import * as _ from 'lodash'

import { HttpClient, HttpHeaders } from '@angular/common/http'
import { environment } from '../../../../environments/environment'

export type SearchLocation = 'header' | 'indicator' | 'mobile-header'

export type CategoryWithDepth = Category & { depth: number }

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  exportAs: 'search',
})
export class SearchComponent implements OnChanges, OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>()
  cartItems: any
  form!: FormGroup
  quantity: FormControl = new FormControl([])

  hasSuggestions = false

  categories: CategoryWithDepth[] = []

  suggestedProducts: any[] = []

  addedToCartProducts: any[] = []

  @Input() location: SearchLocation = 'header'

  @Output() escape: EventEmitter<void> = new EventEmitter<void>()

  @Output() closeButtonClick: EventEmitter<void> = new EventEmitter<void>()

  @HostBinding('class.search') classSearch = true

  @HostBinding('class.search--location--header')
  get classSearchLocationHeader(): boolean {
    return this.location === 'header'
  }

  @HostBinding('class.search--location--indicator')
  get classSearchLocationIndicator(): boolean {
    return this.location === 'indicator'
  }

  @HostBinding('class.search--location--mobile-header')
  get classSearchLocationMobileHeader(): boolean {
    return this.location === 'mobile-header'
  }

  @HostBinding('class.search--has-suggestions')
  get classSearchHasSuggestions(): boolean {
    return this.hasSuggestions
  }

  @HostBinding('class.search--suggestions-open')
  classSearchSuggestionsOpen = false

  @ViewChild('input') inputElementRef!: ElementRef

  availability=false;
  get element(): HTMLElement {
    return this.elementRef.nativeElement
  }

  get inputElement(): HTMLElement {
    return this.inputElementRef.nativeElement
  }
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private fb: FormBuilder,
    private elementRef: ElementRef,
    private zone: NgZone,
    private shop: ShopService,
    private cart: CartService,
    public root: RootService,
    private http: HttpClient,
  ) {}
  httpHeader = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.location && this.location === 'header') {
      this.fetchCategories()
        .pipe(takeUntil(this.destroy$))
        .subscribe((response) => {
          if (response && response.data) {
            let categoriesData = this.getCategories({ menus: response.data })
            this.categories = this.getCategoriesWithDepth(categoriesData)
          }
        })
      this.shop
        .getCategories(null, 1)
        .pipe(takeUntil(this.destroy$))
        .subscribe((categories) => {
          this.categories = this.getCategoriesWithDepth(categories)
        })
    }
  }
  getCategories(data: any): any {
    let categories = data.menus
    let menuItems: any = []
    categories.forEach((category: any) => {
      let subCategories: any = []
      let catslug = category.CategoryName.toLowerCase().replace(/ /g, '')
      if (category.LstCategoryDetail) {
        category.LstCategoryDetail.forEach((subCategory: any) => {
          let subCategorySlug = subCategory.SubCategoryName.toLowerCase().replace(
            / /g,
            '',
          )
          subCategories.push({
            path: `${catslug}/${subCategorySlug}`,
            slug: subCategorySlug,
            name: subCategory.SubCategoryName,
            ...subCategory,
            children: [],
          })
        })
      }

      menuItems.push({
        slug: catslug,
        path: `${catslug}`,
        name: category.CategoryName,
        url: `/shop/catalog/${catslug}`,
        children: subCategories,
      })
    })
    return menuItems
  }
  fetchCategories(): Observable<any> {
    return this.http
      .post(
        `${environment.apiUrl}/POS/ProductCatAndSubCatGet`,
        JSON.stringify({}),
      )
      .pipe(
        tap((response) => {
          // console.log('response', response);
        }),
      )
  }
  ngOnInit(): void {
    let customerKey = localStorage.getItem('CustomerMasterKey')
    if (customerKey) {
      this.getCartItems(customerKey).subscribe((response) => {
        this.cartItems = response
      })
    } else {
      const cartItemsStr = localStorage.getItem('cartItems')
      if (cartItemsStr) {
        this.cartItems = JSON.parse(cartItemsStr)
      }
    }
    this.form = this.fb.group({
      category: ['all'],
      query: [''],
    })
    
    let updatedProducts: any = []
    this.form
      .get('query')
      ?.valueChanges.pipe(
        throttleTime(250, asyncScheduler, { leading: true, trailing: true }),
        map((query) => query.trim()),
        switchMap((query) => {
          if (query) {
            let subCategorySlug = null
            let categorySlug =
              this.form.value.category !== 'all'
                ? this.form.value.category
                : null
            let splitString = categorySlug ? categorySlug.split('/') : []
            if (splitString && splitString.length && splitString.length == 2) {
              categorySlug = splitString[0]
              subCategorySlug = splitString[1]
            }
            return this.shop.getSuggestions(
              query,
              5,
              categorySlug,
              subCategorySlug,
            )
          }

          return of([])
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((products) => { 
        updatedProducts = []
        if (products && products.data) {
          products.data.forEach((product: any,index:any) => {
            let productObj: any = {
              id: product.$id,
              name: product.ProductName,
              sku: '83690/32',
              ProductKey: product.ProductKey ? product.ProductKey : '',
              SkuKey: product.SkuKey
                ? product.SkuKey
                : product.ProductKey
                ? product.ProductKey
                : '',
              slug: product.ProductName.replace(/\s+/g, '').toLowerCase(),
              price: product.SalesPrice ? product.SalesPrice : 0,
              SalesPrice: product.SalesPrice ? product.SalesPrice : 0,
              compareAtPrice: product.compareAtPrice || null,
              images: [product.SkuImage] ? [product.SkuImage].slice() : [],
              badges: [],
              rating: product.rating,
              reviews: product.reviews,
              availability: product.Stock>0?true:false,
              brand: null,
              customFields: {},
            }
            productObj.quantity = new FormControl(0)
            let isExist = _.find(this.cartItems, (item) => {
              return (
                item.product &&
                _.isEqual(item.product.SkuKey, productObj.SkuKey)
              )
            })
            if (isExist && isExist.quantity) {
              //   this.quantity.setValue(isExist.quantity)
              productObj.cartQty = isExist.quantity
              productObj.quantity.setValue(isExist.quantity)
            }
            updatedProducts.push(productObj)
          })
          this.hasSuggestions = updatedProducts.length > 0
        }
        // if (updatedProducts.length > 0) {
        this.suggestedProducts = updatedProducts
        // }
      })

    this.zone.runOutsideAngular(() => {
      fromEvent(this.document, 'click')
        .pipe(takeUntil(this.destroy$))
        .subscribe((event) => {
          const activeElement = this.document.activeElement

          // If the inner element still has focus, ignore the click.
          if (
            activeElement &&
            activeElement.closest('.search') === this.element
          ) {
            return
          }

          // Close suggestion if click performed outside of component.
          if (
            event.target instanceof HTMLElement &&
            this.element !== event.target.closest('.search')
          ) {
            this.zone.run(() => this.closeSuggestion())
          }
        })

      fromEvent(this.element, 'focusout')
        .pipe(debounceTime(10), takeUntil(this.destroy$))
        .subscribe(() => {
          if (this.document.activeElement === this.document.body) {
            return
          }

          // Close suggestions if the focus received an external element.
          if (
            this.document.activeElement &&
            this.document.activeElement.closest('.search') !== this.element
          ) {
            this.zone.run(() => this.closeSuggestion())
          }
        })
    })
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
                mrp: cart.MRP,
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
  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  openSuggestion(): void {
    this.classSearchSuggestionsOpen = true
  }

  closeSuggestion(): void {
    this.classSearchSuggestionsOpen = false
  }

  getCategoryName(category: CategoryWithDepth): string {
    return '&nbsp;'.repeat(category.depth * 4) + category.name
  }

  addToCart(product: any): void {
    if (this.addedToCartProducts.includes(product)) {
      return
    }

    this.addedToCartProducts.push(product)
    // let quantity = product.quantity.value ? product.quantity.value : 1;
    product.cartQty++;
    this.cart.add(product, 1).subscribe({
      complete: () => {
        this.addedToCartProducts = this.addedToCartProducts.filter(
          (eachProduct: any) => eachProduct.SkuKey !== product.SkuKey,
        )
      },
    })
  }

  private getCategoriesWithDepth(
    categories: Category[],
    depth = 0,
  ): CategoryWithDepth[] {
    return categories.reduce<CategoryWithDepth[]>(
      (acc, category) => [
        ...acc,
        { ...category, depth },
        ...this.getCategoriesWithDepth(category.children || [], depth + 1),
      ],
      [],
    )
  }
}
