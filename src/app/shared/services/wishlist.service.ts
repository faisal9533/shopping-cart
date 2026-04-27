import { Inject, Injectable, OnDestroy, PLATFORM_ID } from '@angular/core'
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs'
import { Product } from '../interfaces/product'
import { map, takeUntil } from 'rxjs/operators'
import { isPlatformBrowser } from '@angular/common'
import { ShopService } from '../../modules/shop/shop.service'

interface WishlistData {
  items: any[]
}

@Injectable({
  providedIn: 'root',
})
export class WishlistService implements OnDestroy {
  private data: WishlistData = {
    items: [],
  }

  private destroy$: Subject<void> = new Subject()
  private itemsSubject$: BehaviorSubject<Product[]> = new BehaviorSubject<
    Product[]
  >([])
  private onAddingSubject$: Subject<Product> = new Subject()

  readonly items$: Observable<any[]> = this.itemsSubject$.pipe(
    takeUntil(this.destroy$),
  )
  readonly count$: Observable<number> = this.itemsSubject$.pipe(
    map((items) => items.length),
  )
  readonly onAdding$: Observable<Product> = this.onAddingSubject$.asObservable()

  constructor(
    @Inject(PLATFORM_ID)
    private platformId: any,
    public apiService: ShopService,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.load()
    }
  }

  add(product: any): Observable<void> { 
    // timer only for demo
    if (localStorage.getItem('CustomerMasterKey')) {
      var formData: any = new FormData()
      formData.append('FavKey', 0)
      formData.append('CustomerKey', localStorage.getItem('CustomerMasterKey'))
      formData.append('SkuKey', product.SkuKey) // Need to Add Dynamic Value
      formData.append('MODE', 'ADD')
      return this.apiService.CustomerFavouriteSave_WEB(formData).pipe(
        map(() => {
          this.onAddingSubject$.next(product)
          const index = this.data.items.findIndex(
            (item) => item.SkuKey === product.SkuKey,
          )
          if (index === -1) {
            this.data.items.push(product);
            this.save()
          }
        }),
      )
    } else {
      return timer(1000).pipe(
        map(() => {
          this.onAddingSubject$.next(product)
          const index = this.data.items.findIndex(
            (item) => item.SkuKey === product.SkuKey,
          )
          if (index === -1) {
            this.data.items.push(product);
            this.save()
          }
        }),
      )
    }
  }

  remove(product: any): Observable<void> {
    // timer only for demo
    return timer(1000).pipe(
      map(() => {
        const index = this.data.items.findIndex(
          (item:any) => item.SkuKey === product.SkuKey,
        )

        if (index !== -1) {
          this.data.items.splice(index, 1)
          this.save()
        }
      }),
    )
  }

  private save(): void {
    localStorage.setItem('wishlistItems', JSON.stringify(this.data.items))

    this.itemsSubject$.next(this.data.items)
  }

  private load(): void { 
    let customerKey = localStorage.getItem('CustomerMasterKey')

    if (customerKey) {
      var formData: any = new FormData()
      formData.append('CustomerKey', customerKey)
      this.apiService
        .CustomerFavouriteGet_WEB(formData)
        .subscribe((res: any) => {
          this.data.items = res['data']
          this.itemsSubject$.next(this.data.items)
        })
    } else {
      const items = localStorage.getItem('wishlistItems')

      if (items) {
        this.data.items = JSON.parse(items)
        this.itemsSubject$.next(this.data.items)
      }
    }
  }
  public loadAgain() {
    this.load()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
}
