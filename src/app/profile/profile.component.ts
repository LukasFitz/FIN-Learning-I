import {Component, OnDestroy, OnInit, ViewChild, HostListener} from '@angular/core';
import {MentorGrade} from '../../models/MentorGrade';
import {UserService} from '../../services/user.service';
import {User} from '../../models/user';
import {Subscription} from 'rxjs';
import {Course} from '../../models/Course';
import {CoursesService} from '../../services/courses.service';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {

  constructor(private userService: UserService, private coursesService: CoursesService) {
  }

  columns = [];

  @ViewChild('myTable') table;
  expanded: any = {};

  isLoading = false;

  user: User;
  userProfileSubscription: Subscription;
  coursesSubscription: Subscription;
  mentorGrades: MentorGrade[] = [];
  searchGrades: MentorGrade[] = [];
  editIndex = -1;
  editGrade = 1;
  search: string;
  currentUserForename = '';
  currentUserLastname = '';
  currentUserNickname = '';

  /**
   * Changes grade number to string.
   * Replaces decimal point to decimal-comma.
   * String has always one decimal digit.
   * @param grade: grade-number containing a decimal-point
   * @return: grade-string containing a decimal-comma and one decimal-digit
   */
  public static getDeciamlCommaAndOneComma(grade): string {
    let commaGrade = grade.toString();
    commaGrade = commaGrade.replace('.', ',');
    if (!commaGrade.includes(',')) {
      commaGrade += ',0';
    }
    return commaGrade;
  }

  /**
   * add the selected module
   */
  onSelect(row) {
    console.log(row);
    this.add(row.course, row.grade);
  }

  /**
   * Subscribe to user profile changes from database. On change -> update user profile
   */
  ngOnInit(): void {
    this.userProfileSubscription = this.userService.fetchUserInformation().subscribe((user: User) => {
      this.user = user;
      this.currentUserForename = user.foreName;
      this.currentUserLastname = user.lastName;
      this.currentUserNickname = user.nickName;
      
      

      // hier drin, um den user und die verfügbaren kurse auf einmal zu haben
      this.coursesSubscription = this.coursesService.getCourses().subscribe((courses) => {
        this.initializeRows(courses, user);
      });
    });
    
    this.search = '';
  }


  private initializeRows(courses: Course[], user: User) {
    this.mentorGrades = [];
    courses.forEach((course) => {
      if (user.grades == null || user.grades.findIndex(j => j.course === course.name) === -1) // nicht bereits vom user eingetragen
      {
        this.mentorGrades.push({
          course: course.name,
          grade: 1.0,
          enabled: true
        });
      }
    });
    this.searchGrades = this.mentorGrades;
  }

  /**
   * Unsubscribe to user profile changes on destroy
   */
  ngOnDestroy(): void {
    this.userProfileSubscription.unsubscribe();
  }

  /**
   * Deleting selected course out of database.
   * @param grade MentorGrade that should be deleted
   */
  delete(grade: MentorGrade): void {
    this.userService.deleteMentorGradeForUser(grade);
  }

  /**
   * Adds a course and corresponding mark in database.
   * @param course Name of the course to add
   * @param mark Corresponding marks to add
   */
  add(course: string, mark: string): void {
    const mentorGrade: MentorGrade = {
      course,
      grade: Number(mark),
      enabled: true
    };
    this.userService.addMentorGrade(mentorGrade);
  }

  /**
   * Adds a course and corresponding mark in database.
   * @param course Name of the course to add
   * @param mark Corresponding marks to add
   */
  addNumber(course: MentorGrade): void {
    this.userService.addMentorGrade(course);
  }

  /**
   * update the displayed modules
   * @param event user put in his search
   */
  updateFilter(event) {
    const val = event.target.value.toLowerCase();
    this.searchGrades = this.mentorGrades.filter((d) => d.course.toLowerCase().indexOf(val) !== -1 || !val);
  }

  /**
   * set the grade of the module, when the slider is moved
   * @param event
   * @param rowIndex
   */
  setGrade(event, rowIndex) {
    this.searchGrades[rowIndex].grade = event.newValue;
  }

  setGrade1(event, rowIndex, row, expanded) {
    this.searchGrades.find(j => j.course === row.course).grade = event.newValue;
    this.searchGrades[rowIndex].grade = event.newValue;
  }

  sortModules() {
    if (this.user && this.user.grades) {
      return this.user.grades.sort((a, b) => a.course > b.course ? 1 : a.course === b.course ? 0 : -1);
    } else {
      return [];
    }
  }

  public getDecimal(grade): string {
    return ProfileComponent.getDeciamlCommaAndOneComma(grade);
  }

  toggleExpandRow(row) {
    console.log('Toggled Expand Row!', row);
    this.table.rowDetail.toggleExpandRow(row);
  }

  onDetailToggle(event) {
    console.log('Detail Toggled', event);
  }

  edit(index: number) {
    if (this.editIndex === index) {
      this.editIndex = -1;
    }
    else {
      this.editIndex = index;
      this.editGrade = this.sortModules()[index].grade;
    }
  }

  changeEditGrade(event) {
    this.editGrade = event.newValue;
  }

  /**
   * change grade of course
   * @param course which grade needs to be changed
   */
  updateGrade(course: MentorGrade) {
    course.grade = this.editGrade;
    this.addNumber(course);
    this.editIndex = -1;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.table.recalculate();
  }
}
