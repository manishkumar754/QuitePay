# Level 4 Submission Checklist

- [x] Contract written (`contracts/quietpay.compact`) with privacy model
      documented in-file
- [ ] Contract compiled with `compact compile` — **run locally**, requires
      the Compact CLI, not available in this build environment
- [x] Tests written and passing (11/11, `npm test`)
- [x] Frontend built and wired to a contract-interaction layer
      (`npm run build` — zero errors)
- [x] Lint clean (`npm run lint` — 0 warnings, 0 errors)
- [ ] Contract deployed to Preprod — **run locally**, needs your wallet/CLI
- [ ] Contract address added to README.md — **mandatory**
- [ ] Frontend deployed (Vercel/Netlify) and live link added to README.md
- [x] CI/CD workflow created (`.github/workflows/ci.yml`)
- [ ] CI badge confirmed passing after first push (update
      `YOUR_GITHUB_USERNAME` in the badge URL)
- [x] `docs/USAGE.md` written
- [x] File structure matches the Level 4 spec
- [ ] Product X account created, 3 tweets posted (drafts in
      `docs/LAUNCH_TWEETS.md`), link added to README
- [ ] Demo video recorded
- [ ] 15+ meaningful commits made
- [ ] Repo pushed and submitted on Rise In

## What's left for you to do manually

1. Install the Compact CLI and run:
   ```
   compact compile contracts/quietpay.compact managed/quietpay
   ```
   Check `persistentHash`, `concat`, and `padTo32` calls against your
   installed compiler's stdlib — fix any naming drift it flags.
2. Deploy to Preprod and paste the contract address into `README.md`.
3. `npm run build`, deploy `dist/` to Vercel or Netlify, add the live URL
   to `README.md`.
4. Push this repo to GitHub as `YOUR_GITHUB_USERNAME/quietpay`, update the
   CI badge URL in `README.md`, confirm the Actions tab shows a green run.
5. Create the product's X account, post the three drafted tweets (fill in
   the demo/GitHub links), add the profile link to `README.md`.
6. Record a short demo video: fund pool → commit a split → claim as a
   recipient → generate an income proof → show the public ledger only
   ever displaying hashes and booleans.
7. Make incremental commits rather than one giant commit — contract, then
   tests, then components, then CI, then docs is a natural 5+ commit
   shape from this codebase.
