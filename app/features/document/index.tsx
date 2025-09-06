import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "react-router";
import { useEffect, useRef } from "react";

interface DocumentProps {
  DOMAIN?: string;
  GOOGLE_ADS_ID?: string;
  GOOGLE_ANALYTICS_ID?: string;
  MICROSOFT_CLARITY_ID?: string;
  THIRD_PARTY_ADS_ID?: string;
  lang?: string;
  theme?: string;
}
export function Document({
  lang = "en",
  theme = "light",
  children,
  DOMAIN,
  GOOGLE_ADS_ID,
  GOOGLE_ANALYTICS_ID,
  MICROSOFT_CLARITY_ID,
  THIRD_PARTY_ADS_ID,
}: React.PropsWithChildren<DocumentProps>) {
  const rootRef = useRef<HTMLHtmlElement>(null);
  const error = useRouteError();

  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    let adsScript: HTMLScriptElement;
    let gaScript: HTMLScriptElement;
    let gaInitScript: HTMLScriptElement;
    let pScript: HTMLScriptElement;
    let clarityScript: HTMLScriptElement;
    let thirdPartyAdsScript: HTMLScriptElement;

    // Adsense
    if (GOOGLE_ADS_ID && !error) {
      adsScript = document.createElement("script");
      adsScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${GOOGLE_ADS_ID}`;
      adsScript.async = true;
      adsScript.crossOrigin = "anonymous";

      document.head.appendChild(adsScript);
    }

    // GA
    if (GOOGLE_ANALYTICS_ID) {
      gaScript = document.createElement("script");
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
      gaScript.async = true;

      document.head.appendChild(gaScript);

      // Initlize
      gaInitScript = document.createElement("script");
      gaInitScript.id = "gtag-init";
      gaInitScript.async = true;

      gaInitScript.textContent = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ANALYTICS_ID}', {
              page_path: window.location.pathname,
            });
          `;

      document.head.appendChild(gaInitScript);
    }

    // Microsoft Clarity
    if (MICROSOFT_CLARITY_ID) {
      clarityScript = document.createElement("script");
      clarityScript.type = "text/javascript";
      clarityScript.textContent = `
        (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${MICROSOFT_CLARITY_ID}");
      `;

      document.head.appendChild(clarityScript);
    }

    // 第三方广告网络 - 临时禁用
    // if (THIRD_PARTY_ADS_ID) {
    //   thirdPartyAdsScript = document.createElement("script");
    //   thirdPartyAdsScript.src = `//pl27453148.revenuecpmgate.com/${THIRD_PARTY_ADS_ID}/invoke.js`;
    //   thirdPartyAdsScript.async = true;
    //   thirdPartyAdsScript.setAttribute("data-cfasync", "false");

    //   document.head.appendChild(thirdPartyAdsScript);
    // }

    // Plausible
    if (DOMAIN) {
      pScript = document.createElement("script");
      pScript.src = "https://app.pageview.app/js/script.js";
      pScript.dataset.domain = new URL(DOMAIN).hostname;
      pScript.defer = true;

      document.head.appendChild(pScript);
    }

    return () => {
      if (adsScript) adsScript.remove();
      if (gaScript) gaScript.remove();
      if (gaInitScript) gaInitScript.remove();
      if (clarityScript) clarityScript.remove();
      // if (thirdPartyAdsScript) thirdPartyAdsScript.remove(); // 临时禁用
      if (pScript) pScript.remove();
    };
  }, [GOOGLE_ADS_ID, GOOGLE_ANALYTICS_ID, MICROSOFT_CLARITY_ID, THIRD_PARTY_ADS_ID, DOMAIN, error]);

  return (
    <html ref={rootRef} lang={lang} data-theme={theme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {GOOGLE_ADS_ID && (
          <meta name="google-adsense-account" content={`ca-${GOOGLE_ADS_ID}`} />
        )}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
