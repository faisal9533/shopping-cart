import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import * as _ from 'lodash';

@Component({
    selector: 'app-block-banner',
    templateUrl: './block-banner.component.html',
    styleUrls: ['./block-banner.component.scss']
})
export class BlockBannerComponent {
    IsShow:boolean=false;
    constructor(
        public sanitizer: DomSanitizer,
        private http: HttpClient,
    ) { }
    httpHeader = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json'
        })
    }
    advObj: any = {
        title: 'Advertisement',
        text: 'Advertisement',
        image_desktop: 'assets/images/banners/banner-1.jpg',
        image_mobile: 'assets/images/banners/banner-1.jpg'
    };
    ngOnInit(): void {
        this.fetchAdvertise().subscribe(response => {
            if (response && response.data) {
                let advertisements = this.updateResponseFormat(response.data);
                this.advObj = advertisements && Array.isArray(advertisements) && advertisements.length && _.first(advertisements)
                    ? _.first(advertisements) : [];
            }
        });
    }
    updateResponseFormat(data: any): any {
        let advs: any = [];
        let webAdvResponse = _.find(data, (dt) => {
            return _.isEqual(dt.DisplayType, "Web Advertise")
        });
        if (webAdvResponse && !_.isEmpty(webAdvResponse)) {

            webAdvResponse.LstDisplayDetail.forEach((adv: any) => {
                this.IsShow=true;
                let obj = {
                    title: adv.BannerName,
                    text: adv.BannerName,
                    image_desktop: encodeURI(adv.BannerImage),
                    image_mobile: encodeURI(adv.BannerImage) //'assets/images/slides/slide-3-mobile.jpg'
                }
                advs.push(obj);
            });
        }
        return advs;
    }
    fetchAdvertise(): Observable<any> {
        return this.http.post(
            `${environment.apiUrl}/WEB/PosDashBoardGet_WEB`, JSON.stringify({ Source: "WEB" }))
            .pipe(
                tap((response) => {
                })
            );
    }
}
