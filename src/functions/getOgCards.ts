import ogs from 'open-graph-scraper';

export type OgCard = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
};

export async function getOgCards(urls: string[]): Promise<OgCard[]> {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const { result } = await ogs({
        url,
        timeout: 5000,
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      });

      return {
        url,
        title: result.ogTitle || result.twitterTitle,
        description: result.ogDescription || result.twitterDescription,
        image:
          result.ogImage?.[0]?.url ||
          result.twitterImage?.[0]?.url,
        siteName: result.ogSiteName,
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<OgCard> => r.status === 'fulfilled')
    .map((r) => r.value);
}

