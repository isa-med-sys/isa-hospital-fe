import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from 'src/app/main/layout/home/home.component';
import { ContractFormComponent } from './main/contract/contract-form/contract-form.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'contract', component: ContractFormComponent }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
