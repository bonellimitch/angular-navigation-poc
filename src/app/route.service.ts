import { ChangeDetectorRef, ComponentFactoryResolver, Injectable, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, ActivationStart, ChildrenOutletContexts, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { modalRoutes } from './app-routing.module';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class RouteService {

  routerOutletIndex = 0;

  routerOutletStack: string[] = [];

  routerOutletMap: Map<string, RouterOutlet> = new Map();

  routerOutletParamStack: any[] = [];

  get isModalOpen(): boolean {
    return this.routerOutletStack.length > 0;
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    // quick and dirty per risolvere problema apertura N modali
    this.router.events.subscribe(e => {
      if (e instanceof ActivationStart && e.snapshot.outlet.startsWith('modal')) {
        this.routerOutletMap.get(e.snapshot.outlet)?.deactivate();
      }
    });
  }

  addDynamicModalRoutes(): string {
    const name = this.getRouterOutletName();
    this.routerOutletStack.push(name);
    const routes = _.cloneDeep(modalRoutes);
    for (const route of routes) {
      route.outlet = name;
    }

    this.router.config.push(...routes);
    return name;
  }

  clearDynamicModalRoutes(outlet: string): void {
    const routes = this.router.config.filter(route => route.outlet !== outlet);
    this.router.resetConfig(routes);
    this.routerOutletStack.pop();
    this.routerOutletIndex = this.routerOutletIndex - 1;
  }

  getRouterOutletName(): string {
    // const name = 'modal_' + this.randomInt(0, 10000);
    const name = 'modal_' + this.routerOutletIndex; // genera problema 'Cannot activate an already activated outlet'
    this.routerOutletIndex = this.routerOutletIndex + 1;
    return name;
  }

  getCurrentActiveRouterOutlet(): string {
    return this.routerOutletStack[this.routerOutletIndex - 1];
  }

  navigate(url?: string, params?: any): void {
    if (!this.isModalOpen) {
      this.router.navigate([url], {
        queryParams: params
      });
    } else if (this.isModalOpen) {
      const routerOutletName = this.getCurrentActiveRouterOutlet();
      const outlets = {};
      (outlets as any) [routerOutletName] = url ? [`${url}`] : null;
      this.routerOutletParamStack.push(params);
      this.router.navigate([{ outlets }], {
        skipLocationChange: false,
      });
    }
  }

  goBack(): void {
    // this.loca
  }

  clearRoute(): void {
    if (!this.isModalOpen) {
      this.router.navigate([null]);
    } else if (this.isModalOpen) {
      const routerOutletName = this.getCurrentActiveRouterOutlet();
      const outlets = {};
      (outlets as any) [routerOutletName] = null;
      this.router.navigate([{ outlets }], {
        skipLocationChange: false,
      });
    }
  }

  createRouterOutlet(
    parentContexts: ChildrenOutletContexts,
    location: ViewContainerRef,
    resolver: ComponentFactoryResolver,
    name: string,
    changeDetector: ChangeDetectorRef): RouterOutlet {
      const outlet = new RouterOutlet(parentContexts, location, resolver, name, changeDetector);
      this.routerOutletMap.set(name, outlet);
      return outlet;
  }

  clearRouterOutlet(): void {
    const name = this.getCurrentActiveRouterOutlet();
    this.clearRoute();
    this.clearDynamicModalRoutes(name);
    const outlet = this.routerOutletMap.get(name);
    if (outlet) {
      outlet.deactivate();
      outlet.ngOnDestroy();
    }
  }

  getActiveRouterOutletByName(name: string): RouterOutlet | undefined {
    return this.routerOutletMap.get(name);
  }

  getRouterOutletParams(name: string): any {
    if (this.isModalOpen && this.routerOutletParamStack.length > 0) {
      const params = this.routerOutletParamStack[this.routerOutletParamStack.length - 1];
      return params ?  params[name] : null;
    }
    return null;
  }

  getParameter(name: string): any {
    return this.getRouterOutletParams(name) ?
      this.getRouterOutletParams(name) : this.activatedRoute.snapshot.queryParams.number;
  }

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
