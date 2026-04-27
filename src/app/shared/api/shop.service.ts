import { EventEmitter, Injectable } from '@angular/core'

import { Observable, of, throwError, timer } from 'rxjs'
import { catchError, tap, mergeMap } from 'rxjs/operators'
import { Category } from '../interfaces/category'
import { HttpClient } from '@angular/common/http'
import { Brand } from '../interfaces/brand'
import { Product } from '../interfaces/product'
import { ProductsList } from '../interfaces/list'
import { map } from 'rxjs/operators'
import { environment } from '../../../environments/environment'
import { HttpErrorResponse } from '@angular/common/http'
import { PageCategoryService } from '../../modules/shop/services/page-category.service'
import {
  CategoryFilterItem,
  CheckFilter,
  ColorFilter,
  ColorFilterItem,
  Filter,
  FilterItem,
  RadioFilter,
} from '../interfaces/filter'
import { CartService } from '../../shared/services/cart.service'

import * as _ from 'lodash'

import { SerializedFilterValues } from '../interfaces/filter'
import {
  getBestsellers,
  getFeatured,
  getLatestProducts,
  getProduct,
  getRelatedProducts,
  getSpecialOffers,
  getTopRated,
  getShopCategoriesBySlugs,
  getShopCategoriesTree,
  getShopCategory,
  getBrands,
  getProductsList,
} from '../../../fake-server'
import { getSuggestions } from 'src/fake-server/database/products'

export interface ListOptions {
  page?: number
  limit?: number
  sort?: string
  filterValues?: SerializedFilterValues
}
interface ProductsForFilterValuesResult {
  [filterValueSlug: string]: number
}
interface FilterDef {
  type: Filter['type']
  slug: string
  name: string
}
interface FilterListValueDef {
  slug: string
  name: string
}
type FilterValueDef = number | FilterListValueDef[]

var attributesDef: any = []
@Injectable({
  providedIn: 'root',
})
export class ShopService {
  cartItems: any

  // noinspection JSUnusedLocalSymbols
  constructor(
    private cart: CartService,
    private http: HttpClient, // private pageService: PageCategoryService,
  ) {
    let customerKey = localStorage.getItem('CustomerMasterKey')
    if (customerKey) {
      this.getCartItems(customerKey).subscribe((response) => {
        this.cartItems = response;
      })
    } else {
      const cartItemsStr = localStorage.getItem('cartItems')
      if (cartItemsStr) {
        this.cartItems = JSON.parse(cartItemsStr)
      }
    }
  }
  optionsChange$: EventEmitter<ListOptions> = new EventEmitter<ListOptions>()

