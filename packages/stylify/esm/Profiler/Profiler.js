/**
 * Stylify.js v0.0.1 
 * (c) 2020-2021 Vladimír Macháček
 * Released under the MIT License.
 */

var n,l,u,i,t,r,o={},f=[],e=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;function c(n,l){for(var u in l)n[u]=l[u];return n}function s(n){var l=n.parentNode;l&&l.removeChild(n);}function a(n,l,u){var i,t,r,o=arguments,f={};for(r in l)"key"==r?i=l[r]:"ref"==r?t=l[r]:f[r]=l[r];if(arguments.length>3)for(u=[u],r=3;r<arguments.length;r++)u.push(o[r]);if(null!=u&&(f.children=u),"function"==typeof n&&null!=n.defaultProps)for(r in n.defaultProps)void 0===f[r]&&(f[r]=n.defaultProps[r]);return v(n,f,i,t,null)}function v(l,u,i,t,r){var o={type:l,props:u,key:i,ref:t,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:null==r?++n.__v:r};return null!=n.vnode&&n.vnode(o),o}function h(){return {current:null}}function y(n){return n.children}function p(n,l){this.props=n,this.context=l;}function d(n,l){if(null==l)return n.__?d(n.__,n.__.__k.indexOf(n)+1):null;for(var u;l<n.__k.length;l++)if(null!=(u=n.__k[l])&&null!=u.__e)return u.__e;return "function"==typeof n.type?d(n):null}function _(n){var l,u;if(null!=(n=n.__)&&null!=n.__c){for(n.__e=n.__c.base=null,l=0;l<n.__k.length;l++)if(null!=(u=n.__k[l])&&null!=u.__e){n.__e=n.__c.base=u.__e;break}return _(n)}}function k(l){(!l.__d&&(l.__d=!0)&&u.push(l)&&!m.__r++||t!==n.debounceRendering)&&((t=n.debounceRendering)||i)(m);}function m(){for(var n;m.__r=u.length;)n=u.sort(function(n,l){return n.__v.__b-l.__v.__b}),u=[],n.some(function(n){var l,u,i,t,r,o;n.__d&&(r=(t=(l=n).__v).__e,(o=l.__P)&&(u=[],(i=c({},t)).__v=t.__v+1,T(o,t,i,l.__n,void 0!==o.ownerSVGElement,null!=t.__h?[r]:null,u,null==r?d(t):r,t.__h),j(u,t),t.__e!=r&&_(t)));});}function b(n,l,u,i,t,r,e,c,s,a){var h,p,_,k,m,b,w,A=i&&i.__k||f,P=A.length;for(u.__k=[],h=0;h<l.length;h++)if(null!=(k=u.__k[h]=null==(k=l[h])||"boolean"==typeof k?null:"string"==typeof k||"number"==typeof k?v(null,k,null,null,k):Array.isArray(k)?v(y,{children:k},null,null,null):k.__b>0?v(k.type,k.props,k.key,null,k.__v):k)){if(k.__=u,k.__b=u.__b+1,null===(_=A[h])||_&&k.key==_.key&&k.type===_.type)A[h]=void 0;else for(p=0;p<P;p++){if((_=A[p])&&k.key==_.key&&k.type===_.type){A[p]=void 0;break}_=null;}T(n,k,_=_||o,t,r,e,c,s,a),m=k.__e,(p=k.ref)&&_.ref!=p&&(w||(w=[]),_.ref&&w.push(_.ref,null,k),w.push(p,k.__c||m,k)),null!=m?(null==b&&(b=m),"function"==typeof k.type&&null!=k.__k&&k.__k===_.__k?k.__d=s=g(k,s,n):s=x(n,k,_,A,m,s),a||"option"!==u.type?"function"==typeof u.type&&(u.__d=s):n.value=""):s&&_.__e==s&&s.parentNode!=n&&(s=d(_));}for(u.__e=b,h=P;h--;)null!=A[h]&&("function"==typeof u.type&&null!=A[h].__e&&A[h].__e==u.__d&&(u.__d=d(i,h+1)),L(A[h],A[h]));if(w)for(h=0;h<w.length;h++)I(w[h],w[++h],w[++h]);}function g(n,l,u){var i,t;for(i=0;i<n.__k.length;i++)(t=n.__k[i])&&(t.__=n,l="function"==typeof t.type?g(t,l,u):x(u,t,t,n.__k,t.__e,l));return l}function w(n,l){return l=l||[],null==n||"boolean"==typeof n||(Array.isArray(n)?n.some(function(n){w(n,l);}):l.push(n)),l}function x(n,l,u,i,t,r){var o,f,e;if(void 0!==l.__d)o=l.__d,l.__d=void 0;else if(null==u||t!=r||null==t.parentNode)n:if(null==r||r.parentNode!==n)n.appendChild(t),o=null;else {for(f=r,e=0;(f=f.nextSibling)&&e<i.length;e+=2)if(f==t)break n;n.insertBefore(t,r),o=r;}return void 0!==o?o:t.nextSibling}function A(n,l,u,i,t){var r;for(r in u)"children"===r||"key"===r||r in l||C(n,r,null,u[r],i);for(r in l)t&&"function"!=typeof l[r]||"children"===r||"key"===r||"value"===r||"checked"===r||u[r]===l[r]||C(n,r,l[r],u[r],i);}function P(n,l,u){"-"===l[0]?n.setProperty(l,u):n[l]=null==u?"":"number"!=typeof u||e.test(l)?u:u+"px";}function C(n,l,u,i,t){var r;n:if("style"===l)if("string"==typeof u)n.style.cssText=u;else {if("string"==typeof i&&(n.style.cssText=i=""),i)for(l in i)u&&l in u||P(n.style,l,"");if(u)for(l in u)i&&u[l]===i[l]||P(n.style,l,u[l]);}else if("o"===l[0]&&"n"===l[1])r=l!==(l=l.replace(/Capture$/,"")),l=l.toLowerCase()in n?l.toLowerCase().slice(2):l.slice(2),n.l||(n.l={}),n.l[l+r]=u,u?i||n.addEventListener(l,r?H:$,r):n.removeEventListener(l,r?H:$,r);else if("dangerouslySetInnerHTML"!==l){if(t)l=l.replace(/xlink[H:h]/,"h").replace(/sName$/,"s");else if("href"!==l&&"list"!==l&&"form"!==l&&"download"!==l&&l in n)try{n[l]=null==u?"":u;break n}catch(n){}"function"==typeof u||(null!=u&&(!1!==u||"a"===l[0]&&"r"===l[1])?n.setAttribute(l,u):n.removeAttribute(l));}}function $(l){this.l[l.type+!1](n.event?n.event(l):l);}function H(l){this.l[l.type+!0](n.event?n.event(l):l);}function T(l,u,i,t,r,o,f,e,s){var a,v,h,d,_,k,m,g,w,x,A,P=u.type;if(void 0!==u.constructor)return null;null!=i.__h&&(s=i.__h,e=u.__e=i.__e,u.__h=null,o=[e]),(a=n.__b)&&a(u);try{n:if("function"==typeof P){if(g=u.props,w=(a=P.contextType)&&t[a.__c],x=a?w?w.props.value:a.__:t,i.__c?m=(v=u.__c=i.__c).__=v.__E:("prototype"in P&&P.prototype.render?u.__c=v=new P(g,x):(u.__c=v=new p(g,x),v.constructor=P,v.render=M),w&&w.sub(v),v.props=g,v.state||(v.state={}),v.context=x,v.__n=t,h=v.__d=!0,v.__h=[]),null==v.__s&&(v.__s=v.state),null!=P.getDerivedStateFromProps&&(v.__s==v.state&&(v.__s=c({},v.__s)),c(v.__s,P.getDerivedStateFromProps(g,v.__s))),d=v.props,_=v.state,h)null==P.getDerivedStateFromProps&&null!=v.componentWillMount&&v.componentWillMount(),null!=v.componentDidMount&&v.__h.push(v.componentDidMount);else {if(null==P.getDerivedStateFromProps&&g!==d&&null!=v.componentWillReceiveProps&&v.componentWillReceiveProps(g,x),!v.__e&&null!=v.shouldComponentUpdate&&!1===v.shouldComponentUpdate(g,v.__s,x)||u.__v===i.__v){v.props=g,v.state=v.__s,u.__v!==i.__v&&(v.__d=!1),v.__v=u,u.__e=i.__e,u.__k=i.__k,v.__h.length&&f.push(v);break n}null!=v.componentWillUpdate&&v.componentWillUpdate(g,v.__s,x),null!=v.componentDidUpdate&&v.__h.push(function(){v.componentDidUpdate(d,_,k);});}v.context=x,v.props=g,v.state=v.__s,(a=n.__r)&&a(u),v.__d=!1,v.__v=u,v.__P=l,a=v.render(v.props,v.state,v.context),v.state=v.__s,null!=v.getChildContext&&(t=c(c({},t),v.getChildContext())),h||null==v.getSnapshotBeforeUpdate||(k=v.getSnapshotBeforeUpdate(d,_)),A=null!=a&&a.type===y&&null==a.key?a.props.children:a,b(l,Array.isArray(A)?A:[A],u,i,t,r,o,f,e,s),v.base=u.__e,u.__h=null,v.__h.length&&f.push(v),m&&(v.__E=v.__=null),v.__e=!1;}else null==o&&u.__v===i.__v?(u.__k=i.__k,u.__e=i.__e):u.__e=z(i.__e,u,i,t,r,o,f,s);(a=n.diffed)&&a(u);}catch(l){u.__v=null,(s||null!=o)&&(u.__e=e,u.__h=!!s,o[o.indexOf(e)]=null),n.__e(l,u,i);}}function j(l,u){n.__c&&n.__c(u,l),l.some(function(u){try{l=u.__h,u.__h=[],l.some(function(n){n.call(u);});}catch(l){n.__e(l,u.__v);}});}function z(n,l,u,i,t,r,e,c){var a,v,h,y,p=u.props,d=l.props,_=l.type,k=0;if("svg"===_&&(t=!0),null!=r)for(;k<r.length;k++)if((a=r[k])&&(a===n||(_?a.localName==_:3==a.nodeType))){n=a,r[k]=null;break}if(null==n){if(null===_)return document.createTextNode(d);n=t?document.createElementNS("http://www.w3.org/2000/svg",_):document.createElement(_,d.is&&d),r=null,c=!1;}if(null===_)p===d||c&&n.data===d||(n.data=d);else {if(r=r&&f.slice.call(n.childNodes),v=(p=u.props||o).dangerouslySetInnerHTML,h=d.dangerouslySetInnerHTML,!c){if(null!=r)for(p={},y=0;y<n.attributes.length;y++)p[n.attributes[y].name]=n.attributes[y].value;(h||v)&&(h&&(v&&h.__html==v.__html||h.__html===n.innerHTML)||(n.innerHTML=h&&h.__html||""));}if(A(n,d,p,t,c),h)l.__k=[];else if(k=l.props.children,b(n,Array.isArray(k)?k:[k],l,u,i,t&&"foreignObject"!==_,r,e,n.firstChild,c),null!=r)for(k=r.length;k--;)null!=r[k]&&s(r[k]);c||("value"in d&&void 0!==(k=d.value)&&(k!==n.value||"progress"===_&&!k)&&C(n,"value",k,p.value,!1),"checked"in d&&void 0!==(k=d.checked)&&k!==n.checked&&C(n,"checked",k,p.checked,!1));}return n}function I(l,u,i){try{"function"==typeof l?l(u):l.current=u;}catch(l){n.__e(l,i);}}function L(l,u,i){var t,r,o;if(n.unmount&&n.unmount(l),(t=l.ref)&&(t.current&&t.current!==l.__e||I(t,null,u)),i||"function"==typeof l.type||(i=null!=(r=l.__e)),l.__e=l.__d=void 0,null!=(t=l.__c)){if(t.componentWillUnmount)try{t.componentWillUnmount();}catch(l){n.__e(l,u);}t.base=t.__P=null;}if(t=l.__k)for(o=0;o<t.length;o++)t[o]&&L(t[o],u,i);null!=r&&s(r);}function M(n,l,u){return this.constructor(n,u)}function N(l,u,i){var t,r,e;n.__&&n.__(l,u),r=(t="function"==typeof i)?null:i&&i.__k||u.__k,e=[],T(u,l=(!t&&i||u).__k=a(y,null,[l]),r||o,o,void 0!==u.ownerSVGElement,!t&&i?[i]:r?null:u.firstChild?f.slice.call(u.childNodes):null,e,!t&&i?i:r?r.__e:u.firstChild,t),j(e,l);}function O(n,l){N(n,l,O);}function S(n,l,u){var i,t,r,o=arguments,f=c({},n.props);for(r in l)"key"==r?i=l[r]:"ref"==r?t=l[r]:f[r]=l[r];if(arguments.length>3)for(u=[u],r=3;r<arguments.length;r++)u.push(o[r]);return null!=u&&(f.children=u),v(n.type,f,i||n.key,t||n.ref,null)}function q(n,l){var u={__c:l="__cC"+r++,__:n,Consumer:function(n,l){return n.children(l)},Provider:function(n){var u,i;return this.getChildContext||(u=[],(i={})[l]=this,this.getChildContext=function(){return i},this.shouldComponentUpdate=function(n){this.props.value!==n.value&&u.some(k);},this.sub=function(n){u.push(n);var l=n.componentWillUnmount;n.componentWillUnmount=function(){u.splice(u.indexOf(n),1),l&&l.call(n);};}),n.children}};return u.Provider.__=u.Consumer.contextType=u}n={__e:function(n,l){for(var u,i,t;l=l.__;)if((u=l.__c)&&!u.__)try{if((i=u.constructor)&&null!=i.getDerivedStateFromError&&(u.setState(i.getDerivedStateFromError(n)),t=u.__d),null!=u.componentDidCatch&&(u.componentDidCatch(n),t=u.__d),t)return u.__E=u}catch(l){n=l;}throw n},__v:0},l=function(n){return null!=n&&void 0===n.constructor},p.prototype.setState=function(n,l){var u;u=null!=this.__s&&this.__s!==this.state?this.__s:this.__s=c({},this.state),"function"==typeof n&&(n=n(c({},u),this.props)),n&&c(u,n),null!=n&&this.__v&&(l&&this.__h.push(l),k(this));},p.prototype.forceUpdate=function(n){this.__v&&(this.__e=!0,n&&this.__h.push(n),k(this));},p.prototype.render=y,u=[],i="function"==typeof Promise?Promise.prototype.then.bind(Promise.resolve()):setTimeout,m.__r=0,r=0;

