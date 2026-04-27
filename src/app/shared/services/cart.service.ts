import { Inject, Injectable, PLATFORM_ID } from '@angular/core'
import { Product } from '../interfaces/product'
import { CartItem } from '../interfaces/cart-item'
import { BehaviorSubject, Observable, of, Subject, timer,from,forkJoin } from 'rxjs'
import { map } from 'rxjs/operators'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { environment } from '../../../environments/environment'
import { sub } from 'ngx-red-zoom/lib/vector'

interface CartTotal {
  title: string
  price: number
  type: 'shipping' | 'fee' | 'tax' | 'other'
}

interface CartData {
  items: CartItem[]
  quantity: number
  subtotal: number
  totals: CartTotal[]
  total: number
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private data: CartData = {
    items: [],
    quantity: 0,
    subtotal: 0,
    totals: [],
    total: 0,
  }

  private itemsSubject$: BehaviorSubject<CartItem[]> = new BehaviorSubject(
    this.data.items,
  )
  private quantitySubject$: BehaviorSubject<number> = new BehaviorSubject(
    this.data.quantity,
  )
  private subtotalSubject$: BehaviorSubject<number> = new BehaviorSubject(
    this.data.subtotal,
  )
  private totalsSubject$: BehaviorSubject<CartTotal[]> = new BehaviorSubject(
    this.data.totals,
  )
  private totalSubject$: BehaviorSubject<number> = new BehaviorSubject(
    this.data.total,
  )
  private onAddingSubject$: Subject<Product> = new Subject()

  get items(): ReadonlyArray<CartItem> {
    return this.data.items
  }

  get quantity(): number {
    return this.data.quantity
  }
  get subTotal(): number {
    return this.data.subtotal
  }
  get totals(): any {
    return this.data.totals
  }
  get total(): any {
    return this.data.total
  }

  readonly items$: Observable<CartItem[]> = this.itemsSubject$.asObservable()
  readonly quantity$: Observable<number> = this.quantitySubject$.asObservable()
  readonly subtotal$: Observable<number> = this.subtotalSubject$.asObservable()
  readonly totals$: Observable<CartTotal[]> = this.totalsSubject$.asObservable()
  readonly total$: Observable<number> = this.totalSubject$.asObservable()

  readonly onAdding$: Observable<Product> = this.onAddingSubject$.asObservable()

