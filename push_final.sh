#!/usr/bin/env bash
cd /c/Users/Marlene/Desktop/ventas-garzon
git push -u origin main 2>&1
EXIT_CODE=$?
echo "PUSH_EXIT_CODE=$EXIT_CODE"
exit $EXIT_CODE