var preact = /*#__PURE__*/Object.freeze({
  __proto__: null,
  render: N,
  hydrate: O,
  createElement: a,
  h: a,
  Fragment: y,
  createRef: h,
  get isValidElement () { return l; },
  Component: p,
  cloneElement: S,
  createContext: q,
  toChildArray: w,
  get options () { return n; }
});

var n$1=function(t,s,r,e){var u;s[0]=0;for(var h=1;h<s.length;h++){var p=s[h++],a=s[h]?(s[0]|=p?1:2,r[s[h++]]):s[++h];3===p?e[0]=a:4===p?e[1]=Object.assign(e[1]||{},a):5===p?(e[1]=e[1]||{})[s[++h]]=a:6===p?e[1][s[++h]]+=a+"":p?(u=t.apply(a,n$1(t,a,r,["",null])),e.push(u),a[0]?s[0]|=2:(s[h-2]=0,s[h]=u)):e.push(a);}return e},t$1=new Map;function htm(s){var r=t$1.get(this);return r||(r=new Map,t$1.set(this,r)),(r=n$1(this,r.get(s)||(r.set(s,r=function(n){for(var t,s,r=1,e="",u="",h=[0],p=function(n){1===r&&(n||(e=e.replace(/^\s*\n\s*|\s*\n\s*$/g,"")))?h.push(0,n,e):3===r&&(n||e)?(h.push(3,n,e),r=2):2===r&&"..."===e&&n?h.push(4,n,0):2===r&&e&&!n?h.push(5,0,!0,e):r>=5&&((e||!n&&5===r)&&(h.push(r,0,e,s),r=6),n&&(h.push(r,n,0,s),r=6)),e="";},a=0;a<n.length;a++){a&&(1===r&&p(),p(a));for(var l=0;l<n[a].length;l++)t=n[a][l],1===r?"<"===t?(p(),h=[h],r=3):e+=t:4===r?"--"===e&&">"===t?(r=1,e=""):e=t+e[0]:u?t===u?u="":e+=t:'"'===t||"'"===t?u=t:">"===t?(p(),r=1):r&&("="===t?(r=5,s=e,e=""):"/"===t&&(r<5||">"===n[a][l+1])?(p(),3===r&&(h=h[0]),r=h,(h=h[0]).push(2,0,r),r=0):" "===t||"\t"===t||"\n"===t||"\r"===t?(p(),r=2):e+=t),3===r&&"!--"===e&&(r=4,h=h[0]);}return p(),h}(s)),r),arguments,[])).length>1?r:r[0]}

