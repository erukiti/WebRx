/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../typings/l2o.d.ts" />
/// <reference path="../typings/ix.d.ts" />

describe('HtmlTemplateEngine',() => {
    var engine = wx.injector.resolve<wx.ITemplateEngine>(wx.res.htmlTemplateEngine);

    it('smoke-test',() => {
        loadFixtures('templates/Services/HtmlTemplateEngine.html');

        var html;
        expect(engine.parse("")).toEqual([]);
        
        var nodes = engine.parse($("#fixture1")[0].innerHTML);
        expect(nodes.length).toEqual(3);
        expect(Array.isArray(nodes)).toBeTruthy();

        // should match jQuery.parseHTML
        expect(engine.parse($("#fixture1")[0].innerHTML).map(x=> x.toString()).join()).toEqual(
            jQuery["parseHTML"]($("#fixture1")[0].innerHTML).map(x=> x.toString()).join());

        html = "<script>undefined()</script>";  // "Ignore scripts by default" 
        expect(engine.parse(html).length).toEqual(0);

        html += "<div></div>";
        expect(engine.parse(html)[0].nodeName.toLowerCase()).toEqual("div"); // "Preserve non-script nodes"

        expect(engine.parse("text")[0].nodeType).toEqual(3);    // "Parsing text returns a text node"
        expect(engine.parse("\t<div></div>")[0].nodeValue).toEqual("\t");   //"Preserve leading whitespace"

        expect(engine.parse(" <div/> ")[0].nodeType).toEqual(3);    // "Leading spaces are treated as text nodes (#11290)"

        html = engine.parse("<div>test div</div>");

        expect(html[0].parentNode.nodeType).toEqual(11);  // "parentNode should be documentFragment"
        expect(html[0].innerHTML).toEqual("test div");   // "Content should be preserved"

        expect(engine.parse("<span><span>").length).toEqual(1); // "Incorrect html-strings should not break anything"
        expect(engine.parse("<td><td>")[1].parentNode.nodeType).toEqual(11);  // parentNode should be documentFragment for wrapMap (variable in manipulation module) elements too"
        expect(()=> engine.parse("<#if><tr><p>This is a test.</p></tr><#/if>")).not.toThrow();   //"Garbage input should not cause error"
    });
});