import {Component, TemplateRef, OnInit, Output, OnDestroy} from '@angular/core';
import {AuthenticationService} from '../services/authentication.service';
import {Subscription} from 'rxjs';
import {BsModalService} from 'ngx-bootstrap/modal';
import {BsModalRef} from 'ngx-bootstrap/modal/bs-modal-ref.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {share} from 'rxjs/operators';
import {UserService} from '../services/user.service';
import {User} from '../models/user';
import {ChatService} from '../services/chat.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  currentUserForename = '';
  isCurrentUserAdmin = false;
  authState$: Observable<firebase.User>;
  thewError: boolean;
  wrongMail: boolean;
  shortPassword: boolean;
  noForeName: boolean;
  noLastName: boolean;
  exsitingUser: boolean;

  userProfileSubscription: Subscription;

  constructor(public authenticationService: AuthenticationService,
              private modalService: BsModalService,
              private formBuilder: FormBuilder,
              private userService: UserService,
              public chatService: ChatService) {
  }

  modalRef: BsModalRef;
  loginForm: FormGroup;
  registerForm: FormGroup;
  public isCollapsed = true;

  title = 'FIN-Learning';

  logout() {
    this.authenticationService.logout().then(() => window.location.reload());
  }

  ngOnInit() {
    this.authState$ = this.authenticationService.getAuthState().pipe(share());
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.registerForm = this.formBuilder.group({
      foreName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.wrongMail = false;
    this.noForeName = false;
    this.noLastName = false;
    this.shortPassword = false;

    this.userProfileSubscription = this.userService.fetchUserInformation().subscribe((user) => {
      this.currentUserForename = user.foreName;
      if (user.isAdmin != null) {
        this.isCurrentUserAdmin = user.isAdmin;
      }
    });
  }

  /**
   * Check if e-mail is valid (has an @) and is an
   * ovgu.de-e-mail. When regestering a 2nd time in
   * a session all the variables are null, so there
   * is a 2nd check needed.
   * @param input e-mail to check
   */
  public validEmail(input: string): boolean {
    if (input != null && input.includes('@')) {
      const domain = input.split('@', 2);
      const data = domain[1].toLowerCase();
      return data.includes('ovgu.de');
    } else {
      return false;
    }
  }

  /**
   * register new users with forename, lastname and email
   */
  registerUser(): void {
    const user: User = {
      foreName: this.registerForm.get('foreName').value,
      lastName: this.registerForm.get('lastName').value,
      email: this.registerForm.get('email').value,
    };
    const password: string = this.registerForm.get('password').value;
    this.exsitingUser = false;
    this.wrongMail = false;
    this.noForeName = false;
    this.noLastName = false;
    this.shortPassword = false;

    if (!this.validEmail(this.registerForm.get('email').value)) {
      this.wrongMail = true;
    }
    /**
     * Checks first if value is null (happens when registering in same session 2+ times),
     * if value is empty, or password is too short.
     */
    if (this.registerForm.get('foreName').value === null || this.registerForm.get('foreName').value === '') {
      this.noForeName = true;
    }
    if (this.registerForm.get('lastName').value === null || this.registerForm.get('lastName').value === '') {
      this.noLastName = true;
    }
    if (password === null || password.length < 6) {
      this.shortPassword = true;
    }

    /**
     * check whether input of text fields was in correct format
     */
    if (!(this.wrongMail || this.noForeName || this.noLastName || this.shortPassword)) {
      this.authenticationService.registerUser(user, password)
        .then(() => this.userService.writeIdInDatabase())
        // .then(() => this.router.navigate(['home']))
        .then(() => this.registerForm.reset())
        .then(() => this.modalRef.hide())
        .catch(error => this.exsitingUser = true);
    }
  }

  /**
   * for user sessions
   */
  public authenticateUser(): void {
    const email = this.loginForm.get('username').value;
    const pwd = this.loginForm.get('password').value;
    this.thewError = false;

    this.authenticationService.login(email, pwd)
      .then(() => this.loginForm.reset())
      .then(() => this.modalRef.hide())
      .catch(error => this.thewError = true);
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, {backdrop: true, keyboard: false});
  }

  logoutModal(template: TemplateRef<any>) {
    this.authenticationService.logout()
      .then(() => this.modalRef.hide());
  }

  ngOnDestroy(): void {
    this.userProfileSubscription.unsubscribe();
  }

  checkForNotifications(): boolean {
    return this.chatService.globalNotification;
  }
}
