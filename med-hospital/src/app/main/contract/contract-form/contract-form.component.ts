import { Component } from '@angular/core';
import { AuthService } from 'src/app/authentication/auth.service';
import { User } from 'src/shared/model/user.model';
import { Contract } from "../../../../shared/model/contract";
import { ContractService } from "../contract.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Company } from "../../../../shared/model/company";
import { Equipment } from "../../../../shared/model/equipment";
import { MatSnackBar, MatSnackBarVerticalPosition } from "@angular/material/snack-bar";

@Component({
  selector: 'app-contract-form',
  templateUrl: './contract-form.component.html',
  styleUrls: ['./contract-form.component.scss']
})
export class ContractFormComponent {
  user: User | undefined;

  contract: Contract | undefined;
  shouldCreateContract: boolean = true;

  contractFields!: FormGroup;
  companies: Company[] = [];

  showEquipment: boolean = false;
  equipment: Equipment[] = [];
  selectedEquipment: Equipment[] = [];
  selectedRecord: Record<number, number> = {};

  constructor(private authService: AuthService,
              private contractService: ContractService,
              private fb: FormBuilder,
              private snackBar: MatSnackBar) {
    this.createContractForm();
  }

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.getContract();
    });
  }

  createContractForm() {

    this.contractFields = this.fb.group({
      userId: [null, Validators.required],
      company: [null, Validators.required],
      date: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  getContract() {
    if(this.user) {
      this.contractService.getUsersContract(this.user.id).subscribe({
        next: (result) => {
          this.contract = result;
          if (this.contract) {
            this.shouldCreateContract = false;
          }
          this.getCompanies();
        }
      });
    }
  }

  getCompanies() {
    this.contractService.getCompanies().subscribe({
      next: (result) => {
        this.companies = result;
        if (this.companies) {
          const selectedCompany = this.companies.find(company => company.id === this.contract?.companyId);
          if (selectedCompany) {
            this.equipment = selectedCompany.equipment;
            this.initializeSelectedEquipment();
          }
        }
        this.initializeForm();
      }
    });
  }

  initializeSelectedEquipment() {
    this.selectedEquipment = [];
    this.selectedRecord = {};
    for (const equipmentKey in this.contract?.equipmentQuantities) {
      const equipmentId = Number(equipmentKey);

      const matchingEquipment = this.equipment.find(eq => eq.id === equipmentId);

      if (matchingEquipment) {
        this.selectedEquipment.push(matchingEquipment);
        this.selectedRecord[matchingEquipment.id] = this.contract?.equipmentQuantities[matchingEquipment.id];

        this.equipment = this.equipment.filter(item => item !== matchingEquipment);
      }
    }
  }

  findCompanyById(id: number | undefined): any {
    return this.companies.find(company => company.id === id);
  }

  initializeForm() {
    this.contractFields = this.fb.group({
      userId: [this.user?.id, Validators.required],
      company: [this.findCompanyById(this.contract?.companyId), Validators.required],
      date: [this.contract?.startDate, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });

    if (this.findCompanyById(this.contract?.companyId)) {
      this.showEquipment = true;
    }

    this.contractFields.get('company')?.valueChanges.subscribe(newValue => {

      if (newValue) {
        this.showEquipment = true;

        const selectedCompany = this.findCompanyById(newValue.id);
        if (selectedCompany) {
          this.equipment = selectedCompany.equipment;
          console.log(this.equipment);
          if (selectedCompany.id != this.contract?.companyId) {
            this.selectedEquipment = [];
            this.selectedRecord = {};
          }
          else {
            this.initializeSelectedEquipment();
          }
        }
      }
    });
  }

  onSubmitForm() {

    if (this.contractFields.valid && Object.keys(this.selectedRecord).length > 0) {

      let newId = 0;
      if (this.contract?.id) {
        newId = this.contract?.id;
      }

      let resContract: Contract = {
        id: newId,
        userId: this.contractFields.get('userId')?.value,
        companyId: this.contractFields.get('company')?.value.id,
        startDate: this.contractFields.get('date')?.value,
        equipmentQuantities: this.selectedRecord,
        isActive: true
      };

      if(this.shouldCreateContract) {
        console.log('Creating...');
        this.createContract(resContract);
      }
      else {
        console.log('Updating...');
        this.updateContract(resContract);
      }
    }
    else {
      this.openSnackBar('Fill all fields and choose at least one item.', 'close');
    }
  }

  createContract(newContract: Contract) {
    this.contractService.createContract(newContract).subscribe({
      next: (result) => {
        this.shouldCreateContract = false;
        console.log(result);
        this.getContract();
        console.log('Created.');
      }
    });
  }

  updateContract(newContract: Contract) {
    this.contractService.updateContract(newContract.id, newContract).subscribe({
      next: (result) => {
        console.log(result);
        this.getContract();
        console.log('Updated.');
      }
    });
  }

  addEquipment(eq: Equipment) {
    const quantityControl = this.contractFields.get('quantity');
    if (quantityControl?.valid) {
      this.selectedEquipment.push(eq);
      this.selectedRecord[eq.id] = this.contractFields.get('quantity')?.value;

      const indexToRemove = this.equipment.indexOf(eq);
      if (indexToRemove !== -1) {
        this.equipment.splice(indexToRemove, 1);
      }
    }
    else {
      this.openSnackBar('Invalid input', 'close');
    }
  }

  removeEquipment(eq: Equipment) {
    this.equipment.push(eq);

    const keyToRemove = eq.id;

    if (keyToRemove in this.selectedRecord) {
      delete this.selectedRecord[keyToRemove];
    }

    const indexToRemove = this.selectedEquipment.indexOf(eq);
    if (indexToRemove !== -1) {
      this.selectedEquipment.splice(indexToRemove, 1);
    }
  }

  getQuantity(id: number) {
    return this.selectedRecord[id];
  }

  onLogout(): void {
    this.authService.logout();
  }

  openSnackBar(message: string, action: string, verticalPosition: MatSnackBarVerticalPosition = 'bottom') {
    this.snackBar.open(message, action, {
      duration: 30000,
      verticalPosition: verticalPosition,
    });
  }
}
