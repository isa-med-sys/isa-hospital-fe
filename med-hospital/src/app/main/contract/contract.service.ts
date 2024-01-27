import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { Contract } from "../../../shared/model/contract";
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from "../../../env/environment";
import { Company } from "../../../shared/model/company";

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  constructor(private http: HttpClient) { }

  getUsersContract(userId: number): Observable<Contract> {
    const params = this.buildParams(userId);
    return this.http.get<Contract>(environment.apiHost + 'contracts/active', { params })
  }

  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(environment.apiHost + 'companies');
  }

  createContract(contract: Contract): Observable<Contract> {
    return this.http.post<Contract>(environment.apiHost + 'contracts', contract);
  }

  updateContract(id: number, contract: Contract): Observable<Contract> {
    return this.http.put<Contract>(environment.apiHost + `contracts/${id}`, contract);
  }

  private buildParams(userId: number): HttpParams {
    let params = new HttpParams()
      .set('userId', userId.toString());

    return params;
  }
}
