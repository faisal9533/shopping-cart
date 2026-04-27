import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContactusService {
 

  constructor(
    public http:HttpClient
  ) {}

  contactus(data:any){
    return this.http.post(`${environment.apiUrl}/WEB/POSContactUs`,data);
  }
}
