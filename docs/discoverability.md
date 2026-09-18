# Discoverability foundation

## What changed

The site remains server-rendered Django. Its design, home template, hero, hiring copy, JavaScript and media assets are unchanged.

- `/company/` provides a dated public explanation of the product stage, paid waitlist and both founders.
- `/company.json` mirrors the approved public facts only. It is not a private data room or a special search-ranking API. The HTML page is canonical; the JSON response is `noindex`.
- Organization and Person identities are separate. Personal profiles belong to the founder, not Organization `sameAs`. Corporate profiles should be added only when exact live URLs have been verified.
- Default canonical URLs use the production origin and request path, without campaign queries or preview hosts.
- `robots.txt` allows public search access, including OAI-SearchBot, while consistently excluding submission endpoints for every named crawler. This is not an access-control mechanism. The existing global training policy was not changed.
- The sitemap uses only the canonical production origin and omits unknown modification dates instead of stamping today's date. Known company and article dates are retained.
- Regression tests check JSON-LD, both founders, canonical URLs, sitemap destinations, crawler rules, and public-data boundaries.

## Updating company information

Edit `PUBLIC_COMPANY` in `landing/discovery.py`. Keep the date and visible `/company/` wording in sync. A paid waitlist is not a deployed-robot count. Do not relabel deposits as recurring revenue. Do not add an institutional investor because a person is affiliated with that institution. Keep private documents and discussions out of this public repository.

The optional public JSON export mirrors the website. It does not guarantee an AI citation, Knowledge Panel, indexing or investor attention.

## Verification

```sh
python manage.py check
python manage.py test
```

After deployment, check `/company/`, `/company.json`, `/robots.txt` and `/sitemap.xml` on the canonical domain. Confirm the old domain preserves path-level redirects. Search Console ownership and actual crawler-IP/firewall behavior require separate verification; a successful user-agent test does not establish that real crawlers have reached the site.

## Primary technical references

- Google AI features: https://developers.google.com/search/docs/appearance/ai-features
- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- OpenAI crawler controls: https://developers.openai.com/api/docs/bots
- Identity semantics: https://schema.org/sameAs