function o$1(_,o,e,n$1,t){var f={};for(var l in o)"ref"!=l&&(f[l]=o[l]);var s,u,a={type:_,props:f,key:e,ref:o&&o.ref,__k:null,__:null,__b:0,__e:null,__d:void 0,__c:null,__h:null,constructor:void 0,__v:++n.__v,__source:n$1,__self:t};if("function"==typeof _&&(s=_.defaultProps))for(u in s)void 0===f[u]&&(f[u]=s[u]);return n.vnode&&n.vnode(a),a}

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = "@font-face {\n  font-family: 'stylify-profiler';\n  src: url('data:font/woff;base64,d09GRgABAAAAAA80AAsAAAAADugAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABPUy8yAAABCAAAAGAAAABgDxIF/2NtYXAAAAFoAAAAVAAAAFQXVtKPZ2FzcAAAAbwAAAAIAAAACAAAABBnbHlmAAABxAAACpAAAAqQWvrfGWhlYWQAAAxUAAAANgAAADYbzUQVaGhlYQAADIwAAAAkAAAAJAfCA85obXR4AAAMsAAAADQAAAA0KgACMWxvY2EAAAzkAAAAHAAAABwL6g6ubWF4cAAADQAAAAAgAAAAIAAWAJFuYW1lAAANIAAAAfIAAAHy8WdVV3Bvc3QAAA8UAAAAIAAAACAAAwAAAAMDzQGQAAUAAAKZAswAAACPApkCzAAAAesAMwEJAAAAAAAAAAAAAAAAAAAAARAAAAAAAAAAAAAAAAAAAAAAQAAA6QgDwP/AAEADwABAAAAAAQAAAAAAAAAAAAAAIAAAAAAAAwAAAAMAAAAcAAEAAwAAABwAAwABAAAAHAAEADgAAAAKAAgAAgACAAEAIOkI//3//wAAAAAAIOkA//3//wAB/+MXBAADAAEAAAAAAAAAAAAAAAEAAf//AA8AAQAAAAAAAAAAAAIAADc5AQAAAAABAAAAAAAAAAAAAgAANzkBAAAAAAEAAAAAAAAAAAACAAA3OQEAAAAABABVAAADqwNVABsAKwA1AD8AABMiBgcOARURFBYXHgEzITI2Nz4BNRE0JicuASMTITU0Njc+ATMhMhYXHgEVBREjIiYnLgE1EQERIREUBgcOASPVGi8RERUUEhEvGgJWGi8RERUUEhEvGir9VgYGBg8JAlYIEAYGBv4AgAgQBgYGAQABqgYGBg8JA1UUERIuG/2rGi8REhQUEhEvGgJVGy8RERT/AIAJEAUGBwcGBRAJ1f5VBwYGDwkBgP5VAav+gAkPBgYHAAACAFUAAAPCA3MANABsAAABNz4BNzYmJy4BJyYGBw4BBw4BFwEOARUUFhceATMyNjcBMhYzFjY3PgE3NiYnLgEnJiIPAScOARUUFh8BHgEzMjY/ARYGBw4BBw4BJy4BJyYGBwEOASMiJicuATU0NjcBPgEnLgE3PgE3PgEXApGhAwQCBwwQCREJMm40OFAUEgMR/u0TFBQTFDEZGjEUARMBBAEzbTQ4UBQUAhkCBAMMJAyggQ0MDQxEDR8REB8MbgMHCQ45KCVOJAcMBg0aCf7ZBxEKCREHBwcHBwEmCgQFEgIPDjkpGzkbAoChAgYEECEIAwcDDwUXGlg1L2cz/u0TMRoZMhMUExMUARMCEAYXGlc2NXc4BAYDDAyhgA0fEBAfDUQNDAwMbhkzFyY/EhEECwIFAwUFCf7ZBwcHBwcSCQkSBwEnCRsLKVQnJj8SDAkEAAAAAwDV/6sDKwOrAA4AHQBcAAABIyImJy4BNTQ2Nz4BOwETMzIWFx4BFRQGBw4BKwETIzU0JiMiBh0BIyIGBw4BFRQWFx4BOwEVIyIGFRQWOwEVFBYzMjY9ATMyNjc+ATU0JicuASsBNTMyNjU0JiMB1UAWJw4PEBAPDicWQFZAFicODxAQDw4nFkCqqhkSEhlAJ0YaGh8fGhpGJ0DVEhkZEtUZEhIZQCdGGhofHxoaRidAqhIZGRIB1REPDicWFicODxH+1REODycWFicODxACVYASGRkSgB4aGkYoKEYaGh7VGRISGYARGRkRgB8aGkYnKEYaGh7WGRESGQAACAAr/9UD1QOAAAgAEQAaACQALQByAHsAgQAAATceARceARcjBSc+ATc+ATcHAyMuATU0NjcXJSczHgEVFAYHJwMTFw4BBw4BBwcWMjMeATMyNz4BNzY3PgE3PgE3PgE1NCYnNCYnLgEnLgEnKgEjLgEjIgcOAQcGBw4BBw4BBw4BFRQWFxQWFx4BFx4BFzcHLgEnLgEnMzcHIyc3MwHnXztmKQ0YCt3+2V8FCgUwf0hvJL4LCxUTbgHUPr4LCxUTbdKsXwUKBTB/SFABAwENGA0xLi5UJSYgDBUKAgIBKi8TEwEBEjEeN41RAQMBDRgNMS4uVCUmIAwVCgICASovExMBARIxHjeNUVBfO2YpDRgK3fZKlEpKlAKApAs2KQ0dEICkBgsFMDsFwP7BHkAiLVYnwS1qHkEhLlYmvv5sASqkBgsFMDsFUgEBAgoJJBoZIAwZDQEDAjqMTjFdKwEDAShHHzZGCgIBCgkkGRofDBkNAgMCOoxNMl0qAgICKEceN0YJ/KQLNygNHg/WgICAAAMAK//VA9UDgAA3AFAAZAAAATQnLgEnJicmJy4BJyYjIgcOAQcGBwYHDgEHBhUUFx4BFxYXFhceARcWMzI3PgE3Njc2Nz4BNzYnFAYHDgEjIiYnLgE1NDY3PgEzMhYXHgEVAREUFh8BFjY3NiYvATU0JiMiBhUD1QkKIxoZICAmJVQuLjExLi5UJSYgIBkaIwoJCQojGhkgICYlVC4uMTEuLlQlJiAgGRojCglVPDQ1i1BQizU0PDw0NYtQUIs1NDz+VQ0Lqw8iCAgLEJMZEhIZAaswLi5UJiYgHxoZJAkKCgkkGRofICYmVC4uMDEuLlQmJSAgGRokCQoKCSQaGSAgJSZULi4xUIw0NDw8NDSMUE+MNDQ9PTQ0jE8BAP8ADRQFVggLEBAiCEnmERkZEQAEAAAAAAQAA1UAAwAdACEAMAAAEyERIQMiBh0BFBY7AREUFjMhMjY1ETMyNj0BNCYjBSEVIQEzMjY1NCYrASIGFRQWM6sCqv1WgBIZGRIqGRIDABIZKhIZGRL8gANW/KoBVqoSGRkSqhIZGRICK/4qAwAZEdYRGf4AEhkZEgIAGRHWERlVgP8AGRIRGRkREhkAAAAAAgAAAAAEAANRAEcAjgAAEz4BNz4BFx4BHwEjIgYVFBYzITAyMTI2Nz4BNzQ2Mz4BNz4BNTwBMRE0JiMiBh0BJy4BJyYnJgYHBgcGBw4BBwYHBhYXFjY3AxcWFx4BFxYzMjc+ATc2Nz4BNzYmJyYGBw4BBw4BIyImLwEzMjY1NCYjITAiMSIGBw4BBxQiBw4BBw4BFTAUFREUFjMyNjW+GFw7O4dDJkAZeZURGRkRAQABBAgEBAcDAQECBAEBAhkSERl9IFEvKioqUygoJSUhITgXFg4GDxEQIAZpfh8kI00pKCkpKShNJCQfIzMPBQ8RER8GDCgcMn5CQX4zeJURGRkR/wABBAgEBAcDAQECBAEBAhkSERkCHENjHRwJGA0pGnEZEhIZAgIBBQMBAQMGAwQGBAEBAQASGRkSnXUgNBEOBgYFCgsREhkYPSUkKhEgBgUPEP7Xdx8XFx8ICAgIHxcYHyNSKxAgBgYQESFBHTIyMzJxGRESGQIBAgUDAQEDBgMDBwQBAf8AERkZEQAAAAIALf/YA9MDfQA6AHUAAAEeARcWNjc+AT8BPgEnLgEnLgEjIgYPAQYUFxYyPwE+ATMyFhceARcUBg8BDgEHDgEnLgEnLgEHDgEXNy4BJyYGBw4BDwEOARceARceATMyNj8BNjQnJiIPAQ4BIwYmJy4BJzQ2PwE+ATc+ARceARceATc+AScBiCBYMTFiKwcPBoAlJAEBJyYmXTAwXCVKDAwNIwxJGT0gID4ZGhoBGBiABAkFHUEhIDsVCyMODgUK8CBYMTFiKwcPBoAlJAEBJyYmXTAwXCVJDQ0MIw1IGT0gID4ZGhoBGBiABAkFHUEhIDsVCyMODgUKAWYqMwcHGCAGDAaAJmAxMV0lJSMkJEkNIwwNDEkYGBgYGT4hIT8ZgAQIBBUQBQQiHQ4FCwojD4kqMwcHGB8GDAd/J18xMV4lJCQkJEoMIw0MDEkXGAEYGBk+ISE/GYAECAQVEAUEIhwOBQoLIw4AAAQAL//aA9EDfAADABoALgBCAAABDQElJQUOARceARcFFjI3JT4BJy4BJyUmIgcBBRY2NyU+AScuAQcFJSYGBwYWFzUFFjI3JT4BJy4BBwUlJgYHBhYXAgABS/61/rUBOP5VEAsIAwoGAasJFAkBqxALCAMKBv5VCRQJ/lUBqwkUCQGrEAsICCIP/mj+aA8iCAgLEAGrCRQJAasQCwgIIg/+aP5oDyIICAsQAyampqb71QghEAcJA9UFBdUIIRAHCQPWBAT9M9UFAQTVCCIPEAsHzMsICxAPIgjW1gQE1gciEBALCMzMCAsQECIIAAAAAAEAAAABAAClewBtXw889QALBAAAAAAA3Fb/4QAAAADcVv/hAAD/qwQAA6sAAAAIAAIAAAAAAAAAAQAAA8D/wAAABAAAAAAABAAAAQAAAAAAAAAAAAAAAAAAAA0EAAAAAAAAAAAAAAACAAAABAAAVQQAAFUEAADVBAAAKwQAACsEAAAABAAAAAQAAC0EAAAvAAAAAAAKABQAHgCCASwBqgJyAwoDVAQcBNAFSAABAAAADQCPAAgAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAADgCuAAEAAAAAAAEAEAAAAAEAAAAAAAIABwCxAAEAAAAAAAMAEABRAAEAAAAAAAQAEADGAAEAAAAAAAUACwAwAAEAAAAAAAYAEACBAAEAAAAAAAoAGgD2AAMAAQQJAAEAIAAQAAMAAQQJAAIADgC4AAMAAQQJAAMAIABhAAMAAQQJAAQAIADWAAMAAQQJAAUAFgA7AAMAAQQJAAYAIACRAAMAAQQJAAoANAEQc3R5bGlmeS1wcm9maWxlcgBzAHQAeQBsAGkAZgB5AC0AcAByAG8AZgBpAGwAZQByVmVyc2lvbiAxLjAAVgBlAHIAcwBpAG8AbgAgADEALgAwc3R5bGlmeS1wcm9maWxlcgBzAHQAeQBsAGkAZgB5AC0AcAByAG8AZgBpAGwAZQByc3R5bGlmeS1wcm9maWxlcgBzAHQAeQBsAGkAZgB5AC0AcAByAG8AZgBpAGwAZQByUmVndWxhcgBSAGUAZwB1AGwAYQByc3R5bGlmeS1wcm9maWxlcgBzAHQAeQBsAGkAZgB5AC0AcAByAG8AZgBpAGwAZQByRm9udCBnZW5lcmF0ZWQgYnkgSWNvTW9vbi4ARgBvAG4AdAAgAGcAZQBuAGUAcgBhAHQAZQBkACAAYgB5ACAASQBjAG8ATQBvAG8AbgAuAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==') format('woff');\n  font-weight: normal;\n  font-style: normal;\n  font-display: block;\n}\n\n.sp-icon {\n  /* use !important to prevent issues with browser extensions that change fonts */\n  font-family: 'stylify-profiler' !important;\n  speak: never;\n  font-style: normal;\n  font-weight: normal;\n  font-variant: normal;\n  text-transform: none;\n  line-height: 1;\n\n  /* Better Font Rendering =========== */\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.sp-icon-layers:before {\n  content: \"\\e908\";\n}\n.sp-icon-link:before {\n  content: \"\\e907\";\n}\n.sp-icon-layout:before {\n  content: \"\\e900\";\n}\n.sp-icon-tool:before {\n  content: \"\\e901\";\n}\n.sp-icon-dollar-sign:before {\n  content: \"\\e902\";\n}\n.sp-icon-aperture:before {\n  content: \"\\e903\";\n}\n.sp-icon-clock:before {\n  content: \"\\e904\";\n}\n.sp-icon-archive:before {\n  content: \"\\e905\";\n}\n.sp-icon-refresh-cw:before {\n  content: \"\\e906\";\n}\n";
styleInject(css_248z);

