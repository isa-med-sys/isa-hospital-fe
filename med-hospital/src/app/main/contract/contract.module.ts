import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material/material.module';
import { ContractFormComponent } from './contract-form/contract-form.component';
import {ReactiveFormsModule} from "@angular/forms";
import {MatOption, MatSelect} from "@angular/material/select";



@NgModule({
  declarations: [
    ContractFormComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    MatSelect,
    MatOption
  ],
  exports: [
    ContractFormComponent
  ]
})
export class ContractModule { }
