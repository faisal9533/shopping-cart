import { Injectable } from '@angular/core'
import { Product } from '../interfaces/product'
import { Category } from '../interfaces/category'
import { Brand } from '../interfaces/brand'

@Injectable({
  providedIn: 'root',
})
export class RootService {
  constructor() {}

  home(): string {
    return '/'
  }

  shop(): string {
    return `/shop/catalog`
  }

  category(category: Partial<Category>): string {
    if (category.type === 'shop') {
      const basePath = this.shop()
      if ('slug' in category) {
        if (category.slug != category.path) {
          if (category.path) {
            let path = category?.path?.split('/')
            if (path && path.length == 2) {
              return `${basePath}/${category.path}`
            } else if (path && path.length == 3) {
              return `/shop/products/${category.slug}`
            } else {
              return basePath
            }
          } else {
            return basePath
          }
          //
        }
        return `${basePath}/${category.slug}`
      }
      if ('id' in category) {
        return `${basePath}/${category.id}`
      }

      throw Error('Provide category with "path", "slug" or "id".')
    }
    if (category.type === 'blog') {
      return this.blog()
    }

    throw Error('Provided category with unknown type.')
  }

  product(product: any): string {
    const basePath = '/shop/products'
    if (!('slug' in product) && (product.name || product.SkuName)) {
      let productName: any = product?.name || product?.SkuName
      product['slug'] = productName.replace(/\s+/g, '').toLowerCase()
    }

    if ('slug' in product) {
      return `${basePath}/${product.slug}`
    }
    if ('id' in product) {
      return `${basePath}/${product.id}`
    }
    if ('Rating' in product) {
      return `${basePath}/0`
    }

    throw Error('Provide product with "slug" or "id".')
  }

  // noinspection JSUnusedLocalSymbols
  brand(brand: Partial<Brand>): string {
    return '/'
  }

  cart(): string {
    return '/shop/cart'
  }

  checkout(): string {
    return '/shop/cart/checkout'
  }

  wishlist(): string {
    return '/shop/wishlist'
  }

  blog(): string {
    return '/blog'
  }

  post(): string {
    return `/blog/post-classic`
  }

  login(): string {
    return '/account/login'
  }

  terms(): string {
    return '/site/terms'
  }

  notFound(): string {
    return `/site/not-found`
  }
}
