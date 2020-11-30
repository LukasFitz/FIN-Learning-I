import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {DatePipe} from '@angular/common';
import {Quiz} from '../..';
import {Subscription} from 'rxjs';
import {QuizServiceFb} from '../../services/quiz.service.fb';
import {ResultService} from '../../services/result.service';

@Component({
  selector: 'app-start-quiz',
  templateUrl: './start-quiz.component.html',
  styleUrls: ['./start-quiz.component.css'],
  providers: [QuizServiceFb, DatePipe]
})
export class StartQuizComponent implements OnInit {
  quizes: Quiz[] = [];
  numbers: any[];
  quiz: Quiz = new Quiz();
  mode = 'quiz';
  quizName: string;
  quizSubscription: Subscription;

  constructor(private quizServiceFb: QuizServiceFb, public resultService: ResultService,
              private router: Router) {
  }

  /**
   * Quiz overview for dashboard
   * if available, show last 5 quizzes and possibilty, to start a quiz from dashboard
   */
  ngOnInit() {
    this.quizSubscription = this.quizServiceFb.getQuizzes().subscribe((quizzes) => {
      this.quizes = quizzes;
      this.quizName = quizzes[0].id;
    });
  }

  // show the last 5 quiz results
  getLast5Results() {
    let last5 = 5;
    // weil bei einfacher zuweisung reverse nicht funktioniert
    const results = this.resultService.userResults.filter(j => true);
    if (last5 > results.length) {
      last5 = results.length;
    }

    return results.reverse().slice(0, last5);
  }

  /**
   * switch site router to quiz
   */
  startQuiz() {

    this.router.navigate(['quiz']);
  };

  /**
   * time how long it took to make the quiz
   */
  parseTime(totalSeconds: number) {
    let mins: string | number = Math.floor(totalSeconds / 60);
    let secs: string | number = Math.round(totalSeconds % 60);
    mins = (mins < 10 ? '0' : '') + mins;
    secs = (secs < 10 ? '0' : '') + secs;
    return `${mins}:${secs}`;
  }

  /**
   * date, when quiz was made
   * @param seconds
   */
  getDate(seconds: number) {
    return new Date(seconds).toLocaleDateString();
  }
}

