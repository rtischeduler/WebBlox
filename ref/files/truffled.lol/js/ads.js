(() => {
  if (localStorage.getItem("adsEnabled") === "false") return;
  if (/^\/(?:mobile\.html|iframe\.html|unityframe\.html|i|u)\/?$/.test(location.pathname)) return;
  if (document.body?.classList.contains("proxy-browser-page")) return;
  if (window.__siteAds || document.querySelector('script[data-truffled-ad],script[data-site-ad]')) return;
  window.__siteAds = true;
  const script = document.createElement("script");
  script.src = "https://abscloud.org/1/3f3236be1ec5673d9ed3582262c4dab9";
  script.async = true;
  script.dataset.truffledAd = "";
  (document.body || document.head).appendChild(script);
  const script2 = document.createElement("script");
  script2.src = "https://bauval.org/14/1eca0b39c37917b7f099788bd311eae3";
  script2.setAttribute("data-cfasync", "false");
  script2.dataset.truffledAd = "";
  (document.body || document.head).appendChild(script2);
})();
