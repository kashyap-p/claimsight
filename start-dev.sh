#!/bin/bash
# Persistent dev server launcher
cd /home/z/my-project
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 1
rm -f dev.log
exec bun run dev