  constructor(
    @Inject(PLATFORM_ID)
    private platformId: any,
    public http: HttpClient,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.load()
      this.calc()
    }
  }

  add(
    product: any,
    quantity: number,
    options: { name: string; value: string }[] = [],
    isIncrement?: boolean,
  ): Observable<CartItem> {
    // timer only for demo
    let customerKey = localStorage.getItem('CustomerMasterKey')
    if (customerKey) {
      let item: any = this.items.find((eachItem) => {
        if (eachItem.product.SkuKey !== product.SkuKey) {
          return false
        }
        return true
      })

      if (item) {
        if (isIncrement == false) {
          item.quantity = quantity
        } else {
          item.quantity += quantity
        }
      } else {
        item = { product, quantity, options }

        this.data.items.push(item)
      }
      var formData: any = new FormData()
      formData.append('CustomerKey', customerKey)
      formData.append('Qty', item.quantity)
      formData.append('SkuKey', product['SkuKey'])
      return this.saveCart(formData).pipe(
        map(() => {
          this.onAddingSubject$.next(product)
          if (product) {
            if (isIncrement == false) {
              product.quantity = quantity
            } else {
              product.quantity += quantity
            }
          }
          // let item = { product, quantity, options };

          this.save()
          this.calc()
          return item
        }),
      )
    } else {
      return timer(1000).pipe(
        map(() => {
          this.onAddingSubject$.next(product)

          let item = this.items.find((eachItem) => {
            if (eachItem.product.SkuKey !== product.SkuKey) {
              return false
            }
            // if (
            //   eachItem.product.id !== product.id ||
            //   eachItem.options.length !== options.length
            // ) {
            //   return false
            // }

            if (eachItem.options.length) {
              for (const option of options) {
                if (
                  !eachItem.options.find(
                    (itemOption) =>
                      itemOption.name === option.name &&
                      itemOption.value === option.value,
                  )
                ) {
                  return false
                }
              }
            }

            return true
          })
          if (item) {
            if (isIncrement == false) {
              item.quantity = quantity
            } else {
              item.quantity += quantity
            }
          } else {
            item = { product, quantity, options,maxqty:5 }

            this.data.items.push(item)
          }

          this.save()
          this.calc()

          return item
        }),
      )
    }
  }

  update(updates: { item: CartItem; quantity: number }[]): Observable<void> {
    // timer only for demo
    let customerKey = localStorage.getItem('CustomerMasterKey')
    if (customerKey) {
      let calls:any = [];
      for (var _i = 0; _i < updates.length; _i++) {
        const item: any = this.items.find((eachItem) => {
          return eachItem.product.SkuKey === updates[_i].item.product.SkuKey
        })
        console.log('item', item)
        console.log('item', item.quantity != updates[_i].quantity)
        // if (item & item.quantity != updates[_i].quantity) {
        if (item && item.quantity != updates[_i].quantity) {
          item.quantity = updates[_i].quantity

          var formData: any = new FormData()
          formData.append('CustomerKey', customerKey)
          formData.append('Qty', updates[_i].quantity)
          formData.append('SkuKey', item.product.SkuKey)
          calls.push(this.saveCart(formData));
        }
      }
      return timer(1000).pipe(
        map(() => {
          forkJoin(...calls).subscribe(
            data => { // Note: data is an array now
                this.save()
                this.calc()
            }, err => console.log('error ' + err),
            () => console.log('Ok '));
      }));
    } else {
      return timer(1000).pipe(
        map(() => {
          updates.forEach((update) => {
            const item = this.items.find((eachItem) => eachItem === update.item)

            if (item) {
              item.quantity = update.quantity
            }
          })

          this.save()
          this.calc()
        }),
      )
    }
  }
  async asyncFor(array: any, callback: Function) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }
  remove(item: CartItem): Observable<void> {
    let customerKey = localStorage.getItem('CustomerMasterKey')
    if (customerKey) {
      // return timer(10).pipe(map(() => {
      item.quantity = 0
      var formData: any = new FormData()
      formData.append('CustomerKey', customerKey)
      formData.append('Qty', item.quantity)
      formData.append('SkuKey', item.product.SkuKey);
      return this.saveCart(formData).pipe(
        map(() => {
          this.data.items = this.data.items.filter(
            (eachItem) => eachItem !== item,
          )
          this.save()
          this.calc()
        }),
      )
      // }));
    } 
    else {
      // timer only for demo
      return timer(1000).pipe(
        map(() => {
          this.data.items = this.data.items.filter(
            (eachItem) => eachItem !== item,
          )

          this.save()
          this.calc()
        }),
      )
    }
  }

  private calc(): void {
    let quantity = 0
    let subtotal = 0

    this.data.items.forEach((item) => {
      quantity += item.quantity
      subtotal += item.product.price * item.quantity
    })

    const totals: CartTotal[] = []


    // totals.push({
    //   title: 'Tax',
    //   price: subtotal * 0.2,
    //   type: 'tax',
    // })
    //imran 040178
    if(subtotal<2500)
    totals.push({
      title: 'Shipping Charge',
      price: 70,
      type: 'shipping',
    })
    const total =
      subtotal + totals.reduce((acc, eachTotal) => acc + eachTotal.price, 0)

    this.data.quantity = quantity
    this.data.subtotal = subtotal
    this.data.totals = totals
    this.data.total = total

    this.itemsSubject$.next(this.data.items)
    this.quantitySubject$.next(this.data.quantity)
    this.subtotalSubject$.next(this.data.subtotal)
    this.totalsSubject$.next(this.data.totals)
    this.totalSubject$.next(this.data.total)
  }
  private saveCart(data: any) {
    return this.http.post(
      `${environment.apiUrl}/WEB/CustomerCardSave_WEB`,
      data,
    )
  }
  public getCart(data: any) {
    return this.http.post(`${environment.apiUrl}/POS/CustomerCardGet`, data)
  }
  private save(): void {
    this.getCartItems()
    localStorage.setItem('cartItems', JSON.stringify(this.data.items))
  }
  public getCartItems(): Observable<any> {
    let cartItems: any = []
    let customerKey = localStorage.getItem('CustomerMasterKey')

    if (customerKey) {
      var formData: any = new FormData()
      formData.append('CustomerKey', customerKey)
      return this.getCart(formData).pipe(
        map((response: any) => {
          if (response && response.data) {
            response.data.forEach((cart: any) => { 
              this.data.items.push({
                product: {
                  name: cart.SkuName,
                  price: cart.SalesPrice,
                  mrp: cart.MRP,
                  images: [cart.SKUImage],
                  ...cart,
                },
                quantity: cart.Qty,
                maxqty:cart.MaxSelection,
                options: [],
              })
              console.log(cart.MaxSelection);
            }

            )
            this.calc()
            return this.data.items
          } else {
            return
          }
          // this.data.items = cartItems;
        }),
      )
    } else {
      return of(cartItems)
    }
  }
  private async load(): Promise<any> {
    let customerKey = localStorage.getItem('CustomerMasterKey')
    if (customerKey) {
      await this.getCartItems().subscribe()
    } else {
      const items = localStorage.getItem('cartItems')

      if (items) {
        this.data.items = JSON.parse(items)
      }
    }
  }
}
