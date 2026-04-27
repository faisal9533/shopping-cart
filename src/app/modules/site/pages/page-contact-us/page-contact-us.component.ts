import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContactusService } from 'src/app/shared/services/contactus.service';
import Swal from 'sweetalert2';
import { StoreService } from '../../../../shared/services/store.service';

@Component({
    selector: 'app-contact-us',
    templateUrl: './page-contact-us.component.html',
    styleUrls: ['./page-contact-us.component.scss']
})
export class PageContactUsComponent {
    [x: string]: any;
    constructor(public store: StoreService,private fb: FormBuilder,private contact:ContactusService) { }
    ngOnInit(){
        this.formDefaultValue();
    }
    contactform!:FormGroup  ;
    get contactFormData() { return this.contactform?.controls;  }
    public isSubmit=false;
    formDefaultValue(){
        this.contactform = this.fb.group({  
            name:['',[Validators.required]],
            email:['',[Validators.required, Validators.email]],
            subject:['',[Validators.required]],
            message:['',[Validators.required]],
 
        });  
 
    }

    submitContactForm(){
        this.isSubmit=true;
        if(this.contactform?.invalid){return;}
  
        var formData :any =new FormData();
        formData.append("name",this.contactFormData.name.value);
        formData.append("email",this.contactFormData.email.value);
        formData.append("subject",this.contactFormData.subject.value);
        formData.append("message",this.contactFormData.message.value);
        this.contact.contactus(formData).subscribe((resA:any) =>{
            Swal.fire('Thank you '+ this.contactFormData.name.value, 'We will contact you soon.', 'success')
            this.contactform.reset();
            this.formSubmitAttempt = false;
          
        });
        
    }
}
