import { Component } from '@angular/core';
import { QueryParamsService } from './query-params.service';
import { RouteService } from './route.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'angular-navigation-poc';

  constructor(
    private readonly queryService: QueryParamsService,
    private routeService: RouteService
    ){
    queryService.onQueryParamsChange.subscribe((p: any) => console.log('All params', p));
    queryService.onQueryParamChange('number').subscribe(n => console.log('Number param', n))
  }
}
