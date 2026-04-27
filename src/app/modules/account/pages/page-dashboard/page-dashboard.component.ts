import { Component } from '@angular/core';
import { Order } from '../../../../shared/interfaces/order';
import { orders } from '../../../../../data/account-orders';

import { AccountService } from '../../account.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { Router } from '@angular/router';

@Component({
    selector: 'app-page-dashboard',
    templateUrl: './page-dashboard.component.html',
    styleUrls: ['./page-dashboard.component.sass']
})
export class PageDashboardComponent {
    orders:any[] = orders.slice(0, 3);
    allOrders:any;
    constructor(
        private fb: FormBuilder,
        public service:AccountService,
        private router:Router,
    ) { }


    public login_user_data = {
        $id: "", Button: "", CustomerDOB: null, CustomerEmail: "", CustomerFullName: "", 
        CustomerImagePath: "", CustomerMasterKey: 0, CustomerPassword: "", CustomerPhone: "",
        Offers: true, PIN: 0, RegisteredDate: "", RowIndex: 0, UID: null
    };

    ngOnInit() {
        var formData: any = new FormData();
        formData.append("CustomerMasterKey",localStorage.getItem('CustomerMasterKey'));
        this.service.Pos_CustomerEntryGET(formData).subscribe((res:any) =>{
            let data = Object.assign(this.login_user_data,res['data'][0]);
        });
        let data = `CustomerKey=${localStorage.getItem('CustomerMasterKey')}`
        this.service.getOrders(data).subscribe((response:any)=>{
            this.allOrders=[];
            if(response && response.data){
                response.data.forEach((order:any) => {
                    let singleOrder = {
                        id: order.OrderNo,
                        date: order.OrderDate,
                        status: order.OrderStatus,
                        total: order.NetAmount,
                        OrderKey: order.OrderKey,
                        // quantity: 5,
                    }
                    this.allOrders.push(singleOrder);
                });
                
            }
            this.orders=this.allOrders.slice(0, 3);
        });
        this.getAddressList();
    }

    public address = {
        $id: "5",AddressKey: 37,AddressType: "office",Alias: "Office",
        ApartmentName: "Siddhi",AreaDetails: "A-1178",City: "Ahmedad",
        CustomerKey: 47,DefaultAddress: true,FullAddress: "908 SIDDHI A-1178\nMAKRBA AHMEDAD GUJARAT 380051",HouseNo: "908",
        LandmarkName: "Makrba",Latitude: 122.24,Longitude: 97.987,PinCode: "380051",State: "Gujarat"
    };

    getAddressList(){
        var formData: any = new FormData();
        formData.append("CustomerKey",localStorage.getItem('CustomerMasterKey'));
        formData.append("AddressKey",'0');
        this.service.POSAddressesEntryGet_WEB(formData).subscribe((res:any) =>{
            res['data'].forEach((element:any,index:any) => {
                if(element.DefaultAddress == true){
                    Object.assign(this.address,res['data'][index]);
                }
            });
        });
    }
}
