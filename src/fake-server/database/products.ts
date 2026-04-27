import { AttributeDef, ProductDef } from '../interfaces/product-def';
import { Product, ProductAttribute, ProductAttributeValue } from '../../app/shared/interfaces/product';
import { brands } from './brands';
import { Category } from '../../app/shared/interfaces/category';
import { shopCategoriesList } from './categories';
import { Observable, of, throwError, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

let lastProductId = 0;

export const attributesDef: AttributeDef[] = [
    {
        name: 'Color',
        slug: 'color',
        values: [
            {name: 'White', slug: 'white'},
            {name: 'Silver', slug: 'silver'},
            {name: 'Light Gray', slug: 'light-gray'},
            {name: 'Gray', slug: 'gray'},
            {name: 'Dark Gray', slug: 'dark-gray'},
            {name: 'Coal', slug: 'coal'},
            {name: 'Black', slug: 'black'},
            {name: 'Red', slug: 'red'},
            {name: 'Orange', slug: 'orange'},
            {name: 'Yellow', slug: 'yellow'},
            {name: 'Pear Green', slug: 'pear-green'},
            {name: 'Green', slug: 'green'},
            {name: 'Emerald', slug: 'emerald'},
            {name: 'Shamrock', slug: 'shamrock'},
            {name: 'Shakespeare', slug: 'shakespeare'},
            {name: 'Blue', slug: 'blue'},
            {name: 'Dark Blue', slug: 'dark-blue'},
            {name: 'Violet', slug: 'violet'},
            {name: 'Purple', slug: 'purple'},
            {name: 'Cerise', slug: 'cerise'},
        ],
    },
    {
        name: 'Speed',
        slug: 'speed',
        values: [
            {name: '750 RPM', slug: '750-rpm'},
        ],
    },
    {
        name: 'Power Source',
        slug: 'power-source',
        values: [
            {name: 'Cordless-Electric', slug: 'cordless-electric'},
        ],
    },
    {
        name: 'Battery Cell Type',
        slug: 'battery-cell-type',
        values: [
            {name: 'Lithium', slug: 'lithium'},
        ],
    },
    {
        name: 'Voltage',
        slug: 'voltage',
        values: [
            {name: '20 Volts', slug: '20-volts'},
        ],
    },
    {
        name: 'Battery Capacity',
        slug: 'battery-capacity',
        values: [
            {name: '2 Ah', slug: '2-Ah'},
        ],
    },
];

const productsDef: ProductDef[] = [
    {
        slug: 'electric-planer-brandix-kl370090g-300-watts',
        name: 'Electric Planer Brandix KL370090G 300 Watts',
        price: 749,
        mrp:760,
        images: [
            'assets/images/products/product-1.jpg',
            'assets/images/products/product-1-1.jpg',
        ],
        badges: 'new',
        rating: 4,
        reviews: 12,
        availability: 'in-stock',
        brand: 'brandix',
        categories: ['screwdrivers'],
        attributes: [
            {slug: 'color',             values: 'yellow'},
            {slug: 'speed',             values: '750-rpm',           featured: true},
            {slug: 'power-source',      values: 'cordless-electric', featured: true},
            {slug: 'battery-cell-type', values: 'lithium',           featured: true},
            {slug: 'voltage',           values: '20-volts',          featured: true},
            {slug: 'battery-capacity',  values: '2-Ah',              featured: true},
        ],
    } 
    
];

export const products: Product[] = productsDef.map(productDef => {
    let badges: string[] = [];

    if (productDef.badges) {
        badges = typeof productDef.badges === 'string' ? [productDef.badges] : productDef.badges;
    }

    const categories: Category[] = shopCategoriesList.filter(x => productDef.categories.includes(x.slug)).map(x => ({
        ...x,
        parents: null,
        children: null,
    }));

    const attributes: ProductAttribute[] = (productDef.attributes || []).map(productAttributeDef => {
        const attributeDef = attributesDef.find(x => x.slug === productAttributeDef.slug);

        if (!attributeDef) {
            return null;
        }

        let valuesDef: string[] = [];

        if (typeof productAttributeDef.values === 'string') {
            valuesDef = [productAttributeDef.values];
        } else if (productAttributeDef.values) {
            valuesDef = productAttributeDef.values;
        }

        const values: ProductAttributeValue[] = valuesDef.map(valueSlug => {
            const valueDef = attributeDef.values.find(x => x.slug === valueSlug);

            if (!valueDef) {
                return null;
            }

            return {
                ...valueDef,
                customFields: {},
            };
        }).filter(x => x !== null) as ProductAttributeValue[];

        if (!values.length) {
            return null;
        }

        return {
            name: attributeDef.name,
            slug: attributeDef.slug,
            featured: !!productAttributeDef.featured,
            values,
            customFields: {},
        };
    }).filter(x => x !== null) as ProductAttribute[];

    return {
        id: ++lastProductId,
        name: productDef.name,
        sku: '83690/32',
        slug: productDef.slug,
        price: productDef.price,
        compareAtPrice: productDef.compareAtPrice || null,
        images: productDef.images.slice(),
        badges: badges.slice(),
        rating: productDef.rating,
        reviews: productDef.reviews,
        availability: productDef.availability,
  
        brand: brands.find(x => x.slug === productDef.brand) || null,
        categories,
        attributes,
        customFields: {},
        mrp:productDef.mrp
    };
});

export function getBestsellers(limit: number|null = null): Observable<Product[]> {
    const start = 0;
    const end = limit ? start + limit : undefined;

    return of(products.slice(start, end));
}

export function getTopRated(limit: number|null = null): Observable<Product[]> {
    const start = 3;
    const end = limit ? start + limit : undefined;

    return of(products.slice(start, end));
}

export function getSpecialOffers(limit: number|null = null): Observable<Product[]> {
    const start = 6;
    const end = limit ? start + limit : undefined;

    return of(products.slice(start, end));
}

export function getFeatured(categorySlug: string|null = null, limit: number|null = null): Observable<Product[]> {
    let fakeProducts = products.slice();

    if (categorySlug === 'power-tools') {
        fakeProducts = fakeProducts.reverse();
    } else if (categorySlug === 'hand-tools') {
        fakeProducts = [...fakeProducts.slice(8), ...fakeProducts.slice(0, 8)];
    } else if (categorySlug === 'plumbing') {
        fakeProducts = [...fakeProducts.slice(8), ...fakeProducts.slice(0, 8)].reverse();
    }

    return timer(1000).pipe(map(() => fakeProducts.slice(0, limit || undefined)));
}

export function getLatestProducts(categorySlug: string|null = null, limit: number|null = null): Observable<Product[]> {
    return getFeatured(categorySlug, limit);
}

// noinspection JSUnusedLocalSymbols
export function getRelatedProducts(product: Partial<Product>): Observable<Product[]> {
    return of(products.slice(0, 7));
}

export function getSuggestions(query: string, limit: number, categorySlug: string|null = null): Observable<Product[]> {
    return of(products.filter(x => x.name.toLowerCase().includes(query.toLowerCase())).slice(0, limit));
}

export function getProduct(productSlug: string): Observable<Product> {
    const product = products.find(x => x.slug === productSlug);

    if (!product) {
        return throwError(new HttpErrorResponse({status: 404, statusText: 'Page Not Found'}));
    }

    return of(JSON.parse(JSON.stringify(product)));
}
