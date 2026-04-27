import { AfterViewInit, Component, ElementRef, Inject, Input, PLATFORM_ID, ViewChild } from '@angular/core';
import { DirectionService } from '../../../shared/services/direction.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
    selector: 'app-block-posts',
    templateUrl: './block-posts.component.html',
    styleUrls: ['./block-posts.component.scss']
})
export class BlockPostsComponent implements AfterViewInit {
    @Input() header = '';
    @Input() layout: 'list-sm'|'grid-nl' = 'list-sm';
    @Input() posts: any[] = [];

    @ViewChild('container', {read: ElementRef}) container!: ElementRef;

    showCarousel = true;

    carouselDefaultOptions = {
        margin: 30,
        nav: false,
        dots: false,
        loop: true,
        rtl: this.direction.isRTL()
    };

    carouselOptionsByLayout = {
        'grid-nl': {
            responsive: {
                930: {items: 3},
                690: {items: 2},
                0: {items: 1}
            }
        },
        'list-sm': {
            responsive: {
                930: {items: 2},
                0: {items: 1}
            }
        }
    };

    get carouselOptions(): any {
        return Object.assign({}, this.carouselDefaultOptions, this.carouselOptionsByLayout[this.layout]);
    }

    constructor(
        @Inject(PLATFORM_ID) private platformId: any,
        private direction: DirectionService
    ) { }

    ngAfterViewInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            const container = this.container.nativeElement as HTMLElement;
            const containerWidth = container.getBoundingClientRect().width;

            window.addEventListener('load', () => {
                const newContainerWidth = container.getBoundingClientRect().width;

                if (containerWidth !== newContainerWidth) {
                    this.showCarousel = false;

                    setTimeout(() => this.showCarousel = true, 0);
                }
            });
        }
    }
}
