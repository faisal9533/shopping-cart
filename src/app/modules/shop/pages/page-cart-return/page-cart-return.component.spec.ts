import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageCartReturnComponent } from './page-cart-return.component';

describe('PageCartReturnComponent', () => {
  let component: PageCartReturnComponent;
  let fixture: ComponentFixture<PageCartReturnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PageCartReturnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageCartReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
