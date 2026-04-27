import { Component } from '@angular/core';
import { CurrencyService } from '../../../../shared/services/currency.service';
const USER_KEY = 'auth-user';
import { AccountService } from '../../../account/account.service';
import { Router } from '@angular/router'

interface Currency {
    name: string;
    url: string;
    code: string;
    symbol: string;
}

@Component({
    selector: 'app-header-topbar',
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
    isShowAccount = false;
    links: { label: string; url: string }[] = [
        {label: 'Dashboard',     url: '/account/dashboard'},
        {label: 'Edit Profile',  url: '/account/profile'},
        {label: 'Order History', url: '/account/orders'},
        {label: 'Addresses',     url: '/account/addresses'},
        {label: 'Password',      url: '/account/password'},
        {label: 'Logout',        url: '/account/login'}
    ];
    languages = [
        {name: 'English', image: 'language-1'},
        {name: 'French',  image: 'language-2'},
        {name: 'German',  image: 'language-3'},
        {name: 'Russian', image: 'language-4'},
        {name: 'Italian', image: 'language-5'}
    ];

    currencies = [
        {name: '₹ Indian Rupee',           url: '', code: 'INR', symbol: '₹'},
        {name: '€ Euro',           url: '', code: 'EUR', symbol: '€'},
        {name: '£ Pound Sterling', url: '', code: 'GBP', symbol: '£'},
        {name: '$ US Dollar',      url: '', code: 'USD', symbol: '$'},
        {name: '₽ Russian Ruble',  url: '', code: 'RUB', symbol: '₽'}
    ];
    public login_user_data = {
        $id: "", Button: "", CustomerDOB: null, CustomerEmail: "", CustomerFullName: "",
        CustomerImagePath: "", CustomerMasterKey: 0, CustomerPassword: "", CustomerPhone: "",
        Offers: true, PIN: 0, RegisteredDate: "", RowIndex: 0, UID: null
    };

    constructor(
        public currencyService: CurrencyService,
        private accountService: AccountService,
        private router: Router
    ) { }

    ngOnInit() {
        let CustomerMasterKey: any = localStorage.getItem('CustomerMasterKey');
        this.isShowAccount = CustomerMasterKey ? true : this.isShowAccount;
        var formData: any = new FormData();
        formData.append("CustomerMasterKey", localStorage.getItem('CustomerMasterKey'));
        this.accountService.Pos_CustomerEntryGET(formData).subscribe((res: any) => {
            Object.assign(this.login_user_data, res['data'][0]);
        });
    }
    setCurrency(currency: Currency): void {
        this.currencyService.options = {
            code: currency.code,
            display: currency.symbol,
        };
    }
    buttonClick(item: any) {
        if (item && item.url == '/account/login') {
          localStorage.removeItem('USER_KEY')
          localStorage.removeItem('CustomerMasterKey')
          this.router.navigate(['/account/login']).then(() => {
            window.location.reload()
          })
        }
      }
}
