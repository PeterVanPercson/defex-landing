#!/usr/bin/env bash
# Render build hook — runs at every deploy
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
