import { Component } from '@angular/core'
import { Order } from '../../../../shared/interfaces/order'
import { order } from '../../../../../data/account-order-details'
import { ActivatedRoute } from '@angular/router'
import { AccountService } from '../../../account/account.service'
import { ShopService } from '../../../shop/shop.service'
import { Router } from '@angular/router'
import { StoreService } from 'src/app/shared/services/store.service'
import * as _ from 'lodash'
import { addresses } from 'src/data/account-addresses'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-page-order-details',
  templateUrl: './page-order-details.component.html',
  styleUrls: ['./page-order-details.component.scss'],
})
export class PageOrderDetailsComponent {
  order: any = order
  rzp1: any
  BillingAddress: any = addresses
  currentorder: any
  allitem: any = order.items
  razorPayResponse: any
  customerData: any
  customerKey: any
  orderSuccess = false
  pageType = 'order'
  //  order:any;
  constructor(
    private activeRoute: ActivatedRoute,
    public account: AccountService,
    public shop: ShopService,
    private router: Router,
    public store:StoreService
  ) {}
  ngOnInit(): void {
    this.activeRoute.params.subscribe((routeParams) => {
      console.log('routeParams.orderId', routeParams.orderId)
      if (routeParams.orderId &&  routeParams.pageType != 'return') {
        let data = `OrderKey=${routeParams.orderId}`
        this.account.orderDetail(data).subscribe((res: any) => {
          if (res.data) {
            let currentorder = res.data[0]
            this.allitem = []
            currentorder.LstDetail.forEach((order: any) => {
              let OrderItem = {
                name: order.SKUName,
                quantity: order.Qty,
                rate: order.Rate,
                total: order.Total,
                // quantity: 5,
              }
              this.allitem.push(OrderItem)
            })
            //  Object.assign(this.order, _.first(res.data));
            
            let singleOrder = {
              id: currentorder.OrderNo,
              date: currentorder.OrderDate,
              status: currentorder.OrderStatus,
              OrderKey: currentorder.OrderKey,
              subtotal: currentorder.SubTotal,
              shippingcharges: currentorder.DeliveryCharges,
              total: currentorder.Total,
              paymentMethod: currentorder.PaymentOption,
              CustomerName: currentorder.CustomerName,
              CustomerPhone: currentorder.CustomerPhone,
              CustomerEmail: currentorder.CustomerEmail,
              DeliveryAddress: currentorder.DeliveryAddress,
              InoviceNo: currentorder.InvoiceNo,
              InvoiceID: currentorder.InvoiceID,
              AllowToPaymentButton: currentorder.AllowToPaymentButton,
              AllowToCancel: currentorder.AllowToCancel,
              items: this.allitem,
              // quantity: 5,
            }

            this.order = singleOrder
            console.log('res', this.order.order)
          }
        })
        this.shop
          .getRazorPayOrderId(`orderId=${routeParams.orderId}`)
          .subscribe((razorPayRes: any) => {
            if (razorPayRes.data.orderId) {
              this.razorPayResponse = razorPayRes.data
            }
          })
      }
      if (routeParams.orderId && routeParams.pageType == 'return') {
        this.pageType =  'return';
        let data = `ReturnKey=${routeParams.orderId}`
        this.account.returnItemGet(data).subscribe((res: any) => {
          if (res.data) {
            let subTotal = 0;
            let currentorder = res.data[0]
            this.allitem = []
            currentorder.LstDetail.forEach((order: any) => {
              let OrderItem = {
                name: order.SKUName,
                quantity: order.Qty,
                rate: order.Rate,
                total: order.Total,
                // quantity: 5,
              }
              subTotal+=order.Total;
              this.allitem.push(OrderItem)
            })
            //  Object.assign(this.order, _.first(res.data));
      
            let singleOrder = {
              id: currentorder.ReturnNo,
              date: currentorder.ReturnDate,
              status: currentorder.ReturnStatus,
              OrderKey: currentorder.OrderKey,
              subtotal: currentorder.SubTotal || subTotal,
              shippingcharges: currentorder.DeliveryCharges || 0,
              total: currentorder.GrandTotal,
              InoviceNo: currentorder.InoviceNo,
              items: this.allitem,
              // quantity: 5,
            }

            this.order = singleOrder
            console.log('res', this.order.order)
          }
        })
        
      }
      this.customerKey = localStorage.getItem('CustomerMasterKey')

        if (this.customerKey) {
          var formBody = []
          formBody.push('CustomerMasterKey' + '=' + this.customerKey)
          this.shop
            .GetCustomerDetails(formBody.join('&'))
            .subscribe((res: any) => {
              if (res.data && res.data.length && _.first(res.data)) {
                this.customerData = _.first(res.data)
              }
            })
        }
    })
  }
  cancelOrder(order: any) {
    if (confirm('Are you sure to cancel order?')) {
      let data = `OrderKey=${order.OrderKey}`
      this.account.cancelOrder(data).subscribe((response: any) => {
        console.log('response', response)
        // this.getOrder();
        this.router.navigate(['/account/orders']).then(() => {
          // window.location.reload()
        })
      });
    }
  }
  pay() {
    let addr = this.customerData.address
    var options = {
      key: this.razorPayResponse.razorpayKey || this.store.appsecret, //'rzp_live_pH0KQ3q81PYZ5p',  Enter the Key ID generated from the Dashboard
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
        this.orderSuccess = true
      },
      prefill: {
        name: this.customerData.CustomerFullName,
        email: this.customerData.CustomerEmail,
        contact: this.customerData.CustomerPhone,
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
}
