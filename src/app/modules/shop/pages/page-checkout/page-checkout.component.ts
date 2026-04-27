import { Component, OnDestroy, OnInit } from '@angular/core'
import { CartService } from '../../../../shared/services/cart.service'
import { Subject } from 'rxjs'
import { takeUntil } from 'rxjs/operators'
import { ActivatedRoute, Router } from '@angular/router'
import { RootService } from '../../../../shared/services/root.service'
import { ShopService } from '../../shop.service'
import { AccountService } from '../../../account/account.service'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { StoreService } from 'src/app/shared/services/store.service'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import * as _ from 'lodash'
import Swal from 'sweetalert2'
import { environment } from 'src/environments/environment'
 
@Component({
  selector: 'app-checkout',
  templateUrl: './page-checkout.component.html',
  styleUrls: ['./page-checkout.component.scss'],
})
export class PageCheckoutComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject()
  rzp1: any
  customerKey: any
  addresskey:any
  customerData: any
  customerPersonalData:any;
  orderSuccess = false
  showPayBtn = false
  razorPayResponse: any
  Alias        :any;
  HouseNo      :any;
  ApartmentName:any;
  LandmarkName :any;
  AreaDetails  :any;
  City         :any;
  PinCode      :any;
  State        :any;

  checkoutForm: FormGroup = new FormGroup({})
  constructor(
    private fb: FormBuilder,

    public root: RootService,
    public cart: CartService,
    public shop: ShopService,
    public account: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    public store:StoreService
  ) {}

  public address_list: any
  getAddressList() { 
    var formData: any = new FormData()
    formData.append('CustomerKey', localStorage.getItem('CustomerMasterKey'))
    formData.append('AddressKey', '0')
    this.account.POSAddressesEntryGet_WEB(formData).subscribe((res: any) => {
      this.address_list = res['data']
    })
  }

  ngOnInit(): void {
    console.log("*****************"+this.store.allowcod); 
    this.customerKey = localStorage.getItem('CustomerMasterKey')
    this.getAddressList();
    this.checkoutForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      street: [''],
      apartment: [''],
      city: [''],
      state: [''],
      zip: [''],
      remark: [''],
      Longitude: [''],
      Latitude: [''],
      PaymentType: [this.store.allowcod?'CASH':'ONLINE'],
      transporterdetail:['']
    })
    if (this.customerKey) {

   
      var formData = []
      formData.push('CustomerKey' + '=' + this.customerKey)
       
    
      this.addresskey= localStorage.getItem("addresskey");
      if(typeof  this.addresskey == 'undefined' ||   this.addresskey==null)
      { 
        this.addresskey=0;
      }
      formData.push('AddressKey' + '=' +this. addresskey)
      this.account
        .POSAddressesEntryGet_WEBNew(formData.join('&'))
        .subscribe((res: any) => {
          if (res.data && res.data.length && _.first(res.data)) { 
              this.customerData = _.first(res.data)
              localStorage.setItem("addresskey",this.customerData.AddressKey);
       
 
              
              this.Alias =  this.customerData.Alias ;        
              this.HouseNo    =  this.customerData.HouseNo;       
              this.ApartmentName    =  this.customerData.ApartmentName; 
              this.LandmarkName    =  this.customerData.LandmarkName ; 
              this.AreaDetails    =  this.customerData.AreaDetails ;  
              this.City    =  this.customerData.City ;         
              this.PinCode    =  this.customerData.PinCode ;      
              this.State    =  this.customerData.State ;   
              // this.customerData.HouseNo=HouseNo;
              // this.customerData.ApartmentName=ApartmentName;
              // this.customerData.LandmarkName =LandmarkName;
              // this.customerData.AreaDetails=AreaDetails;
              // this.customerData.City=City;
              // this. customerData.PinCode =PinCode;
              // this. customerData.State=State;

              // this.checkoutForm.patchValue({
              //   street:   this.customerData.AreaDetails,
              //   apartment:   this.customerData.ApartmentName,
              //   city:   this.customerData.City,
              //   state:   this.customerData.State,
              //   zip:   this.customerData.PinCode,
              //   Latitude:   this.customerData.Latitude.toString(),
              //   Longitude:   this.customerData  .Longitude.toString(),
              // })
            //this.router.navigate(['/account/dashboard'])
          }
        })
      var formBody = []
      formBody.push('CustomerMasterKey' + '=' + this.customerKey)
      this.shop.GetCustomerDetails(formBody.join('&')).subscribe((res: any) => {
        if (res.data && res.data.length && _.first(res.data)) { 
          this.customerPersonalData = _.first(res.data)
          this.checkoutForm.patchValue({
            firstName: this.customerPersonalData.CustomerFullName,
            lastName: this.customerPersonalData.CustomerFullName,
          })
        }
      })
    }

    this.cart.quantity$.pipe(takeUntil(this.destroy$)).subscribe((quantity) => {
      if (!quantity) {
        this.router.navigate(['/shop/cart'], { relativeTo: this.route }).then()
      }
    })
  } 
  pay() {
    let CurrentOrderkey:any=0;
    CurrentOrderkey=localStorage.getItem('orderkey');
    let addr = [
      this.form.street.value,
      this.form.apartment.value,
      this.form.city.value,
      this.form.state.value,
      this.form.zip.value,
    ].join(' ')

    var options = {
      key: this.razorPayResponse.razorpayKey || this.store.appsecret,// 'rzp_live_pH0KQ3q81PYZ5p', // Enter the Key ID generated from the Dashboard
      amount: this.razorPayResponse.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
      currency: this.razorPayResponse.currency || 'INR',
      name: this.razorPayResponse.name,
      description: this.razorPayResponse.description,
      image: this.store.paymentlogo, // 'http://shopperzindia.com/assets/images/logos/logo.png'
      order_id: this.razorPayResponse.orderId, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
      handler: (response: any) => { 
        // alert(response.razorpay_payment_id)
        // alert(response.razorpay_order_id)
        // alert(response.razorpay_signature)
        this.updateorderstaatus(response.razorpay_payment_id, "SUCCESS" , CurrentOrderkey)
        this.orderSuccess = true;
        Swal.fire({
          title: 'Thank you for order',
          text: 'Your order has been placed succesfully!',
          icon: 'success',
          showCancelButton: false,
          confirmButtonText: 'Ok',
          cancelButtonText: 'No, keep it'
        }).then((result) => {
          if (result.value) {
            this.orderSuccess = true
            setTimeout(() => {
              this.router.navigate(['/shop/cart']).then(() => {
                window.location.reload()
              })
            }, 2000) //5s
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            Swal.fire(
              'Cancelled',
              'Your imaginary file is safe :)',
              'error'
            )
          }
        })  
      },
      prefill: {
        name: this.customerPersonalData.CustomerFullName,
        email: this.customerPersonalData.CustomerEmail,
        contact: this.customerPersonalData.CustomerPhone,
      },
      notes: {
        address: addr,
      },
      theme: {
        color: '#0a0c09',
      },
    }
    this.rzp1 = new this.shop.nativeWindow.Razorpay(options)
    this.rzp1.open()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }
  get form() {
    return this.checkoutForm.controls
  }
  setaddress(key:any, alis:any,HouseNo:any,ApartmentName:any,LandmarkName:any,AreaDetails:any,City:any,PinCode:any,State:any){
 
 
    localStorage.setItem("addresskey",key);
       this.Alias         =alis;
       this.HouseNo       =HouseNo;
       this.ApartmentName =ApartmentName;
       this.LandmarkName  =LandmarkName;
       this.AreaDetails   =AreaDetails;
       this.City          =City;
       this.PinCode       =PinCode;
       this.State         =State;
  }

  checkout() {   

    if (this.checkoutForm.invalid || this.addresskey<1)  {
      Swal.fire(
        'Un able to place your order.',
        'Make sure address should be selected.<br>   <a href="/account/addresses/0">  <div class="btn btn-primary btn-sm">Add New Address</div></a>',
        'error'
      )
      return
    }

    // this.router.navigate(['/shop/cart'])

    // let addr = [
    //   this.form.street.value,
    //   this.form.apartment.value,
    //   this.form.city.value,
    //   this.form.state.value,
    //   this.form.zip.value,
    // ].join(' ')
    var formBody = []
    // this.cart.totals.forEach((cartTotal: any) => {
    //   if (cartTotal.type == 'shipping') {
    //     formBody.push('DeilveryCharges' + '=' + cartTotal.price)
    //   } else {
    //     formBody.push(cartTotal.type + '=' + cartTotal.price)
    //   }
    // })
    let DeilveryCharges=0;
       this.cart.totals.forEach((cartTotal: any) => {
      if (cartTotal.type == 'shipping') {
        DeilveryCharges=cartTotal.price;
      }  
    });
 

    formBody.push('AddressKey' + '=' +    this. addresskey);
    formBody.push('CustomerKey' + '=' + this.customerKey);
    formBody.push('OrderKey' + '=' + 0);
    formBody.push('Remarks' + '=' + this.form.remark.value);
    formBody.push('DeilveryCharges' + '=' + DeilveryCharges);
    formBody.push('PaymentType' + '=' + this.form.PaymentType.value);
    formBody.push('TransporterDetail' + '=' + this.form.transporterdetail.value);
    
    // formBody.push(
    //   'CustomerName' +
    //     '=' +
    //     [this.form.firstName.value, this.form.lastName.value].join(' '),
    // )
    // !_.isEmpty(addr) ? formBody.push('DeliveryAddress' + '=' + addr) : ''
    // this.form.Longitude.value
    //   ? formBody.push('Longitude' + '=' + this.form.Longitude.value)
    //   : ''
    // this.form.Latitude.value
    //   ? formBody.push('Latitude' + '=' + this.form.Latitude.value)
    //   : ''
    // formBody.push('ShippingKey' + '=' + 1)
    // formBody.push('DeliveryDate' + '=' + '5-12-2020')
    // formBody.push('OrderValue' + '=' + this.cart.subTotal)
    // formBody.push('DiscountAmount' + '=' + 0)
    // formBody.push('NetAmount' + '=' + this.cart.total)
    
    // formBody.push('MODE' + '=' + 'ADD')

    this.shop.CustomerOrderSave(formBody.join('&')).subscribe((res: any) => {
      if (res.status == 200) {
        // this.orderSuccess = true
        localStorage.setItem("orderkey",res.data); 
        if (this.form.PaymentType.value == 'ONLINE') {
          this.shop
            .getRazorPayOrderId(`orderId=${res.data}`)
            .subscribe((razorPayRes: any) => {
              if (razorPayRes.data.orderId) {
                this.showPayBtn = true
                this.razorPayResponse = razorPayRes.data
              }
            })
        } else {
 

          Swal.fire({
            title: 'Thank you for order',
            text: 'Your order has been placed succesfully!',
            icon: 'success',
            showCancelButton: false,
            confirmButtonText: 'Ok',
            cancelButtonText: 'No, keep it'
          }).then((result) => {
            if (result.value) {
              this.orderSuccess = true
              setTimeout(() => {
                this.router.navigate(['/shop/cart']).then(() => {
                  window.location.reload()
                })
              }, 2000) //5s
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              Swal.fire(
                'Cancelled',
                'Your imaginary file is safe :)',
                'error'
              )
            }
          })


        }

        // this.checkoutForm.reset()
        // this.router.navigate(['/account/dashboard'])
      }
    })
  }


////Update Status Of Payment & Order ////
updateorderstaatus(razorpayid:any ,paymentstatus:any,orderkey:any ) {   

 
  var formBody = []
 
  formBody.push('OrderKey' + '=' +     orderkey);
  formBody.push('PaymentStatus' + '=' + paymentstatus);
  formBody.push('PaymentID' + '=' +razorpayid  );
  

    this.shop.CustomerOrderPaymentStatusUpdate(formBody.join('&')).subscribe((res: any) => {
      if (res.status == 200) {
        // this.orderSuccess = true
        localStorage.removeItem('orderkey')
          this.orderSuccess = true
          setTimeout(() => {
            this.router.navigate(['/shop/cart']).then(() => {
              window.location.reload()
            })
          }, 2000) //5s
      }
    })
  } 
}
 