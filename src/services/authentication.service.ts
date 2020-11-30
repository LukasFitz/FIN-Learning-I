import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {User} from '../models/user';
import * as firebase from 'firebase';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/auth';
import {AngularFirestore} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})

/**
 * Service that handles the Authentication with the Firebase Backend
 */
export class AuthenticationService {

  private readonly authState: Observable<firebase.User>;

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFirestore,
    private router: Router,
  ) {
    this.authState = afAuth.authState;
  }

  /**
   * registers User in Firebase, when promise is fulfilled, the user will also be logged in
   * router navigates to home component
   * @param user User Object to be stored in Firebase
   * @param password Password as String
   */
  public registerUser(user: User, password: string): Promise<void> {
    return this.afAuth.createUserWithEmailAndPassword(user.email, password).then((registeredUser) => {
      this.setUser(user, registeredUser.user.uid);
      this.router.navigate(['home']);
    });
  }

  /**
   * logs in a user by email and password
   * sets current user if successfully logged in
   * @param email email address as String
   * @param password password as String
   */
  public login(email: string, password: string): Promise<any> {
    return this.afAuth.signInWithEmailAndPassword(email, password).then(() => {
      this.router.navigate(['home']);
    });
  }

  /**
   * adds user with specific ID to database
   * sets current User
   * @param user Userobject to be added
   * @param userId ID according to afAuth
   */
  private setUser(user: User, userId: string): void {
    this.db.collection('users').doc(userId).set(user).catch(
      err1 => console.log(err1));
  }

  /**
   * signs out current user
   */
  public logout(): Promise<any> {
    return this.afAuth.signOut().then(() => {
      this.router.navigate(['landing']);
      console.log('signed out');
    }).catch(() => console.log('error signing out'));
  }

  /**
   * getter for current User
   */
  public getCurrentUser(): Promise<firebase.User> {
    return this.afAuth.currentUser;
  }

  /**
   * returns an Observable of the Firebase User Object
   */
  public getAuthState(): Observable<firebase.User> {
    return this.authState;
  }

}
