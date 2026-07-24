# AliCIA v1.0.0-beta — Release Deploy Script (legado)
# Redireciona para o pipeline oficial.

$ErrorActionPreference = "Stop"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
& (Join-Path $root "scripts/release/release.ps1") @args
