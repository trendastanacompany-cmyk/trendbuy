import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL, absoluteUrl } from "../lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | Trend Astana"
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  verification: {
    google: "kbdt_dhSBMdNpwp-6epsXm0kVcFwtxFpZDD6qRf2wUo",
    yandex: "8cb527d98ee350fd"
  },
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    siteName: SITE_NAME,
    url: absoluteUrl("/"),
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/img/slider/bg-slide01.jpg",
        width: 1200,
        height: 630,
        alt: "Trend Astana"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/img/slider/bg-slide01.jpg"]
  },
  icons: {
    icon: [{ url: "/img/favicon.svg", type: "image/svg+xml" }]
  }
};

const yandexMetrikaScript = `
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) {
    if (document.scripts[j].src === r) { return; }
  }
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
ym(101718574,"init",{
  clickmap:true,
  trackLinks:true,
  accurateTrackBounce:true,
  webvisor:true
});`;

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru-KZ">
      <head>
        <link rel="stylesheet" href="/css/style.css" />
      </head>
      <body>
        {children}
        <Script id="yandex-metrika" strategy="lazyOnload">
          {yandexMetrikaScript}
        </Script>
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/101718574" style={{ position: "absolute", left: "-9999px" }} alt="" />
          </div>
        </noscript>
      </body>
    </html>
  );
}
