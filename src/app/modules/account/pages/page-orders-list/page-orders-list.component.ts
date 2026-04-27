import { Component } from '@angular/core'
import { Order } from '../../../../shared/interfaces/order'

import { AccountService } from '../../account.service'

@Component({
  selector: 'app-page-orders-list',
  templateUrl: './page-orders-list.component.html',
  styleUrls: ['./page-orders-list.component.sass'],
})
export class PageOrdersListComponent {
  // orders: Partial<Order>[] = orders;
  orders: any
  allOrders: any
  constructor(public service: AccountService) {}
  ngOnInit(): void {
    this.getOrder();
  }
  getOrder(){
    let customerKey = localStorage.getItem('CustomerMasterKey')
    let data = `CustomerKey=${customerKey}`
    this.service.getOrders(data).subscribe((response: any) => {
      this.allOrders = []
      if (response && response.data) {
        response.data.forEach((order: any) => {
          let singleOrder = {
            id: order.OrderNo,
            date: order.OrderDate,
            status: order.OrderStatus,
            total: order.NetAmount,
            OrderKey: order.OrderKey,
            PageType: order.PageType,
            // quantity: 5,
          }
          this.allOrders.push(singleOrder)
        })
      }
      this.orders = this.allOrders
    })
  }
  cancelOrder(order: any) {
    if (confirm('Are you sure to cancel order?')) {
      let data = `OrderKey=${order.OrderKey}`
      this.service.cancelOrder(data).subscribe((response: any) => {
        this.getOrder();
      });
    }
  }
}
