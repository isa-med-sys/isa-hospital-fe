import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from 'src/app/authentication/auth.service';
import { User } from 'src/shared/model/user.model';
import { Contract } from "../../../../shared/model/contract";
import { DatePipe } from '@angular/common';
import { ContractService } from "../contract.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Company } from "../../../../shared/model/company";
import { Equipment } from "../../../../shared/model/equipment";
import { MatSnackBar, MatSnackBarVerticalPosition } from "@angular/material/snack-bar";
import * as SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';
import { environment } from 'src/env/environment';
import { AppNotification } from 'src/shared/model/notification';

@Component({
  selector: 'app-contract-form',
  templateUrl: './contract-form.component.html',
  styleUrls: ['./contract-form.component.scss']
})
export class ContractFormComponent implements OnInit, OnDestroy {
  private stompClient: any;
  isLoaded: boolean = false;
  isCustomSocketOpened = false;

  user: User | undefined;

  contract: Contract | undefined;
  shouldCreateContract: boolean = true;

  contractFields!: FormGroup;
  companies: Company[] = [];
  notifications: AppNotification[] = [];

  showEquipment: boolean = false;
  equipment: Equipment[] = [];
  selectedEquipment: Equipment[] = [];
  selectedRecord: Record<number, number> = {};

  constructor(private authService: AuthService,
              private contractService: ContractService,
              private fb: FormBuilder,
              private snackBar: MatSnackBar,
              private datePipe: DatePipe
              ) {
    this.createContractForm();
  }

  ngOnInit(): void {
    this.subscribeToUserChanges();
  }

  ngOnDestroy(): void {
    this.closeWebSocketConnection();
  }

  private subscribeToUserChanges(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
      this.initializeWebSocketConnection(() => {
        this.getContract();
        this.getNotifications();
      });
    });
  }

  private initializeWebSocketConnection(callback: () => void): void {
    if (!this.user || this.isLoaded) {
      return;
    }

    const ws = new SockJS(environment.socketHost);
    this.stompClient = Stomp.over(ws);

    this.stompClient.connect({}, () => {
      this.isLoaded = true;
      this.openSocket();
      callback();
    });
  }

  private openSocket(): void {
    if (!this.user || !this.isLoaded) {
      return;
    }

    this.isCustomSocketOpened = true;

    const contractsTopic = `/socket-publisher/contracts/${this.user.id}`;
    const notificationsTopic = `/socket-publisher/notifications/${this.user.id}`;

    this.stompClient.subscribe(contractsTopic, (message: { body: string }) => {
      this.handleContractUpdate(message);
    });

    this.stompClient.subscribe(notificationsTopic, (message: { body: string }) => {
      this.handleNotification(message);
    });
  }

  handleContractUpdate(message: { body: string }): void {
    this.contract = JSON.parse(message.body);

    if (this.contract) {
      this.shouldCreateContract = false;
    }

    this.getCompanies();
  }

  handleNotification(message: { body: string }): void {
    const parsedMessage = JSON.parse(message.body);
    alert(parsedMessage.message);

    const newNotification: AppNotification = {
      userId: parsedMessage.userId,
      timestamp: parsedMessage.timestamp,
      message: parsedMessage.message
    };

    this.notifications = [newNotification, ...this.notifications];
  }

  closeWebSocketConnection() {
    if (this.stompClient) {
      this.stompClient.disconnect();
    }
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

  getNotifications(): void {
    if (this.user) {
      this.contractService.getNotificationsByUser(this.user.id).subscribe({
        next: (notifications) => {
          this.notifications = notifications;
        },
        error: (error) => {
          console.error('Error fetching notifications:', error);
        }
      });
    }
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
        alert('Contract created!');
      }
    });
  }

  updateContract(newContract: Contract) {
    this.contractService.updateContract(newContract.id, newContract).subscribe({
      next: (result) => {
        console.log(result);
        alert('Contract updated!');
      }
    });
  }

  deleteContract(): void {
    if (this.contract?.id) {
      const confirmed = window.confirm('Are you sure you want to delete this contract?');
      this.contractService.deleteContract(this.contract.id).subscribe({
        next: (result) => {
          console.log(result);
          alert('Contract deleted!');
          this.contractFields.reset();
        }
      });
    }
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

  formatDate(dateArray: number[] | null): string {
    if (dateArray) {
      const dateObject = new Date(dateArray[0], dateArray[1] - 1, dateArray[2], dateArray[3], dateArray[4]);
      return this.datePipe.transform(dateObject, 'dd.MM.yyyy HH:mm') ?? 'N/A';
    } else {
      return 'N/A';
    }
  }
}
