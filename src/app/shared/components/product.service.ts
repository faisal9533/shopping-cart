import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})

export class ProductService {
  
    constructor(
      public http:HttpClient
    ) {}
  
    ProductSKuDataGet_WEB(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/ProductSKuDataGet_WEB`,data);
    }

    CustomerFavouriteSave_WEB(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/CustomerFavouriteSave_WEB`,data);
    }

}  