import {AngularFirestore, DocumentReference} from '@angular/fire/firestore';
import {AuthenticationService} from './authentication.service';
import {Injectable} from '@angular/core';
import {User} from '../models/user';
import {Observable, Subscription} from 'rxjs';
import {concatMap, filter, map, share} from 'rxjs/operators';
import {Message} from '../models/Message';
import * as firebase from 'firebase';
import {Chat} from '../models/Chat';
import {UserService} from './user.service';

@Injectable({
  providedIn: 'root'
})

/**
 * Service that handles saving and getting User Chats from Firebase
 */
export class ChatService {

  constructor(private afs: AngularFirestore,
              private auth: AuthenticationService,
              private userService: UserService) {

    this.firstLoad = true;
    this.chatReferencesSubscription = this.getUserChats().subscribe((chatReferences) => {
      if (chatReferences) {
        this.chatReferences = chatReferences;
      }
      this.subscribeToChats();
    });

    this.userProfileSubscription = this.userService.fetchUserInformation().subscribe((user) => {
      this.currentUserName = user.foreName + ' ' + user.lastName;
    });

  }

  public chatReferences: DocumentReference[] = [];

  userNames: string;
  currentUserName: string;
  firstLoad: boolean;
  public chatSubscriptions: Subscription[] = [];
  public chatReferencesSubscription: Subscription;
  public chats: Chat[] = [];
  userProfileSubscription: Subscription;
  public currentChat: Chat;
  public chatsWithNotifications: Chat[] = [];
  public globalNotification = false;
  public openChatID: number = null;

  /**
   * returns an Observable of an DocumentReference array that contains all references to chats for the currently logged
   * in User
   */
  public getUserChats(): Observable<DocumentReference[]> {
    return this.auth.getAuthState().pipe(
      filter((user) => user != null),
      concatMap((user) => {
        if (user) {
          return this.afs.collection('users').doc(user.uid).valueChanges().pipe(map((value) => {
            const userInformation: User = value as User;
            return userInformation.chats;
          }));
        }
      }), share());
  }

  /**
   * Updates the given chat with the given message in the database
   * @param message Message object to add to the chat
   * @param chat Chat object that needs to be updated
   */
  public addMessageToChat(message: Message, chat: Chat): Promise<any> {
    return chat.chatRef.update({
      notificationUser1: chat.notificationUser1,
      notificationUser2: chat.notificationUser2,
      messages: firebase.firestore.FieldValue.arrayUnion(message)
    });
  }

  /**
   * Chat getter
   * @param chatReference DocumentReference of the Chat to be get
   */
  public getChat(chatReference: DocumentReference): Observable<Chat> {
    return this.afs.doc(chatReference).valueChanges().pipe(map(value => value as Chat));
  }

  /**
   * add archive flag to chat in firebase
   * @param chatRef DocumentRefence of chat to be archived
   */
  public archiveChat(chatRef: DocumentReference) {
    return new Promise(resolve => {
      this.afs.doc(chatRef).get().toPromise().then(chat => {
        const chatObject = chat.data() as Chat;
        chatObject.isActive = false;
        this.afs.doc(chatRef).set(chatObject);
      });
    });
  }

  /**
   * If chat is viewed, remove the notification from chat bar
   */
  removeNotification() {
    this.chatsWithNotifications = this.chatsWithNotifications.filter(notificationChat => notificationChat !== this.currentChat);

    this.globalNotification = this.chatsWithNotifications.length > 0;

    this.auth.getCurrentUser().then(value => {
      if (this.currentChat.user1Id.id === value.uid) {
        this.currentChat.chatRef.update({
          notificationUser1: false
        });
      } else {
        this.currentChat.chatRef.update({
          notificationUser2: false
        });
      }
    });
  }

  private subscribeToChats() {
    this.chatSubscriptions.forEach(sub => sub.unsubscribe());
    this.chats = [];
    this.chatReferences.forEach(ref => {
      this.chatSubscriptions.push(this.getChat(ref).subscribe(chat => {
        if (chat) {
          this.chats = this.chats.filter(singleChat => singleChat.chatRef !== ref);
          chat.chatRef = ref;
          if (this.currentChat) {
            this.setNotifications(chat);
          }
          this.chats.push(chat);
          if (this.currentChat && (this.currentChat.module === chat.module)) {
            this.currentChat = chat;
          }
          this.chats.sort((a, b) => this.compare(a, b));

          if (this.firstLoad && this.chatReferences.length === this.chats.length) {
            this.currentChat = this.chats[0];
            this.chats.forEach(checkChat => {
              this.setNotifications(checkChat);
            });
            this.firstLoad = false;
          }
        }
      }));
    });
  }

  private setNotifications(chat: Chat): void {
    this.auth.getCurrentUser().then(value => {
      if ((chat.notificationUser1 && chat.user1Id.id === value.uid)) {
        this.globalNotification = true;
        if (this.currentChat.module !== chat.module) {
          this.chatsWithNotifications.push(chat);
        }
      } else if (chat.notificationUser2 && chat.user2Id.id === value.uid) {
        this.globalNotification = true;
        if (this.currentChat.module !== chat.module) {
          this.chatsWithNotifications.push(chat);
        }
      }
    });
  }

  /**
   * Helper-Function.
   * Sorts the chats orderes by timestamp of last message. If chat has no messages these
   * chat will stay at the top of the chat-list.
   * @param a First Chat
   * @param b Second Chat
   * a and b will be compared.
   */
  compare(a, b): number {
    if (a.messages.length === 0 || b.messages.length === 0) {
      return -1;
    } else if (a.messages.length > 0 && b.messages.length > 0 &&
      a.messages[a.messages.length - 1].timestamp.valueOf() > b.messages[b.messages.length - 1].timestamp.valueOf()) {
      return -1;
    } else {
      return 1;
    }
  }

  /**
   * push init message to chat, to open a nice conversation and avoid bugs with empty chats
   * @param chatRef DocumentReference to the Chat where the message should be send
   */
  sendInitialMessage(chatRef: DocumentReference): Promise<void> {
    return new Promise(resolve => {
      this.afs.doc(chatRef).get().toPromise().then(chat => {
        const chatObject = chat.data() as Chat;
        const message: Message = {
          sender: chatObject.user2Name,
          content: 'Hey! Wie kann ich dir helfen?',
          timestamp: new Date(),
        };
        chatRef.update({
          notificationUser1: false,
          notificationUser2: true,
          messages: firebase.firestore.FieldValue.arrayUnion(message)
        }).then(resolve);
      });
    });
  }
}
