import { Component } from '@angular/core';
import { AuthService } from 'src/app/authentication/auth.service';
import { User } from 'src/shared/model/user.model';

@Component({
  selector: 'app-contract-form',
  templateUrl: './contract-form.component.html',
  styleUrls: ['./contract-form.component.scss']
})
export class ContractFormComponent {
  user: User | undefined;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });
  }

  onLogout(): void {
    this.authService.logout();
  }
}
