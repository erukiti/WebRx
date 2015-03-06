/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />
/// <reference path="../TestUtils.ts" />

describe("VirtualChildNodes",() => {
    function createChild(id: string): Element {
        var child = document.createElement("div");
        child.setAttribute("id", id);
        return child;
    }

    it("smoke-test",() => {
        loadFixtures('templates/Core/VirtualChildNodes.html');

        var el = <HTMLElement> document.querySelector("#empty-node");
        var proxy = new wx.internal.VirtualChildNodes(el, false);

        expect(proxy.childNodes.length).toEqual(el.childNodes.length);

        var child1 = createChild("child1");
        var child2 = createChild("child2");
        var child3 = createChild("child3");

        // append
        proxy.appendChilds([child1, child2, child3]);
        expect(proxy.childNodes.length).toEqual(el.childNodes.length);

        expect(testutils.allAttributes2String(testutils.nodeChildrenToArray(el), "id")).toEqual(
            testutils.allAttributes2String(proxy.childNodes, "id"));

        var child4 = createChild("child4");
        var child5 = createChild("child5");
        var child6 = createChild("child6");

        // insert
        proxy.insertChilds(2, [child4, child5, child6]);
        expect(proxy.childNodes.length).toEqual(el.childNodes.length);

        expect(testutils.allAttributes2String(testutils.nodeChildrenToArray(el), "id")).toEqual(
            testutils.allAttributes2String(proxy.childNodes, "id"));

        // remove - keepDom
        proxy.removeChilds(1, 2, false);
        expect(proxy.childNodes.length).toEqual(el.childNodes.length);

        expect(testutils.allAttributes2String(testutils.nodeChildrenToArray(el), "id")).toEqual(
            testutils.allAttributes2String(proxy.childNodes, "id"));

        // clear
        proxy.clear();
        expect(proxy.childNodes.length).toEqual(el.childNodes.length);

        expect(testutils.allAttributes2String(testutils.nodeChildrenToArray(el), "id")).toEqual(
            testutils.allAttributes2String(proxy.childNodes, "id"));
    });

    it("smoke-test - with aliens",() => {
        loadFixtures('templates/Core/VirtualChildNodes.html');

        var el = <HTMLElement> document.querySelector("#empty-node");
        var proxy = new wx.internal.VirtualChildNodes(el, false);
        var aliens = [];
        var alien: Node;

        // insert alien at the beginning
        alien = createChild("child10");
        aliens.push(alien);
        el.appendChild(alien);

        expect(proxy.childNodes.length).toEqual(el.childNodes.length - aliens.length);

        var child1 = createChild("child1");
        var child2 = createChild("child2");
        var child3 = createChild("child3");

        // append
        proxy.appendChilds([child1, child2, child3]);
        expect(proxy.childNodes.length).toEqual(el.childNodes.length - aliens.length);

        // insert alien
        alien = createChild("child11");
        aliens.push(alien);
        el.insertBefore(alien, child2);

        expect(testutils.allAttributes2String(testutils.nodeChildrenToArray(el), "id", aliens)).toEqual(
            testutils.allAttributes2String(proxy.childNodes, "id"));

        var child4 = createChild("child4");
        var child5 = createChild("child5");
        var child6 = createChild("child6");

        // remove an alien
        el.removeChild(aliens[1]);
        aliens.splice(1, 1);

        // insert
        proxy.insertChilds(2, [child4, child5, child6]);
        expect(proxy.childNodes.length).toEqual(el.childNodes.length - aliens.length);

        expect(testutils.allAttributes2String(testutils.nodeChildrenToArray(el), "id", aliens)).toEqual(
            testutils.allAttributes2String(proxy.childNodes, "id"));

        // insert another alien
        alien = createChild("child12");
        aliens.push(alien);
        el.insertBefore(alien, child5);

        // remove - keepDom
        proxy.removeChilds(1, 2, false);
        expect(proxy.childNodes.length).toEqual(el.childNodes.length - aliens.length);

        expect(testutils.allAttributes2String(testutils.nodeChildrenToArray(el), "id", aliens)).toEqual(
            testutils.allAttributes2String(proxy.childNodes, "id"));

        // clear
        proxy.clear();
        expect(proxy.childNodes.length).toEqual(el.childNodes.length - aliens.length);

        expect(testutils.allAttributes2String(testutils.nodeChildrenToArray(el), "id", aliens)).toEqual(
            testutils.allAttributes2String(proxy.childNodes, "id"));

        // final test: just the aliens should be left now
        expect(aliens.length).toEqual(el.childNodes.length);
    });
});
