import { Component, OnInit } from '@angular/core';
import { Product } from '../../../../shared/interfaces/product';
import { ActivatedRoute } from '@angular/router';
import { ShopService } from '../../../../shared/api/shop.service';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
@Component({
    selector: 'app-page-product',
    templateUrl: './page-product.component.html',
    styleUrls: ['./page-product.component.scss']
})

export class PageProductComponent implements OnInit {
    relatedProducts$!: Observable<any[]>;
    apptype:any=environment.apptype;
    product!: any;
    layout: 'standard' | 'columnar' | 'sidebar' = 'standard';
    sidebarPosition: 'start' | 'end' = 'start'; // For LTR scripts "start" is "left" and "end" is "right"

    constructor(
        private shop: ShopService,
        private route: ActivatedRoute,
    ) { }

    ngOnInit(): void {
        this.route.data.subscribe(data => {
            this.apptype=environment.apptype;
            this.layout = data.layout || this.layout;
            this.sidebarPosition = data.sidebarPosition || this.sidebarPosition;
            this.product = data.product;
            // this.relatedProducts$ = this.shop.getRelatedProducts(data.product);
            this.relatedProducts$ = this.getRelatedProducts(data.product.relatedProducts);
 
        });
    }
    getRelatedProducts(products: Partial<any>): Observable<any[]> {
        return of(products.slice());
    }
}
