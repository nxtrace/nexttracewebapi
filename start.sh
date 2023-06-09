#!/bin/sh

# Start nginx in the background
nginx &

# Start the Python app
python3 app.py
