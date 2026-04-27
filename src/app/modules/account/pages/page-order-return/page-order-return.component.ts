import { Component, OnInit, Input } from '@angular/core'
import { Order } from '../../../../shared/interfaces/order'
import { order } from '../../../../../data/account-order-details'
import { ActivatedRoute } from '@angular/router'
import { AccountService } from '../../../account/account.service'
import { ShopService } from '../../../shop/shop.service'
import { FormControl } from '@angular/forms'
import * as _ from 'lodash'
import { addresses } from 'src/data/account-addresses'
import { Router } from '@angular/router'
import { StoreService } from 'src/app/shared/services/store.service'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-page-order-return',
  templateUrl: './page-order-return.component.html',
  styleUrls: ['./page-order-return.component.scss'],
})
export class PageOrderReturnComponent implements OnInit {
  @Input() product!: any
  quantity: FormControl = new FormControl(0)
  order: any = order
  rzp1: any
  BillingAddress: any = addresses
  currentorder: any
  allitem: any = order.items
  razorPayResponse: any
  customerData: any
  customerKey: any
  orderSuccess = false
  returnItemXML:any
  showReturnBtn=false
  //  order:any;
  constructor(
    private activeRoute: ActivatedRoute,
    public account: AccountService,
    public shop: ShopService,
    public router: Router,
    public store:StoreService
  ) {}
  ngOnInit(): void {
    this.activeRoute.params.subscribe((routeParams) => {
      if (routeParams.orderId) {
        let data = `OrderKey=${routeParams.orderId}`
        this.account.orderDetail(data).subscribe((res: any) => {
          if (res.data) {
            let currentorder = res.data[0]
            this.allitem = []
            currentorder.LstDetail.forEach((order: any) => {
              let OrderItem = {
                name: order.SKUName,
                SKUKey: order.SKUKey,
                quantity: order.Qty,
                rate: order.Rate,
                total: order.Total,
                ValidReturnQty: order.ValidReturnQty,
              }
              this.allitem.push(OrderItem)
            })

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
              InoviceNo: currentorder.InoviceNo,
              InvoiceID: currentorder.InvoiceID,
              items: this.allitem,
            }

            this.order = singleOrder
          }
        })
        this.shop
          .getRazorPayOrderId(`orderId=${routeParams.orderId}`)
          .subscribe((razorPayRes: any) => {
            if (razorPayRes.data.orderId) {
              this.razorPayResponse = razorPayRes.data
            }
          })
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
      }
    })
  }
  parentFun(returnedItem: any) {
    let total = 0;
    let xmlStr = '<Head>';
    this.order.items.map((item: any) => {
      if (item.returnedQty <= item.quantity && item.returnedQty <= item.ValidReturnQty && item.returnedQty) {
        let qty = item.quantity - item.returnedQty;
        item.total = qty * item.rate;
        xmlStr += `<Det SKUKey="${item.SKUKey}" Qty="${item.returnedQty}"/>`;
        this.showReturnBtn = true
      }
      total+=item.total;
    })
    xmlStr += '</Head>';
    this.returnItemXML = xmlStr;
    console.log('xmlStr', this.returnItemXML)
    this.order.total = total;
  }
  return(){
    var formBody = [];
    formBody.push('InvoiceKey' + '=' + this.order.InvoiceID);
    formBody.push('Remarks' + '=' + 'Return order');
    formBody.push('XML' + '=' + this.returnItemXML);
    this.account.returnItem(formBody.join('&')).subscribe((res: any) => {
      this.router.navigate(['/account/orders']).then(() => {
        // window.location.reload()
      })
    });
  }
  pay() {
    let addr = this.customerData.address
    var options = {
      key: this.razorPayResponse.razorpayKey ||   this.store.appsecret, //'rzp_live_pH0KQ3q81PYZ5p', // Enter the Key ID generated from the Dashboard
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
