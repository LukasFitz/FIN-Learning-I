import {DocumentReference} from '@angular/fire/firestore';
import {
  MentorGrade
} from './MentorGrade';

export class User {
  id?: string;
  email: string;
  foreName: string;
  lastName: string;
  nickName?: string;
  grades?: MentorGrade[];
  chats?: DocumentReference[];
  results?: DocumentReference[];
  permissions?: string[];
  isAdmin?: boolean;
  lotteryBalls?: number;
}
