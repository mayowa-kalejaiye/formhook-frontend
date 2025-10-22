import Head from 'next/head';

type SEOProps = {
  title: string;
  description: string;
  image?: string; // absolute URL
  url?: string; // absolute URL
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  jsonLd?: Record<string, any> | null;
};

const DEFAULT_SITE = process.env.NEXT_PUBLIC_SITE_NAME || 'FormHook';
const DEFAULT_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://formhook-frontend.vercel.app').replace(/\/$/, '');
const DEFAULT_IMAGE = process.env.NEXT_PUBLIC_OG_IMAGE || `${DEFAULT_URL}/og-image.svg`;

export default function SEO({
  title,
  description,
  image = DEFAULT_IMAGE,
  url = DEFAULT_URL,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  keywords = [],
  jsonLd = null,
}: SEOProps) {
  const fullTitle = title ? `${title} · ${DEFAULT_SITE}` : DEFAULT_SITE;

  const ld = jsonLd || {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: DEFAULT_SITE,
    url,
  };

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow" />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={DEFAULT_SITE} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* Article times and author (optional) */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta name="author" content={author} />}

      {/* Canonical */}
      <link rel="canonical" href={url} />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
    </Head>
  );
}
