import { ChangeDetectorRef, ComponentFactoryResolver, Injectable, ViewContainerRef } from '@angular/core';
import { ChildrenOutletContexts, Router, RouterOutlet } from '@angular/router';
import { modalRoutes } from './app-routing.module';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class RouteService {

  index = 0;

  modalRouterOutletStack: string[] = [];

  routerOutletMap: Map<string, RouterOutlet> = new Map();

  get isModalOpen(): boolean {
    return this.modalRouterOutletStack.length > 0;
  }

  constructor(
    private router: Router,
  ) {
  }

  addDynamicModalRoutes(): string {
    const name = this.getRouterOutletName();
    this.modalRouterOutletStack.push(name);
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
    this.modalRouterOutletStack.pop();
    this.index = this.index - 1;
  }

  getRouterOutletName(): string {
    const name = 'modal_' + this.randomInt(0, 10000);
    // const name = 'modal_' + this.index; // genera problema 'Cannot activate an already activated outlet'
    this.index = this.index + 1;
    return name;
  }

  getCurrentActiveRouterOutlet(): string {
    return this.modalRouterOutletStack[this.index - 1];
  }

  navigate(url?: string): void {
    if (!this.isModalOpen) {
      this.router.navigate([url]);
    } else if (this.isModalOpen) {
      const routerOutletName = this.getCurrentActiveRouterOutlet();
      const outlets = {};
      (outlets as any) [routerOutletName] = url ? [url] : null;
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
    this.navigate();
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

  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
