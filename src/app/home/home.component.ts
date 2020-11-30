import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {AuthenticationService} from '../../services/authentication.service';
import {UserService} from '../../services/user.service';
import {ChatService} from '../../services/chat.service';
import {Router} from '@angular/router';
import {Chat} from '../../models/Chat';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private userService: UserService,
              public chatService: ChatService,
              private authService: AuthenticationService,
              private changeDetection: ChangeDetectorRef,
              private router: Router) {
  }

  ngOnInit(): void {
  }

  logout() {
    this.authService.logout();
  }

  /**
   * open specific chat from home site overview
   * @param i the ID of the displayed chat
   */
  openChat(i: number): void {
    this.chatService.openChatID = i;
    this.router.navigateByUrl('/chat');
  }

  /**
   * show notifications on home screen
   */
  checkForNotifications(): boolean {
    return this.chatService.globalNotification;
  }

  /**
   * Check whether there are new notifications
   * @param chat shows notification icon on specific chat
   */
  public checkNotificationsForChat(chat: Chat): boolean {
    return this.chatService.chatsWithNotifications.includes(chat);
  }
}
