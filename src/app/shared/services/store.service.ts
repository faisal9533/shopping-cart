import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { toUpper } from 'lodash';
import { environment } from 'src/environments/environment';
import { profile } from '../interfaces/profile';
interface ProfileData {
    profile: any[]
  }
  
@Injectable({
    providedIn: 'root'
})

export class StoreService extends profile {
 
    // address = '715 Fake Street, New York 10021 USA';
    // email = 'stroyka@example.com';

    // hours = 'Mon-Sat 10:00pm - 7:00pm';

    get primaryPhone(): string|undefined {
        return this.mobile1;
    }

    constructor(
        public http:HttpClient
      ) {
        super();
        this.getProfileData();
     
    }
    getProfileData(): void {
        this.getProfile().subscribe((response:any) =>{ 
            if(response && response.data){
                this. mobile1=response.data.Mobile;
                this. mobile2=response.data.Telephone;
                this. address=response.data.Address;
                this. email=response.data.Email;
                this. hours=response.data.TRN;
                this.phone=[  this. mobile1,this.mobile2];
                this.companyname= response.data.CompanyName;
                this.appsecret=response.data.AppSecret;
                this.allowcod=toUpper(response.data.AllowToShowCashOnDelivery)=="YES"?true:false;;
                this.backendurl=response.data.BackEndUrl;
                this.paymentlogo=response.data.PaymentLogo;
            }
        });
     }
     public httpOptions = {
        headers: new HttpHeaders({
          'Content-Type':  'application/x-www-form-urlencoded'
        })
      };
      
      getcook(): void { 
        this.cook().subscribe((response:any) =>{ 
            if(response && response.data){
 
            }
        });
     }


     cook(){
        let grant_type = 'password'
        let UserName = 'imran'
        let password = '123456'
        let body =
          'UserName=' +
          UserName +
          '&UserPassword=' +
          password
    return  this.http.post(`http://angularerp.pos-erp.in/api/Auth/Authenticate`,body,this.httpOptions);
      }
    getProfile(){ 
      
        return this.http.post(`${environment.apiUrl}/WEB/POS_Profile_WEB`,'');
      }
 
}
