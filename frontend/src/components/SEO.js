import { Helmet } from 'react-helmet-async';

const SITE = 'https://emodoka.vercel.app';

function SEO({ title, description, path, ogImage }) {
  const fullTitle = title ? `${title} | E-modoka` : 'E-modoka - Bus Booking Made Easy';
  const desc = description || 'Book bus tickets online in Kigali, Rwanda. Fast, reliable bus transport with real-time tracking and mobile QR ticketing.';
  const url = `${SITE}${path || '/'}`;
  const image = ogImage || `${SITE}/logo.png`;

  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'BusTrip',
    name: 'E-modoka',
    description: desc,
    url: SITE,
    image,
    areaServed: { '@type': 'City', name: 'Kigali', addressCountry: 'RW' },
    offers: { '@type': 'Offer', priceCurrency: 'RWF', description: 'Bus ticket booking' },
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />
      <script type="application/ld+json">{JSON.stringify(ldJson)}</script>
    </Helmet>
  );
}

export default SEO;
