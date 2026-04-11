import "./globals.css";

export const metadata = {
  title: "Starlink Price Explorer | Compare Global Roaming Rates",
  description: "Dynamic Starlink price comparator. Find the best regional and global roaming deals for countries without official Starlink support.",
  keywords: "starlink, roaming, global roaming, regional roam, price comparison, internet, satellite",
  openGraph: {
    title: "Starlink Price Explorer | Compare Global Roaming Rates",
    description: "Compare Starlink prices worldwide. Find the best deals for Regional and Global roaming.",
    url: "https://starlink.genu.cm",
    siteName: "Starlink Price Explorer",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Starlink Price Explorer",
    description: "Compare Starlink prices worldwide. Find the best deals for Regional and Global roaming.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
