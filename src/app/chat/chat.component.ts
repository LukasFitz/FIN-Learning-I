import {AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UserService} from '../../services/user.service';
import {ChatService} from '../../services/chat.service';
import {Message} from '../../models/Message';
import {Chat} from '../../models/Chat';
import {AuthenticationService} from '../../services/authentication.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {

  constructor(private userService: UserService,
              public chatService: ChatService,
              private authService: AuthenticationService,
              private changeDetection: ChangeDetectorRef) {
  }

  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  @ViewChild('chatContent') private chatContent: ElementRef;

  chatHeight = window.innerHeight * 0.8;
  dynamicHeight = window.innerHeight * 0.8;

  /**
   * Build the chat and scroll the chat messages to the bottom
   */
  ngOnInit(): void {
    this.scrollToBottom();
    this.getChat(this.chatService.openChatID === null ? 0 : this.chatService.openChatID);
    this.chatService.openChatID = null;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  /**
   * Scroll to bottom of the window
   */
  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) {
    }
  }

  /**
   * used to display the chat partners username
   * (no equal to own username)
   * @param chat
   */
  displayChatPartnerName(chat: Chat) {
    let chatPartnerName = '';
    if (this.chatService.currentUserName === chat.user1Name) {
      chatPartnerName = chat.user2Name;
    } else {
      chatPartnerName = chat.user1Name;
    }

    return chatPartnerName;
  }

  /**
   * Adds a Message to specific chat
   * On new message, notify the receiver (notificationUser)
   * @param content content of the message
   * @param event event handler
   */
  public addMessageToChat(content: string, event?): void {
    if (event) {
      event.preventDefault();
    }
    if (content.trim().length > 0) {
      this.authService.getCurrentUser().then((user) => {
        this.userService.getNameForUserUid(user.uid).then(name => {
          const message: Message = {
            content,
            sender: name,
            timestamp: new Date()
          };
          if (this.chatService.currentChat.user1Id.id === user.uid) {
            this.chatService.currentChat.notificationUser2 = true;
            this.chatService.currentChat.notificationUser1 = false;
          } else {
            this.chatService.currentChat.notificationUser1 = true;
            this.chatService.currentChat.notificationUser2 = false;
          }
          this.chatService.addMessageToChat(message, this.chatService.currentChat).then(() => {
            this.chatService.currentChat = this.chatService.chats[0];
            this.changeDetection.detectChanges();
          });
        });
      });
    }
    this.chatContent.nativeElement.value = '';
  }

  /**
   * If chats are finished, they can be archived
   */
  archiveChat() {
    this.chatService.archiveChat(this.chatService.currentChat.chatRef).then(() => {
      this.getChat(0);
      if (this.chatService.chats.length === 0) {
        this.chatService.currentChat = null;
      }
    });
  }

  /**
   * Get the select Message-Array of the specified chat.
   * @param i Chat-Reference-ID to get
   */
  getChat(i: number) {
    if (this.chatService.chats.length > 0) {
      this.chatService.currentChat = this.chatService.chats[i];
      this.chatService.removeNotification();
      this.chatService.userNames = this.chatService.chats[i].user1Name + ' und ' + this.chatService.chats[i].user2Name;
      this.changeDetection.detectChanges();
    }
  }

  /**
   * Check whether there are new notifications
   * @param chat shows notification icon on specific chat
   */
  public checkNotificationsForChat(chat: Chat): boolean {
    return this.chatService.chatsWithNotifications.includes(chat);
  }

  /**
   * Adjust height of textfield at the bottom of chats
   */
  onResized(event) {
    // event ist höhe des Textfelds
    this.dynamicHeight = this.chatHeight - event + 34;
    console.log(this.dynamicHeight);
  }
}
