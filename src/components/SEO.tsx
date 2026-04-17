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
const DEFAULT_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://formhookapp.vercel.app').replace(/\/$/, '');
const DEFAULT_TITLE = 'FormHook: Reliable Event Intake and Delivery for Developers';
const DEFAULT_DESCRIPTION = 'Capture frontend events and form payloads with one endpoint. FormHook handles validation, storage, routing, retries, and delivery visibility.';
const DEFAULT_KEYWORDS = [
  'event intake',
  'event delivery',
  'webhook reliability',
  'form backend',
  'frontend events',
  'webhooks',
  'event pipeline',
  'developer infrastructure',
  'no backend glue code'
];

// Prefer raster images if generated in /public
function findDefaultImage() {
  // If author set an override, use it
  if (process.env.NEXT_PUBLIC_OG_IMAGE) return process.env.NEXT_PUBLIC_OG_IMAGE;

  const candidates = ['og-image.png', 'og-image.jpg', 'og-image-2.png', 'og-image-2.jpg', 'og-image.svg', 'og-image-2.svg'];

  // Only attempt to access the filesystem on the server side
  if (typeof window !== 'undefined') {
    return `${DEFAULT_URL}/og-image.svg`;
  }

  try {
    const fs = require('fs');
    const path = require('path');
    const publicDir = path.join(process.cwd(), 'public');

    for (const c of candidates) {
      try {
        if (fs.existsSync(path.join(publicDir, c))) {
          return `${DEFAULT_URL}/${c}`;
        }
      } catch (e) {
        // ignore and continue
      }
    }
  } catch (err) {
    // if require fails or other errors, fall back
  }

  return `${DEFAULT_URL}/og-image.svg`;
}

const DEFAULT_IMAGE = findDefaultImage();

export default function SEO({
  title,
  description,
  image = DEFAULT_IMAGE,
  url = DEFAULT_URL,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  keywords = DEFAULT_KEYWORDS,
  jsonLd = null,
}: SEOProps) {
  const fullTitle = title || DEFAULT_TITLE;
  const fullDescription = description || DEFAULT_DESCRIPTION;

  const ld = jsonLd || {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FormHook',
    description: fullDescription,
    url,
    keywords: keywords.join(', ')
  };

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="robots" content="index, follow" />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={DEFAULT_SITE} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      {image && <meta name="twitter:image" content={image} />}
      <meta name="twitter:url" content={url} />

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
