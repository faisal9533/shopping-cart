import { Component, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DirectionService } from '../../../shared/services/direction.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import * as _ from 'lodash';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { StoreService } from 'src/app/shared/services/store.service';
@Component({
    selector: 'app-block-slideshow',
    templateUrl: './block-slideshow.component.html',
    styleUrls: ['./block-slideshow.component.scss']
})
export class BlockSlideshowComponent {
    @Input() withDepartments = false;

    options = {
        nav: false,
        dots: true,
        loop: true,
        responsive: {
            0: { items: 1 }
        },
        rtl: this.direction.isRTL(),
        autoplay:true,
        autoplayHourPause:true,
        autoplayTimeOut:1000
    };

    slides:any = [];

    constructor(
        public sanitizer: DomSanitizer,
        private direction: DirectionService,
        private http: HttpClient,
        private store:StoreService
    ) { }

    httpHeader = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json'
        })
    }
    ngOnInit(): void {
        this.fetchBannerSlides().subscribe(response => {
            if (response && response.data) {
                this.slides = this.updateResponseFormat(response.data);
            }
        });
    }
    updateResponseFormat(data: any): any {
        let slides: any = [];
        let Lc:any=0;
        let webbannerResponse = _.find(data, (dt) => {
            return _.isEqual(dt.DisplayType, "Web Banner")
        });
        if (webbannerResponse && !_.isEmpty(webbannerResponse)) {
   
   
            webbannerResponse.LstDisplayDetail.forEach((slide: any) => {
                Lc++;
                let obj = {
           
              
                    title: slide.BannerName,
                    text: slide.BannerName,
                    image_classic: encodeURI(slide.BannerImage),
                    image_full: encodeURI(slide.BannerImage), // 'assets/images/slides/slide-3-full.jpg',
                    image_mobile: encodeURI(this.store.backendurl+'/Upload/'+'m'+Lc.toString()+'.jpeg'), //'assets/images/slides/slide-3-mobile.jpg'
    
                      
                        
              
                }
                slides.push(obj);
            });
        }
        return slides;
    }
    fetchBannerSlides(): Observable<any> {
        return this.http.post(
            `${environment.apiUrl}/WEB/PosDashBoardGet_WEB`, JSON.stringify({ Source: "WEB" }))
            .pipe(
                tap((response) => {
                })
            );
    }
}
