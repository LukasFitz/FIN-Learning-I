import {Injectable} from '@angular/core';
import {User} from '../models/user';
import {AngularFirestore} from '@angular/fire/firestore';
import {MentorGrade} from '../models/MentorGrade';
import {AuthenticationService} from './authentication.service';
import {Observable} from 'rxjs';
import * as firebase from 'firebase';
import {concatMap, filter, map, share} from 'rxjs/operators';
import {Chat} from '../models/Chat';
import DocumentReference = firebase.firestore.DocumentReference;

@Injectable({
  providedIn: 'root'
})
/**
 * Service that handles user and mentor operations and inherent communication with firebase
 */
export class UserService {

  constructor(private db: AngularFirestore, private authenticationService: AuthenticationService) {
  }

  /**
   * adds the given mentor grade to the user profile
   * @param mentorGrade to be added
   */
  public addMentorGrade(mentorGrade: MentorGrade): void {
    this.authenticationService.getCurrentUser().then((user) => {
      this.addAsMentor(mentorGrade);
      this.db.collection('users').doc(user.uid).get().toPromise().then(currentUserDoc => {
        const currentUser: User = currentUserDoc.data() as User;
        const updatedUser: User = currentUser;
        if (currentUser.grades) {
          updatedUser.grades = currentUser.grades.filter((currentGrade) => (currentGrade.course !== mentorGrade.course));
        } else {
          updatedUser.grades = [];
        }
        updatedUser.grades.push(mentorGrade);
        this.db.collection('users').doc(user.uid).set(updatedUser);
      });
    });
  }

  /**
   * executed when a mentor grade is added
   * adds the user to the mentor collection
   * @param grade MentorGrade of the user
   */
  private addAsMentor(grade: MentorGrade): void {
    this.authenticationService.getCurrentUser().then((user) => {
      const docRef = firebase.firestore().doc('/users/' + user.uid);
      this.db.collection('mentors').doc(grade.course)
        .update({
          mentors: firebase.firestore.FieldValue
            .arrayUnion(docRef)
        }).catch(() => {
        this.db.collection('mentors').doc(grade.course).set({mentors: [docRef]});
      });
    });
  }

  /**
   * deletes the given MentorGrade from  user profile
   * @param mentorGrade grade to be deleted
   */
  public deleteMentorGradeForUser(mentorGrade: MentorGrade): void {
    this.authenticationService.getCurrentUser().then((user) => {
      this.deleteFromMetors(mentorGrade);
      this.db.collection('users').doc(user.uid).update({
        grades: firebase.firestore.FieldValue
          .arrayRemove(mentorGrade)
      });
    });
  }

  private deleteFromMetors(mentorGrade: MentorGrade) {
    this.authenticationService.getCurrentUser().then((user) => {
      this.db.collection('mentors').doc(mentorGrade.course)
        .update({
          mentors: firebase.firestore.FieldValue
            .arrayRemove(firebase.firestore().doc('/users/' + user.uid))
        });
    });
  }

  /**
   * Observable that fires every time some user profile information changes, emits the user profile
   */
  public fetchUserInformation(): Observable<User> {
    return this.authenticationService.getAuthState().pipe(
      filter((user) => user != null),
      concatMap((user) => {
        if (user) {
          return this.db.collection('users').doc(user.uid).valueChanges().pipe(map((value) => {
            return value as User;
          }));
        }
      }), share());
  }

  /**
   * Gets the database reference to a randomly chosen mentor for the selected course
   * @param course String with the course name
   */
  private getRandomMentorForCourse(course: string): Promise<DocumentReference> {
    return new Promise((resolve, reject) => {
      this.activeChatForModuleDoesNotExist(course).then(() => {
        let mentors: DocumentReference[] = [];
        this.db.collection('mentors').doc(course).get().subscribe(value => {
          mentors = value.data().mentors as DocumentReference[];
          this.filterSelfFromMentorList(mentors).then(potentialMentors => {
            this.getAllUsersOnce().subscribe((users: User[]) => {
              potentialMentors.forEach(mentor => {
                const user = users.find(u => u.id === mentor.id);
                const userGrade = user.grades.find(j => j.course === course).grade;
                // Idee: jeder zur Verfügung stehende Mentor wirft x Kugeln (Anzahl Kugeln abhängig von Note)
                // in den Topf mit seinem Namen drauf, eine Kugel wird gezogen -> der neue Mentor
                user.lotteryBalls = this.transformIntoLotteryBalls(userGrade);
              });
              if (potentialMentors.length >= 1) {
                // get mentor(users) return id
                resolve(potentialMentors[this.commenceLottery(users.filter(u => u.lotteryBalls != null))]);
              } else {
                reject('No Mentor available');
              }
            });
          });
        });
      }).catch(() => reject('Could not find Module or Chat already exists'));
    });
  }

