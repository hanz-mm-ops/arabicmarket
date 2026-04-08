#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Deploying The Arabic Market..."
echo ""
git add -A
git commit -m "Update: $(date '+%Y-%m-%d %H:%M')"
git push
echo ""
echo "✅ Done! Site will update in a few seconds."
echo ""
read -p "Press Enter to close..."
