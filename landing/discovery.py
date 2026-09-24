"""Public company facts and canonical crawl surfaces. No private fundraising data."""
import json
import os
from datetime import date
from xml.etree.ElementTree import Element, SubElement, tostring

from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.templatetags.static import static
from django.urls import reverse
from django.views.decorators.http import require_safe

from .forms import ContactForm

CANONICAL_ORIGIN = "https://defexrobotics.com"
COMPANY_UPDATED = date(2026, 9, 17)
PUBLIC_COMPANY = {
    "name": "Defex",
    "alternate_name": "Defex Robotics",
    "url": CANONICAL_ORIGIN + "/",
    "description": "Defex is developing self-teaching assembly robots for manufacturing, starting with connector assembly.",
    "location": "San Francisco, California, United States",
    # headquarters first, then the other two offices, west to east
    "offices": [
        {"city": "San Francisco", "region": "California", "country": "United States", "time_zone": "America/Los_Angeles"},
        {"city": "Hong Kong", "country": "Hong Kong SAR", "time_zone": "Asia/Hong_Kong"},
        {"city": "Shanghai", "country": "China", "time_zone": "Asia/Shanghai"},
    ],
    "as_of": COMPANY_UPDATED.isoformat(),
    "product": {
        "focus": "Connector assembly",
        "stage": "Assembly cell in development",
        "approach": "A robot attempts an assembly, a physical test scores the result, and a reset prepares the next attempt.",
        "prior_product": "Vision inspection prototype built on NVIDIA Jetson Orin",
    },
    "paid_waitlist": {
        "factories": 21,
        "definition": "Factories that paid to hold a place before the first assembly cell ships.",
        "as_of": COMPANY_UPDATED.isoformat(),
    },
    "founders": [
        {"name": "Husan Mavlonov", "role": "Co-founder and CEO", "id": "https://husanmavlonov.com/#person", "url": "https://husanmavlonov.com/", "same_as": ["https://www.linkedin.com/in/husan-mavlonov", "https://github.com/PeterVanPercson", "https://x.com/MavlonovHusan"], "bio": "Hardware researcher with more than three years in electronics manufacturing and batteries, with factory operations experience across Uzbekistan, Turkiye, China and the United States."},
        {"name": "Hasan Mavlonov", "role": "Co-founder and CTO", "id": CANONICAL_ORIGIN + "/#hasan-mavlonov", "url": "https://hasanmavlonov.com/", "same_as": ["https://github.com/hasan-mavlonov", "https://x.com/HasanMavlonovX", "https://www.instagram.com/hasanmavlonov_/"], "bio": "Building a personality layer for AI, after publishing more than 10 research papers on it. Built an AI question-generation pipeline for a government education platform with more than 60,000 students."},
    ],
    "contact": "husan@defexrobotics.com",
    "links": {
        "technical_note": CANONICAL_ORIGIN + "/blog/the-cost-of-the-next-attempt/",
        "inspection_demo": CANONICAL_ORIGIN + "/#origin",
        "blog": CANONICAL_ORIGIN + "/blog/",
        "feed": CANONICAL_ORIGIN + "/blog/feed.xml",
    },
}


# Companies that registered, shown by name in the rolling row on the home page and
# on the pitch. Add one here and it joins the roll. Their files are served as they
# were sent. "opaque" marks a file that sits on a white ground instead of a clear
# one (the page turns that white into nothing, see .roll__logo[data-opaque]); "trim"
# hides a stray rule along the bottom edge of a file. Kept out of PUBLIC_COMPANY,
# which is dumped whole into /company.json.
IN_LINE = [
    {"name": "GRAND", "logo": "img/factories/grand.jpg", "width": 640, "height": 640, "opaque": True, "trim": True},
    {"name": "UzChasys", "logo": "img/factories/uzchasys.png", "width": 159, "height": 60},
    {"name": "ATH", "logo": "img/factories/ath.png", "width": 1520, "height": 1034},
    {"name": "NOVA Solutions", "logo": "img/factories/nova.png", "width": 400, "height": 140},
    {"name": "Artel", "logo": "img/factories/artel.png", "width": 765, "height": 401, "opaque": True},
    {"name": "Texnopark", "logo": "img/factories/texnopark.webp", "width": 3719, "height": 577},
]

