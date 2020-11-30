import {Component, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs';
import {AuthenticationService} from '../../services/authentication.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.css']
})
export class LoginScreenComponent implements OnInit {

  loginForm: FormGroup;

  constructor(private authenticationService: AuthenticationService,
              private formBuilder: FormBuilder) {
  }

  @Output()
  public loginSubject: Subject<boolean> = new Subject();

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  /**
   * Login user with given data. Check this data. 3 possible answers for wrong data:
   *  account to e-mail is not existing,
   *  account to e-mail is exiting but the password is wrong,
   *  too many tries needed to login with wrong data.
   */
  public authenticateUser(): void {
    const email = this.loginForm.get('username').value;
    const pwd = this.loginForm.get('password').value;

    this.authenticationService.login(email, pwd).catch((error) => {
      if (error.message === 'There is no user record corresponding to this identifier. The user may have been deleted.') {
        document.getElementById('noLoginData-warning').innerHTML =
          '<div class="alert alert-danger alert-dismissible" role="alert">User does not exist!' +
          '<button class="close" id="closeBtn">X</button></div>';
        const btnNoUser = document.getElementById('closeBtn');
        btnNoUser.addEventListener('click', this.noLoginDataWarning);
      }
      else if (error.message === 'The password is invalid or the user does not have a password.') {
        document.getElementById('wrongLoginData-warning').innerHTML =
          '<div class="alert alert-danger alert-dismissible" role="alert">Wrong e-mail or password entered!' +
          '<button class="close" id="closeWrongPass">X</button></div>';
        const btnWrongPass = document.getElementById('closeWrongPass');
        btnWrongPass.addEventListener('click', this.wrongLoginWarning);
      }
      else if (error.message === 'Too many unsuccessful login attempts. Please try again later.') {
        document.getElementById('tooOftenWrongData-warning').innerHTML =
          '<div class="alert alert-danger alert-dismissible" role="alert">Too many unsuccessful login attempts. Please try again later!' +
          '<button class="close" id="tooOftenWrong">X</button></div>';
        const btnTooOftenWrong = document.getElementById('tooOftenWrong');
        btnTooOftenWrong.addEventListener('click', this.tooOftenWrongData);
      }
    });
  }

  /**
   * Delete warning-messages that there is no account to given data.
   */
  noLoginDataWarning() {
    document.getElementById('noLoginData-warning').innerHTML = '';
  }

  /**
   * Delete warning-message that the given login-data is wrong.
   */
  wrongLoginWarning() {
    document.getElementById('wrongLoginData-warning').innerHTML = '';
  }

  /**
   * Delete warning-message that too many tries to login are needed.
   */
  tooOftenWrongData() {
    document.getElementById('tooOftenWrongData-warning').innerHTML = '';
  }
}
