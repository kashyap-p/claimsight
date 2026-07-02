#!/bin/bash
# Persistent watchdog daemon: keeps the ClaimSight dev server alive forever.
# Started once with setsid; loops every 10s checking if server is up; restarts if down.
cd /home/z/my-project

while true; do
  # Check if server responds on port 3000
  if ! curl -s -o /dev/null --max-time 3 http://127.0.0.1:3000/ 2>/dev/null; then
    echo "[$(date)] Server down, restarting..." >> /home/z/my-project/watchdog.log
    pkill -f "next dev" 2>/dev/null
    pkill -f "next-server" 2>/dev/null
    sleep 1
    # Start server fully detached in a new session
    setsid bash -c 'cd /home/z/my-project && exec bun run dev' </dev/null >>/home/z/my-project/dev.log 2>&1 &
    # Give it time to boot
    for i in $(seq 1 20); do
      if curl -s -o /dev/null --max-time 2 http://127.0.0.1:3000/ 2>/dev/null; then
        echo "[$(date)] Server back up after ${i}s" >> /home/z/my-project/watchdog.log
        break
      fi
      sleep 1
    done
  fi
  sleep 10
done
