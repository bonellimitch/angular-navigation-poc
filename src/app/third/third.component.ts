import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouteService } from '../route.service';

@Component({
  selector: 'app-third',
  templateUrl: './third.component.html',
  styleUrls: ['./third.component.scss']
})
export class ThirdComponent implements OnInit, OnDestroy {
  isModal = false;
  outlet!: string;
  number!: number;

  constructor(
    private activatedRoute: ActivatedRoute,
    private route: RouteService
  ) {
    this.number = this.route.getParameter('number');
  }

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe(params => {
      this.isModal = params.isModal;
      this.outlet = params.outlet;
    });
  }

  ngOnDestroy(): void {
    console.log(`third component with number ${this.number} is destroyed`);
  }

  navigate(url: string): void {
    this.route.navigate(url, {
      number: this.route.randomInt(1, 100)
    });
  }

  goBack(): void {
    this.route.goBack();
  }
}
