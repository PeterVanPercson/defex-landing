# config/settings.py

import os
import secrets
import sys
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY
DEBUG = os.getenv("DEBUG", "False") == "True"

# No production fallback. The old code defaulted to a literal committed to a
# public repo, so a deploy that forgot the variable would sign cookies with a
# key anyone could read, and would do it silently. Fail loudly instead: a
# missing key is a broken deploy, not a working one.
#
# Commands that never serve a request are exempt, because they legitimately run
# without the key: `manage.py test`, and `collectstatic` in the Vercel build
# step. They get a throwaway random key, prefixed django-insecure- so that
# `check --deploy` still reports W009 if the real key is ever absent.
_NON_SERVING_COMMANDS = {
    "test", "check", "collectstatic", "makemigrations", "migrate",
    "showmigrations", "diffsettings", "shell",
}
_is_non_serving = (
    os.path.basename(sys.argv[0] or "") == "manage.py"
    and len(sys.argv) > 1
    and sys.argv[1] in _NON_SERVING_COMMANDS
)

SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    if DEBUG or _is_non_serving:
        SECRET_KEY = "django-insecure-ephemeral-" + secrets.token_urlsafe(32)
    else:
        raise ImproperlyConfigured(
            "SECRET_KEY is not set. Set it in the environment before deploying."
        )

ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,.vercel.app,defex.app,www.defex.app"
).split(",")

CSRF_TRUSTED_ORIGINS = os.getenv(
    "CSRF_TRUSTED_ORIGINS",
    "https://*.vercel.app,https://defex.app,https://www.defex.app"
).split(",")

# Render / Vercel terminate SSL at their proxy — trust X-Forwarded-Proto.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Everything below is production-only so plain-http local dev still works.
# check --deploy flagged all four as missing.
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    # The flash-message cookie is signed, not encrypted, so keep it off the
    # wire in cleartext and away from document.cookie.
    SESSION_COOKIE_HTTPONLY = True
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Serverless (Vercel) has a read-only filesystem — keep flash messages in a
# signed cookie so a form submit never needs to write to the DB/session.
MESSAGE_STORAGE = "django.contrib.messages.storage.cookie.CookieStorage"


# APPLICATIONS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'landing',
]


# MIDDLEWARE (correct order + no duplicates)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',

    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# URL / WSGI
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'


# TEMPLATES
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'landing.context_processors.asset_version',
            ],
        },
    },
]


# DATABASE (SQLite for now — fine for early stage)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# PASSWORD VALIDATION
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# INTERNATIONALIZATION
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'

USE_I18N = True
USE_TZ = True


# STATIC FILES (Render + WhiteNoise)
STATIC_URL = '/static/'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise — serve from finders so it works even if collectstatic hasn't run
WHITENOISE_USE_FINDERS = True
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
# the videos are already compressed; brotli/gzip on H.264 just burns build minutes
WHITENOISE_SKIP_COMPRESS_EXTENSIONS = (
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'zip', 'gz', 'tgz', 'bz2', 'tbz', 'xz', 'br',
    'swf', 'flv', 'woff', 'woff2', 'mp4', 'webm', 'm4v', 'glb',
)
WHITENOISE_MIMETYPES = {'.wasm': 'application/wasm'}

# The templates append ?v=DEFEX_ASSET_VERSION to every asset URL, so bump this
# whenever a file changes, AND any DEFEX_ASSET_VERSION override set in the Vercel
# project, or the deploy silently keeps serving the old assets.
#
# _static_headers below no longer runs in production: vercel.json publishes
# static/** through @vercel/static, so /static/ is answered at the edge and never
# reaches Django. Production cache headers live in vercel.json. This hook still
# runs under gunicorn and in the tests, and is what they assert against.
DEFEX_ASSET_VERSION = os.getenv("DEFEX_ASSET_VERSION", "84")

# The cal.com event the booker on the home page mounts. Env-overridable, so
# the event can be renamed in the Vercel project without a deploy.
CAL_LINK = os.getenv("CAL_LINK", "husan-mavlonov-qxqy1a/30min")


def _static_headers(headers, path, url):
    if url.startswith("/static/defex/"):
        headers["Cache-Control"] = "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800"


WHITENOISE_ADD_HEADERS_FUNCTION = _static_headers


# DEFAULT FIELD TYPE
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# NOTIFICATIONS (Resend HTTP API)
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "defex <onboarding@resend.dev>")
NOTIFY_TO = os.getenv("NOTIFY_TO", "husan@buildcored.com")
# personal-site pings (telegram channel requests) land here, not in the defex inbox
PING_TO = os.getenv("PING_TO", "husanmavlonov79@gmail.com")

# The autoresponder mails whatever address the visitor typed, from a Defex
# domain. That is an open relay in miniature: anyone can make defex.app send
# mail to a victim, repeatedly, and burn the sending domain's reputation doing
# it. There is no captcha on the form yet, so it is OFF unless explicitly
# enabled. Set AUTORESPONDER=1 once Turnstile is wired.
AUTORESPONDER = os.getenv("AUTORESPONDER", "0") == "1"
# It used to send from husan@buildcored.com, a different company, on a Defex
# enquiry. Defaults to the Defex sender; override once the domain is verified.
AUTORESPONDER_FROM = os.getenv("AUTORESPONDER_FROM", EMAIL_FROM)

# Best-effort per-IP throttle on the endpoints that send mail.
CONTACT_RATE_LIMIT = int(os.getenv("CONTACT_RATE_LIMIT", "5"))     # per window
CONTACT_RATE_WINDOW = int(os.getenv("CONTACT_RATE_WINDOW", "3600"))
