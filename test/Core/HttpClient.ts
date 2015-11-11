/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-ajax.d.ts" />

/// <reference path="../../node_modules/rx/ts/rx.lite.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.testing.d.ts" />

describe("HttpClient", () => {
    beforeEach(function() {
      jasmine.Ajax.install();
    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
    });

    it("get() with just a request url", (done) => {
        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        var requestUrl = '/some/cool/url';
        var responseData = 42;

        client.get(requestUrl).then(response=> {
            expect(response).toEqual(responseData);
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("GET");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData.toString()
        });
    });

    it("get() with error response", (done) => {
        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        var requestUrl = '/some/cool/url';
        var responseData = 42;

        client.get(requestUrl).then(response=> {
            fail("Promise should have signalled failure");
            done();
        }, (reason)=> {
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("GET");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 400,
        });
    });

    it("get() with raw response", (done) => {
        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        var requestUrl = '/some/cool/url';
        var responseData = "bar";

        client.get(requestUrl, null, { raw: true }).then(response=> {
            expect(response).toEqual(responseData);
            done();
        }, (reason)=> {
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("GET");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData
        });
    });

    it("get() with params", (done) => {
        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        var requestUrl = '/some/cool/url';
        var requestParams = { 'id': 42 };
        var responseData = 42;

        client.get(requestUrl, requestParams).then(response=> {
            expect(response).toEqual(responseData);
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("GET");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl+"?id=42");

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData.toString()
        });
    });

    it("get() with params and options", (done) => {
        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        var requestUrl = '/some/cool/url';
        var requestParams = { 'id': 42 };
        var responseData = 42;
        var options: wx.IHttpClientOptions = {
            params: { 'bar': 'baz' },
            headers: { 'foo': 'bar' },
        }

        client.get(requestUrl, requestParams, options).then(response=> {
            expect(response).toEqual(responseData);
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("GET");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl+"?bar=baz"); // params from options overide params argument
        expect(jasmine.Ajax.requests.mostRecent().requestHeaders['foo']).toEqual('bar');

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData.toString()
        });
    });

    it("get() with params and existing query parameters", (done) => {
        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        var requestUrl = '/some/cool/url?foo=bar';
        var requestParams = { 'id': 42 };
        var responseData = 42;

        client.get(requestUrl, requestParams).then(response=> {
            expect(response).toEqual(responseData);
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("GET");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl+"&id=42");

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData.toString()
        });
    });

    it("post()", (done) => {
        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        var requestUrl = '/some/cool/url';
        var requestData = { 'foo': 'bar'};

        client.post(requestUrl, requestData).then(response=> {
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("POST");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);
        expect(jasmine.Ajax.requests.mostRecent().data().foo).toEqual(requestData.foo);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
        });
    });

    it("put()", (done) => {
        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        var requestUrl = '/some/cool/url';
        var requestData = { 'foo': 'bar'};

        client.put(requestUrl, requestData).then(response=> {
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("PUT");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);
        expect(jasmine.Ajax.requests.mostRecent().data().foo).toEqual(requestData.foo);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
        });
    });

    it("delete()", (done) => {
        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        var requestUrl = '/some/cool/url';

        client.delete(requestUrl).then(response=> {
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("DELETE");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
        });
    });

    it("options()", (done) => {
        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        var requestUrl = '/some/cool/url';

        client.options(requestUrl).then(response=> {
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().method).toBe("OPTIONS");
        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
        });
    });

    it("utilizes locally configured dump() function", () => {
        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        var requestUrl = '/some/cool/url';
        var requestData = { 'foo': 'bar'};

        var options: wx.IHttpClientOptions = {
            dump: (data: any)=> {
                return JSON.stringify(requestData);
            }
        };

        client.configure(options);

        client.post(requestUrl, { 'foo': 'baz'})

        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);
        expect(jasmine.Ajax.requests.mostRecent().data().foo).toEqual(requestData.foo);
    });

    it("utilizes locally configured load() function", (done) => {
        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);
        var requestUrl = '/some/cool/url';
        var responseData = 'bar';

        var options: wx.IHttpClientOptions = {
            load: (data: string)=> {
                return "foo_" + data;
            }
        };

        client.configure(options);

        client.get(requestUrl).then(response=> {
            expect(response).toEqual("foo_bar");
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData
        });
    });

    it("utilizes globally configured dump() function", () => {
        var requestUrl = '/some/cool/url';
        var requestData = { 'foo': 'bar'};

        var options = wx.getHttpClientDefaultConfig();
        options.dump = (data: any)=> {
            return JSON.stringify(requestData);
        };

        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);

        client.post(requestUrl, { 'foo': 'baz'})

        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);
        expect(jasmine.Ajax.requests.mostRecent().data().foo).toEqual(requestData.foo);
    });

    it("utilizes globally configured load() function", (done) => {
        var requestUrl = '/some/cool/url';
        var responseData = 'bar';

        var options = wx.getHttpClientDefaultConfig();
        options.load = (data: string)=> {
            return "foo_" + data;
        };

        var client = wx.injector.get<wx.IHttpClient>(wx.res.httpClient);

        client.get(requestUrl).then(response=> {
            expect(response).toEqual("foo_bar");
            done();
        }, (reason)=> {
            fail(reason);
            done();
        });

        expect(jasmine.Ajax.requests.mostRecent().url).toBe(requestUrl);

        jasmine.Ajax.requests.mostRecent().respondWith({
            "status": 200,
            "contentType": 'text/plain',
            "responseText": responseData
        });
    });
});
