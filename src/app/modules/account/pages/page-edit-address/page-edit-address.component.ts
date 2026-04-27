import { AccountService } from '../../account.service';
import { Component } from '@angular/core';  
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { MustMatch } from '../../../../shared/helpers/must-match.validator';
import { Router,ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-page-edit-address',
    templateUrl: './page-edit-address.component.html',
    styleUrls: ['./page-edit-address.component.scss']
})
export class PageEditAddressComponent {

    addressForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        public service:AccountService,
        private router:Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        this.getEditAddress(this.route.snapshot.params.addressId);
        this.formDefaultValue();
    }

    formDefaultValue(){
        this.addressForm = this.fb.group({  
            HouseNo:['',[Validators.required]],
            ApartmentName:['',[Validators.required]],
            LandmarkName:['',[Validators.required]],
            AreaDetails:['',[Validators.required]],
            City:['',[Validators.required]],
            PinCode:['',[Validators.required,Validators.pattern("^[0-9]*$")]],
            AddressType:['default',[Validators.required]],
            Alias: ['',[Validators.required]],
            DefaultAddress: [''],
        });  
        // AddressKey:0
        // DefaultAddress:['',[Validators.required]],
        //     CustomerKey:9
        //     MODE:ADD
        //State:Gujarat
    }

    get addressFormData() {  
        return this.addressForm.controls;  
    }  

    public isSubmittedAddress = false;
    submitAddress(){
        this.isSubmittedAddress = true;  
        if (this.addressForm.invalid) {  
            return;
        }

        let HouseNo = this.addressFormData.HouseNo.value;
        let ApartmentName = this.addressFormData.ApartmentName.value;
        let LandmarkName = this.addressFormData.LandmarkName.value;
        let AreaDetails = this.addressFormData.AreaDetails.value;
        let City = this.addressFormData.City.value;
        let PinCode = this.addressFormData.PinCode.value;
        let AddressType = this.addressFormData.AddressType.value;
        let Alias = this.addressFormData.Alias.value;
        let DefaultAddress = this.addressFormData.DefaultAddress.value;
        var formData: any = new FormData();
        formData.append("HouseNo",HouseNo);
        formData.append("ApartmentName",ApartmentName);
        formData.append("LandmarkName",LandmarkName);
        formData.append("AreaDetails",AreaDetails);
        formData.append("City",City);
        formData.append("PinCode",PinCode);
        formData.append("AddressType",AddressType);
        formData.append("DefaultAddress",DefaultAddress);
        formData.append("Alias",Alias);
        formData.append("Latitude",'122.24');
        formData.append("Longitude",'97.987');
        formData.append("CustomerKey",localStorage.getItem('CustomerMasterKey'));
        if(this.old_address != '0'){
            formData.append("MODE",'UPDATE');
            formData.append("AddressKey",this.old_address);
        }
        else{
            formData.append("AddressKey",'0');
            formData.append("MODE",'ADD');
            formData.append("DefaultAddress",'True');
        }
        this.service.getStateAPI(PinCode).subscribe((res:any) =>{
            if(res[0]['Status'] == 'Success'){
                formData.append("State",res[0]['PostOffice'][0]['State']);
                this.service.POSAddressesEntrySAVE_WEB(formData).subscribe((resA:any) =>{
                    this.router.navigate(['/account/addresses']);
                });
            }
            else{
                formData.append("State",'N/A');
                this.service.POSAddressesEntrySAVE_WEB(formData).subscribe((resA:any) =>{
                    this.router.navigate(['/account/addresses']);
                });
            }
        });
    }

    public old_address:any = '0';
    getEditAddress(id:any){
        if(id != '0'){
            var formData: any = new FormData();
            formData.append("AddressKey",id);
            this.service.POSAddEntrySingleByAppGet(formData).subscribe((res:any) =>{
                this.old_address = id;
                this.addressFormData.HouseNo.setValue(res['data'][0]['HouseNo']);
                this.addressFormData.ApartmentName.setValue(res['data'][0]['ApartmentName']);
                this.addressFormData.LandmarkName.setValue(res['data'][0]['LandmarkName']);
                this.addressFormData.AreaDetails.setValue(res['data'][0]['AreaDetails']);
                this.addressFormData.City.setValue(res['data'][0]['City']);
                this.addressFormData.PinCode.setValue(res['data'][0]['PinCode']);
                this.addressFormData.AddressType.setValue(res['data'][0]['AddressType']);
                this.addressFormData.Alias.setValue(res['data'][0]['Alias']);
                this.addressFormData.DefaultAddress.setValue(res['data'][0]['DefaultAddress']);
            });
        }
    }
}
