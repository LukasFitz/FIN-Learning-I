import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LandingPageComponent} from './landing-page/landing-page.component';
import {LoginScreenComponent} from './login-screen/login-screen.component';
import {HomeComponent} from './home/home.component';
import {ProfileComponent} from './profile/profile.component';
import {canActivate, redirectLoggedInTo, redirectUnauthorizedTo} from '@angular/fire/auth-guard';
import {ChatComponent} from './chat/chat.component';
import {QuizComponent} from './quiz/quiz.component';
import {AdminComponent} from './admin/admin.component';

const redirectUnauthorizedToLanding = () => redirectUnauthorizedTo(['landing']);
const redirectAuthorizedToHome = () => redirectLoggedInTo(['home']);

const routes: Routes = [
  {path: 'landing', component: LandingPageComponent, ...canActivate(redirectAuthorizedToHome)},
  {path: '', component: LandingPageComponent, ...canActivate(redirectAuthorizedToHome)},
  {path: 'login', component: LoginScreenComponent},
  {path: 'home', component: HomeComponent, ...canActivate(redirectUnauthorizedToLanding)},
  {path: 'chat', component: ChatComponent, ...canActivate(redirectUnauthorizedToLanding)},
  {path: 'quiz', component: QuizComponent, ...canActivate(redirectUnauthorizedToLanding)},
  {path: 'profile', component: ProfileComponent},
  {path: 'admin', component: AdminComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
