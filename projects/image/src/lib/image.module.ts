import { NgModule } from '@angular/core';
import { UploadImageComponent } from './components/upload-image/upload-image.component';
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'

@NgModule({
  declarations: [
    UploadImageComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    UploadImageComponent
  ]
})
export class TuilderImageModule { }
