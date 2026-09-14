@echo off
rem Compiles the Arcade and every game into out\ and starts the Arcade. Requires Java 17.
cd /d "%~dp0"
if exist out rmdir /s /q out
mkdir out
dir /s /b arcade\src\*.java games\betlife\src\*.java > out\sources.txt
javac -d out @out\sources.txt
if errorlevel 1 exit /b 1
java -cp out arcade.Main
