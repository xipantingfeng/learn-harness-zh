@echo off
setlocal
set "EXE="
for %%F in ("%~dp0dist\*.exe") do set "EXE=%%~fF"
if not defined EXE (
  echo Cannot find the executable in dist.
  exit /b 1
)
echo Starting Zhixue...
start "" "%EXE%"
endlocal
