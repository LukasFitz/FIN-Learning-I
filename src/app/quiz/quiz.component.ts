import {Component, OnInit, OnDestroy, ChangeDetectorRef, TemplateRef} from '@angular/core';
import {HostListener} from '@angular/core';
import {DatePipe} from '@angular/common';
import {QuizServiceFb} from '../../services/quiz.service.fb';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Option, Question, Quiz, QuizConfig} from '../..';
import {Course} from '../../models/Course';
import {BsModalService} from 'ngx-bootstrap/modal';
import {BsModalRef} from 'ngx-bootstrap/modal/bs-modal-ref.service';
import {ResultService} from '../../services/result.service';
import {Result} from '../../models/result';
import {UserService} from '../../services/user.service';
import {User} from '../../models/user';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css'],
  providers: [QuizServiceFb, DatePipe]
})
export class QuizComponent implements OnInit, OnDestroy {

  constructor(private quizServiceFb: QuizServiceFb,
              private userService: UserService,
              public resultService: ResultService,
              private formBuilder: FormBuilder,
              private changeDetection: ChangeDetectorRef,
              private modalService: BsModalService
  ) {
    this.screenWidth = window.innerWidth;
  }

  get filteredQuestions() {
    return (this.quiz.questions) ?
      this.quiz.questions.slice(this.pager.index, this.pager.index + this.pager.size) : [];
  }

  radioModel = 'Middle';
  questionForm: FormGroup;
  quizes: Quiz[] = [];
  editQuizes: Quiz[] = [];
  numbers: any[];
  quiz: Quiz = new Quiz();
  mode = 'quiz';
  quizName = 'JavaScript Quiz';
  quizId = '';
  editQuizId = '';
  config: QuizConfig = {
    allowBack: true,
    allowReview: true,
    autoMove: true,  // if true, it will move to next question automatically when answered.
    duration: 300,  // indicates the time (in secs) in which quiz needs to be completed. 0 means unlimited.
    pageSize: 1,
    requiredAll: false,  // indicates if you must answer all the questions before submitting.
    richText: false,
    shuffleQuestions: false,
    shuffleOptions: false,
    showClock: false,
    showPager: true,
    theme: 'none'
  };
  isSubmitted = true;

  pager = {
    index: 0,
    size: 1,
    count: 1
  };
  timer: any = null;
  startTime: Date;
  endTime: Date;
  ellapsedTime = '00:00';
  duration = '';
  screenWidth = 0;

  seconds: number;
  maxSeconds: number;
  quizSubscription: Subscription;
  courseSubscription: Subscription;
  userProfileSubscription: Subscription;

  cc: Course[];

  displayedQuestions: Question[] = [];
  firstQuestionIndex: number;
  maxDisplayedQuestions = 5;

  passedSeconds = 0;

  modalRef: BsModalRef;

  options = [{isAnswer: false, name: 'Antwort 1'},
    {isAnswer: false, name: 'Antwort 2'},
    {isAnswer: false, name: 'Antwort 3'},
    {isAnswer: false, name: 'Antwort 4'},
  ];

  buttonText = 'Einreichen';
  inputHeader = 'Frage einreichen';
  oldQuestionName = '';
  currentFilterString = '';

  searchQuestions: Question[] = [];

  time: Date = new Date();
  minTime: Date = new Date();
  maxTime: Date = new Date();

  isDisabled = false;

  var = '';
  private date;
  private oldDate;

  correctAnswerCount = 0;

