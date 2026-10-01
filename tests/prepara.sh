#!/bin/sh
# Prepara i file usati dai test: cartella delle schermate e copia del launcher con lo stato di gioco esposto (window.__S).
mkdir -p shots
sed 's/^  function frame(now) {$/  function frame(now) { window.__S = S;/' ../index.html > nit-test.html
