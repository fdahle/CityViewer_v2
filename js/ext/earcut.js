! function(e) {
  if ("object" == typeof exports && "undefined" != typeof module) module.exports = e();
  else if ("function" == typeof define && define.amd) define([], e);
  else {
    ("undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : this).earcut = e()
  }
}(function() {
  return function i(f, u, o) {
    function v(n, e) {
      if (!u[n]) {
        if (!f[n]) {
          var t = "function" == typeof require && require;
          if (!e && t) return t(n, !0);
          if (y) return y(n, !0);
          var r = new Error("Cannot find module '" + n + "'");
          throw r.code = "MODULE_NOT_FOUND", r
        }
        var x = u[n] = {
          exports: {}
        };
        f[n][0].call(x.exports, function(e) {
          return v(f[n][1][e] || e)
        }, x, x.exports, i, f, u, o)
      }
      return u[n].exports
    }
    for (var y = "function" == typeof require && require, e = 0; e < o.length; e++) v(o[e]);
    return v
  }({
    1: [function(e, n, t) {
      "use strict";

      function r(e, n, t) {
        t = t || 2;
        var r, x, i, f, u, o, v, y = n && n.length,
          p = y ? n[0] * t : e.length,
          a = s(e, 0, p, t, !0),
          l = [];
        if (!a || a.next === a.prev) return l;
        if (y && (a = function(e, n, t, r) {
            var x, i, f, u, o, v = [];
            for (x = 0, i = n.length; x < i; x++) f = n[x] * r, u = x < i - 1 ? n[x + 1] * r : e.length, (o = s(e, f, u, r, !1)) === o.next && (o.steiner = !0), v.push(M(o));
            for (v.sort(Z), x = 0; x < v.length; x++) g(v[x], t), t = c(t, t.next);
            return t
          }(e, n, a, t)), e.length > 80 * t) {
          r = i = e[0], x = f = e[1];
          for (var h = t; h < p; h += t)(u = e[h]) < r && (r = u), (o = e[h + 1]) < x && (x = o), i < u && (i = u), f < o && (f = o);
          v = 0 !== (v = Math.max(i - r, f - x)) ? 1 / v : 0
        }
        return d(a, l, t, r, x, v), l
      }

      function s(e, n, t, r, x) {
        var i, f;
        if (x === 0 < D(e, n, t, r))
          for (i = n; i < t; i += r) f = u(i, e[i], e[i + 1], f);
        else
          for (i = t - r; n <= i; i -= r) f = u(i, e[i], e[i + 1], f);
        return f && h(f, f.next) && (k(f), f = f.next), f
      }

      function c(e, n) {
        if (!e) return e;
        n = n || e;
        var t, r = e;
        do {
          if (t = !1, r.steiner || !h(r, r.next) && 0 !== m(r.prev, r, r.next)) r = r.next;
          else {
            if (k(r), (r = n = r.prev) === r.next) break;
            t = !0
          }
        } while (t || r !== n);
        return n
      }

      function d(e, n, t, r, x, i, f) {
        if (e) {
          !f && i && function(e, n, t, r) {
            var x = e;
            for (; null === x.z && (x.z = w(x.x, x.y, n, t, r)), x.prevZ = x.prev, x.nextZ = x.next, x = x.next, x !== e;);
            x.prevZ.nextZ = null, x.prevZ = null,
              function(e) {
                var n, t, r, x, i, f, u, o, v = 1;
                do {
                  for (t = e, i = e = null, f = 0; t;) {
                    for (f++, r = t, n = u = 0; n < v && (u++, r = r.nextZ); n++);
                    for (o = v; 0 < u || 0 < o && r;) 0 !== u && (0 === o || !r || t.z <= r.z) ? (t = (x = t).nextZ, u--) : (r = (x = r).nextZ, o--), i ? i.nextZ = x : e = x, x.prevZ = i, i = x;
                    t = r
                  }
                  i.nextZ = null, v *= 2
                } while (1 < f)
              }(x)
          }(e, r, x, i);
          for (var u, o, v = e; e.prev !== e.next;)
            if (u = e.prev, o = e.next, i ? p(e, r, x, i) : y(e)) n.push(u.i / t), n.push(e.i / t), n.push(o.i / t), k(e), e = o.next, v = o.next;
            else if ((e = o) === v) {
            f ? 1 === f ? d(e = a(c(e), n, t), n, t, r, x, i, 2) : 2 === f && l(e, n, t, r, x, i) : d(c(e), n, t, r, x, i, 1);
            break
          }
        }
      }

      function y(e) {
        var n = e.prev,
          t = e,
          r = e.next;
        if (!(0 <= m(n, t, r))) {
          for (var x = e.next.next; x !== e.prev;) {
            if (b(n.x, n.y, t.x, t.y, r.x, r.y, x.x, x.y) && 0 <= m(x.prev, x, x.next)) return;
            x = x.next
          }
          return 1
        }
      }

      function p(e, n, t, r) {
        var x = e.prev,
          i = e,
          f = e.next;
        if (!(0 <= m(x, i, f))) {
          for (var u = x.x < i.x ? x.x < f.x ? x.x : f.x : i.x < f.x ? i.x : f.x, o = x.y < i.y ? x.y < f.y ? x.y : f.y : i.y < f.y ? i.y : f.y, v = x.x > i.x ? x.x > f.x ? x.x : f.x : i.x > f.x ? i.x : f.x, y = x.y > i.y ? x.y > f.y ? x.y : f.y : i.y > f.y ? i.y : f.y, p = w(u, o, n, t, r), a = w(v, y, n, t, r), l = e.prevZ, h = e.nextZ; l && l.z >= p && h && h.z <= a;) {
            if (l !== e.prev && l !== e.next && b(x.x, x.y, i.x, i.y, f.x, f.y, l.x, l.y) && 0 <= m(l.prev, l, l.next)) return;
            if (l = l.prevZ, h !== e.prev && h !== e.next && b(x.x, x.y, i.x, i.y, f.x, f.y, h.x, h.y) && 0 <= m(h.prev, h, h.next)) return;
            h = h.nextZ
          }
          for (; l && l.z >= p;) {
            if (l !== e.prev && l !== e.next && b(x.x, x.y, i.x, i.y, f.x, f.y, l.x, l.y) && 0 <= m(l.prev, l, l.next)) return;
            l = l.prevZ
          }
          for (; h && h.z <= a;) {
            if (h !== e.prev && h !== e.next && b(x.x, x.y, i.x, i.y, f.x, f.y, h.x, h.y) && 0 <= m(h.prev, h, h.next)) return;
            h = h.nextZ
          }
          return 1
        }
      }

      function a(e, n, t) {
        var r = e;
        do {
          var x = r.prev,
            i = r.next.next;
          !h(x, i) && z(x, r, r.next, i) && q(x, i) && q(i, x) && (n.push(x.i / t), n.push(r.i / t), n.push(i.i / t), k(r), k(r.next), r = e = i), r = r.next
        } while (r !== e);
        return c(r)
      }

      function l(e, n, t, r, x, i) {
        var f, u, o = e;
        do {
          for (var v = o.next.next; v !== o.prev;) {
            if (o.i !== v.i && (u = v, (f = o).next.i !== u.i && f.prev.i !== u.i && ! function(e, n) {
                var t = e;
                do {
                  if (t.i !== e.i && t.next.i !== e.i && t.i !== n.i && t.next.i !== n.i && z(t, t.next, e, n)) return 1;
                  t = t.next
                } while (t !== e);
                return
              }(f, u) && (q(f, u) && q(u, f) && function(e, n) {
                var t = e,
                  r = !1,
                  x = (e.x + n.x) / 2,
                  i = (e.y + n.y) / 2;
                for (; t.y > i != t.next.y > i && t.next.y !== t.y && x < (t.next.x - t.x) * (i - t.y) / (t.next.y - t.y) + t.x && (r = !r), t = t.next, t !== e;);
                return r
              }(f, u) && (m(f.prev, f, u.prev) || m(f, u.prev, u)) || h(f, u) && 0 < m(f.prev, f, f.next) && 0 < m(u.prev, u, u.next)))) {
              var y = O(o, v);
              return o = c(o, o.next), y = c(y, y.next), d(o, n, t, r, x, i), void d(y, n, t, r, x, i)
            }
            v = v.next
          }
          o = o.next
        } while (o !== e)
      }

      function Z(e, n) {
        return e.x - n.x
      }

      function g(e, n) {
        if (n = function(e, n) {
            var t, r = n,
              x = e.x,
              i = e.y,
              f = -1 / 0;
            do {
              if (i <= r.y && i >= r.next.y && r.next.y !== r.y) {
                var u = r.x + (i - r.y) * (r.next.x - r.x) / (r.next.y - r.y);
                if (u <= x && f < u) {
                  if ((f = u) === x) {
                    if (i === r.y) return r;
                    if (i === r.next.y) return r.next
                  }
                  t = r.x < r.next.x ? r : r.next
                }
              }
              r = r.next
            } while (r !== n);
            if (!t) return null;
            if (x === f) return t;
            var o, v = t,
              y = t.x,
              p = t.y,
              a = 1 / 0;
            r = t;
            for (; x >= r.x && r.x >= y && x !== r.x && b(i < p ? x : f, i, y, p, i < p ? f : x, i, r.x, r.y) && (o = Math.abs(i - r.y) / (x - r.x), q(r, e) && (o < a || o === a && (r.x > t.x || r.x === t.x && (h = r, m((l = t).prev, l, h.prev) < 0 && m(h.next, l, l.next) < 0))) && (t = r, a = o)), r = r.next, r !== v;);
            var l, h;
            return t
          }(e, n)) {
          var t = O(n, e);
          c(n, n.next), c(t, t.next)
        }
      }

      function w(e, n, t, r, x) {
        return (e = 1431655765 & ((e = 858993459 & ((e = 252645135 & ((e = 16711935 & ((e = 32767 * (e - t) * x) | e << 8)) | e << 4)) | e << 2)) | e << 1)) | (n = 1431655765 & ((n = 858993459 & ((n = 252645135 & ((n = 16711935 & ((n = 32767 * (n - r) * x) | n << 8)) | n << 4)) | n << 2)) | n << 1)) << 1
      }

      function M(e) {
        for (var n = e, t = e;
          (n.x < t.x || n.x === t.x && n.y < t.y) && (t = n), (n = n.next) !== e;);
        return t
      }

      function b(e, n, t, r, x, i, f, u) {
        return 0 <= (x - f) * (n - u) - (e - f) * (i - u) && 0 <= (e - f) * (r - u) - (t - f) * (n - u) && 0 <= (t - f) * (i - u) - (x - f) * (r - u)
      }

      function m(e, n, t) {
        return (n.y - e.y) * (t.x - n.x) - (n.x - e.x) * (t.y - n.y)
      }

      function h(e, n) {
        return e.x === n.x && e.y === n.y
      }

      function z(e, n, t, r) {
        var x = v(m(e, n, t)),
          i = v(m(e, n, r)),
          f = v(m(t, r, e)),
          u = v(m(t, r, n));
        return x !== i && f !== u || (0 === x && o(e, t, n) || (0 === i && o(e, r, n) || (0 === f && o(t, e, r) || !(0 !== u || !o(t, n, r)))))
      }

      function o(e, n, t) {
        return n.x <= Math.max(e.x, t.x) && n.x >= Math.min(e.x, t.x) && n.y <= Math.max(e.y, t.y) && n.y >= Math.min(e.y, t.y)
      }

      function v(e) {
        return 0 < e ? 1 : e < 0 ? -1 : 0
      }

      function q(e, n) {
        return m(e.prev, e, e.next) < 0 ? 0 <= m(e, n, e.next) && 0 <= m(e, e.prev, n) : m(e, n, e.prev) < 0 || m(e, e.next, n) < 0
      }

      function O(e, n) {
        var t = new f(e.i, e.x, e.y),
          r = new f(n.i, n.x, n.y),
          x = e.next,
          i = n.prev;
        return (e.next = n).prev = e, (t.next = x).prev = t, (r.next = t).prev = r, (i.next = r).prev = i, r
      }

      function u(e, n, t, r) {
        var x = new f(e, n, t);
        return r ? (x.next = r.next, (x.prev = r).next.prev = x, r.next = x) : (x.prev = x).next = x, x
      }

      function k(e) {
        e.next.prev = e.prev, e.prev.next = e.next, e.prevZ && (e.prevZ.nextZ = e.nextZ), e.nextZ && (e.nextZ.prevZ = e.prevZ)
      }

      function f(e, n, t) {
        this.i = e, this.x = n, this.y = t, this.prev = null, this.next = null, this.z = null, this.prevZ = null, this.nextZ = null, this.steiner = !1
      }

      function D(e, n, t, r) {
        for (var x = 0, i = n, f = t - r; i < t; i += r) x += (e[f] - e[i]) * (e[i + 1] + e[f + 1]), f = i;
        return x
      }
      n.exports = r, (n.exports.default = r).deviation = function(e, n, t, r) {
        var x = n && n.length,
          i = x ? n[0] * t : e.length,
          f = Math.abs(D(e, 0, i, t));
        if (x)
          for (var u = 0, o = n.length; u < o; u++) {
            var v = n[u] * t,
              y = u < o - 1 ? n[u + 1] * t : e.length;
            f -= Math.abs(D(e, v, y, t))
          }
        var p = 0;
        for (u = 0; u < r.length; u += 3) {
          var a = r[u] * t,
            l = r[u + 1] * t,
            h = r[u + 2] * t;
          p += Math.abs((e[a] - e[h]) * (e[1 + l] - e[1 + a]) - (e[a] - e[l]) * (e[1 + h] - e[1 + a]))
        }
        return 0 === f && 0 === p ? 0 : Math.abs((p - f) / f)
      }, r.flatten = function(e) {
        for (var n = e[0][0].length, t = {
            vertices: [],
            holes: [],
            dimensions: n
          }, r = 0, x = 0; x < e.length; x++) {
          for (var i = 0; i < e[x].length; i++)
            for (var f = 0; f < n; f++) t.vertices.push(e[x][i][f]);
          0 < x && (r += e[x - 1].length, t.holes.push(r))
        }
        return t
      }
    }, {}]
  }, {}, [1])(1)
});
