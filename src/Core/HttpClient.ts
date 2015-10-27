"use strict";

/**
 * Simple http client inspired by https://github.com/radiosilence/xr
 */
export default class HttpClient implements wx.IHttpClient {
  private static Methods = {
    GET: 'get',
    POST: 'post',
    PUT: 'put',
    DELETE: 'delete',
    PATCH: 'patch',
    OPTIONS: 'options'
  };

  private static Events = {
    READY_STATE_CHANGE: 'readystatechange',
    LOAD_START: 'loadstart',
    PROGRESS: 'progress',
    ABORT: 'abort',
    ERROR: 'error',
    LOAD: 'load',
    TIMEOUT: 'timeout',
    LOAD_END: 'loadend'
  };

  private static defaults: wx.IHttpClientOptions = {
    method: HttpClient.Methods.GET,
    data: undefined,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    dump: JSON.stringify,
    load: JSON.parse,
    xmlHttpRequest: () => new XMLHttpRequest(),
    promise: fn => new Promise(fn)
  };

  private res(xhr: XMLHttpRequest) {
    return {
      status: xhr.status,
      response: xhr.response,
      xhr: xhr
    };
  }

  private assign(l: any, ...rs): any {
    for (const i in rs) {
      if (!{}.hasOwnProperty.call(rs, i))
        continue;

      const r = rs[i];
      if (typeof r !== 'object')
        continue;

      for (const k in r) {
        if (!{}.hasOwnProperty.call(r, k))
          continue;
        l[k] = r[k];
      }
    }

    return l;
  }

  private config: wx.IHttpClientOptions = <any>{};

  private promise<T>(args, fn): Promise<T> {
    return ((args && args.promise)
      ? args.promise
      : (this.config.promise || HttpClient.defaults.promise)
    )(fn);
  }

  public configure(opts: wx.IHttpClientOptions): void {
    this.config = this.assign({}, this.config, opts);
  }

  public request<T>(options: wx.IHttpClientOptions): Promise<T> {
    return this.promise(options, (resolve, reject) => {
      const opts = this.assign({}, HttpClient.defaults, this.config, options);
      const xhr = opts.xmlHttpRequest();

      if (typeof opts.url !== "string" || opts.url.length === 0)
        reject(new Error("HttpClient: Please provide a request url"));

      if (!HttpClient.Methods.hasOwnProperty(opts.method.toUpperCase()))
        reject(new Error("HttpClient: Unrecognized http-method: " + opts.method));

      let requestUrl = <string> opts.url;

      if (opts.params) {
        requestUrl += requestUrl.indexOf('?') !== -1 ? (requestUrl[requestUrl.length - 1] != '&' ? '&' : '') : '?';

        // append request parameters
        requestUrl += Object.getOwnPropertyNames(opts.params).map(x=> `${x}=${opts.params[x]}`).join('&');
      }

      xhr.open(
        opts.method.toUpperCase(),
        requestUrl,
        true
      );

      xhr.addEventListener(HttpClient.Events.LOAD, () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let data = null;
          if (xhr.responseText) {
            data = opts.raw === true
              ? xhr.responseText : opts.load(xhr.responseText);
          }
          resolve(data);
        } else {
          reject(this.res(xhr));
        }
      });

      xhr.addEventListener(HttpClient.Events.ABORT, () => reject(this.res(xhr)));
      xhr.addEventListener(HttpClient.Events.ERROR, () => reject(this.res(xhr)));
      xhr.addEventListener(HttpClient.Events.TIMEOUT, () => reject(this.res(xhr)));

      for (const k in opts.headers) {
        if (!{}.hasOwnProperty.call(opts.headers, k)) 
          continue;
        
        xhr.setRequestHeader(k, opts.headers[k]);
      }

      for (const k in opts.events) {
        if (!{}.hasOwnProperty.call(opts.events, k)) 
          continue;
        
        xhr.addEventListener(k, opts.events[k].bind(null, xhr), false);
      }

      const data = (typeof opts.data === 'object' && !opts.raw)
        ? opts.dump(opts.data)
        : opts.data;

      if (data !== undefined)
        xhr.send(data);
      else
        xhr.send();
    });
  }

  public get<T>(url: string, params?: Object, options?: wx.IHttpClientOptions): Promise<T> {
    let opts: wx.IHttpClientOptions = { url: url, method: HttpClient.Methods.GET, params: params };
    return <Promise<T>> this.request(this.assign(opts, options));
  }

  public put<T>(url: string, data: T, options?: wx.IHttpClientOptions): Promise<any> {
    let opts: wx.IHttpClientOptions = { url: url, method: HttpClient.Methods.PUT, data: data };
    return this.request(this.assign(opts, options));
  }

  public post<T>(url: string, data: T, options?: wx.IHttpClientOptions): Promise<any> {
    let opts: wx.IHttpClientOptions = { url: url, method: HttpClient.Methods.POST, data: data };
    return this.request(this.assign(opts, options));
  }

  public patch<T>(url: string, data: T, options?: wx.IHttpClientOptions): Promise<any> {
    let opts: wx.IHttpClientOptions = { url: url, method: HttpClient.Methods.PATCH, data: data };
    return this.request(this.assign(opts, options));
  }

  public delete(url: string, options?: wx.IHttpClientOptions): Promise<any> {
    let opts: wx.IHttpClientOptions = { url: url, method: HttpClient.Methods.DELETE };
    return this.request(this.assign(opts, options));
  }

  public options(url: string, options?: wx.IHttpClientOptions): Promise<any> {
    let opts: wx.IHttpClientOptions = { url: url, method: HttpClient.Methods.OPTIONS };
    return this.request(this.assign(opts, options));
  }
}
