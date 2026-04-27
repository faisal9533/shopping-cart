import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageOrderReturnComponent } from './page-order-return.component';

describe('PageOrderReturnComponent', () => {
  let component: PageOrderReturnComponent;
  let fixture: ComponentFixture<PageOrderReturnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PageOrderReturnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageOrderReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
