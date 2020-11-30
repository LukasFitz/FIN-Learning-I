import {Component, OnInit} from '@angular/core';
import {CoursePermission} from '../../models/CoursePermission';
import {UserService} from '../../services/user.service';
import {CoursesService} from '../../services/courses.service';
import {QuizServiceFb} from '../../services/quiz.service.fb';
import {Subscription} from 'rxjs';
import {User} from '../../models/user';
import {Course} from '../../models/Course';
import {Quiz, Question} from 'src/index';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {

  constructor(private userService: UserService, private coursesService: CoursesService, private quizService: QuizServiceFb) {
  }

  userSubscription: Subscription;
  coursesSubscription: Subscription;
  searchModules: CoursePermission[] = [];
  allModules: CoursePermission[] = [];
  currentFilterString: string;
  isDisabled = false;
  newModuleName = '';

  /**
   * load all modules and users with permission to edit their quiz
   */
  ngOnInit(): void {
    this.userSubscription = this.userService.getAllUsers().subscribe((users: User[]) => {
      this.coursesSubscription = this.coursesService.getCourses().subscribe((courses: Course[]) => {
        this.searchModules = [];
        this.allModules = [];
        let usiers: User[] = [];
        courses.forEach(c => {
          usiers = [];
          users.filter(k => k.permissions != null && k.permissions.findIndex(l => l === c.name) !== -1).forEach(u => {
            usiers.push(u);
          });
          this.allModules.push({course: c.name, users: usiers, newUserString: ''});
          this.searchModules.push({course: c.name, users: usiers, newUserString: ''});
        });
      });
    });
  }

  /**
   * update searchModules to show the results of the search
   */
  updateFilter(event) {
    this.currentFilterString = event.target.value.toLowerCase();

    const val = event.target.value.toLowerCase();

    this.searchModules = this.allModules.filter((d) => d.course.toLowerCase().indexOf(val) !== -1 || !val);
  }

  /**
   * check if email is valid
   */
  validEmail(input: string): boolean {
    if (input != null && input.includes('@')) {
      const domain = input.split('@', 2);
      const data = domain[1].toLowerCase();
      return data.includes('ovgu.de');
    } else {
      return false;
    }
  }

  /**
   * add permissions to user
   */
  addUser(module: CoursePermission) {
    if (this.validEmail(module.newUserString)) {
      this.userService.getAllUsersOnce().subscribe((users: User[]) => {
        const user = users.find(j => j.email === module.newUserString);

        // wenn null
        if (user.permissions === undefined) {
          user.permissions = [];
        }
        user.permissions.push(module.course);
        this.userService.addPermissionForUser(user.id, module.course);
        module.newUserString = '';
      });
    }
  }

  /**
   * revoke permissions from user
   */
  deleteUser(user: User, module: CoursePermission) {
    this.userService.removePermissionFromUser(user.id, module.course);
  }

  /**
   * delete module from database (will be gone)
   */
  deleteModule(course: string) {
    this.coursesService.deleteModule(course);
    this.searchModules.forEach((module, index) => {
      if (module.course === course) {
        this.searchModules.splice(index, 1);
      }
    });
    this.allModules.forEach((module, index) => {
      if (module.course === course) {
        this.allModules.splice(index, 1);
      }
    });
  }

  /**
   * add module to courses and create a quiz
   */
  addModule() {
    // in courses und quiz
    const newCourse = {name: this.newModuleName, professor: ''};
    this.coursesService.addModule(newCourse);

    const newQuestions: Question[] = [];
    const newQuiz: Quiz = {name: this.newModuleName, id: this.newModuleName, description: '', questions: newQuestions};
    this.quizService.addQuiz(newQuiz);

    // clear feld
    this.newModuleName = '';
  }
}
