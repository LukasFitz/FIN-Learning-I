import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Result} from '../models/result';
import {AuthenticationService} from './authentication.service';
import {UserService} from './user.service';
import {User} from '../models/user';


@Injectable({
  providedIn: 'root'
})
/**
 * Service that adds new quiz results to firebases and fetches new user results
 */
export class ResultService {

  constructor(private db: AngularFirestore, private authenticationService: AuthenticationService, private userService: UserService) {
    this.subscribeToResults();
  }

  public userResults: Result[] = [];

  /**
   * create new results and add them to firebase
   * @param result
   */
  public addResult(result: Result): void {
    this.authenticationService.getCurrentUser().then((user) => {
      result.userId = user.uid;
      this.db.collection('result').add(result).then((resultRef) => {
        this.db.collection('users').doc(user.uid).get().toPromise().then(currentUserDoc => {
          const currentUser: User = currentUserDoc.data() as User;
          const updatedUser: User = currentUser;
          if (!currentUser.results) {
            currentUser.results = [];
          }
          updatedUser.results.push(resultRef);
          this.db.collection('users').doc(user.uid).set(updatedUser);
        });
      });
    });
  }

  private subscribeToResults(): void {
    this.userService.fetchUserInformation().subscribe((user) => {
      this.userResults = [];
      if (user.results) {
        user.results.forEach((resultRef) => {
          resultRef.get().then(fbResult => {
            const result = fbResult.data() as Result;
            this.userResults.push(result);
          });
        });
      }
    });
  }
}