  shopCategoriesList: any = []
  shopCategoriesTree: any = []
  lastProductId = 0
  brands: any = []
  productsTable: any = []
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
  getProducts(data: any): any {
    let category = data.category
    let limit = data.limit
    let products = data.products
    let updatedProducts: any = []
    if (products && !_.isEmpty(products)) {
      products.forEach((product: any) => {
        let badges: string[] = []

        if (product.badges) {
          badges =
            typeof product.badges === 'string'
              ? [product.badges]
              : product.badges
        }

        let categories: any = []
        if (product.categories) {
          categories = this.shopCategoriesList
            .filter((x: any) => product.categories.includes(x.slug))
            .map((x: any) => ({
              ...x,
              parents: null,
              children: null,
            }))
        }

        const attributes: any[] = (product.attributes || [])
          .map((productAttributeDef: any) => {
            const attributeDef = attributesDef.find(
              (x: any) => x.slug === productAttributeDef.slug,
            )

            if (!attributeDef) {
              return null
            }

            let valuesDef: string[] = []

            if (typeof productAttributeDef.values === 'string') {
              valuesDef = [productAttributeDef.values]
            } else if (productAttributeDef.values) {
              valuesDef = productAttributeDef.values
            }

            const values: any[] = valuesDef
              .map((valueSlug) => {
                const valueDef = attributeDef.values.find(
                  (x: any) => x.slug === valueSlug,
                )

                if (!valueDef) {
                  return null
                }

                return {
                  ...valueDef,
                  customFields: {},
                }
              })
              .filter((x) => x !== null) as any[]

            if (!values.length) {
              return null
            }

            return {
              name: attributeDef.name,
              slug: attributeDef.slug,
              featured: !!productAttributeDef.featured,
              values,
              customFields: {},
            }
          })
          .filter((x: any) => x !== null) as any[]
        let sku: any =
          product.LstSKU &&
          Array.isArray(product.LstSKU) &&
          product.LstSKU.length &&
          _.first(product.LstSKU)
            ? _.first(product.LstSKU)
            : {}
  
        let productObj:any = {
          id: product.$id,
          name: product.ProductName,
          sku: sku.SkuName,
          ProductKey: product.ProductKey ? product.ProductKey : '',
          SkuKey: sku.SkuKey
            ? sku.SkuKey
            : product.SkuKey
            ? product.SkuKey
            : '',
          slug: product.ProductName.replace(/\s+/g, '').toLowerCase(),
          price: product.SalesPrice
            ? product.SalesPrice
            : sku.MRP
            ? sku.MRP
            : 0,
          SalesPrice: product.SalesPrice
            ? product.SalesPrice
            : sku.MRP
            ? sku.MRP
            : 0,
          mrp: product.MRP ? product.MRP : 0,
          compareAtPrice: product.compareAtPrice || null,
          images: sku.SKUImage
            ? [sku.SKUImage].slice()
            : product.ProductSmallImage
            ? [product.ProductSmallImage].slice()
            : [],
          badges: badges.slice(),
          rating: product.Rating,
          maxqty:product.MaxSelection,
          reviews: product.reviews || 12,
          availability: product.Stock>0?'in-stock':'out-of-stock',
          stock:product.Stock,
          brand: 'brandix',
          categories,
          attributes,
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
    return updatedProducts
  }
  /**
   * Returns category object by slug.
   *
   * @param slug - Unique human-readable category identifier.
   */
  getCategory(slug: string, subcategorySlug?: string): Observable<any> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/shop/categories/power-tools.json
     *
     * where:
     * - power-tools = slug
     */
    // return this.http.get<Category>(`https://example.com/api/shop/categories/${slug}.json`);

    // This is for demonstration purposes only. Remove it and use the code above.
    return this.http
      .post(
        `${environment.apiUrl}/POS/ProductCatAndSubCatGet`,
        JSON.stringify({}),
      )
      .pipe(
        mergeMap((response: any, index): any => {
          if (response && response.data) {
            let [allCategories, subCategories]: any = this.getAllCategories({
              products: response.data,
            })
            ;[this.shopCategoriesTree, this.shopCategoriesList] = this.walkTree(
              'shop',
              allCategories,
            )
          }
          return this.getShopCategory(slug, subcategorySlug)
        }),
      )
    // return this.getShopCategory(slug);
  }
  getAllCategories(data: any): any {
    let allCategories: any = []
    let allSubCategories: any = []
    let categories = data.products
    categories.forEach((category: any) => {
      let subCategories = category.LstCategoryDetail

      let subCategoryArr: any = []
      subCategories.forEach((subCategory: any) => {
        let subCategoryProductsArr: any = []
        let subCategoryProducts = subCategory.LstProduct
        subCategoryProducts.forEach((subCategoryProduct: any) => {
          subCategoryProductsArr.push({
            name: subCategoryProduct.ProductName,
            slug: subCategoryProduct.ProductName.toLowerCase().replace(
              /\s/g,
              '',
            ),
            items: 10,
          })
        })
        subCategoryArr.push({
          name: subCategory.SubCategoryName,
          slug: subCategory.SubCategoryName.toLowerCase().replace(/\s/g, ''),
          image: '',
          items: subCategoryProducts.length,
          children: subCategoryProductsArr,
        })
        allSubCategories.push(
          subCategory.SubCategoryName.toLowerCase().replace(/\s/g, ''),
        )
      })
      allCategories.push({
        name: category.CategoryName,
        slug: category.CategoryName.toLowerCase().replace(/\s/g, ''),
        items: 272,
        children: subCategoryArr,
      })
    })
    return [allCategories, allSubCategories]
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
  getShopCategory(
    slug: string,
    subcategorySlug?: string,
  ): Observable<Category> {
    if (!slug || slug == 'selectall') {
      let firstLevelCategories = _.filter(
        this.shopCategoriesList,
        (category) => {
          return (
            category.children &&
            category.children.length &&
            !category.path.includes('/')
          )
        },
      )
      return of(
        JSON.parse(
          JSON.stringify({
            ...{
              id: 1,
              image: null,
              name: 'All Products',
              path: 'selectall',
              slug: 'selectall',
              type: 'shop',
            },
            parents: this.limitDepth([], 0),
            children: this.limitDepth(firstLevelCategories || [], 0),
          }),
        ),
      )
    } else {
      let category = this.shopCategoriesList.find((x: any) => x.slug === slug)
      if (subcategorySlug && category.children) {
        category = category.children.find(
          (x: any) => x.slug === subcategorySlug,
        )
      }
      if (!category) {
        return throwError(
          new HttpErrorResponse({ status: 404, statusText: 'Page Not Found' }),
        )
      }
      return of(
        JSON.parse(
          JSON.stringify({
            ...category,
            parents: this.limitDepth(category.parents || [], 0),
            children: this.limitDepth(category.children || [], 0),
          }),
        ),
      )
    }
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
  // getCategory(slug: string): Observable<Category> {
  //     /**
  //      * This is what your API endpoint might look like:
  //      *
  //      * https://example.com/api/shop/categories/power-tools.json
  //      *
  //      * where:
  //      * - power-tools = slug
  //      */
  //     // return this.http.get<Category>(`https://example.com/api/shop/categories/${slug}.json`);

  //     // This is for demonstration purposes only. Remove it and use the code above.
  //     return getShopCategory(slug);
  // }
  dashboardAPI(): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/POS/ProductCatAndSubCatGet`,
      JSON.stringify({}),
    )
  }
  getProductsForCategory(slug: any): Observable<any> {
    slug = slug ? slug : 'selectall'
    var formData: any = new FormData()
    formData.append('CategoryName', slug)
    formData.append('SentType', 'category')
    return this.http.post(
      `${environment.apiUrl}/WEB/ProductDisplayByCategory_WEB`,
      formData,
    )
  }

  /**
   * Returns a category tree.
   *
   * @param parent - If a parent is specified then its descendants will be returned.
   * @param depth  - Maximum depth of category tree.
   */
  getCategories(
    parent: Partial<Category> | null = null,
    depth: number = 0,
  ): Observable<Category[]> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/shop/categories.json?parent=latest-news&depth=1
     *
     * where:
     * - parent = parent.slug
     * - depth  = depth
     */
    // const params: {[param: string]: string} = {
    //     parent: parent.slug,
    //     depth: depth.toString(),
    // };
    //
    // return this.http.get<Category[]>('https://example.com/api/shop/categories.json', {params});

    // This is for demonstration purposes only. Remove it and use the code above.
    return getShopCategoriesTree(parent ? parent.slug : null, depth)
  }

  /**
   * Returns an array of the specified categories.
   *
   * @param slugs - Array of slugs.
   * @param depth - Maximum depth of category tree.
   */
  getCategoriesBySlug(
    slugs: string[],
    depth: number = 0,
  ): Observable<Category[]> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/shop/categories.json?slugs=power-tools,measurement&depth=1
     *
     * where:
     * - slugs = slugs.join(',')
     * - depth = depth
     */
    // const params: {[param: string]: string} = {
    //     slugs: slugs.join(','),
    //     depth: depth.toString(),
    // };
    //
    // return this.http.get<Category[]>('https://example.com/api/shop/categories.json', {params});

    // This is for demonstration purposes only. Remove it and use the code above.
    return getShopCategoriesBySlugs(slugs, depth)
  }

  /**
   * Returns paginated products list.
   * If categorySlug is null then a list of all products should be returned.
   *
   * @param categorySlug         - Unique human-readable category identifier.
   * @param options              - Options.
   * @param options.page         - Page number (optional).
   * @param options.limit        - Maximum number of items returned at one time (optional).
   * @param options.sort         - The algorithm by which the list should be sorted (optional).
   * @param options.filterValues - An object whose keys are filter slugs and values ​​are filter values (optional).
   */
  getProductsList(
    categorySlug: string | null,
    subcategorySlug: string | null,
    options: ListOptions,
  ): Observable<any> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/products.json?category=screwdriwers&page=2&limit=12&sort=name_desc&filter_price=500-1000
     *
     * where:
     * - category     = categorySlug
     * - page         = options.page
     * - limit        = options.limit
     * - sort         = options.sort
     * - filter_price = options.filterValues.price
     */
    // const params: {[param: string]: string} = {};
    //
    // if (categorySlug) {
    //     params.category = categorySlug;
    // }
    // if ('page' in options) {
    //     params.page = options.page.toString();
    // }
    // if ('limit' in options) {
    //     params.limit = options.limit.toString();
    // }
    // if ('sort' in options) {
    //     params.sort = options.sort;
    // }
    // if ('filterValues' in options) {
    //     Object.keys(options.filterValues).forEach(slug => params[`filter_${slug}`] = options.filterValues[slug]);
    // }
    //
    // return this.http.get<ProductsList>('https://example.com/api/products.json', {params});
    // this.getProductsForCategory(categorySlug).get().flatMap((res1: any) => this.serviceB.get()).
    //     subscribe((response: any) => {
    //         if (response && response.data) {
    //             let cat: any = response.data.LstCatAndub && Array.isArray(response.data.LstCatAndub) && _.first(response.data.LstCatAndub) ? _.first(response.data.LstCatAndub) : {};
    //             let products = cat && cat.LstProduct && Array.isArray(cat.LstProduct) && cat.LstProduct.length ? cat.LstProduct : [];

    //             this.productsTable = this.getProducts({ products: products });
    //         }
    //     });
    this.getCategory('').subscribe()
    categorySlug = categorySlug ? categorySlug : 'selectall'
    var formData: any = new FormData()

    if (subcategorySlug) {
      formData.append('CategoryName', subcategorySlug)
      formData.append('SentType', 'subcategory')
    } else {
      formData.append('CategoryName', categorySlug)
      formData.append('SentType', 'category')
    }

    return this.http
      .post(`${environment.apiUrl}/WEB/ProductDisplayByCategory_WEB`, formData)
      .pipe(
        mergeMap((response: any, index): any => {  
          if (response && response.data) {
            let cat: any =
              response.data.LstCatAndub &&
              Array.isArray(response.data.LstCatAndub) &&
              _.first(response.data.LstCatAndub)
                ? _.first(response.data.LstCatAndub)
                : {}
            let products =
              cat &&
              cat.LstProduct &&
              Array.isArray(cat.LstProduct) &&
              cat.LstProduct.length
                ? cat.LstProduct
                : []

            this.productsTable = this.getProducts({ products: products })
          }
          return this.getProductsListServer(
            categorySlug,
            subcategorySlug,
            options,
          )
        }),
      )

    // This is for demonstration purposes only. Remove it and use the code above.
    // return this.getProductsListServer(categorySlug, options);
  }
  getProductUpdatedFormat(product: any): Observable<any> {
    if (!product) {
      return throwError(
        new HttpErrorResponse({ status: 404, statusText: 'Page Not Found' }),
      )
    }
    let badges: string[] = []

    if (product.badges) {
      badges =
        typeof product.badges === 'string' ? [product.badges] : product.badges
    }

    let categories: any = []
    if (product.categories) {
      categories = this.shopCategoriesList
        .filter((x: any) => product.categories.includes(x.slug))
        .map((x: any) => ({
          ...x,
          parents: null,
          children: null,
        }))
    }

    const attributes: any[] = (product.attributes || [])
      .map((productAttributeDef: any) => {
        const attributeDef = attributesDef.find(
          (x: any) => x.slug === productAttributeDef.slug,
        )

        if (!attributeDef) {
          return null
        }

        let valuesDef: string[] = []

        if (typeof productAttributeDef.values === 'string') {
          valuesDef = [productAttributeDef.values]
        } else if (productAttributeDef.values) {
          valuesDef = productAttributeDef.values
        }

        const values: any[] = valuesDef
          .map((valueSlug) => {
            const valueDef = attributeDef.values.find(
              (x: any) => x.slug === valueSlug,
            )

            if (!valueDef) {
              return null
            }

            return {
              ...valueDef,
              customFields: {},
            }
          })
          .filter((x) => x !== null) as any[]

        if (!values.length) {
          return null
        }

        return {
          name: attributeDef.name,
          slug: attributeDef.slug,
          featured: !!productAttributeDef.featured,
          values,
          customFields: {},
        }
      })
      .filter((x: any) => x !== null) as any[]
    let relatedProducts: any = []
    if (product.LstProduct && Array.isArray(product.LstProduct))  {  
      relatedProducts = product.LstProduct.map((relatedproduct: any) => {
        return {
          id: relatedproduct.$id,
          name: relatedproduct.SkuName,
          sku: relatedproduct.SkuName,
          slug: relatedproduct.SkuName.replace(/\s+/g, '').toLowerCase(),
          SkuKey: relatedproduct.SkuKey ? relatedproduct.SkuKey : '',
          price: relatedproduct.SalesPrice
            ? relatedproduct.SalesPrice
            : relatedproduct.SalesPrice
            ? relatedproduct.SalesPrice
            : 0,
          SalesPrice: relatedproduct.SalesPrice
            ? relatedproduct.SalesPrice
            : relatedproduct.SalesPrice
            ? relatedproduct.SalesPrice
            : 0,
          mrp: relatedproduct.MRP ? relatedproduct.MRP : 0,
          compareAtPrice: relatedproduct.compareAtPrice || null,
          images: relatedproduct.LstImage
            ? relatedproduct.LstImage.slice()
            : [],
          badges: badges.slice(),
          rating: relatedproduct.Rating,
          reviews: relatedproduct.reviews || 12,
          availability: relatedproduct.Stock > 0 ? 'in-stock' : 'out-of-stock',
          brand: 'brandix',
          categories: [],
          attributes: [],
        }
        return
      })
    }
    let productObj:any = {
      id: product.$id,
      name: product.SkuName,
      description: product.ProductDescription ? product.ProductDescription : '',
      sku: product.SkuName,
      slug: product.SkuName.replace(/\s+/g, '').toLowerCase(),
      category: product.Category,
      category_slug: product.Category.replace(/\s+/g, '').toLowerCase(),
      subCategory: product.SubCategory,
      subCategory_slug: product.SubCategory.replace(/\s+/g, '').toLowerCase(),
      price: product.SalesPrice ? product.SalesPrice : 0,
      mrp: product.MRP ? product.MRP : 0,
      compareAtPrice: product.compareAtPrice || null,
      images: product.LstImage ? product.LstImage.slice() : [],
      badges: badges.slice(),
      rating: product.Rating,
      reviews: product.reviews || 12,
      availability: product.Stock > 0 ? 'in-stock' : 'out-of-stock',
      brand: 'brandix',
      categories,
      attributes,
      relatedProducts: relatedProducts,
      SkuKey: product['SkuKey'],
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
    return of(JSON.parse(JSON.stringify(productObj)))
  }
  getProduct(productSlug: string): Observable<any> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/products/electric-planer-brandix-kl370090g-300-watts.json
     *
     * where:
     * - electric-planer-brandix-kl370090g-300-watts = productSlug
     */
    // return this.http.get<Product>(`https://example.com/api/products/${productSlug}.json`);
    productSlug = productSlug ? productSlug : 'Nescafe Gold Coffee 200Gm'
    // productSlug = "Nescafe Gold Coffee 200Gm";
    var formData: any = new FormData()
    formData.append('SkuName', productSlug)
    return this.http
      .post(`${environment.apiUrl}/WEB/ProductSKuDataGet_WEB`, formData)
      .pipe(
        mergeMap((response: any, index): any => {
          let product = response && response.data ? response.data : {}
          return this.getProductUpdatedFormat(product)
        }),
      )
    // This is for demonstration purposes only. Remove it and use the code above.
    // return this.getProductUpdatedFormat(productSlug);
  }

  /**
   * Returns popular brands.
   */
  getPopularBrands(): Observable<Brand[]> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/shop/brands/popular.json
     */
    // return this.http.get<Brand[]>('https://example.com/api/shop/brands/popular.json');

    // This is for demonstration purposes only. Remove it and use the code above.
    return getBrands()
  }
  getBestsellers(limit: number | null = null): Observable<any> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/shop/products/bestsellers.json?limit=3
     *
     * where:
     * - limit = limit
     */
    // const params: {[param: string]: string} = {};
    //
    // if (limit) {
    //     params.limit = limit.toString();
    // }
    //
    // return this.http.get<Product[]>('https://example.com/api/shop/products/bestsellers.json', {params});
    // This is for demonstration purposes only. Remove it and use the code above.
    return getBestsellers(limit)
  }

  getTopRated(limit: number | null = null): Observable<Product[]> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/shop/products/top-rated.json?limit=3
     *
     * where:
     * - limit = limit
     */
    // const params: {[param: string]: string} = {};
    //
    // if (limit) {
    //     params.limit = limit.toString();
    // }
    //
    // return this.http.get<Product[]>('https://example.com/api/shop/products/top-rated.json', {params});

    // This is for demonstration purposes only. Remove it and use the code above.
    return getTopRated(limit)
  }

  getSpecialOffers(limit: number | null = null): Observable<Product[]> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/shop/products/special-offers.json?limit=3
     *
     * where:
     * - limit = limit
     */
    // const params: {[param: string]: string} = {};
    //
    // if (limit) {
    //     params.limit = limit.toString();
    // }
    //
    // return this.http.get<Product[]>('https://example.com/api/shop/products/special-offers.json', {params});

    // This is for demonstration purposes only. Remove it and use the code above.
    return getSpecialOffers(limit)
  }

