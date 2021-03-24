import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Routable, SecondContext } from '../route.model';
import { RouteService } from '../route.service';

@Component({
  selector: 'app-second',
  templateUrl: './second.component.html',
  styleUrls: ['./second.component.scss']
})
export class SecondComponent implements OnInit, OnDestroy, Routable {

  @HostBinding('id')
  id: string;

  isModal = false;
  outlet!: string;
  number!: number;

  get showBackButton(): boolean {
    return this.route.showBackButton(this.activatedRoute);
  }

  constructor(
    // private router: Router,
    private activatedRoute: ActivatedRoute,
    private route: RouteService
  ) {
    this.number = this.route.getParameter(this.activatedRoute, 'number');
    this.id = this.route.getParameter(this.activatedRoute, 'id');
    console.log(`second component id is ${this.id}`);  
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    console.log(`second component with number ${this.number} is destroyed`);
  }

  saveContext(): void {
    console.log('called saved context second component');
    const context = new SecondContext();
    context.data = {
      number: this.number
    };
    this.route.setComponentSessionData(this.id, context);
  }

  navigate(url: string): void {
    this.route.navigate(url, {
      number: this.route.randomInt(1, 100)
    }, this);
  }

  goBack(): void {
    this.route.goBack(this);
  }
}