# Kept out of PUBLIC_COMPANY on purpose: that dict is dumped whole into /company.json.
PRICING = {
    "robot": {"price": "$65,000", "what": "One robot, taught your part, running on your floor.",
              "terms": "30% with the order. The rest when it passes your test on your floor."},
    "steps": [
        {"price": "Free", "pick": "part", "go": "Send it", "title": "Send us your part.", "line": "A short video or a drawing, how many you make and how you check it. We will tell you straight if it is a fit."},
        {"price": "$1,000", "pick": "place", "go": "Reserve", "title": "Hold your place.", "line": "Your place among the first robots. Not a fit? You get it back."},
        {"price": "$5,000", "pick": "bench", "go": "Book it", "title": "Put your part on our bench.", "line": "A straight yes or no, the test it has to pass in writing and a fixed price for your robot. You only pay for a yes."},
        {"price": "$500", "per": "a month", "title": "Keep it running.", "line": "Support, maintenance and updates."},
        {"price": "$5,000", "title": "Teach it a new part.", "line": "Not a new project."},
    ],
}


def office_place(office):
    """One office as a Place, so search engines read three locations, not one."""
    address = {"@type": "PostalAddress", "addressLocality": office["city"], "addressCountry": office["country"]}
    if office.get("region"):
        address["addressRegion"] = office["region"]
    return {"@type": "Place", "name": office["city"], "address": address}


def organization_jsonld():
    """Keep the company distinct from its founders. No invented corporate profiles."""
    org_id = CANONICAL_ORIGIN + "/#org"
    graph = [
        {"@type": "Organization", "@id": org_id, "name": PUBLIC_COMPANY["name"],
         "alternateName": [PUBLIC_COMPANY["alternate_name"], "defex"],
         "url": PUBLIC_COMPANY["url"], "description": PUBLIC_COMPANY["description"],
         "logo": {"@type": "ImageObject", "url": CANONICAL_ORIGIN + static("img/apple-touch-icon.png"), "width": 180, "height": 180},
         "email": PUBLIC_COMPANY["contact"],
         "founder": [{"@id": person["id"]} for person in PUBLIC_COMPANY["founders"]],
         "location": [office_place(office) for office in PUBLIC_COMPANY["offices"]]},
        {"@type": "WebSite", "@id": CANONICAL_ORIGIN + "/#website", "url": PUBLIC_COMPANY["url"],
         "name": "Defex", "alternateName": "Defex Robotics", "inLanguage": "en", "publisher": {"@id": org_id}},
    ]
    for person in PUBLIC_COMPANY["founders"]:
        node = {"@type": "Person", "@id": person["id"], "name": person["name"],
                "jobTitle": person["role"], "worksFor": {"@id": org_id}}
        if person.get("url"):
            node["url"] = person["url"]
        if person.get("same_as"):
            node["sameAs"] = person["same_as"]
        graph.append(node)
    # Only trusted public constants enter this graph. Escape HTML delimiters even
    # so: JSON in a script element must not be able to terminate the element.
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=True, indent=2).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


# The practice field on /why-us/: 36 attempts, the misses thinning out as a
# candidate improves. Illustrative only; the page labels the figure a schematic.
PRACTICE = "..x.x..x.xx." "x.xx.xxx.xxx" "xxxx.xxxxxxx"


@require_safe
def why_us(request):
    return render(request, "landing/why_us.html", {
        "company": PUBLIC_COMPANY, "updated": COMPANY_UPDATED, "pricing": PRICING, "in_line": IN_LINE, "form": ContactForm(),
        "practice_marks": [mark == "x" for mark in PRACTICE], "trials": range(8)})


