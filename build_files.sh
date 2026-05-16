#!/usr/bin/env bash
# Vercel @vercel/static-build hook — produces staticfiles/ for the CDN.
set -o errexit

pip install -r requirements.txt
python3 manage.py collectstatic --no-input