  /**
   * mentor grades are related to the matching (the worse the grade, the lower the matching chance)
   * @param grade
   */
  public transformIntoLotteryBalls(grade: number) {
    let lotteryBalls = 0;

    if (grade === 4.0) {
      lotteryBalls = 1;
    }
    if (grade === 3.7) {
      lotteryBalls = 2;
    }
    if (grade === 3.3) {
      lotteryBalls = 3;
    }
    if (grade === 3.0) {
      lotteryBalls = 4;
    }
    if (grade === 2.7) {
      lotteryBalls = 5;
    }
    if (grade === 2.3) {
      lotteryBalls = 6;
    }
    if (grade === 2.0) {
      lotteryBalls = 7;
    }
    if (grade === 1.7) {
      lotteryBalls = 8;
    }
    if (grade === 1.3) {
      lotteryBalls = 9;
    }
    if (grade === 1.0) {
      lotteryBalls = 10;
    }

    return lotteryBalls;
  }

  /**
   * start the lottery of mentors
   * @param users
   */
  public commenceLottery(users: User[]) {
    let winnerIdInArray = -1;
    let ballsCount = 0;
    users.forEach(u => ballsCount = ballsCount + u.lotteryBalls);

    const lotteryBall = Math.floor(Math.random() * ballsCount) + 1;

    let resultCount = 0;
    users.forEach(u => {
      if (resultCount < lotteryBall) {
        winnerIdInArray = winnerIdInArray + 1;
      }
      resultCount = resultCount + u.lotteryBalls;
    });

    console.log(ballsCount);
    console.log(lotteryBall);
    console.log(winnerIdInArray);

    return winnerIdInArray;
  }

  /**
   * Observable of an array containing all users
   * fires when something changes
   */
  public getAllUsers(): Observable<User[]> {
    return this.db.collection('users').snapshotChanges().pipe(
      map(userDocsArray => {
        const userArray: User[] = [];
        userDocsArray.forEach(doc => userArray.push(doc.payload.doc.data() as User));
        return userArray;
      }));
  }

  /**
   * Observable of an array containing all users
   */
  public getAllUsersOnce(): Observable<User[]> {
    return this.db.collection('users').get().pipe(
      map(userDocsArray => {
        const userArray: User[] = [];
        userDocsArray.forEach(doc => userArray.push(doc.data() as User));
        return userArray;
      }));
  }

  /**
   * creates a new document in mentoring-request collection with a reference to a randomly available mentor and the mentee
   * adds a reference to these requests in user collection of both mentor and mentee
   * @param course The course for which a mentor is requested
   */
  public requestMentoring(course: string): Promise<DocumentReference> {
    return new Promise(resolve => {
      this.authenticationService.getCurrentUser().then((user) => {
        const currentUserRef = this.db.collection('users').doc(user.uid).ref;
        this.getRandomMentorForCourse(course).then((mentor) => {
          this.createChatObject(currentUserRef, mentor, course).then(chat => {
            this.db.collection('chats').add(chat).then((chatReference) => {
              console.log(chatReference.path);
              currentUserRef.update({
                  chats: firebase.firestore.FieldValue.arrayUnion(chatReference)
                }
              );
              mentor.update({
                chats: firebase.firestore.FieldValue.arrayUnion(chatReference)
              });
              resolve(chatReference);
            });
          });
        });
      });
    });
  }

  /**
   * creates a chat object for the given users and course
   * @param user1Id DocumentReference to first User
   * @param user2Id DocumentReference to second User
   * @param course  Module as String
   */
  private async createChatObject(user1Id: firebase.firestore.DocumentReference,
                                 user2Id: firebase.firestore.DocumentReference,
                                 course: string): Promise<Chat> {
    const chat: Chat = {messages: [], user1Id, user2Id, module: course, isActive: true};
    let user1Name = '';
    let user2Name = '';

    await this.getNameForUserRef(user1Id).then(value => user1Name = value);
    await this.getNameForUserRef(user2Id).then(value => user2Name = value);
    chat.user1Name = user1Name;
    chat.user2Name = user2Name;

    return Promise.resolve(chat);
  }

