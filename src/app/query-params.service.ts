import { EventEmitter, Injectable } from '@angular/core';
import { ActivationEnd, Router } from '@angular/router';
import {distinct, filter, map} from 'rxjs/operators';

interface Storage {
  put: <T>(key: string, value: T) => T;
  get: <T>(key: string, defaultValue?: T) => T;
}

const KEY_QUERYPARAMS = 'queryParams';

@Injectable({
  providedIn: 'root'
})
export class QueryParamsService {
  onQueryParamsChange = new EventEmitter<any>();
  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter(e => (e instanceof ActivationEnd) && (Object.keys(e.snapshot.queryParams).length > 0)),
        map(e => e instanceof ActivationEnd ? e.snapshot.queryParams : {})
      )
      .subscribe(params => {
        this.storage.put(KEY_QUERYPARAMS, params);
        this.onQueryParamsChange.emit(params);
      });
  }

  private get storage(): Storage {
    return {
      put: (key, value) => {
        sessionStorage.setItem(key, JSON.stringify(value));
        return value;
      },
      get: (key, defaultValue?) => {
        let v = JSON.parse(sessionStorage.getItem(key) as string);
        if (v == null && defaultValue !== undefined) {
          v = defaultValue;
        }
        return v;
      }
    } as Storage;
  }

  getQueryParams() {
    return this.storage.get<any>(KEY_QUERYPARAMS, {});
  }

  /**
   * 
   * @param key : Chiave query param
   * @param force : Limitare o meno la lettura query params da router outlet non principali (DA IMPLEMENTARE)
   */
  getQueryParam(key: string, force = false) {
    const q = this.getQueryParams();
    if (key in q) {
      return q[key];
    }
    return undefined;
  }

  onQueryParamChange(key: string) {
    return this.onQueryParamsChange.pipe(
      filter(params => key in params),
      map(params => params[key]),
      distinct()
    );
  }
}