const extensions = {};
let extensionsConfig = {};

const ToolbarExtension = ({
  extensionName
}) => {
  const TagName = extensions[extensionName];
  return o$1(TagName, {
    config: extensionsConfig
  }, void 0);
};

class ProfilerToolbar extends p {
  constructor() {
    super();
    this.LOCAL_STORAGE_ID = 'stylify-profiler;';
    this.state = {
      profilerVisible: false,
      extensions: extensions,
      extensionsVisible: true
    };

    this.getConfigFromLocalStorage = () => {
      const localStorageConfig = localStorage.getItem(this.LOCAL_STORAGE_ID);

      if (!localStorageConfig) {
        localStorage.setItem(this.LOCAL_STORAGE_ID, JSON.stringify({
          extensionsVisible: this.state.extensionsVisible
        }));
      }

      return localStorageConfig ? JSON.parse(localStorageConfig) : null;
    };

    this.updateConfigInLocalStorage = (config = {}) => {
      localStorage.setItem(this.LOCAL_STORAGE_ID, JSON.stringify(Object.assign(this.getConfigFromLocalStorage(), config)));
    };

    this.toggleExtensionsVisibility = () => {
      const extensionsVisible = !this.state.extensionsVisible;
      this.setState({
        extensionsVisible: extensionsVisible
      });
      this.updateConfigInLocalStorage({
        extensionsVisible: extensionsVisible
      });
    };

    this.componentDidMount = () => {
      this.props.config.stylify.EventsEmitter.addListener('stylify:runtime:uncloak', data => {
        const elementId = data.id || null;

        if (elementId !== 'stylify-profiler') {
          return;
        }

        this.setState({
          profilerVisible: true
        });
      });
    };

    const configFromLocalStorage = this.getConfigFromLocalStorage();

    if (configFromLocalStorage) {
      this.state.extensionsVisible = configFromLocalStorage.extensionsVisible;
    }
  }

