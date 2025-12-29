import { JSDOM } from 'jsdom';

export type OgCard = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
};

function resolveUrl(base: string, relative?: string | null) {
  try {
    return relative ? new URL(relative, base).href : undefined;
  } catch {
    return undefined;
  }
}

function getMeta(
  document: Document,
  attr: 'property' | 'name',
  value: string
) {
  return document
    .querySelector(`meta[${attr}="${value}"]`)
    ?.getAttribute('content');
}

async function scrapeOg(url: string): Promise<OgCard> {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0',
      'accept': 'text/html',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  const html = await res.text();
  const dom = new JSDOM(html, { url });
  const { document } = dom.window;

  const title =
    getMeta(document, 'property', 'og:title') ||
    getMeta(document, 'name', 'twitter:title') ||
    document.querySelector('title')?.textContent ||
    undefined;

  const description =
    getMeta(document, 'property', 'og:description') ||
    getMeta(document, 'name', 'twitter:description') ||
    getMeta(document, 'name', 'description');

  const imageRaw =
    getMeta(document, 'property', 'og:image') ||
    getMeta(document, 'name', 'twitter:image');

  const siteName = getMeta(document, 'property', 'og:site_name');

  return {
    url,
    title,
    description,
    image: resolveUrl(url, imageRaw),
    siteName,
  };
}

export async function getOgCards(urls: string[]): Promise<OgCard[]> {
  const results = await Promise.allSettled(
    urls.map(scrapeOg)
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<OgCard> =>
        r.status === 'fulfilled'
    )
    .map(r => r.value);
}

