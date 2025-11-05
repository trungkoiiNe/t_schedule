# Publishing Guide for react-native-t-schedule

## Pre-Publishing Checklist ✅

- ✅ Package built successfully (`lib/` directory exists)
- ✅ All tests passing (11/11)
- ✅ TypeScript compilation successful
- ✅ No linter errors
- ✅ Documentation complete
- ✅ Examples working
- ✅ Package version: 0.1.0

## Publishing to NPM

### Step 1: Login to NPM

If you don't have an npm account, create one at https://www.npmjs.com/signup

Then login:

```bash
npm login
```

You'll be prompted for:

- Username
- Password
- Email
- One-time password (if 2FA is enabled)

### Step 2: Verify Login

```bash
npm whoami
```

This should display your npm username.

### Step 3: Check Package Name Availability

```bash
npm view react-native-t-schedule
```

If the package doesn't exist, you'll see an error - that's good!
If it exists, you may need to choose a different name.

### Step 4: Final Pre-Publish Check

```bash
# Make sure everything is built
yarn prepare

# Run tests
yarn test

# Check what will be published
npm pack --dry-run
```

### Step 5: Publish

For first release (v0.1.0):

```bash
npm publish
```

For public scoped packages (if needed):

```bash
npm publish --access public
```

### Step 6: Verify Publication

After publishing, verify at:

- https://www.npmjs.com/package/react-native-t-schedule
- Or run: `npm view react-native-t-schedule`

## Publishing Updates

### Patch Release (Bug fixes)

```bash
npm version patch  # 0.1.0 -> 0.1.1
npm publish
```

### Minor Release (New features, backward compatible)

```bash
npm version minor  # 0.1.0 -> 0.2.0
npm publish
```

### Major Release (Breaking changes)

```bash
npm version major  # 0.1.0 -> 1.0.0
npm publish
```

## Using release-it (Automated)

The package is configured with release-it:

```bash
yarn release
```

This will:

1. Run tests
2. Build the package
3. Bump version
4. Create git tag
5. Push to GitHub
6. Publish to npm
7. Create GitHub release

## Post-Publishing Checklist

- [ ] Verify package appears on npmjs.com
- [ ] Test installation in a new project
  ```bash
  npx create-react-native-app test-app
  cd test-app
  npm install react-native-t-schedule
  ```
- [ ] Check if package README displays correctly on npm
- [ ] Update GitHub repository with release notes
- [ ] Share on social media / Discord / etc.

## Troubleshooting

### "Package name already exists"

Choose a different name in `package.json`:

- `@yourusername/react-native-t-schedule`
- `react-native-tdmu-schedule`
- `rn-t-schedule`

### "Need auth"

Run `npm login` first.

### "403 Forbidden"

You may not have permission. Check:

- Are you logged in? (`npm whoami`)
- Is the package name available?
- Do you have 2FA enabled? Use `npm publish --otp=YOUR_CODE`

### "Payment Required"

For scoped packages, use `npm publish --access public`

## Beta/Alpha Releases

### Alpha Release

```bash
npm version prerelease --preid=alpha  # 0.1.0-alpha.0
npm publish --tag alpha
```

### Beta Release

```bash
npm version prerelease --preid=beta  # 0.1.0-beta.0
npm publish --tag beta
```

Users install with:

```bash
npm install react-native-t-schedule@alpha
npm install react-native-t-schedule@beta
```

## Quick Publish Command

Once you're logged in:

```bash
cd /home/ctdev/.cursor/worktrees/t_schedule/zQV2X
yarn prepare && yarn test && npm publish
```

## Support

If you encounter issues:

- Check npm status: https://status.npmjs.org/
- npm support: https://www.npmjs.com/support
- GitHub issues: https://github.com/trungkoiiNe/react-native-t-schedule/issues

---

**Ready to publish!** 🚀

Good luck with your first release!
