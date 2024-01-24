import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/material/material.module';
import { ContractFormComponent } from './contract-form/contract-form.component';



@NgModule({
  declarations: [
    ContractFormComponent
  ],
  imports: [
    CommonModule,
    MaterialModule
  ],
  exports: [
    ContractFormComponent
  ]
})
export class ContractModule { }