  render() {
    return o$1("div", Object.assign({
      "s-cloak": "stylify-profiler",
      hidden: this.state.profilerVisible === false,
      id: "stylify-profiler",
      class: "align-items:center position:fixed bottom:0 left:0 background:#000 color:#fff width:auto font-family:arial font-size:12px display:flex line-height:1"
    }, {
      children: [o$1("a", Object.assign({
        role: "button",
        class: "font-size:14px line-height:26px padding:0__8px align-items:center display:inline-block cursor:pointer user-select:none",
        onClick: this.toggleExtensionsVisibility
      }, {
        children: o$1("strong", {
          children: "Stylify"
        }, void 0)
      }), void 0), o$1("div", Object.assign({
        class: `align-items:center display:${this.state.extensionsVisible ? 'flex' : 'none'} content-visibility:${this.state.extensionsVisible ? 'visible' : 'hidden'}`
      }, {
        children: Object.keys(this.state.extensions).map(extensionName => {
          return o$1(ToolbarExtension, {
            extensionName: extensionName
          }, void 0);
        })
      }), void 0)]
    }), void 0);
  }

}

const initProfilerToolbar = profilerConfig => {
  extensionsConfig = profilerConfig;
  let profilerToolbarElement = document.querySelector('#stylify-profiler');

  if (!profilerToolbarElement) {
    profilerToolbarElement = document.createElement('div');
    profilerToolbarElement.id = 'stylify-profiler';
    document.body.appendChild(profilerToolbarElement);
  }

  N(o$1(ProfilerToolbar, {
    config: extensionsConfig
  }, void 0), profilerToolbarElement, profilerToolbarElement);
};

const addProfilerExtension = component => {
  extensions[component.name] = component;
};

class BuildsAnalyzerExtension extends p {
  constructor(props) {
    super();
    this.openCodeInNewWindow = null;
    this.state = {
      cssInBase64: null,
      totalRepaintTime: 0,
      actualSize: 0,
      builds: [],
      buildsListVisible: false
    };

    this.toggleBuildsListVisibility = () => {
      this.setState({
        buildsListVisible: !this.state.buildsListVisible
      });
    };

    this.openGeneratedCssInNewWindow = () => {
      this.openCodeInNewWindow(this.getGeneratedCssFromPage(), 'css', 'generated css');
    };

    this.openCodeInNewWindow = props.config.openCodeInNewWindow;
    props.config.stylify.EventsEmitter.addListener('stylify:runtime:repainted', data => {
      const builds = this.state.builds;
      const buildSize = this.state.actualSize === 0 ? data.css.length : data.css.length - this.state.actualSize;

      if (buildSize === 0) {
        return;
      }

      builds.push({
        content: data.content,
        size: buildSize,
        repaintTime: data.repaintTime,
        details: data.compilerResult.lastBuildInfo
      });
      this.setState({
        totalRepaintTime: this.state.totalRepaintTime + data.repaintTime,
        actualSize: this.state.actualSize + buildSize,
        builds: builds
      });
    });
  }

  getGeneratedCssFromPage() {
    const stylifyCssElement = document.querySelector('#stylify-css');
    return stylifyCssElement ? stylifyCssElement.innerHTML : '';
  }

  convertSizeToKb(size, precision = 1) {
    return (size / 1000).toFixed(precision) + ' Kb';
  }

  convertTimeToSeconds(time, precision = 1) {
    return time.toFixed(precision) + ' ms';
  }

  openProcessedContentInNewWindow(content) {
    const div = document.createElement('div');
    div.innerHTML = decodeURIComponent(content);
    this.openCodeInNewWindow(div.innerHTML, null, 'processed selectors');
  }