  getFeaturedProducts(
    categorySlug: string | null = null,
    limit: number | null = null,
  ): Observable<any> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/shop/products/featured.json?category=screwdrivers&limit=3
     *
     * where:
     * - category = categorySlug
     * - limit    = limit
     */
    // const params: {[param: string]: string} = {};
    //
    // if (category) {
    //     params.category = category;
    // }
    // if (limit) {
    //     params.limit = limit.toString();
    // }
    //
    // return this.http.get<Product[]>('https://example.com/api/shop/products/featured.json', {params});
    // return this.http.post(`${environment.apiUrl}/WEB/PosDashBoardGet_WEB`, JSON.stringify({}));
    // This is for demonstration purposes only. Remove it and use the code above.
    return getFeatured(categorySlug, limit)
  }

  getLatestProducts(
    categorySlug: string | null = null,
    limit: number | null = null,
  ): Observable<Product[]> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/shop/products/latest.json?category=screwdrivers&limit=3
     *
     * where:
     * - category = categorySlug
     * - limit    = limit
     */
    // const params: {[param: string]: string} = {};
    //
    // if (category) {
    //     params.category = category;
    // }
    // if (limit) {
    //     params.limit = limit.toString();
    // }
    //
    // return this.http.get<Product[]>('https://example.com/api/shop/products/latest.json', {params});

    // This is for demonstration purposes only. Remove it and use the code above.
    return getLatestProducts(categorySlug, limit)
  }

  getRelatedProducts(product: Partial<Product>): Observable<Product[]> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/shop/products/related.json?for=water-tap
     *
     * where:
     * - for = product.slug
     */
    // const params: {[param: string]: string} = {
    //     for: product.slug,
    // };
    //
    // return this.http.get<Product[]>('https://example.com/api/shop/products/related.json', {params});

    // This is for demonstration purposes only. Remove it and use the code above.
    return getRelatedProducts(product)
  }

  getSuggestions(
    query: string,
    limit: number,
    categorySlug: string | null = null,
    subCategorySlug?: string | null,
  ): Observable<any> {
    /**
     * This is what your API endpoint might look like:
     *
     * https://example.com/api/search/suggestions.json?query=screwdriver&limit=5&category=power-tools
     *
     * where:
     * - query = query
     * - limit = limit
     * - category = categorySlug
     */
    // const params: {[param: string]: string} = {query, limit: limit.toString()};
    //
    // if (categorySlug) {
    //     params.category = categorySlug;
    // }
    //
    // return this.http.get<Product[]>('https://example.com/api/search/suggestions.json', {params});
    var formData: any = new FormData()
    formData.append('Criteria', query)
    if (categorySlug) {
      formData.append('categoryName', categorySlug)
    }
    if (subCategorySlug) {
      formData.append('subCatName', subCategorySlug)
    }
    const params: { [param: string]: string } = {
      query,
      limit: limit.toString(),
    }

    if (categorySlug) {
      params.category = categorySlug
    }

    return this.http.post(
      `${environment.apiUrl}/WEB/POS_ProductSearch_WEB`,
      formData,
    )
    // This is for demonstration purposes only. Remove it and use the code above.
    // return getSuggestions(query, limit, categorySlug)
  }
  getProductsListServer(
    categorySlug: string | null,
    subCategorySlug: string | null,
    options: ListOptions,
  ): Observable<any> {
    const page = options.page || 1
    const limit = options.limit || 12
    const sort = options.sort || 'default'
    const filterValues = options.filterValues || {}
    const filters: Filter[] = []
    const filtersDef: FilterDef[] = [
      { type: 'range', slug: 'price', name: 'Price' },
      // {type: 'check', slug: 'brand', name: 'Brand'},
      // {type: 'radio', slug: 'discount', name: 'With Discount'},
      // {type: 'color', slug: 'color', name: 'Color'},
    ]

    let items = this.productsTable.slice()

    // Make filters.
    if (categorySlug === null) {
      filters.push({
        type: 'categories',
        slug: 'categories',
        name: 'Categories',
        root: true,
        items: [
          ...this.shopCategoriesTree.map((x: any) =>
            this.makeCategoryFilterItem('child', x),
          ),
        ],
      })
    } else {
      let category: any = {}
      if (categorySlug == 'selectall') {
        let firstLevelCategories = _.filter(
          this.shopCategoriesList,
          (category) => {
            return (
              category.children &&
              category.children.length &&
              !category.path.includes('/')
            )
          },
        )
        category = {
          ...{
            id: 1,
            image: null,
            name: 'All Products',
            path: 'selectall',
            slug: 'selectall',
            type: 'shop',
          },
          parents: this.limitDepth([], 0),
          children: this.limitDepth(firstLevelCategories || [], 0),
        }
      } else {
        category = this.shopCategoriesList.find(
          (x: any) => x.slug === categorySlug,
        )
        if (subCategorySlug && category.children) {
          category = category.children.find(
            (x: any) => x.slug === subCategorySlug,
          )
        }
      }
      if (!category) {
        return throwError(
          new HttpErrorResponse({ status: 404, statusText: 'Page Not Found' }),
        )
      }

      filters.push({
        type: 'categories',
        slug: 'categories',
        name: 'Categories',
        root: false,
        items: [
          ...(category.parents || []).map((x: any) =>
            this.makeCategoryFilterItem('parent', x),
          ),
          this.makeCategoryFilterItem('current', category),
          ...(category.children || []).map((x: any) =>
            this.makeCategoryFilterItem('child', x),
          ),
        ],
      })
    }

    this.makeFilters(filtersDef, items).forEach((x) => filters.push(x))

    // Apply values to filters.
    filters.forEach((filter) => {
      if (filter.slug in filterValues && 'value' in filter) {
        filter.value = this.parseFilterValue(filter, filterValues[filter.slug])
      }
    })

    // Calculate items count for filter values.
    filters.forEach((filter) => {
      if (
        filter.type !== 'check' &&
        filter.type !== 'color' &&
        filter.type !== 'radio'
      ) {
        return
      }

      const counts = this.calcProductsForFilterValues(filter, filters, items)

      filter.items.forEach((item) => {
        if (item.slug in counts) {
          item.count = counts[item.slug]
        }
      })
    })

    // Apply filters to items list.
    items = items.filter((product: any) => {
      return filters.reduce<boolean>(
        (result, filter) => result && this.testProduct(filter, product),
        true,
      )
    })

    // Sort items array.
    items = items.sort((a: any, b: any) => {
      if (['name_asc', 'name_desc'].includes(sort)) {
        if (a.name === b.name) {
          return 0
        }

        return (a.name > b.name ? 1 : -1) * (sort === 'name_asc' ? 1 : -1)
      }

      return 0
    })

    // Preparing data for a response.
    const start = (page - 1) * limit
    const end = start + limit

    const total = items.length
    const pages = Math.ceil(total / limit)
    const from = (page - 1) * limit + 1
    const to = Math.max(Math.min(page * limit, total), from)

    items = items.slice(start, end)

    const response: ProductsList = {
      items,
      page,
      limit,
      total,
      pages,
      from,
      to,
      sort,
      filters,
      filterValues,
    }
    return timer(0).pipe(map(() => JSON.parse(JSON.stringify(response))))
    // return JSON.parse(JSON.stringify(response))
  }

  /**
   * Returns corresponding filter value from product object.
   *
   * @param type         - Filter type.
   * @param slug         - Filter slug.
   * @param product      - Product object.
   * @param defaultValue - Default value.
   */
  getFilterValue(
    type: 'range',
    slug: string,
    product: Product,
    defaultValue: number | null,
  ): number
  getFilterValue(
    type: 'check',
    slug: string,
    product: Product,
    defaultValue: FilterListValueDef[],
  ): FilterListValueDef[]
  getFilterValue(
    type: string,
    slug: string,
    product: Product,
    defaultValue: FilterValueDef | null = null,
  ): FilterValueDef | null {
    if (type === 'range' && slug === 'price') {
      return product.price
    } else if (type === 'check' && slug === 'brand') {
      if (product.brand && typeof product.brand === 'object') {
        return [{ slug: product.brand.slug, name: product.brand.name }]
      }
    } else if (type === 'check' && slug === 'discount') {
      const items = [{ slug: 'any', name: 'Any' }]

      if (product.compareAtPrice) {
        items.push({ slug: 'yes', name: 'Yes' })
      } else {
        items.push({ slug: 'no', name: 'No' })
      }

      return items
    } else if (type === 'check' || type === 'radio') {
      if (!('attributes' in product) || !Array.isArray(product.attributes)) {
        return defaultValue
      }

      const attribute = product.attributes.find((x) => x.slug === slug)

      if (!attribute) {
        return defaultValue
      }

      return attribute.values.map((x) => ({ slug: x.slug, name: x.name }))
    }

    return defaultValue
  }

  getRangeValue(
    slug: string,
    product: Product,
    defaultValue: number | null = null,
  ): number {
    return this.getFilterValue('range', slug, product, defaultValue)
  }

  getListValues(
    slug: string,
    product: Product,
    defaultValue: FilterListValueDef[] = [],
  ): FilterListValueDef[] {
    return this.getFilterValue('check', slug, product, defaultValue)
  }

  getColorCode(slug: string): string {
    switch (slug) {
      case 'white':
        return '#fff'
      case 'silver':
        return '#d9d9d9'
      case 'light-gray':
        return '#b3b3b3'
      case 'gray':
        return '#808080'
      case 'dark-gray':
        return '#666'
      case 'coal':
        return '#4d4d4d'
      case 'black':
        return '#262626'
      case 'red':
        return '#ff4040'
      case 'orange':
        return '#ff8126'
      case 'yellow':
        return '#ffd333'
      case 'pear-green':
        return '#becc1f'
      case 'green':
        return '#8fcc14'
      case 'emerald':
        return '#47cc5e'
      case 'shamrock':
        return '#47cca0'
      case 'shakespeare':
        return '#47cccc'
      case 'blue':
        return '#40bfff'
      case 'dark-blue':
        return '#3d6dcc'
      case 'violet':
        return '#7766cc'
      case 'purple':
        return '#b852cc'
      case 'cerise':
        return '#e53981'
    }

    return '#000'
  }

  parseFilterValue(filter: Filter, value: string): any {
    switch (filter.type) {
      case 'range':
        return value.split('-').map((x) => parseFloat(x))
      case 'check':
      case 'color':
        return value.trim() === '' ? [] : value.split(',').map((x) => x.trim())
    }

    return value
  }

  testProduct(filter: Filter, product: Product): boolean {
    if (filter.type === 'range') {
      const value = this.getRangeValue(filter.slug, product)

      if (
        value === null ||
        value < filter.value[0] ||
        value > filter.value[1]
      ) {
        return false
      }
    } else if (filter.type === 'check' || filter.type === 'color') {
      const values = this.getListValues(filter.slug, product)

      return (
        filter.value.length < 1 ||
        filter.value.reduce<boolean>((isMatched, value) => {
          return isMatched || !!values.find((x) => x.slug === value)
        }, false)
      )
    } else if (filter.type === 'radio') {
      const values = this.getListValues(filter.slug, product)

      return !!values.find((x) => x.slug === filter.value)
    }

    return true
  }

  calcProductsForFilterValues(
    filter: Filter,
    allFilters: Filter[],
    products: Product[],
  ): ProductsForFilterValuesResult {
    const result: ProductsForFilterValuesResult = {}

    products = products.filter((product) =>
      allFilters.reduce<boolean>((isMatched, eachFilter) => {
        return (
          isMatched &&
          (filter.slug === eachFilter.slug ||
            this.testProduct(eachFilter, product))
        )
      }, true),
    )

    products.forEach((product) => {
      switch (filter.type) {
        case 'check':
        case 'color':
        case 'radio':
          this.getListValues(filter.slug, product).forEach((value) => {
            if (!(value.slug in result)) {
              result[value.slug] = 0
            }

            result[value.slug] += 1
          })
          break
      }
    })

    return result
  }

  makeFilters(filtersDef: FilterDef[], products: Product[]): Filter[] {
    const result: Filter[] = []

    filtersDef.forEach((filterDef) => {
      const filterType = filterDef.type

      if (filterType === 'range') {
        let max = products.reduce(
          (value, product) =>
            Math.max(value, this.getRangeValue(filterDef.slug, product, value)),
          0,
        )
        let min = products.reduce(
          (value, product) =>
            Math.min(value, this.getRangeValue(filterDef.slug, product, value)),
          max,
        )
        /** Calculates the number of digits for rounding. */
        let digit = Math.max(Math.ceil(max).toString().length - 2, 1)

        digit = Math.pow(10, digit)
        max = Math.ceil(max / digit) * digit
        min = Math.floor(min / digit) * digit

        result.push({
          type: filterType,
          slug: filterDef.slug,
          name: filterDef.name,
          value: [min, max],
          // options
          min,
          max,
        })
      } else if (
        filterType === 'check' ||
        filterType === 'radio' ||
        filterType === 'color'
      ) {
        const itemsBySlug: { [slug: string]: FilterItem } = {}
        let items: FilterItem[] = []

        products.forEach((product) => {
          this.getListValues(filterDef.slug, product).forEach((value) => {
            if (value.slug in itemsBySlug) {
              return
            }

            const item: FilterItem = this.makeFilterItem(filterType, value)

            itemsBySlug[value.slug] = item
            items.push(item)
          })
        })

        if (items.length < 1 || (filterType === 'radio' && items.length < 2)) {
          return
        }

        items = this.sortFilterItems(filterType, filterDef.slug, items)

        result.push({
          type: filterType,
          slug: filterDef.slug,
          name: filterDef.name,
          value: filterType === 'radio' ? items[0].slug : [],
          items,
        } as CheckFilter | RadioFilter | ColorFilter)
      }
    })

    return result
  }

  makeFilterItem(
    filterType: 'check' | 'color' | 'radio',
    value: FilterListValueDef,
  ): FilterItem | ColorFilterItem {
    switch (filterType) {
      case 'check':
      case 'radio':
        return {
          slug: value.slug,
          name: value.name,
          count: 0,
        }
      case 'color':
        return {
          slug: value.slug,
          name: value.name,
          count: 0,
          color: this.getColorCode(value.slug),
        }
    }
  }

  makeCategoryFilterItem(
    type: 'parent' | 'current' | 'child',
    category: Category,
  ): CategoryFilterItem {
    return {
      slug: category.slug,
      name: category.name,
      type,
      category: { ...category, children: null, parents: null },
      count: category.items,
    }
  }

  sortFilterItems(
    filterType: string,
    filterSlug: string,
    items: FilterItem[],
  ): FilterItem[] {
    if (filterType === 'color' && filterSlug === 'color') {
      const attributeDef = attributesDef.find((x: any) => x.slug === filterSlug)

      if (attributeDef) {
        const values = attributeDef.values.map((x: any) => x.slug)

        return items.sort((a, b) => {
          return values.indexOf(a.slug) - values.indexOf(b.slug)
        })
      }
    }

    return items
  }
}
