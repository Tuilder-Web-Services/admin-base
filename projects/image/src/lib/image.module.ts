import { NgModule } from '@angular/core';
import { UploadImageComponent } from './components/upload-image/upload-image.component';
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import {MatProgressBarModule} from '@angular/material/progress-bar';

@NgModule({
  declarations: [
    UploadImageComponent
  ],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  exports: [
    UploadImageComponent
  ]
})
export class ImageModule { }
