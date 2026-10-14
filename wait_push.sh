#!/usr/bin/env bash
# Espera a que termine el push y muestra el resultado
cd /c/Users/Marlene/Desktop/ventas-garzon
timeout 300 git push -u origin main 2>&1
EXIT_CODE=$?
echo "EXIT_CODE=$EXIT_CODE"
exit $EXIT_CODE
