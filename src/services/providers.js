// Provider configuration constants
// Each provider defines its base URL, endpoint template, and default settings.

const PROVIDERS = {
  firecrawl: {
    id: 'firecrawl',
    name: 'Firecrawl',
    website: 'https://firecrawl.dev',
    baseUrl: 'https://api.firecrawl.dev/v1',
    endpoints: {
      scrape: '/scrape',
      search: '/search'
    },
    requiresKey: true,
    headerName: 'Authorization',
    headerPrefix: 'Bearer'
  },
  scrapingbee: {
    id: 'scrapingbee',
    name: 'ScrapingBee',
    website: 'https://www.scrapingbee.com',
    baseUrl: 'https://api.scrapingbee.com',
    endpoints: {
      fetch: '/fetch'
    },
    requiresKey: true,
    headerName: 'X-Api-Key',
    headerPrefix: ''
  },
  scrapedo: {
    id: 'scrapedo',
    name: 'Scrape.do',
    website: 'https://scrape.do',
    baseUrl: 'https://api.scrape.do',
    endpoints: {
      scrape: '/scrape'
    },
    requiresKey: true,
    headerName: 'X-Api-Key',
    headerPrefix: ''
  },
  apify: {
    id: 'apify',
    name: 'Apify',
    website: 'https://apify.com',
    baseUrl: 'https://api.apify.com/v2',
    endpoints: {
      call: '/acts/{actorId}/call'
    },
    requiresKey: true,
    headerName: 'Authorization',
    headerPrefix: 'Bearer'
  },
  scrapingdog: {
    id: 'scrapingdog',
    name: 'ScrapingDog',
    website: 'https://www.scrapingdog.com',
    baseUrl: 'https://api.scrapingdog.com',
    endpoints: {
      scrape: '/'
    },
    requiresKey: true,
    headerName: 'X-Api-Key',
    headerPrefix: ''
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    website: '',
    baseUrl: '',
    endpoints: {
      scrape: ''
    },
    requiresKey: false,
    headerName: 'Authorization',
    headerPrefix: 'Bearer'
  }
};

export default PROVIDERS;
