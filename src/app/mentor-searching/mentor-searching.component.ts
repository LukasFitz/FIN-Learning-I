import {Component, HostListener, OnDestroy, OnInit, ViewChild, ChangeDetectorRef} from '@angular/core';
import {MentorGrade} from '../../models/MentorGrade';
import {UserService} from '../../services/user.service';
import {User} from '../../models/user';
import {Subscription} from 'rxjs';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {Course} from '../../models/Course';
import {CoursesService} from '../../services/courses.service';
import {Router} from '@angular/router';
import {ChatService} from '../../services/chat.service';


@Component({
  selector: 'app-mentor-searching',
  templateUrl: './mentor-searching.component.html',
  styleUrls: ['./mentor-searching.component.css']
})
export class MentorSearchingComponent implements OnInit, OnDestroy {

  constructor(private userService: UserService,
              private coursesService: CoursesService,
              private chatService: ChatService,
              private router: Router,
              private changeDetection: ChangeDetectorRef) {
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
  ColumnMode = ColumnMode;
  search: string;

  /**
   * add the selected module
   */
  onSelect(row) {
    console.log(row);
    this.requestMentoring(row.course).then(() => {
      this.router.navigate(['chat']);
    });
  }

  /**
   * Subscribe to user profile changes from database. On change -> update user profile
   */
  ngOnInit(): void {
    this.userProfileSubscription = this.userService.fetchUserInformation().subscribe((user: User) => {
      this.user = user;
    });

    this.coursesSubscription = this.coursesService.getCourses().subscribe((courses) => {
      console.log(courses.length);
      this.initializeRows(courses);
    });
    this.search = '';
  }

  /**
   * in search mentoring init course rows
   */
  private initializeRows(courses: Course[]) {
    this.mentorGrades = [];
    courses.forEach((course) => {
      this.mentorGrades.push({
        course: course.name,
        grade: 1.0,
        enabled: true
      });
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
   * update the displayed modules
   * @param event user put in his search
   */
  updateFilter(event) {
    const val = event.target.value.toLowerCase();

    this.searchGrades = this.mentorGrades.filter((d) => d.course.toLowerCase().indexOf(val) !== -1 || !val);
    this.changeDetection.detectChanges();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.table.recalculate();
  }

  /**
   * triggers the search for a mentor for the given course
   * when mentor is found an initial message is sent
   * @param course Course object for which to look for a mentor
   */
  requestMentoring(course): Promise<void> {
    return new Promise((resolve) => {
      this.userService.requestMentoring(course).then((chatRef) => {
        this.chatService.sendInitialMessage(chatRef).then(() => resolve());
      });
    });
  }
}