@require_safe
def company_json(request):
    response = JsonResponse(PUBLIC_COMPANY, json_dumps_params={"indent": 2})
    response["X-Robots-Tag"] = "noindex"
    revision = os.environ.get("VERCEL_GIT_COMMIT_SHA", "")
    if revision:
        response["X-Defex-Revision"] = revision
    response["Link"] = '<' + CANONICAL_ORIGIN + '/>; rel="canonical"'
    return response


@require_safe
def llms_txt(request):
    from .views import POSTS

    husan, hasan = PUBLIC_COMPANY["founders"]
    lines = [
        "# Defex", "",
        "> " + PUBLIC_COMPANY["description"], "",
        "Defex (also written Defex Robotics) is based in " + PUBLIC_COMPANY["location"]
        + ", with offices in " + " and ".join(office["city"] for office in PUBLIC_COMPANY["offices"][1:]) + ". "
        + husan["name"] + " is " + husan["role"] + "; " + hasan["name"] + " is " + hasan["role"] + ". "
        "Canonical domain: defexrobotics.com (defex.app redirects here).", "",
        "## Pages",
        "- [Home](" + PUBLIC_COMPANY["url"] + "): what the robots do, the founders and the inspection prototype",
        "- [Why us](" + CANONICAL_ORIGIN + reverse("why_us") + "): why robots that test every part they build: built-in testing, self-reset, new parts, and where we are today",
        "- [Careers](" + CANONICAL_ORIGIN + reverse("careers") + "): open roles", "",
        "## Writing",
    ]
    for post in POSTS:
        path = reverse("blog_post", kwargs={"slug": post["slug"]})
        if post.get("canonical_url", CANONICAL_ORIGIN + path) == CANONICAL_ORIGIN + path:
            lines.append("- [" + post["title"] + "](" + CANONICAL_ORIGIN + path + ")")
    lines += ["- [Feed](" + PUBLIC_COMPANY["links"]["feed"] + ")", "",
              "## Contact", "- " + PUBLIC_COMPANY["contact"], ""]
    return HttpResponse("\n".join(lines), content_type="text/plain; charset=utf-8")


@require_safe
def robots(request):
    # Named crawler groups must repeat exclusions: they do not inherit the '*'
    # group. Existing public-page access, including training policy, is unchanged.
    rules = "Disallow: /contact/\nDisallow: /careers/apply/\nDisallow: /ping/\nDisallow: /admin/\nAllow: /\n"
    agents = ("*", "Googlebot", "Bingbot", "YandexBot", "OAI-SearchBot", "ChatGPT-User")
    body = "\n".join("User-agent: " + agent + "\n" + rules for agent in agents)
    body += "\nSitemap: " + CANONICAL_ORIGIN + "/sitemap.xml\n"
    return HttpResponse(body, content_type="text/plain; charset=utf-8")


@require_safe
def sitemap(request):
    # Import here to avoid a views/context-processor import cycle.
    from .views import POSTS
    from .jobs import JOBS, JOBS_UPDATED, job_path

    # Do not manufacture lastmod=date.today(). Omit unknown modification dates.
    pages = [(reverse("home"), None), (reverse("careers"), None),
             (reverse("blog"), None), (reverse("why_us"), None)]
    pages.extend((job_path(job), JOBS_UPDATED) for job in JOBS)
    for post in POSTS:
        path = reverse("blog_post", kwargs={"slug": post["slug"]})
        canonical = post.get("canonical_url", CANONICAL_ORIGIN + path)
        if canonical == CANONICAL_ORIGIN + path:
            pages.append((path, post.get("modified", post["date"])))
    root = Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for path, modified in pages:
        entry = SubElement(root, "url")
        SubElement(entry, "loc").text = CANONICAL_ORIGIN + path
        if modified is not None:
            SubElement(entry, "lastmod").text = modified.isoformat()
    return HttpResponse(tostring(root, encoding="utf-8", xml_declaration=True), content_type="application/xml; charset=utf-8")
