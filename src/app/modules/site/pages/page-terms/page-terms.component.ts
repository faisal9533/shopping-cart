import { Component } from '@angular/core';
import { StoreService } from 'src/app/shared/services/store.service';

@Component({
    selector: 'app-terms',
    templateUrl: './page-terms.component.html',
    styleUrls: ['./page-terms.component.scss']
})
export class PageTermsComponent {
    constructor(public store:StoreService) { }
}
