import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxGridCoreModule } from '@blueshiftone/ngx-grid-core'
import { EntityGridComponent } from './components/entity-grid/entity-grid.component'
import { FloatingGridToolbarComponent } from './components/floating-grid-toolbar/floating-grid-toolbar.component'
import { StaticGridToolbarComponent } from './components/static-grid-toolbar/static-grid-toolbar.component'
import { MatIconModule } from '@angular/material/icon'
import { MatMenuModule } from '@angular/material/menu'
import { EditEntitiesComponent } from './components/edit-entities/edit-entities.component'
import { MatListModule } from '@angular/material/list'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { EditEntityComponent } from './components/edit-entity/edit-entity.component'
import { MatButtonModule } from '@angular/material/button'

@NgModule({
  declarations: [
    EntityGridComponent,
    FloatingGridToolbarComponent,
    StaticGridToolbarComponent,
    EditEntitiesComponent,
    EditEntityComponent
  ],
  imports: [
    CommonModule,
    NgxGridCoreModule,
    MatIconModule,
    MatMenuModule,
    MatListModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule
  ],
  exports: [
    EntityGridComponent,
    FloatingGridToolbarComponent,
    StaticGridToolbarComponent,
    EditEntitiesComponent,
    EditEntityComponent
  ]
})
export class AdminStarterModule { }
