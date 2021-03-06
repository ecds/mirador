/*! modernizr 3.3.1 (Custom Build) | MIT *
 * https://modernizr.com/download/?-cssfilters-printshiv-setclasses ! */
!(function (e, t, n) {
  function r(e, t) { return typeof e === t; } function o() {
    var e,
      t,
      n,
      o,
      i,
      a,
      s; for (var l in E) if (E.hasOwnProperty(l)) { if (e = [], t = E[l], t.name && (e.push(t.name.toLowerCase()), t.options && t.options.aliases && t.options.aliases.length)) for (n = 0; n < t.options.aliases.length; n++)e.push(t.options.aliases[n].toLowerCase()); for (o = r(t.fn, 'function') ? t.fn() : t.fn, i = 0; i < e.length; i++)a = e[i], s = a.split('.'), s.length === 1 ? Modernizr[s[0]] = o : (!Modernizr[s[0]] || Modernizr[s[0]] instanceof Boolean || (Modernizr[s[0]] = new Boolean(Modernizr[s[0]])), Modernizr[s[0]][s[1]] = o), y.push((o ? '' : 'no-') + s.join('-')); }
  } function i(e) {
    var t = C.className,
      n = Modernizr._config.classPrefix || ''; if (b && (t = t.baseVal), Modernizr._config.enableJSClass) { var r = new RegExp('(^|\\s)' + n + 'no-js(\\s|$)'); t = t.replace(r, '$1' + n + 'js$2'); }Modernizr._config.enableClasses && (t += ' ' + n + e.join(' ' + n), b ? C.className.baseVal = t : C.className = t);
  } function a() { return typeof t.createElement !== 'function' ? t.createElement(arguments[0]) : b ? t.createElementNS.call(t, 'http://www.w3.org/2000/svg', arguments[0]) : t.createElement.apply(t, arguments); } function s(e, t) { return !!~('' + e).indexOf(t); } function l(e) { return e.replace(/([a-z])-([a-z])/g, function (e, t, n) { return t + n.toUpperCase(); }).replace(/^-/, ''); } function u(e, t) { return function () { return e.apply(t, arguments); }; } function c(e, t, n) { var o; for (var i in e) if (e[i] in t) return n === !1 ? e[i] : (o = t[e[i]], r(o, 'function') ? u(o, n || t) : o); return !1; } function f(e) { return e.replace(/([A-Z])/g, function (e, t) { return '-' + t.toLowerCase(); }).replace(/^ms-/, '-ms-'); } function d() { var e = t.body; return e || (e = a(b ? 'svg' : 'body'), e.fake = !0), e; } function p(e, n, r, o) {
    var i,
      s,
      l,
      u,
      c = 'modernizr',
      f = a('div'),
      p = d(); if (parseInt(r, 10)) for (;r--;)l = a('div'), l.id = o ? o[r] : c + (r + 1), f.appendChild(l); return i = a('style'), i.type = 'text/css', i.id = 's' + c, (p.fake ? p : f).appendChild(i), p.appendChild(f), i.styleSheet ? i.styleSheet.cssText = e : i.appendChild(t.createTextNode(e)), f.id = c, p.fake && (p.style.background = '', p.style.overflow = 'hidden', u = C.style.overflow, C.style.overflow = 'hidden', C.appendChild(p)), s = n(f, e), p.fake ? (p.parentNode.removeChild(p), C.style.overflow = u, C.offsetHeight) : f.parentNode.removeChild(f), !!s;
  } function m(t, r) { var o = t.length; if ('CSS' in e && 'supports' in e.CSS) { for (;o--;) if (e.CSS.supports(f(t[o]), r)) return !0; return !1; } if ('CSSSupportsRule' in e) { for (var i = []; o--;)i.push('(' + f(t[o]) + ':' + r + ')'); return i = i.join(' or '), p('@supports (' + i + ') { #modernizr { position: absolute; } }', function (e) { return getComputedStyle(e, null).position == 'absolute'; }); } return n; } function h(e, t, o, i) { function u() { f && (delete z.style, delete z.modElem); } if (i = r(i, 'undefined') ? !1 : i, !r(o, 'undefined')) { var c = m(e, o); if (!r(c, 'undefined')) return c; } for (var f, d, p, h, v, g = ['modernizr', 'tspan', 'samp']; !z.style && g.length;)f = !0, z.modElem = a(g.shift()), z.style = z.modElem.style; for (p = e.length, d = 0; p > d; d++) if (h = e[d], v = z.style[h], s(h, '-') && (h = l(h)), z.style[h] !== n) { if (i || r(o, 'undefined')) return u(), t == 'pfx' ? h : !0; try { z.style[h] = o; } catch (y) {} if (z.style[h] != v) return u(), t == 'pfx' ? h : !0; } return u(), !1; } function v(e, t, n, o, i) {
    var a = e.charAt(0).toUpperCase() + e.slice(1),
      s = (e + ' ' + T.join(a + ' ') + a).split(' '); return r(t, 'string') || r(t, 'undefined') ? h(s, t, o, i) : (s = (e + ' ' + j.join(a + ' ') + a).split(' '), c(s, t, n));
  } function g(e, t, r) { return v(e, n, n, t, r); } var y = [],
    E = [],
    S = { _version: '3.3.1', _config: { classPrefix: '', enableClasses: !0, enableJSClass: !0, usePrefixes: !0 }, _q: [], on: function (e, t) { var n = this; setTimeout(function () { t(n[e]); }, 0); }, addTest: function (e, t, n) { E.push({ name: e, fn: t, options: n }); }, addAsyncTest: function (e) { E.push({ name: null, fn: e }); } },
    Modernizr = function () {}; Modernizr.prototype = S, Modernizr = new Modernizr(); var C = t.documentElement,
      b = C.nodeName.toLowerCase() === 'svg',
      x = S._config.usePrefixes ? ' -webkit- -moz- -o- -ms- '.split(' ') : ['', '']; S._prefixes = x; var w = 'CSS' in e && 'supports' in e.CSS,
        _ = 'supportsCSS' in e; Modernizr.addTest('supports', w || _); b || !(function (e, t) {
          function n(e, t) {
            var n = e.createElement('p'),
              r = e.getElementsByTagName('head')[0] || e.documentElement; return n.innerHTML = 'x<style>' + t + '</style>', r.insertBefore(n.lastChild, r.firstChild);
          } function r() { var e = w.elements; return typeof e === 'string' ? e.split(' ') : e; } function o(e, t) { var n = w.elements; typeof n !== 'string' && (n = n.join(' ')), typeof e !== 'string' && (e = e.join(' ')), w.elements = n + ' ' + e, u(t); } function i(e) { var t = x[e[C]]; return t || (t = {}, b++, e[C] = b, x[b] = t), t; } function a(e, n, r) { if (n || (n = t), v) return n.createElement(e); r || (r = i(n)); var o; return o = r.cache[e] ? r.cache[e].cloneNode() : S.test(e) ? (r.cache[e] = r.createElem(e)).cloneNode() : r.createElem(e), !o.canHaveChildren || E.test(e) || o.tagUrn ? o : r.frag.appendChild(o); } function s(e, n) { if (e || (e = t), v) return e.createDocumentFragment(); n = n || i(e); for (var o = n.frag.cloneNode(), a = 0, s = r(), l = s.length; l > a; a++)o.createElement(s[a]); return o; } function l(e, t) { t.cache || (t.cache = {}, t.createElem = e.createElement, t.createFrag = e.createDocumentFragment, t.frag = t.createFrag()), e.createElement = function (n) { return w.shivMethods ? a(n, e, t) : t.createElem(n); }, e.createDocumentFragment = Function('h,f', 'return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&(' + r().join().replace(/[\w\-:]+/g, function (e) { return t.createElem(e), t.frag.createElement(e), 'c("' + e + '")'; }) + ');return n}')(w, t.frag); } function u(e) { e || (e = t); var r = i(e); return !w.shivCSS || h || r.hasCSS || (r.hasCSS = !!n(e, 'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}')), v || l(e, r), e; } function c(e) { for (var t, n = e.getElementsByTagName('*'), o = n.length, i = RegExp('^(?:' + r().join('|') + ')$', 'i'), a = []; o--;)t = n[o], i.test(t.nodeName) && a.push(t.applyElement(f(t))); return a; } function f(e) { for (var t, n = e.attributes, r = n.length, o = e.ownerDocument.createElement(N + ':' + e.nodeName); r--;)t = n[r], t.specified && o.setAttribute(t.nodeName, t.nodeValue); return o.style.cssText = e.style.cssText, o; } function d(e) { for (var t, n = e.split('{'), o = n.length, i = RegExp('(^|[\\s,>+~])(' + r().join('|') + ')(?=[[\\s,>+~#.:]|$)', 'gi'), a = '$1' + N + '\\:$2'; o--;)t = n[o] = n[o].split('}'), t[t.length - 1] = t[t.length - 1].replace(i, a), n[o] = t.join('}'); return n.join('{'); } function p(e) { for (var t = e.length; t--;)e[t].removeNode(); } function m(e) {
            function t() { clearTimeout(a._removeSheetTimer), r && r.removeNode(!0), r = null; } var r,
              o,
              a = i(e),
              s = e.namespaces,
              l = e.parentWindow; return !T || e.printShived ? e : (typeof s[N] === 'undefined' && s.add(N), l.attachEvent('onbeforeprint', function () { t(); for (var i, a, s, l = e.styleSheets, u = [], f = l.length, p = Array(f); f--;)p[f] = l[f]; for (;s = p.pop();) if (!s.disabled && _.test(s.media)) { try { i = s.imports, a = i.length; } catch (m) { a = 0; } for (f = 0; a > f; f++)p.push(i[f]); try { u.push(s.cssText); } catch (m) {} }u = d(u.reverse().join('')), o = c(e), r = n(e, u); }), l.attachEvent('onafterprint', function () { p(o), clearTimeout(a._removeSheetTimer), a._removeSheetTimer = setTimeout(t, 500); }), e.printShived = !0, e);
          } var h,
            v,
            g = '3.7.3',
            y = e.html5 || {},
            E = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,
            S = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,
            C = '_html5shiv',
            b = 0,
            x = {}; !(function () { try { var e = t.createElement('a'); e.innerHTML = '<xyz></xyz>', h = 'hidden' in e, v = e.childNodes.length == 1 || (function () { t.createElement('a'); var e = t.createDocumentFragment(); return typeof e.cloneNode === 'undefined' || typeof e.createDocumentFragment === 'undefined' || typeof e.createElement === 'undefined'; }()); } catch (n) { h = !0, v = !0; } }()); var w = { elements: y.elements || 'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output picture progress section summary template time video', version: g, shivCSS: y.shivCSS !== !1, supportsUnknownElements: v, shivMethods: y.shivMethods !== !1, type: 'default', shivDocument: u, createElement: a, createDocumentFragment: s, addElements: o }; e.html5 = w, u(t); var _ = /^$|\b(?:all|print)\b/,
              N = 'html5shiv',
              T = !v && (function () { var n = t.documentElement; return !(typeof t.namespaces === 'undefined' || typeof t.parentWindow === 'undefined' || typeof n.applyElement === 'undefined' || typeof n.removeNode === 'undefined' || typeof e.attachEvent === 'undefined'); }()); w.type += ' print', w.shivPrint = m, m(t), typeof module === 'object' && module.exports && (module.exports = w);
        }(typeof e !== 'undefined' ? e : this, t)); var N = 'Moz O ms Webkit',
          T = S._config.usePrefixes ? N.split(' ') : []; S._cssomPrefixes = T; var j = S._config.usePrefixes ? N.toLowerCase().split(' ') : []; S._domPrefixes = j; var k = { elem: a('modernizr') }; Modernizr._q.push(function () { delete k.elem; }); var z = { style: k.elem.style }; Modernizr._q.unshift(function () { delete z.style; }), S.testAllProps = v, S.testAllProps = g, Modernizr.addTest('cssfilters', function () { if (Modernizr.supports) return g('filter', 'blur(2px)'); var e = a('a'); return e.style.cssText = x.join('filter:blur(2px); '), !!e.style.length && (t.documentMode === n || t.documentMode > 9); }), o(), i(y), delete S.addTest, delete S.addAsyncTest; for (var P = 0; P < Modernizr._q.length; P++)Modernizr._q[P](); e.Modernizr = Modernizr;
}(window, document));
