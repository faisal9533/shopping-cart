import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { environment } from '../../../environments/environment'
function _window(): any {
  // return the global native browser window object
  return window
}
@Injectable({
  providedIn: 'root',
})
export class ShopService {
  constructor(public http: HttpClient) {}
  public httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
  }
  CustomerFavouriteGet_WEB(data: any) {
    return this.http.post(
      `${environment.apiUrl}/WEB/CustomerFavouriteGet_WEB`,
      data,
    )
  }

  CustomerFavouriteSave_WEB(data: any) {
    return this.http.post(
      `${environment.apiUrl}/WEB/CustomerFavouriteSave_WEB`,
      data,
    )
  }
  CustomerOrderSave(data: any) { 
    return this.http.post(
          `${environment.apiUrl}/WEB/CustomerOrderSave_WEB`,
      data,
      this.httpOptions,
    )
  }
  CustomerOrderPaymentStatusUpdate(data: any) {
    return this.http.post(
          `${environment.apiUrl}/WEB/POS_OrderPaymentStatusUpdate`,
      data,
      this.httpOptions,
    )
  }
  getRazorPayOrderId(data: any) {
    return this.http.post(
      `${environment.apiUrl}/Payment/CreateOrder`,
      data,
      this.httpOptions,
    )
  }
  GetCustomerDetails(data: any) {
    return this.http.post(
      `${environment.apiUrl}/WEB/Pos_CustomerEntryGet_WEB`,
      data,
      this.httpOptions,
    )
  }
  get nativeWindow(): any {
    return _window()
  }
}