  /**
   * quizzes that the user can do and quizzes that the user can edit are loaded
   */
  ngOnInit() {
    this.quizSubscription = this.quizServiceFb.getQuizzes().subscribe((quizzes) => {

      this.userProfileSubscription = this.userService.fetchUserInformation().subscribe((user: User) => {
        // console.log("HEY LUL" + this.editQuizId);

        if (user.permissions !== undefined) {
          this.editQuizes = quizzes.filter(j => user.permissions.findIndex(k => k === j.name) !== -1);
        }
        // this.quizes = quizzes.filter(j => user.permissions.findIndex(k => k === j.name) === -1);
        this.quizes = quizzes.filter(q => q.questions != null && q.questions.length > 4);

        if (this.quizId.length === 0) {
          if (this.quizes != null && this.quizes.length > 0) {
            this.quizId = this.quizes[0].id;
          } else {
            this.quizId = '-1';
          }
        }

        if (this.editQuizId.length === 0) {
          if (this.editQuizes != null && this.editQuizes.length > 0) {
            this.editQuizId = this.editQuizes[0].id;
          } else {
            this.editQuizId = '-1';
          }
        }
      });

      // initialize time limit
      this.time.setHours(0);
      this.time.setMinutes(30);
      this.maxTime.setHours(10);
      this.maxTime.setMinutes(0);
      this.minTime.setHours(0);
      this.minTime.setMinutes(30);

      // this.loadQuiz(this.quizes[0].id);
    });

    // initialize form to create new questions
    this.questionForm = this.formBuilder.group({
        name: ['', Validators.required],
        option0isAnswer: false,
        option0Name: ['', Validators.required],
        option1isAnswer: false,
        option1Name: ['', Validators.required],
        option2isAnswer: false,
        option2Name: ['', Validators.required],
        option3isAnswer: false,
        option3Name: ['', Validators.required],
      },
      {
        validator: this.myValidator()
      }
    );

    this.mode = 'selectquiz';
  }

  ngOnDestroy() {
    this.isSubmitted = true;
  }

  /**
   * check if at least one answer is true
   */
  myValidator() {
    return (group: FormGroup) => {
      const errors: any = {};
      let conError = false;
      if (!group.value.option0isAnswer && !group.value.option1isAnswer && !group.value.option2isAnswer && !group.value.option3isAnswer) {
        errors.requiredOneAnswer = true;
        conError = true;
      }
      return conError ? errors : null;
    };
  }

  /**
   * update searchModules to show the results of the search
   */
  updateFilter(event) {
    this.currentFilterString = event.target.value.toLowerCase();

    const val = event.target.value.toLowerCase();

    this.searchQuestions = this.quiz.questions.filter((d) => d.name.toLowerCase().indexOf(val) !== -1 || !val);
  }

  /**
   * load the question into the form to easily edit
   */
  edit(question: Question) {
    this.oldQuestionName = question.name;

    this.questionForm = this.formBuilder.group({
        name: [question.name, Validators.required],
        option0isAnswer: question.options[0].isAnswer,
        option0Name: [question.options[0].name, Validators.required],
        option1isAnswer: question.options[1].isAnswer,
        option1Name: [question.options[1].name, Validators.required],
        option2isAnswer: question.options[2].isAnswer,
        option2Name: [question.options[2].name, Validators.required],
        option3isAnswer: question.options[3].isAnswer,
        option3Name: [question.options[3].name, Validators.required],
      },
      {
        validator: this.myValidator()
      }
    );

    this.buttonText = 'Frage aktualisieren';
    this.inputHeader = 'Frage bearbeiten';
  }

  /**
   * clear the edit form
   */
  clearForm() {
    this.questionForm = this.formBuilder.group({
        name: ['', Validators.required],
        option0isAnswer: false,
        option0Name: ['', Validators.required],
        option1isAnswer: false,
        option1Name: ['', Validators.required],
        option2isAnswer: false,
        option2Name: ['', Validators.required],
        option3isAnswer: false,
        option3Name: ['', Validators.required],
      },
      {
        validator: this.myValidator()
      }
    );
    this.buttonText = 'Einreichen';
    this.inputHeader = 'Frage einreichen';
  }

  scroll(el: HTMLElement) {
    el.scrollIntoView({behavior: 'smooth'});
  }

