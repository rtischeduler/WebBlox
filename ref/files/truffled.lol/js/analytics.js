(function () {
  if (window.gaLoaded) return;
  window.gaLoaded = true;
  var list = (window.dataLayer = window.dataLayer || []);
  window.gtag = function () {
    list.push(arguments);
  };
  var p = location.pathname;
  var prox =
    p === "/cm.html" ||
    p.indexOf("/studying/frame") === 0 ||
    p.indexOf("/studying/service/") === 0;
  window.gtag("js", new Date());
  window.gtag("config", "G-PXHK7Q7G3Z", {
    page_location: location.origin + (prox ? "/proxy" : p),
    page_referrer: "",
    page_title: prox ? "Proxy" : document.title,
  });
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=G-PXHK7Q7G3Z";
  document.head.appendChild(s);
  window.trackProxyNavigation = function () {
    window.gtag("event", "proxy_navigation", {
      page_location: location.origin + "/proxy",
      page_referrer: "",
      page_title: "Proxy",
    });
  };
})();
