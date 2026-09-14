# Workflow

- Wants changes verified with an actual build/typecheck/lint run rather than just a code review ("Then verify the built and yes, please do that"). Confidence: 0.6
- Investigates and understands the existing code/animations before editing rather than jumping straight to changes ("first understand my project ... first understand the animation and all the other things then apply"). Confidence: 0.7
- Checks whether the requested behavior already exists before making changes and leaves it untouched if it's already correct ("check that are they doing that or not if doing then don't change that"). Confidence: 0.7
- Wants a plan written out and agreed before making changes ("get back to make a plan and then do this accordingly"; "make a plan and then submit it"). Confidence: 0.7
- Expects completed changes to be committed and pushed to the remote once the work is done ("commitant push this"; "commit and push this"). Confidence: 0.7
- Deploys to Vercel (builds run via `vercel build`); expects the deployment to pass, so tool versions and build config must stay Vercel-compatible. Confidence: 0.7
- Uses pnpm as the package manager (declared via the `packageManager` field in package.json and tracked with `pnpm-lock.yaml`) rather than npm/yarn. Confidence: 0.7
- When a reported issue persists or a previous fix didn't render as expected, wants the agent to diagnose the actual root cause ("check out what this bug is it and please solve this bug") rather than just re-applying another surface tweak. Confidence: 0.6
