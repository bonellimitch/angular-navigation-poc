import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Routable, ThirdContext } from '../route.model';
import { RouteService } from '../route.service';

@Component({
  selector: 'app-third',
  templateUrl: './third.component.html',
  styleUrls: ['./third.component.scss']
})
export class ThirdComponent implements OnInit, OnDestroy, Routable {
  isModal = false;
  outlet!: string;
  number!: number;

  @HostBinding('id')
  id!: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private route: RouteService
  ) {
    this.number = this.route.getParameter(this.activatedRoute, 'number');
    this.id = this.route.getParameter(this.activatedRoute, 'id');
    console.log(`third component id is ${this.id}`);  
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    console.log(`third component with number ${this.number} is destroyed`);
  }

  saveContext(): void {
    console.log('called saved context third component');
    const context = new ThirdContext();
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
