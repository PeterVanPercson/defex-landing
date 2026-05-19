#!/usr/bin/env bash
# Vercel @vercel/static-build hook — produces staticfiles/ for the CDN.
# Vercel's build Python is PEP-668 externally-managed, so install into a
# throwaway venv (this step only needs Django importable for collectstatic;
# the @vercel/python builder installs runtime deps separately).
set -o errexit

python3 -m venv /tmp/bvenv
. /tmp/bvenv/bin/activate
pip install --disable-pip-version-check -q -r requirements.txt
python manage.py collectstatic --no-input