  render() {
    return o$1("div", Object.assign({
      class: "profiler-extension"
    }, {
      children: [o$1("a", Object.assign({
        role: "button",
        onClick: this.toggleBuildsListVisibility,
        class: `${this.state.buildsListVisible ? 'profiler-extension__button--active' : ''} profiler-extension__button`
      }, {
        children: [o$1("strong", Object.assign({
          title: "Builds count",
          class: "margin-right:8px"
        }, {
          children: [o$1("i", {
            class: "sp-icon sp-icon-refresh-cw profiler-extension__button-icon"
          }, void 0), o$1("span", Object.assign({
            class: "profiler-extension__button-label"
          }, {
            children: this.state.builds.length
          }), void 0)]
        }), void 0), "|", o$1("strong", Object.assign({
          title: "Total builds CSS size",
          class: "margin:0__8px"
        }, {
          children: [o$1("i", {
            class: "sp-icon sp-icon-archive profiler-extension__button-icon"
          }, void 0), o$1("span", Object.assign({
            class: "profiler-extension__button-label"
          }, {
            children: this.convertSizeToKb(this.state.actualSize)
          }), void 0)]
        }), void 0), "|", o$1("strong", Object.assign({
          title: "Total builds repaint time",
          class: "margin-left:8px"
        }, {
          children: [o$1("i", {
            class: "sp-icon sp-icon-clock profiler-extension__button-icon"
          }, void 0), o$1("span", Object.assign({
            class: "profiler-extension__button-label"
          }, {
            children: this.convertTimeToSeconds(this.state.totalRepaintTime)
          }), void 0)]
        }), void 0)]
      }), void 0), o$1("div", Object.assign({
        class: `display:${this.state.buildsListVisible ? 'block' : 'none'} profiler-extension__dropdown`
      }, {
        children: [o$1("table", Object.assign({
          class: "text-align:left white-space:nowrap",
          cellspacing: "0"
        }, {
          children: [o$1("thead", {
            children: o$1("tr", {
              children: [o$1("th", Object.assign({
                class: "padding:8px"
              }, {
                children: "Build"
              }), void 0), o$1("th", Object.assign({
                class: "padding:8px"
              }, {
                children: "Size"
              }), void 0), o$1("th", Object.assign({
                class: "padding:8px"
              }, {
                children: "Time"
              }), void 0), o$1("th", Object.assign({
                class: "padding:8px",
                title: "Processed content"
              }, {
                children: "Content"
              }), void 0), o$1("th", Object.assign({
                class: "padding:8px",
                title: "Processed selectors"
              }, {
                children: "Selectors"
              }), void 0), o$1("th", Object.assign({
                class: "padding:8px",
                title: "Processed components"
              }, {
                children: "Components"
              }), void 0)]
            }, void 0)
          }, void 0), o$1("tbody", {
            children: this.state.builds.map((build, i) => {
              return o$1("tr", Object.assign({
                class: "hover:background:#333"
              }, {
                children: [o$1("td", Object.assign({
                  class: "padding:8px"
                }, {
                  children: i
                }), void 0), o$1("td", Object.assign({
                  class: "padding:8px"
                }, {
                  children: this.convertSizeToKb(build.size)
                }), void 0), o$1("td", Object.assign({
                  class: "padding:8px"
                }, {
                  children: this.convertTimeToSeconds(build.repaintTime)
                }), void 0), o$1("td", Object.assign({
                  class: "padding:8px"
                }, {
                  children: o$1("a", Object.assign({
                    role: "button",
                    onClick: () => {
                      this.openProcessedContentInNewWindow(encodeURIComponent(build.content));
                    },
                    class: "profiler-extension__link"
                  }, {
                    children: ["Show(", this.convertSizeToKb(build.content.length), ")"]
                  }), void 0)
                }), void 0), o$1("td", Object.assign({
                  class: "padding:8px"
                }, {
                  children: build.details.processedSelectors.length === 0 ? '---' : o$1("a", Object.assign({
                    role: "button",
                    onClick: () => {
                      this.openProcessedContentInNewWindow(encodeURIComponent(build.details.processedSelectors.sort().join('\n')));
                    },
                    class: "profiler-extension__link"
                  }, {
                    children: ["Show(", build.details.processedSelectors.length, ")"]
                  }), void 0)
                }), void 0), o$1("td", Object.assign({
                  class: "padding:8px"
                }, {
                  children: build.details.processedComponents.length === 0 ? '---' : o$1("a", Object.assign({
                    role: "button",
                    onClick: () => {
                      this.openProcessedContentInNewWindow(encodeURIComponent(build.details.processedComponents.sort().join('\n')));
                    },
                    class: "profiler-extension__link"
                  }, {
                    children: ["Show(", build.details.processedComponents.length, ")"]
                  }), void 0)
                }), void 0)]
              }), void 0);
            })
          }, void 0)]
        }), void 0), o$1("div", Object.assign({
          class: "border-top:1px__solid__#444 padding-top:8px"
        }, {
          children: [o$1("a", Object.assign({
            href: `data:text/plain;charset=utf-8,${encodeURIComponent(this.getGeneratedCssFromPage())}`,
            download: "stylify-generated.css",
            class: "profiler-extension__link"
          }, {
            children: "Export CSS"
          }), void 0), "|", o$1("a", Object.assign({
            role: "button",
            onClick: this.openGeneratedCssInNewWindow,
            class: "profiler-extension__link margin-left:8px"
          }, {
            children: "Show CSS"
          }), void 0)]
        }), void 0)]
      }), void 0)]
    }), void 0);
  }

}

class CacheInfoExtension extends p {
  constructor(props) {
    super();
    this.Stylify = null;
    this.openCodeInNewWindow = null;
    this.state = {
      cacheInfoVisible: false,
      cacheList: []
    };

    this.toggleCacheInfoVisibility = () => {
      this.setState({
        cacheInfoVisible: !this.state.cacheInfoVisible
      });
    };

    this.openActualCacheInNewWindow = () => {
      this.openCodeInNewWindow(this.stringifyCache(this.Stylify.Runtime.CompilerResult.serialize()), 'json');
    };

    this.stringifyCache = cache => {
      return JSON.stringify(cache, null, 4);
    };

    this.Stylify = props.config.stylify;
    this.openCodeInNewWindow = props.config.openCodeInNewWindow;
    props.config.stylify.EventsEmitter.addListener('stylify:runtime:hydrated', data => {
      this.state.cacheList.push(this.stringifyCache(data.cache));
      this.setState({
        cacheList: this.state.cacheList
      });
    });
  }

  convertSizeToKb(size, precision = 1) {
    return (size / 1000).toFixed(precision);
  }