  /**
   * gets the users forename + lastname for the given uid
   * @param userRef DocumentReference of a user
   */
  public getNameForUserRef(userRef: DocumentReference): Promise<string> {
    return new Promise(resolve => {
      this.db.doc(userRef).get().toPromise().then(value => {
        const user: User = value.data() as User;
        const name: string = user.foreName + ' ' + user.lastName;
        resolve(name);
      });
    });
  }

  /**
   * gets the users forename + lastname for the given uid
   * @param uid ID of a user
   */
  public getNameForUserUid(uid: string): Promise<string> {
    return new Promise<string>(resolve => {
      this.db.collection('users').doc(uid).get().toPromise().then(value => {
        const user: User = value.data() as User;
        const name: string = user.foreName + ' ' + user.lastName;
        resolve(name);
      });
    });
  }

  /**
   * check if an existing chat for the requested module already exists
   * Promise rejects if chat already exists
   * @param course requested module
   */
  async activeChatForModuleDoesNotExist(course: string): Promise<any> {

    return new Promise<any>((resolve, reject) => {

      this.authenticationService.getCurrentUser().then((user) => {
        this.db.collection('users').doc(user.uid).get().toPromise().then(currentFirebaseUser => {
          const currentUser = currentFirebaseUser.data() as User;

          if (currentUser.chats) {
            const promises = currentUser.chats.map(value => {
              return this.db.doc(value).get().toPromise().then(chat => {
                const chatObject = chat.data() as Chat;
                if (chatObject != undefined && chatObject.isActive && chatObject.module === course) {
                  reject();
                }
              });
            });
            Promise.all(promises).then(() => {
              resolve(true);
            });
          } else {
            resolve(true);
          }
        });
      });
    });
  }

  /**
   * filter the logged in user from list of potential mentors
   * @param mentors DocumentReference Array of potential mentors
   */
  private filterSelfFromMentorList(mentors: firebase.firestore.DocumentReference[]): Promise<DocumentReference[]> {
    return new Promise<DocumentReference[]>(resolve => {
      this.authenticationService.getCurrentUser().then((user) => {
        this.db.collection('users').doc(user.uid).get().toPromise().then((currentFirebaseUser) => {
          mentors = mentors.filter(userRef => userRef.id !== currentFirebaseUser.ref.id);
          resolve(mentors);
        });
      });
    });
  }

  /**
   * disable courses on toggle (dashboard)
   * @param course
   * @param toggle
   */
  disableCourse(course: MentorGrade, toggle: boolean) {
    console.log(course.course, toggle);
    this.updateUserMentorGradeToggle(course, toggle);
    if (toggle) {
      this.addAsMentor(course);
    } else {
      this.deleteFromMetors(course);
    }
  }

  private updateUserMentorGradeToggle(course: MentorGrade, toggle: boolean) {
    this.authenticationService.getCurrentUser().then((firebaseUser) => {
      this.db.collection('users').doc(firebaseUser.uid).get().toPromise().then((userDoc) => {
        const user = userDoc.data() as User;
        user.grades = user.grades.map((grade: MentorGrade) => {
          if (grade.course === course.course) {
            return {
              enabled: toggle,
              course: course.course,
              grade: grade.grade
            };
          } else {
            return grade;
          }
        });
        userDoc.ref.update(user);
      });
    });
  }

  /**
   * for working with the users ID later, write it into database
   */
  writeIdInDatabase() {
    this.authenticationService.getCurrentUser().then((firebaseUser) => {
      this.db.collection('users').doc(firebaseUser.uid).get().toPromise().then((userDoc) => {
        const user = userDoc.data() as User;
        user.id = userDoc.id;
        userDoc.ref.update(user);
      });
    });
  }

  /**
   * permissions for creating chat topis or can be removed here
   * @param userId
   * @param courseName
   */
  removePermissionFromUser(userId: string, courseName: string) {
    // todo, muss an die user ran kommen
    this.db.collection('users').doc(userId).get().toPromise().then((userDoc) => {
      const user = userDoc.data() as User;
      user.permissions.forEach((module, index) => {
        if (module === courseName) {
          user.permissions.splice(index, 1);
        }
      });
      userDoc.ref.update(user);
    });
  }

  /**
   * add permissions for creating chat topics
   * @param userId
   * @param courseName
   */
  addPermissionForUser(userId: string, courseName: string) {
    // todo, muss an die user ran kommen
    this.db.collection('users').doc(userId).get().toPromise().then((userDoc) => {
      const user = userDoc.data() as User;
      if (user.permissions === undefined) {
        user.permissions = [];
      }
      user.permissions.push(courseName);
      userDoc.ref.update(user);
    });
  }
}
