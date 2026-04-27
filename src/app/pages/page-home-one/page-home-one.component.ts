import { Component, OnDestroy, OnInit } from '@angular/core'
import { posts } from '../../../data/blog-posts'
import { Brand } from '../../shared/interfaces/brand'
import { Observable, Subject, of, merge } from 'rxjs'
import { ShopService } from '../../shared/api/shop.service'
import { Product } from '../../shared/interfaces/product'
import { Category } from '../../shared/interfaces/category'
import { BlockHeaderGroup } from '../../shared/interfaces/block-header-group'
import { takeUntil, tap, map } from 'rxjs/operators'
import { HttpClient } from '@angular/common/http'
import { environment } from '../../../environments/environment'
import * as _ from 'lodash'
import { CartService } from '../../shared/services/cart.service'

interface ProductsCarouselGroup extends BlockHeaderGroup {
  products$: Observable<Product[]>
}

interface ProductsCarouselData {
  abort$: Subject<void>
  loading: boolean
  products: Product[]
  groups: ProductsCarouselGroup[]
}

@Component({
  selector: 'app-home',
  templateUrl: './page-home-one.component.html',
  styleUrls: ['./page-home-one.component.scss'],
})

export class PageHomeOneComponent implements OnInit, OnDestroy {
  destroy$: Subject<void> = new Subject<void>()
  bestsellers$!: Observable<Product[]>
  brands$!: Observable<Brand[]>
  popularCategories$!: Observable<Category[]>

  columnTopRated$!: Observable<Product[]>
  columnSpecialOffers$!: Observable<Product[]>
  columnBestsellers$!: Observable<Product[]>

  posts = posts
  shopCategoriesTree: any
  shopCategoriesList: any
  featuredProducts!: ProductsCarouselData
  bestSale!: ProductsCarouselData
  latestProducts!: ProductsCarouselData
  cartItems: any

