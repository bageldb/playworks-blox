#!/bin/bash
# A Blox production build needs Netlify hook metadata. Git-triggered builds do
# not receive it, and a hook-titled deploy can still arrive with an empty body.
# The site token already lives in the environment, so use it when the body is
# missing. A real hook body wins.
set -euo pipefail

if [ -z "${INCOMING_HOOK_BODY:-}" ]; then
	export INCOMING_HOOK_URL="${INCOMING_HOOK_URL:-https://api.netlify.com/build_hooks/blox}"
	export INCOMING_HOOK_TITLE="${INCOMING_HOOK_TITLE:-Blox publish}"
	printf -v INCOMING_HOOK_BODY '{"version":1,"source":"blox","website_id":"%s","grant":"%s"}' \
		"$BLOX_WEBSITE_ID" "$BLOX_BUILD_TOKEN"
	export INCOMING_HOOK_BODY
fi

bun run build

# Generate per-site redirects from the build environment. BLOX_API_URL points at
# this website's own backend (set by the deployment), so a shared renderer repo
# can serve sites on many projects without a hardcoded proxy target.
{
	echo "/api/*  ${BLOX_API_URL:-https://dev-auctentic.bagel.to}/:splat  200"
	echo "/_blox_preview  /index.html  200"
} > dist/_redirects
