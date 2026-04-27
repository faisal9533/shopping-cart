import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})

export class AccountService {
  
    constructor(
      public http:HttpClient
    ) {}
  
    Pos_SentOTPToCustomer_WEB(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/Pos_SentOTPToCustomer_WEB`,data);
    }
    Pos_CustomerPasswordChange(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/POS_CustomerPasswordChange`,data);
    }
    Pos_ForgotPassword(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/Pos_ForgotPassword_WEB`,data);
    }
    CustomerEntrySAVE(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/Pos_CustomerEntrySAVE_WEB`,data);
    }

    Pos_CustomerEntryGET(data:any){
      return this.http.post(`${environment.apiUrl}/POS/Pos_CustomerEntryGet`,data);
    }

    public httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/x-www-form-urlencoded'
      })
    };
    
    token(data:any){
      return this.http.post(`${environment.withoutAPIUrl}/token`,data,this.httpOptions);
    }
    login(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/authenticate`,data,this.httpOptions);
    }

    getStateAPI(pincode:any){
      return this.http.get(`https://api.postalpincode.in/pincode/${pincode}`);
    }

    POSAddressesEntrySAVE_WEB(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/POSAddressesEntrySAVE_WEB`,data);
    }

    POSAddEntrySingleByAppGet(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/POSAddEntrySingleByAppGet_WEB`,data);
    }

    POSAddressesEntryGet_WEB(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/POSAddressesEntryGet_WEB`,data);
    }
    POSAddressesEntryGet_WEBNew(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/POSAddressesEntryGet_WEB`,data,this.httpOptions);
    }
    getOrders(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/POS_OrdeerLIstGet_WEB`,data,this.httpOptions);
    }
    cancelOrder(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/POS_OrderStatusCancel_WEB`,data,this.httpOptions);
    }
    orderDetail(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/POS_OrderDisplayGet_WEB`,data,this.httpOptions);
    }
    returnItemGet(data:any){
      return this.http.post(`${environment.apiUrl}/POS/POS_ReturnDisplayGet`,data,this.httpOptions);
    }
    returnItem(data:any){
      return this.http.post(`${environment.apiUrl}/WEB/CustomerReturnOrderSave_WEB`,data,this.httpOptions);
    }
}  