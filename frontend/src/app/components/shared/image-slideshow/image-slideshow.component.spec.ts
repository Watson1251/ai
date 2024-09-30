import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageSlideshowComponent } from './image-slideshow.component';

describe('ImageSlideshowComponent', () => {
  let component: ImageSlideshowComponent;
  let fixture: ComponentFixture<ImageSlideshowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageSlideshowComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageSlideshowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