  render() {
    return o$1("div", Object.assign({
      class: "profiler-extension"
    }, {
      children: [o$1("a", Object.assign({
        role: "button",
        onClick: this.toggleCacheInfoVisibility,
        title: "Cache info",
        class: `${this.state.cacheInfoVisible ? 'profiler-extension__button--active' : ''} profiler-extension__button`
      }, {
        children: [o$1("i", {
          class: "sp-icon sp-icon-layers profiler-extension__button-icon"
        }, void 0), o$1("strong", Object.assign({
          class: `${this.state.cacheSize > 50 ? 'color:red' : ''} profiler-extension__button-label`
        }, {
          children: this.state.cacheList.length
        }), void 0)]
      }), void 0), o$1("div", Object.assign({
        class: `display:${this.state.cacheInfoVisible ? 'block' : 'none'} profiler-extension__dropdown`
      }, {
        children: [o$1("table", {
          children: [o$1("thead", {
            children: [o$1("th", {
              children: "Id"
            }, void 0), o$1("th", {
              children: "Size"
            }, void 0)]
          }, void 0), o$1("tbody", {
            children: this.state.cacheList.map((cache, i) => {
              return o$1("tr", {
                children: [o$1("td", {
                  children: i
                }, void 0), o$1("td", {
                  children: o$1("a", Object.assign({
                    role: "button",
                    class: "profiler-extension__link",
                    onClick: () => {
                      this.openCodeInNewWindow(cache, 'json');
                    }
                  }, {
                    children: ["Show: ", this.convertSizeToKb(cache.length), " Kb"]
                  }), void 0)
                }, void 0)]
              }, void 0);
            })
          }, void 0)]
        }, void 0), o$1("hr", {}, void 0), o$1("div", Object.assign({
          class: "display:flex"
        }, {
          children: o$1("a", Object.assign({
            role: "button",
            class: "profiler-extension__link margin-left:8px",
            onClick: () => {
              this.openActualCacheInNewWindow();
            }
          }, {
            children: "Dump actual cache"
          }), void 0)
        }), void 0)]
      }), void 0)]
    }), void 0);
  }

}

class ConfigurationsVisualizerExtension extends p {
  constructor(props) {
    super();
    this.state = {
      components: {},
      componentsListVisible: false,
      macros: {},
      macrosListVisible: false,
      variables: {},
      variablesListVisible: false
    };

    this.updateCompilerConfigs = Compiler => {
      this.setState({
        components: Compiler.components,
        helpers: Compiler.helpers,
        macros: Compiler.macros,
        variables: Compiler.variables
      });
    };

    this.toggleDetailVisibility = name => {
      const newState = {};
      newState[name + 'Visible'] = !this.state[name + 'Visible'];
      this.setState(newState);
    };

    this.updateCompilerConfigs(props.config.stylify.Compiler);
    props.config.stylify.EventsEmitter.addListener('stylify:compiler:configured', data => {
      this.updateCompilerConfigs(data.compiler);
    });
  }

  render() {
    return o$1(y, {
      children: [o$1("div", Object.assign({
        class: "profiler-extension"
      }, {
        children: [o$1("a", Object.assign({
          role: "button",
          title: "Macros",
          class: `${this.state.macrosListVisible && Object.keys(this.state.macros).length ? 'profiler-extension__button--active' : ''} profiler-extension__button`,
          onClick: () => this.toggleDetailVisibility('macrosList')
        }, {
          children: [o$1("i", {
            class: "sp-icon sp-icon-aperture profiler-extension__button-icon"
          }, void 0), o$1("strong", Object.assign({
            class: "profiler-extension__button-label"
          }, {
            children: Object.keys(this.state.macros).length
          }), void 0)]
        }), void 0), o$1("div", Object.assign({
          class: `visibility:${this.state.macrosListVisible && Object.keys(this.state.macros).length ? 'visible' : 'hidden'} display:flex profiler-extension__dropdown`
        }, {
          children: o$1("table", {
            children: [o$1("thead", {
              children: o$1("tr", {
                children: o$1("th", Object.assign({
                  class: "padding:8px"
                }, {
                  children: "Macro"
                }), void 0)
              }, void 0)
            }, void 0), o$1("tbody", {
              children: Object.keys(this.state.macros).map((macroRegExp, i) => {
                return o$1("tr", Object.assign({
                  class: "hover:background:#333"
                }, {
                  children: o$1("td", Object.assign({
                    class: "padding:8px white-space:nowrap max-width:800px overflow-x:auto"
                  }, {
                    children: o$1("pre", {
                      children: o$1("code", {
                        children: this.state.macros[macroRegExp].toString().replaceAll(/  |\t\t/ig, ' ')
                      }, void 0)
                    }, void 0)
                  }), void 0)
                }), void 0);
              })
            }, void 0)]
          }, void 0)
        }), void 0)]
      }), void 0), o$1("div", Object.assign({
        class: "profiler-extension"
      }, {
        children: [o$1("a", Object.assign({
          role: "button",
          title: "Variables",
          class: `${this.state.variablesListVisible && Object.keys(this.state.variables).length ? 'profiler-extension__button--active' : ''} profiler-extension__button`,
          onClick: () => this.toggleDetailVisibility('variablesList')
        }, {
          children: [o$1("i", {
            class: "sp-icon sp-icon-dollar-sign profiler-extension__button-icon"
          }, void 0), o$1("strong", Object.assign({
            class: "profiler-extension__button-label"
          }, {
            children: Object.keys(this.state.variables).length
          }), void 0)]
        }), void 0), o$1("div", Object.assign({
          class: `visibility:${this.state.variablesListVisible && Object.keys(this.state.variables).length ? 'visible' : 'hidden'} display:flex profiler-extension__dropdown`
        }, {
          children: o$1("table", {
            children: [o$1("thead", {
              children: o$1("tr", {
                children: [o$1("th", Object.assign({
                  class: "padding:8px"
                }, {
                  children: "Name"
                }), void 0), o$1("th", Object.assign({
                  class: "padding:8px"
                }, {
                  children: "Value"
                }), void 0)]
              }, void 0)
            }, void 0), o$1("tbody", {
              children: Object.keys(this.state.variables).map((variableName, i) => {
                return o$1("tr", Object.assign({
                  class: "hover:background:#333"
                }, {
                  children: [o$1("td", Object.assign({
                    class: "padding:8px white-space:nowrap"
                  }, {
                    children: variableName
                  }), void 0), o$1("td", Object.assign({
                    class: "padding:8px white-space:nowrap max-width:800px overflow-x:auto"
                  }, {
                    children: this.state.variables[variableName]
                  }), void 0)]
                }), void 0);
              })
            }, void 0)]
          }, void 0)
        }), void 0)]
      }), void 0), o$1("div", Object.assign({
        class: "profiler-extension"
      }, {
        children: [o$1("a", Object.assign({
          role: "button",
          title: "Components",
          class: `${this.state.componentsListVisible && Object.keys(this.state.components).length ? 'profiler-extension__button--active' : ''} profiler-extension__button`,
          onClick: () => this.toggleDetailVisibility('componentsList')
        }, {
          children: [o$1("i", {
            class: "sp-icon sp-icon-layout profiler-extension__button-icon"
          }, void 0), o$1("strong", Object.assign({
            class: "profiler-extension__button-label"
          }, {
            children: Object.keys(this.state.components).length
          }), void 0)]
        }), void 0), o$1("div", Object.assign({
          class: `visibility:${this.state.componentsListVisible && Object.keys(this.state.components).length ? 'visible' : 'hidden'} display:flex profiler-extension__dropdown`
        }, {
          children: o$1("table", {
            children: [o$1("thead", {
              children: o$1("tr", {
                children: [o$1("th", Object.assign({
                  class: "padding:8px"
                }, {
                  children: "Name"
                }), void 0), o$1("th", Object.assign({
                  class: "padding:8px"
                }, {
                  children: "Classes"
                }), void 0)]
              }, void 0)
            }, void 0), o$1("tbody", {
              children: Object.keys(this.state.components).map((componentName, i) => {
                return o$1("tr", Object.assign({
                  class: "hover:background:#333"
                }, {
                  children: [o$1("td", Object.assign({
                    class: "padding:8px white-space:nowrap"
                  }, {
                    children: componentName
                  }), void 0), o$1("td", Object.assign({
                    class: "padding:8px white-space:nowrap max-width:800px overflow-x:auto word-spacing:24px"
                  }, {
                    children: this.state.components[componentName]
                  }), void 0)]
                }), void 0);
              })
            }, void 0)]
          }, void 0)
        }), void 0)]
      }), void 0), o$1("div", Object.assign({
        class: "profiler-extension"
      }, {
        children: [o$1("a", Object.assign({
          role: "button",
          title: "Helpers",
          class: `${this.state.helpersListVisible && Object.keys(this.state.helpers).length ? 'profiler-extension__button--active' : ''} profiler-extension__button`,
          onClick: () => this.toggleDetailVisibility('helpersList')
        }, {
          children: [o$1("i", {
            class: "sp-icon sp-icon-tool profiler-extension__button-icon"
          }, void 0), o$1("strong", Object.assign({
            class: "profiler-extension__button-label"
          }, {
            children: Object.keys(this.state.helpers).length
          }), void 0)]
        }), void 0), o$1("div", Object.assign({
          class: `visibility:${this.state.helpersListVisible && Object.keys(this.state.helpers).length ? 'visible' : 'hidden'} display:flex profiler-extension__dropdown`
        }, {
          children: o$1("table", {
            children: [o$1("thead", {
              children: o$1("tr", {
                children: o$1("th", Object.assign({
                  class: "padding:8px"
                }, {
                  children: "Helper"
                }), void 0)
              }, void 0)
            }, void 0), o$1("tbody", {
              children: Object.keys(this.state.helpers).map((helperName, i) => {
                return o$1("tr", Object.assign({
                  class: "hover:background:#333"
                }, {
                  children: o$1("td", Object.assign({
                    class: "padding:8px white-space:nowrap max-width:800px overflow-x:auto"
                  }, {
                    children: o$1("pre", {
                      children: o$1("code", {
                        children: this.state.helpers[helperName].toString().replaceAll(/  |\t\t/ig, ' ')
                      }, void 0)
                    }, void 0)
                  }), void 0)
                }), void 0);
              })
            }, void 0)]
          }, void 0)
        }), void 0)]
      }), void 0)]
    }, void 0);
  }

}