  constructor(
    private shop: ShopService,
    private http: HttpClient,
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
    this.featuredProducts = {
      abort$: new Subject<void>(),
      loading: false,
      products: [],
      groups: <any>[],
    }
    this.bestSale = {
      abort$: new Subject<void>(),
      loading: false,
      products: [],
      groups: <any>[],
    }
    this.latestProducts = {
      abort$: new Subject<void>(),
      loading: false,
      products: [],
      groups: <any>[],
    }
    const shopCategoriesDef: any = []
    ;[this.shopCategoriesTree, this.shopCategoriesList] = this.walkTree(
      'shop',
      shopCategoriesDef,
    )

    // this.bestsellers$ = this.shop.getBestsellers(7);
    // this.brands$ = this.shop.getPopularBrands();
    // this.popularCategories$ = this.shop.getCategoriesBySlug([
    //     'power-tools',
    //     'hand-tools',
    //     'machine-tools',
    //     'power-machinery',
    //     'measurement',
    //     'clothes-and-ppe',
    // ], 1);

    // this.columnTopRated$ = this.shop.getTopRated(3);
    // this.columnSpecialOffers$ = this.shop.getSpecialOffers(3);
    // this.columnBestsellers$ = this.shop.getBestsellers(3);

    // this.featuredProducts = {
    //     abort$: new Subject<void>(),
    //     loading: false,
    //     products: [],
    //     groups: [
    //         {
    //             name: 'All',
    //             current: true,
    //             products$: this.shop.getFeaturedProducts(null, 8),
    //         },
    //         {
    //             name: 'Power Tools',
    //             current: false,
    //             products$: this.shop.getFeaturedProducts('power-tools', 8),
    //         },
    //         {
    //             name: 'Hand Tools',
    //             current: false,
    //             products$: this.shop.getFeaturedProducts('hand-tools', 8),
    //         },
    //         {
    //             name: 'Plumbing',
    //             current: false,
    //             products$: this.shop.getFeaturedProducts('plumbing', 8),
    //         },
    //     ],
    // };
    // console.log('featured', this.featuredProducts)
    // this.groupChange(this.featuredProducts, this.featuredProducts.groups[0]);

    // this.latestProducts = {
    //     abort$: new Subject<void>(),
    //     loading: false,
    //     products: [],
    //     groups: [
    //         {
    //             name: 'All',
    //             current: true,
    //             products$: this.shop.getLatestProducts(null, 8),
    //         },
    //         {
    //             name: 'Power Tools',
    //             current: false,
    //             products$: this.shop.getLatestProducts('power-tools', 8),
    //         },
    //         {
    //             name: 'Hand Tools',
    //             current: false,
    //             products$: this.shop.getLatestProducts('hand-tools', 8),
    //         },
    //         {
    //             name: 'Plumbing',
    //             current: false,
    //             products$: this.shop.getLatestProducts('plumbing', 8),
    //         },
    //     ],
    // };
    // this.groupChange(this.latestProducts, this.latestProducts.groups[0]);
  }
  dashBoard() {
    this.dashboardAPI().subscribe((response) => {  
      if (response && response.data) {
        this.bestsellers$ = this.getProducts({
          products: response.data,
          category: 'Best Seller',
          limit: 200,
        })
        this.columnBestsellers$ = this.getProducts({
          products: response.data,
          category: 'Best Seller',
          limit: 3,
        })

        this.bestSale = this.getFeaturedProducts({
          products: response.data,
          category: 'Best Seller',
          limit: 2000,
        })
        this.groupChange(this.bestSale, this.bestSale.groups[0])

        this.featuredProducts = this.getFeaturedProducts({
          products: response.data,
          category: 'Featured',
          limit: 8,
        })
        this.groupChange(this.featuredProducts, this.featuredProducts.groups[0])
        this.latestProducts = this.getFeaturedProducts({
          products: response.data,
          category: 'New Arrivals',
          limit: 8,
        })
        this.groupChange(this.latestProducts, this.latestProducts.groups[0])
        let [popularCategories, subCategories]: any = this.getPopularProducts({
          products: response.data,
          category: 'Most Popular',
        })
        ;[this.shopCategoriesTree, this.shopCategoriesList] = this.walkTree(
          'shop',
          popularCategories,
        )
        this.popularCategories$ = this.getCategoriesBySlug(subCategories, 1)
      }
    })
  }
  limitDepth(categories: any, depth: number): any {
    return categories.map((category: any) => {
      return {
        ...category,
        parents: null,
        children:
          depth !== 0
            ? this.limitDepth(category.children || [], depth - 1)
            : null,
      }
    })
  }
  getShopCategoriesBySlugs(
    slugs: string[],
    depth: number = 0,
  ): Observable<any> {
    return of(
      this.limitDepth(
        this.shopCategoriesList.filter((x: any) => slugs.includes(x.slug)),
        depth,
      ),
    )
  }
  getCategoriesBySlug(slugs: string[], depth: number = 0): Observable<any> {
    return this.getShopCategoriesBySlugs(slugs, depth)
  }
  walkTree(
    categoriesType: 'shop' | 'blog',
    categoriesDef: any,
    parents: any = [],
  ): [[], []] {
    let lastCategoryId = 0
    let list: any = []
    const tree: any = categoriesDef.map((categoryDef: any) => {
      const category: Category = {
        id: ++lastCategoryId,
        type: categoriesType,
        name: categoryDef.name,
        slug: categoryDef.slug,
        path: [...parents.map((x: any) => x.slug), categoryDef.slug].join('/'),
        image: categoryDef.image || null,
        items: categoryDef.items || 0,
        customFields: {},
        parents: parents.slice(),
        children: [],
      }

      const [childrenTree, childrenList] = this.walkTree(
        categoriesType,
        categoryDef.children || [],
        [...parents, category],
      )

      category.children = childrenTree
      list = [...list, category, ...childrenList]

      return category
    })

    return [tree, list]
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
        console.log(product.MaxSelection);
        let productObj: any = {
          id: product.$id,
          name: product.BannerName,
          sku: '83690/32',
          SkuKey: product.SkuKey ? product.SkuKey : '',
          slug: product.BannerName.replace(/\s+/g, '').toLowerCase(),
          price: product.SalesPrice ? product.SalesPrice : 0,
          mrp: product.MRP ? product.MRP : 0,
          compareAtPrice: product.compareAtPrice || null,
          images: [product.BannerImage] ? [product.BannerImage].slice() : [],
          badges: 'new',
          rating: product.Rating,
          reviews: product.reviews || 12,
          availability: 'in-stock',
          brand: 'brandix',
          categories: [product.ProductCategoryName],
          attributes: [],
          maxqty:product.MaxSelection
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
  getPopularProducts(data: any): any {
    let popularProducts: any = []
    let allSubCategories: any = []
    let category = data.category
    let products = data.products
    products = _.find(products, (dt) => {
      return _.isEqual(dt.GroupName, category)
    })
    let categories = _.uniq(
      _.map(products.LstDisplayDetail, 'ProductCategoryName'),
    )
    categories.forEach((category: any) => {
      let categoryProducts = _.filter(products.LstDisplayDetail, (product) => {
        return _.isEqual(product.ProductCategoryName, category)
      })
      let subCategories = _.uniq(
        _.map(categoryProducts, 'ProductSubCategoryName'),
      )

      let subCategoryArr: any = []
      subCategories.forEach((subCategory: any) => {
        let image = 'assets/images/categories/category-1.jpg'
        let subCategoryProductsArr: any = []
        let subCategoryProducts = _.filter(categoryProducts, (product) => {
          return _.isEqual(product.ProductSubCategoryName, subCategory)
        })
        subCategoryProducts.forEach((subCategoryProduct: any) => {
          image = encodeURI(subCategoryProduct.BannerImage)
          subCategoryProductsArr.push({
            name: subCategoryProduct.BannerName,
            slug: subCategoryProduct.BannerName.toLowerCase().replace(
              /\s/g,
              '',
            ),
            items: 10,
          })
        })
        subCategoryArr.push({
          name: subCategory,
          slug: subCategory.toLowerCase().replace(/\s/g, ''),
          image: image,
          items: 370,
          children: subCategoryProductsArr,
        })
        allSubCategories.push(subCategory.toLowerCase().replace(/\s/g, ''))
      })
      popularProducts.push({
        name: category,
        slug: category.toLowerCase().replace(/\s/g, ''),
        items: 272,
        children: subCategoryArr,
      })
    })
    return [popularProducts, allSubCategories]
  }
  getCategoryProducts(data: any): Observable<any> {
    let products = data.products
    let updatedProducts: any = []
    if (products && Array.isArray(products) && !_.isEmpty(products)) { 
      products.forEach((product: any) => {
        let productObj: any = {
          id: product.$id,
          name: product.BannerName,
          sku: '83690/32',
          stock:product.AllowToAdd,
          SkuKey: product.SkuKey ? product.SkuKey : '',
          slug: product.BannerName.replace(/\s+/g, '').toLowerCase(),
          price: product.SalesPrice ? product.SalesPrice : 0,
          mrp: product.MRP ? product.MRP : 0,
          compareAtPrice: product.compareAtPrice || null,
          images: [product.BannerImage] ? [product.BannerImage].slice() : [],
          badges: 'new',
          rating: product.Rating,
          reviews: product.reviews || 12,
          availability: product.AllowToAdd?'in-stock':'out-of-stock',
          brand: 'brandix',
          categories: [product.ProductCategoryName],
          attributes: [],
          maxqty:product.MaxSelection
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
                maxqty:cart.MaxSelection,
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
  getFeaturedProducts(data: any) {
    let category = data.category
    let products = data.products
    products = _.find(products, (dt) => {
      return _.isEqual(dt.GroupName, category)
    })
    let featuredObj = {
      abort$: new Subject<void>(),
      loading: false,
      products: [],
      groups: <any>[],
    }
    if (products && !_.isEmpty(products)) {
      let categories = _.uniq(
        _.map(products.LstDisplayDetail, 'ProductCategoryName'),
      )
      let allProd = this.getCategoryProducts({
        products: products.LstDisplayDetail,
      })
      let groups = [{ name: 'All', current: true, products$: allProd }]
      categories.forEach((category: any) => {
        let categoryProducts = _.filter(
          products.LstDisplayDetail,
          (product) => {
            return _.isEqual(product.ProductCategoryName, category)
          },
        )
        let products$ = this.getCategoryProducts({ products: categoryProducts })
        groups.push({ name: category, current: false, products$: products$ })
      })
      featuredObj['groups'] = groups
    }
    return featuredObj
  }
  dashboardAPI(): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/WEB/PosDashBoardGet_WEB`,
      JSON.stringify({}),
    )
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
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
