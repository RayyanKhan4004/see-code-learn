# Apply this community pack

Copy all files and folders from this pack into the root of your local
`see-code-learn` repository.

Then run:

```bash
git checkout -b chore/open-source-community-setup
git add README.md LICENSE CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md .github
git commit -m "chore: add open source community files"
git push -u origin chore/open-source-community-setup
```

Open a pull request into `main`.

## GitHub repository settings

After merging:

1. Open **Settings → General → Features**.
2. Enable **Issues**.
3. Enable **Discussions** if you want Q&A and community ideas outside issues.
4. Under **Sponsorships**, select **Set up sponsor button**.
5. Open **Settings → Code security and analysis** and enable private vulnerability reporting when available.
6. Open **Settings → Branches** or **Rules → Rulesets**.
7. Protect `main`:
   - Require a pull request before merging
   - Require at least one approval
   - Require the `quality` status check
   - Block force pushes
   - Block branch deletion

## Funding note

The included `.github/FUNDING.yml` is prepared for the GitHub username
`RayyanKhan4004`. GitHub Sponsors payouts currently require residence in a
supported region, and Pakistan is not currently listed. Add an eligible external
funding platform or custom funding URL to `FUNDING.yml` when you have one.