  /**
   * refresh displayed questions after deleting one
   */
  refreshQuestions(newQuestion: Question, questionToRemoveName: string) {
    if (newQuestion != null) {
      // neue question in quiz
      this.quiz.questions.push(newQuestion);
      // neue question in serachquestions, wenn currentfilterstring passt
      if (newQuestion.name.toLowerCase().indexOf(this.currentFilterString) !== -1 || !this.currentFilterString) {
        this.searchQuestions.push(newQuestion);
      }
    }
    // alte question aus quiz und searchquestions raus
    if (questionToRemoveName.length > 0) {
      this.quiz.questions.forEach((question, index) => {
        if (question.name === questionToRemoveName) {
          this.quiz.questions.splice(index, 1);
        }
      });
      this.searchQuestions.forEach((question, index) => {
        if (question.name === questionToRemoveName) {
          this.searchQuestions.splice(index, 1);
        }
      });
    }
  }

  /**
   * the questions will be added to/renewed in the database and displayed questions will be refreshed
   */
  submitQuestion() {
    const option0: Option = {
      name: this.questionForm.value.option0Name,
      isAnswer: this.questionForm.value.option0isAnswer,
      selected: false
    };
    const option1: Option = {
      name: this.questionForm.value.option1Name,
      isAnswer: this.questionForm.value.option1isAnswer,
      selected: false
    };
    const option2: Option = {
      name: this.questionForm.value.option2Name,
      isAnswer: this.questionForm.value.option2isAnswer,
      selected: false
    };
    const option3: Option = {
      name: this.questionForm.value.option3Name,
      isAnswer: this.questionForm.value.option3isAnswer,
      selected: false
    };

    const optionss = [option0, option1, option2, option3];

    const question: Question = {
      name: this.questionForm.value.name,
      questionTypeId: 0,
      answered: false,
      options: optionss
    };

    // Wenn frage überarbeitet wird vorher checken, ob der name nicht leer ist, dann alte version löschen
    if (this.oldQuestionName.length > 0) {
      this.quizServiceFb.removeQuestion(this.quiz.questions.find(j => j.name === this.oldQuestionName), this.editQuizId);
    }

    console.log('editQuizid:' + this.editQuizId);

    this.quizServiceFb.addQuestion(question, this.editQuizId);

    this.refreshQuestions(question, this.oldQuestionName);

    this.buttonText = 'Einreichen';
    this.inputHeader = 'Frage einreichen';
    this.oldQuestionName = '';

    this.questionForm = this.formBuilder.group({
        name: ['', Validators.required],
        option0isAnswer: false,
        option0Name: ['', Validators.required],
        option1isAnswer: false,
        option1Name: ['', Validators.required],
        option2isAnswer: false,
        option2Name: ['', Validators.required],
        option3isAnswer: false,
        option3Name: ['', Validators.required],
      },
      {
        validator: this.myValidator()
      }
    );

    console.log('editQuizid:' + this.editQuizId);

  }

