@echo off
:: Inkwell CLI - Quick launcher for Windows
:: Usage: inkwell.bat [command]
::   or run: npx inkwell [command]

setlocal
cd /d "%~dp0"

if "%~1"=="" (
    node scripts/inkwell.mjs
) else (
    node scripts/inkwell.mjs %*
)
