import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Quiz} from '../index';
import {Question} from '../index';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import * as firebase from 'firebase';


@Injectable({
  providedIn: 'root'
})

/**
 * Service to save and get quizzes from Firebase
 */
export class QuizServiceFb {

  constructor(private db: AngularFirestore) {
  }

  /**
   * Add questions to the Quiz
   * @param question
   * @param quizName
   */
  public addQuestion(question: Question, quizName: string): void {
    this.db.collection('quiz').doc(quizName).get().toPromise().then(currentQuizDoc => {
      const updatedQuiz: Quiz = currentQuizDoc.data() as Quiz;
      if (updatedQuiz.questions === undefined) {
        updatedQuiz.questions = [];
      }
      updatedQuiz.questions.push(question);
      this.db.collection('quiz').doc(quizName).set(updatedQuiz);
    });
  }

  /**
   * Quiz Getter
   */
  public getQuizzes(): Observable<Quiz[]> {
    return this.db.collection('quiz').snapshotChanges().pipe(
      map(quizzesDocsArray => {
        const quizArray: Quiz[] = [];
        quizzesDocsArray.forEach(doc => quizArray.push(doc.payload.doc.data() as Quiz));
        return quizArray;
      }));
  }

  /**
   * deletes the given MentorGrade from  user profile
   * @param question
   * @param quizId
   */
  public removeQuestion(question: Question, quizId: string): void {
    this.db.collection('quiz').doc(quizId).update({
      questions: firebase.firestore.FieldValue.arrayRemove(question)
    });
  }

  /**
   * Add a new quiz (topic)
   * @param quiz
   */
  public addQuiz(quiz: Quiz): Promise<void> {
    return this.db.collection('quiz').doc(quiz.name).set(quiz);
  }
}
