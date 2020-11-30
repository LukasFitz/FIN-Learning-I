import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NgModule} from '@angular/core';

import {HttpClientModule} from '@angular/common/http';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginScreenComponent} from './login-screen/login-screen.component';
import {AuthenticationService} from '../services/authentication.service';
import {HomeComponent} from './home/home.component';
import {FormBuilder, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {AngularFireAuth, AngularFireAuthModule} from '@angular/fire/auth';
import {environment} from '../environments/environment';
import {AngularFireModule} from '@angular/fire';
import {UserService} from '../services/user.service';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {AppBootstrapModule} from './app-bootstrap.module';
import {ModalModule, BsModalRef} from 'ngx-bootstrap/modal';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {LandingPageComponent} from './landing-page/landing-page.component';
import {AngularFireAuthGuard} from '@angular/fire/auth-guard';
import {ProfileComponent} from './profile/profile.component';
import {CollapseModule} from 'ngx-bootstrap/collapse';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {NgxBootstrapSliderModule} from 'ngx-bootstrap-slider';
import {CoursesService} from '../services/courses.service';
import {ChatComponent} from './chat/chat.component';
import {AdminComponent} from './admin/admin.component';
import {MentorOfferingComponent} from '../app/mentor-offering/mentor-offering.component';
import {MentorSearchingComponent} from '../app/mentor-searching/mentor-searching.component';
import {ChatService} from '../services/chat.service';
import {QuizServiceFb} from '../services/quiz.service.fb';
import {ResultService} from '../services/result.service';
import {QuizComponent} from '../app/quiz/quiz.component';
import {StartQuizComponent} from '../app/start-quiz/start-quiz.component';
import {ProgressbarModule} from 'ngx-bootstrap/progressbar';
import {ButtonsModule} from 'ngx-bootstrap/buttons';
import {CarouselModule} from 'ngx-bootstrap/carousel';
import {AccordionModule} from 'ngx-bootstrap/accordion';
import {AutosizeModule} from 'ngx-autosize';
import {TimepickerModule} from 'ngx-bootstrap/timepicker';
import {TabsModule} from 'ngx-bootstrap/tabs';

@NgModule({
  declarations: [
    AppComponent,
    LoginScreenComponent,
    HomeComponent,
    LandingPageComponent,
    ProfileComponent,
    ChatComponent,
    MentorOfferingComponent,
    MentorSearchingComponent,
    QuizComponent,
    StartQuizComponent,
    AdminComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    RouterModule,
    AppBootstrapModule,
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    CollapseModule.forRoot(),
    NgxDatatableModule,
    NgxBootstrapSliderModule,
    ProgressbarModule.forRoot(),
    ButtonsModule.forRoot(),
    CarouselModule.forRoot(),
    AutosizeModule,
    AccordionModule.forRoot(),
    TimepickerModule.forRoot(),
    TabsModule.forRoot()
  ],
  providers: [
    AuthenticationService,
    FormBuilder,
    AngularFireAuth,
    UserService,
    BsModalRef,
    AngularFireAuthGuard,
    UserService,
    CoursesService,
    ChatService,
    QuizServiceFb,
    ResultService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