  /**
   * delete the question
   */
  deleteQuestion(questionName: string) {
    console.log(questionName);
    console.log(this.quizId);
    this.quizServiceFb.removeQuestion(this.quiz.questions.find(j => j.name === questionName), this.editQuizId);
    this.refreshQuestions(null, questionName);
    this.changeDetection.detectChanges();
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, {backdrop: true, keyboard: false});
  }

  /**
   * start answering the quiz
   */
  startQuiz() {
    this.loadQuiz(true);

    this.quiz.questions.forEach(question =>
      question.options.forEach(option =>
        option.selected = false
      ));

    this.pager.count = this.quiz.questions.length;
    this.pager.index = 0;
    this.numbers = Array(this.pager.count);
    this.startTime = new Date();
    this.ellapsedTime = '00:00';
    this.timer = setInterval(() => {
      if (!this.isSubmitted) {
        this.tick();
      }
    }, 1000);
    this.duration = this.parseTime(this.config.duration);
    this.maxSeconds = this.config.duration;
    this.seconds = this.maxSeconds;

    if (this.quiz.questions.length < this.maxDisplayedQuestions) {
      this.maxDisplayedQuestions = this.quiz.questions.length;
    }
    // erste 5 Fragen anzeigen
    this.displayedQuestions = [];
    this.quiz.questions.slice(0, this.maxDisplayedQuestions).forEach(element => {
      this.displayedQuestions.push(element);
    });
    this.firstQuestionIndex = 0;

    this.processingWindow();
    this.mode = 'quiz';
    this.isSubmitted = false;
  }

  /**
   * load the quiz with questions
   */
  loadQuiz(startQuiz: boolean) {
    if (startQuiz) {
      this.quiz = this.quizes.find(quiz => quiz.id === this.quizId);
    } else {
      this.quiz = this.editQuizes.find(quiz => quiz.id === this.editQuizId);
    }

    this.quizName = this.quiz.name;
    this.isSubmitted = true;

    this.searchQuestions = [];

    this.quiz.questions.forEach(element => {
      this.searchQuestions.push(element);
    });

  }

  setMaxDisplayedQuestions(questions: number) {
    if (this.quiz.questions.length < this.maxDisplayedQuestions || this.quiz.questions.length < questions) {
      this.maxDisplayedQuestions = this.quiz.questions.length;
    } else {
      this.maxDisplayedQuestions = questions;
    }
  }

  tick() {
    const now = new Date();
    const diff = (now.getTime() - this.startTime.getTime()) / 1000;
    if (!this.isSubmitted && diff >= this.config.duration) {
      this.submitQuiz();
    }
    this.ellapsedTime = this.parseTime(diff);
    this.seconds = this.maxSeconds - diff;

    this.passedSeconds = diff;
  }

  parseTime(totalSeconds: number) {
    let mins: string | number = Math.floor(totalSeconds / 60);
    let secs: string | number = Math.round(totalSeconds % 60);
    mins = (mins < 10 ? '0' : '') + mins;
    secs = (secs < 10 ? '0' : '') + secs;
    return `${mins}:${secs}`;
  }

  onSelect(question: Question, option: Option) {
    if (question.questionTypeId === 1) {
      question.options.forEach((x) => {
        if (x !== option) {
          x.selected = false;
        }
      });
    }

    if (this.config.autoMove) {
      this.goTo(this.pager.index + 1);
    }
  }

  /**
   * go to page
   */
  goTo(index: number) {
    if (index >= 0 && index < this.pager.count) {
      this.pager.index = index;
      this.mode = 'quiz';

      this.calculateDisplayedQuestions(index);
    }
  }

  /**
   * calculate how many and which questions will be displayed
   */
  calculateDisplayedQuestions(index: number) {
    // ganz ehrlich: fasst das hier besser nicht an

    this.displayedQuestions = [];
    // aktualisiere die this.maxDisplayedQuestions angezeigten Fragen
    // if(this.pager.count-this.pager.index < this.maxDisplayedQuestions)
    // {
    // index = this.pager.count - this.maxDisplayedQuestions;
    // if(index < 5)
    // index = 5;
    // }
    /*if(index+this.maxDisplayedQuestions > this.pager.count+2) {
      this.quiz.questions.slice(this.firstQuestionIndex, this.pager.count).forEach(element => {
        this.displayedQuestions.push(element)});
    }else {*/
    if (index === 0) { // sonderfall am anfang
      this.firstQuestionIndex = 0;

      this.quiz.questions.slice(0, this.maxDisplayedQuestions).forEach(element => {
        this.displayedQuestions.push(element);
      });
    } else if (index === this.pager.count - 1) { // sonderfall am ende
      this.firstQuestionIndex = this.pager.count - this.maxDisplayedQuestions;

      this.quiz.questions.slice(this.firstQuestionIndex, this.firstQuestionIndex + this.maxDisplayedQuestions).forEach(element => {
        this.displayedQuestions.push(element);
      });
    } else if (index === this.firstQuestionIndex) { // zurück
      this.firstQuestionIndex = this.firstQuestionIndex - 1;

      this.quiz.questions.slice(this.firstQuestionIndex, this.firstQuestionIndex + this.maxDisplayedQuestions).forEach(element => {
        this.displayedQuestions.push(element);
      });
    } else if (index - this.firstQuestionIndex > this.maxDisplayedQuestions - 2) { // vor
      if (this.firstQuestionIndex === this.pager.count - this.maxDisplayedQuestions) { // hinten angekommen
        this.firstQuestionIndex = this.pager.count - this.maxDisplayedQuestions;

        this.quiz.questions.slice(this.firstQuestionIndex, this.firstQuestionIndex + this.maxDisplayedQuestions).forEach(element => {
          this.displayedQuestions.push(element);
        });
      } else { // normal vor

        this.firstQuestionIndex = index - this.maxDisplayedQuestions + 2;

        this.quiz.questions.slice(this.firstQuestionIndex, this.firstQuestionIndex + this.maxDisplayedQuestions).forEach(element => {
          this.displayedQuestions.push(element);
        });
      }
    } else { // wenn nichts bewegtr wird
      this.quiz.questions.slice(this.firstQuestionIndex, this.firstQuestionIndex + this.maxDisplayedQuestions).forEach(element => {
        this.displayedQuestions.push(element);
      });
    }
    // }
  }

  isAnswered(question: Question) {
    return question.options.find(x => x.selected) ? 'Answered' : 'Not Answered';
  }

  isCorrect(question: Question) {
    return question.options.every(x => x.selected === x.isAnswer) ? 'korrekt' : 'leider falsch';
  }

  answeredQuestionCount() {
    return this.quiz.questions.filter(h => !!h.options.find(x => x.selected)).length;
  }

  /**
   * submit the quiz after answering the questions
   */
  submitQuiz() {
    this.mode = 'result';
    this.date = new Date();
    this.oldDate = new Date(this.date.getTime() - ((this.maxSeconds - this.seconds) * 1000));
    // Post your data to the server here. answers contains the questionId and the users' answer.
    this.correctAnswerCount = this.quiz.questions.filter(question =>
      question.options.filter(option =>
        option.isAnswer === option.selected
      ).length === 4).length;

    const result: Result = {
      correct: this.correctAnswerCount,
      wrong: this.quiz.questions.length - this.correctAnswerCount,
      quizName: this.quiz.name,
      endTime: this.date.getTime(),
      userId: null,
      startTime: this.oldDate.getTime(),
    };
    console.log('addResult von submit');
    this.resultService.addResult(result);
    this.isSubmitted = true;
    this.modalRef.hide();
  }

  processingWindow() {
    if (this.screenWidth > 1200) {
      this.setMaxDisplayedQuestions(10);
    } else if (this.screenWidth > 500) {
      this.setMaxDisplayedQuestions(5);
    } else if (this.screenWidth > 350) {
      this.setMaxDisplayedQuestions(3);
    } else {
      this.setMaxDisplayedQuestions(1);
    }

    this.calculateDisplayedQuestions(this.pager.index);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.screenWidth = window.innerWidth;
    this.processingWindow();
  }

  /**
   * get last 6 results (the last one is the recent one that is irrelevant, 5 are remaining)
   */
  getLast5Results() {
    let last6 = 6;
    const results = this.resultService.userResults.filter((j) => j.quizName === this.quizName);
    console.log(this.quizName);
    if (last6 > results.length) {
      last6 = results.length;
    }
    return results.reverse().slice(0, last6);
  }

  getDate(seconds: number) {
    return new Date(seconds).toLocaleDateString();
  }
}
