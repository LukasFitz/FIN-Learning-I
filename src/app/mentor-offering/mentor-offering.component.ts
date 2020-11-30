import {Component, OnInit} from '@angular/core';
import {MentorGrade} from '../../models/MentorGrade';
import {UserService} from '../../services/user.service';
import {User} from '../../models/user';
import {Subscription} from 'rxjs';
import {ProfileComponent} from '../profile/profile.component';


@Component({
  selector: 'app-mentor-offering',
  templateUrl: './mentor-offering.component.html',
  styleUrls: ['./mentor-offering.component.css']
})
export class MentorOfferingComponent implements OnInit {

  constructor(private userService: UserService) {
  }

  user: User;
  userProfileSubscription: Subscription;

  /**
   * Subscribe to user profile changes from database. On change -> update user profile
   */
  ngOnInit(): void {
    this.userProfileSubscription = this.userService.fetchUserInformation().subscribe((user: User) => {
      this.user = user;
    });
  }

  /**
   * sort modules alphabetical
   */
  sortModules() {
    if (this.user) {
      if (this.user.grades) {
        return this.user.grades.sort((a, b) => a.course > b.course ? 1 : a.course === b.course ? 0 : -1);
      }
    } else {
      return [];
    }
  }

  /**
   * used to disable course offering
   */
  Change(event, course: MentorGrade) {
    this.userService.disableCourse(course, event.target.checked);
  }

  getDecimal(grade): string {
    return ProfileComponent.getDeciamlCommaAndOneComma(grade);
  }
}
