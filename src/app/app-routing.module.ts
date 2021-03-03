import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { FirstComponent } from './first/first.component';
import { SecondComponent } from './second/second.component';
import { ThirdComponent } from './third/third.component';

const routes: Routes = [
  { path: '', component: FirstComponent },
  { path: 'first', component: FirstComponent },
  { path: 'second', component: SecondComponent },
  { path: 'third', component: ThirdComponent },
  { path: 'first', component: FirstComponent, outlet: 'modalOutlet' },
  { path: 'second', component: SecondComponent, outlet: 'modalOutlet'  },
  { path: 'third', component: ThirdComponent, outlet: 'modalOutlet'  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
