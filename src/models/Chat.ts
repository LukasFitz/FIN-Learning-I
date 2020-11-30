import {Message} from './Message';
import {DocumentReference} from '@angular/fire/firestore';

export class Chat {
  user1Id: DocumentReference;
  user2Id: DocumentReference;
  module: string;
  messages: Message[];
  chatRef?: DocumentReference;
  //user1 ist der mentee
  user1Name?: string;
  //user2 ist der mentor
  user2Name?: string;
  notificationUser1?: boolean;
  notificationUser2?: boolean;
  isActive: boolean
}
