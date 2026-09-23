# Discoverability foundation

## What changed

The site remains server-rendered Django. The `/company/` page was removed on 2026-09-22 (it redirects to the home page, which carries the founders and the Organization markup); the public facts stay in `/company.json`.

- `/company.json` mirrors the approved public facts only. It is not a private data room or a special search-ranking API. The home page is canonical; the JSON response is `noindex`.
- Organization and Person identities are separate. Personal profiles belong to the founder, not Organization `sameAs`. Corporate profiles should be added only when exact live URLs have been verified.
- Default canonical URLs use the production origin and request path, without campaign queries or preview hosts. RSS links and GUIDs also use the production origin.
- `robots.txt` allows public search access, including OAI-SearchBot, while consistently excluding submission endpoints for every named crawler. This is not an access-control mechanism. The existing global training policy was not changed.
- The sitemap uses only the canonical production origin and omits unknown modification dates instead of stamping today's date. Known company and article dates are retained.
- Regression tests check JSON-LD, both founders, canonical URLs, sitemap destinations, crawler rules, public-data boundaries and IndexNow ownership proof.
- A browser workflow verifies the Why us page at desktop and mobile widths and retains screenshots for three days.

## Search notifications

After a successful main-branch smoke run, `notify-search-engines` waits for the matching Vercel commit to appear in the public `X-Defex-Revision` header on `/company.json`. It then checks the live sitemap and its HTML destinations before submitting at most 100 canonical URLs to IndexNow. It never sends preview URLs, private facts or visitor data. Requests fail closed when the expected production revision is not available.

`/indexnow-key.txt` serves a domain-separated HMAC ownership token derived from the existing application secret. The secret itself is never exposed. The token is public by the IndexNow verification protocol and is excluded from the sitemap.

Run a preflight without a submission:

```sh
python scripts/indexnow.py
```

An IndexNow 200 means receipt; 202 means receipt with key validation pending. Neither confirms indexing or ranking. The workflow does not submit to Google Search Console and makes no claim about Google indexing.

## Updating company information

Edit `PUBLIC_COMPANY` in `landing/discovery.py`. Keep the date and the visible wording on the home page and Why us in sync. A paid waitlist is not a deployed-robot count. Do not relabel deposits as recurring revenue. Do not add an institutional investor because a person is affiliated with that institution. Keep private documents and discussions out of this public repository.

## Verification

```sh
python manage.py check
python manage.py test
```

After deployment, check `/company.json`, `/robots.txt` and `/sitemap.xml` on the canonical domain, and that `/company/` redirects home. Confirm the old domain preserves path-level redirects. Search Console ownership and actual crawler-IP/firewall behavior require separate verification; a successful user-agent test does not establish that real crawlers have reached the site.

## Primary technical references

- Google AI features: https://developers.google.com/search/docs/appearance/ai-features
- Google sitemap guidance: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- OpenAI crawler controls: https://developers.openai.com/api/docs/bots
- Identity semantics: https://schema.org/sameAs
- IndexNow protocol: https://www.indexnow.org/documentation
