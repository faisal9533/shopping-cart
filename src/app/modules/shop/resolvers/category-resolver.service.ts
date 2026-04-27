import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { RootService } from '../../../shared/services/root.service';
import { ShopService } from '../../../shared/api/shop.service';
import { takeUntil, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

@Injectable({
    providedIn: 'root'
})
export class CategoryResolverService implements Resolve<any> {
    constructor(
        private root: RootService,
        private router: Router,
        private shop: ShopService,
    ) { }

    resolve(route: ActivatedRouteSnapshot): Observable<any> | Promise<any> | any {
        const categorySlug = route.params.categorySlug || route.data.categorySlug || null;
        const subcategorySlug = route.params.subcategorySlug || route.data.subcategorySlug || null;
        if (categorySlug === null) {
            return null;
        }
        
        return this.shop.getCategory(categorySlug, subcategorySlug).pipe(
            catchError(error => {
                if (error instanceof HttpErrorResponse && error.status === 404) {
                    this.router.navigateByUrl(this.root.notFound()).then();
                }
                return EMPTY;
            })
        );

        
    }
}
