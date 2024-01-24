import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './authentication/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'med-hospital';

  constructor(private authService: AuthService, private titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Hospital');
    this.checkIfUserExists();
  }

  private checkIfUserExists(): void {
    this.authService.checkIfUserExists();
  }
}