class DomNodesCounterExtension extends p {
  constructor(config) {
    super();
    this.profilerElement = document.querySelector('#stylify-profiler');
    this.state = {
      recommendedDomNodesCount: 1500,
      totalDomNodesCount: 0
    };

    this.updateDomNodesCount = () => {
      const count = document.getElementsByTagName('*').length - this.profilerElement.getElementsByTagName('*').length;
      this.setState({
        totalDomNodesCount: count
      });
    };

    document.addEventListener('DOMContentLoaded', () => {
      this.updateDomNodesCount();
    });
    const observer = new MutationObserver(() => {
      this.updateDomNodesCount();
    });
    observer.observe(document.documentElement, {
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    });
  }

  render() {
    return o$1("div", Object.assign({
      class: "profiler-extension"
    }, {
      children: o$1("div", Object.assign({
        role: "button",
        title: "Dom nodes counter",
        class: "profiler-extension__button"
      }, {
        children: [o$1("i", {
          class: "sp-icon sp-icon-link profiler-extension__button-icon"
        }, void 0), o$1("strong", Object.assign({
          class: `${this.state.totalDomNodesCount > this.state.recommendedDomNodesCount ? 'color:red' : ''} profiler-extension__button-label`
        }, {
          children: this.state.totalDomNodesCount
        }), void 0)]
      }), void 0)
    }), void 0);
  }

}

class Profiler {
  constructor(stylify = window.Stylify) {
    this.PRISM_VERSION = '1.23.0';
    this.PRISM_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/prism/' + this.PRISM_VERSION;
    this.preact = preact;
    this.htm = htm;
    this.stylify = null;

    this.openCodeInNewWindow = (code, language = null, windowTitle = null) => {
      let codeWindow = window.open("");
      language = language || 'markup';
      codeWindow.title = 'Stylify: ' + (windowTitle || 'profiler preview');

      if (language === 'markup') {
        code = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
      }

      codeWindow.document.write(`
			<link href="${this.PRISM_CDN_URL}/themes/prism.min.css" rel="stylesheet" />
			<script async defer src="${this.PRISM_CDN_URL}/components/prism-core.min.js"></script>
			<script async defer src="${this.PRISM_CDN_URL}/plugins/autoloader/prism-autoloader.min.js"></script>
			<pre><code class="language-${language}">${code}</code></pre>
		`);
      codeWindow.document.close();
    };

    this.stylify = stylify || null;
  }

  init(stylify = null) {
    this.stylify = stylify || this.stylify;

    if (stylify && typeof stylify === 'undefined') {
      console.error('Stylify profiller could not be initialized: Stylify is not defined.');
      return false;
    }

    this.stylify.Profiler = Profiler;
    this.stylify.configure({
      compiler: {
        dev: true,
        pregenerate: `
					border-top:1px__solid__#444
					bottom:0
					color:#fff
					content-visibility:hidden
					content-visibility:visible
					display:block
					display:none
					font-family:arial
					font-size:12px
					line-height:26px
					margin-left:8px
					margin:0__8px
					max-width:800px
					overflow-x:auto
					padding-top:8px
					position:fixed
					text-align:left
					visibility:hidden
					visibility:visible
					width:auto
					word-spacing:24px
				`,
        components: {
          'profiler-extension': `
						box-sizing:border-box
						border-left:1px__solid__#555
						align-items:center
						display:flex
						min-height:100%
						position:relative
						hover:background:#333
					`,
          'profiler-extension__button': `
						box-sizing:border-box
						height:26px
						padding:0__8px
						display:flex
						align-items:center
						justify-content:center
						font-size:14px
						cursor:pointer
						user-select:none
					`,
          'profiler-extension__button--active': 'background-color:#333',
          'profiler-extension__dropdown': `
						box-sizing:border-box
						position:absolute
						bottom:100%
						left:0
						max-height:50vh
						overflow:auto
						min-width:100%
						background:#000
						padding:8px
					`,
          'profiler-extension__link': `
						box-sizing:border-box
						text-decoration:none
						color:#00b2e5
						margin-right:8px
						white-space:nowrap
						display:inline-block
						cursor:pointer
					`,
          'profiler-extension__button-icon': 'margin-right:8px display:inline-block font-weight:bold color:#aaa',
          'profiler-extension__button-label': 'line-height:1'
        }
      }
    });
    addProfilerExtension(BuildsAnalyzerExtension);
    addProfilerExtension(CacheInfoExtension);
    addProfilerExtension(ConfigurationsVisualizerExtension);
    addProfilerExtension(DomNodesCounterExtension);
    initProfilerToolbar({
      stylify: this.stylify,
      openCodeInNewWindow: this.openCodeInNewWindow
    });
    return true;
  }

}

export default Profiler;
