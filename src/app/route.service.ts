import { ChangeDetectorRef, ComponentFactoryResolver, Injectable, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, ActivationStart, ChildrenOutletContexts, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { modalRoutes } from './app-routing.module';
import * as _ from 'lodash';
import { Location } from '@angular/common';


export class StackEntry {
  url!: string | undefined;
  params!: any;

  constructor(url: string | undefined, params: any) {
    this.url = url;
    this.params = params;
  }
}
export class RouterOutletStack {
  public name!: string;
  public stack!: StackEntry[];

  constructor(name: string) {
    this.name = name;
    this.stack = [];
  }
}

@Injectable({
  providedIn: 'root'
})
export class RouteService {

  routerOutletIndex = 0;

  routerOutletStack: RouterOutletStack[] = [];

  routerOutletMap: Map<string, RouterOutlet> = new Map();

  private history: any[] = [];

  get isModalOpen(): boolean {
    return this.routerOutletStack.length > 0;
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private location: Location,
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
    this.routerOutletStack.push(new RouterOutletStack(name));
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

  getCurrentActiveRouterOutlet(): RouterOutletStack {
    return this.routerOutletStack[this.routerOutletIndex - 1];
  }

  navigate(url?: string, params?: any): void {
    if (!this.isModalOpen) {
      this.router.navigate([url], {
        queryParams: params
      });
    } else if (this.isModalOpen) {
      const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
      const outlets = {};
      (outlets as any) [activeRouterOutlet.name] = url ? [`${url}`] : null;
      activeRouterOutlet.stack.push(new StackEntry(url, params));
      this.router.navigate([{ outlets }], {
        skipLocationChange: false,
      });
    }
  }

  goBack(): void {
    if (!this.isModalOpen) {
      this.location.back();
    } else {
      const entry = this.popPreviousUrl();
      if (entry) {
        this.navigate(entry.url, entry.params);
      }
    }
  }

  clearRoute(): void {
    if (!this.isModalOpen) {
      this.router.navigate([null]);
    } else if (this.isModalOpen) {
      const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
      const outlets = {};
      (outlets as any) [activeRouterOutlet.name] = null;
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
    const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
    this.clearRoute();
    this.clearDynamicModalRoutes(activeRouterOutlet.name);
    const outlet = this.routerOutletMap.get(activeRouterOutlet.name);
    if (outlet) {
      outlet.deactivate();
      outlet.ngOnDestroy();
    }
  }

  getActiveRouterOutletByName(name: string): RouterOutlet | undefined {
    return this.routerOutletMap.get(name);
  }

  getRouterOutletParams(name: string): any {

    const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
    if (this.isModalOpen && activeRouterOutlet && activeRouterOutlet.stack.length > 0) {
      const entry = activeRouterOutlet.stack[activeRouterOutlet.stack.length - 1];
      return entry && entry.params ?  entry.params[name] : null;
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

  public getHistory(): string[] {
    return this.history;
  }

  public getPreviousUrl(): StackEntry {
    const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
    return activeRouterOutlet.stack[activeRouterOutlet.stack.length - 2];
  }

  public popPreviousUrl(): StackEntry | undefined {
    const activeRouterOutlet = this.getCurrentActiveRouterOutlet();
    activeRouterOutlet.stack.pop(); // current
    return activeRouterOutlet.stack.pop();  //previous
  }
}
