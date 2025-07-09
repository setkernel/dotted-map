# GitHub Workflows Guide

This repository uses a streamlined workflow system designed to prevent conflicts and ensure reliable releases.

## Workflow Overview

### 1. **Continuous Integration** (`ci.yml`)
- **Trigger**: Push to main, Pull requests
- **Purpose**: Automated testing and quality checks
- **Features**:
  - Runs tests and builds on every push/PR
  - Auto-merges Dependabot PRs if tests pass
  - Uploads build artifacts for main branch commits
  - Ignores documentation-only changes

### 2. **Release & Publish** (`release-and-publish.yml`)
- **Trigger**: Manual workflow dispatch only
- **Purpose**: Unified release creation and package publishing
- **Features**:
  - Version bumping (patch/minor/major)
  - Automatic changelog generation
  - Publishes to both NPM and GitHub Packages
  - Dry run mode for testing
  - Emergency skip tests option
  - Comprehensive status reporting

### 3. **Dependency Management** (`dependencies.yml`)
- **Trigger**: Weekly schedule (Mondays 9 AM UTC) + Manual
- **Purpose**: Automated dependency updates
- **Features**:
  - Security audit with high/critical vulnerability detection
  - Automated dependency updates via PR
  - Full test suite validation after updates
  - Auto-merge eligible for CI-passing dependency PRs

### 4. **Emergency Publish** (`emergency-publish.yml`)
- **Trigger**: Manual workflow dispatch with confirmation
- **Purpose**: Critical hotfix publishing
- **Features**:
  - Requires "EMERGENCY" confirmation
  - Bypasses normal release process
  - Quick testing only
  - Publishes current version immediately
  - Requires follow-up proper release

## Usage Instructions

### Normal Release Process
1. **Go to Actions** → **Release & Publish**
2. **Click "Run workflow"**
3. **Select version type**: patch/minor/major
4. **Optional**: Enable dry run to preview
5. **Click "Run workflow"**

The workflow will:
- Run full test suite
- Bump version in package.json
- Create GitHub release with changelog
- Publish to NPM and GitHub Packages
- Provide comprehensive status reports

### Emergency Release
1. **Go to Actions** → **Emergency Publish**
2. **Type "EMERGENCY"** in confirmation field
3. **Provide reason** for emergency publish
4. **Click "Run workflow"**

⚠️ **Note**: Emergency publishes skip normal release process. Create proper release afterward.

### Testing Changes
1. **Create PR** against main branch
2. **CI workflow** runs automatically
3. **Review test results** before merging
4. **Merge PR** when tests pass

### Dependency Updates
- **Automatic**: Runs every Monday, creates PR if updates available
- **Manual**: Go to Actions → Dependency Management → Run workflow

## Workflow Features

### Conflict Prevention
- **No circular triggers**: Release workflow only runs manually
- **Path ignoring**: CI skips documentation-only changes
- **Conditional execution**: Jobs run only when needed
- **Proper dependencies**: Jobs wait for prerequisites

### Error Handling
- **Graceful failures**: Jobs continue even if some steps fail
- **Comprehensive logging**: Detailed status in GitHub Step Summary
- **Emergency options**: Skip tests for critical fixes
- **Dry run mode**: Test releases without creating them

### Security
- **Token management**: Separate tokens for NPM and GitHub
- **Access control**: Manual triggers only for releases
- **Audit integration**: Automatic security vulnerability detection
- **Confirmation required**: Emergency publishes need explicit confirmation

## Required Secrets

Configure these in repository settings:

- **`NPM_TOKEN`**: For publishing to npm registry
- **`GITHUB_TOKEN`**: Automatically provided by GitHub

## Troubleshooting

### Release Not Publishing
1. Check NPM_TOKEN is configured in repository secrets
2. Verify you have publish permissions to @setkernel organization
3. Use Emergency Publish for immediate fixes
4. Check workflow logs for detailed error messages

### CI Failures
1. Review test output in workflow logs
2. Fix issues in new PR
3. Dependabot PRs auto-merge if tests pass

### Dependency Issues
1. Check weekly dependency management workflow
2. Review and merge dependency update PRs
3. Security vulnerabilities block dependency updates

## Best Practices

1. **Use Release & Publish** for all normal releases
2. **Enable dry run** when testing release process
3. **Review dependency PRs** before auto-merge
4. **Use Emergency Publish** only for critical hotfixes
5. **Follow semantic versioning** (patch/minor/major)
6. **Write clear commit messages** (used in changelog)

## Migration from Old Workflows

The new streamlined system replaces:
- ❌ `publish.yml` (had circular trigger issues)
- ❌ `release.yml` (caused version conflicts)
- ✅ `ci.yml` (clean CI/CD)
- ✅ `release-and-publish.yml` (unified process)
- ✅ `dependencies.yml` (enhanced)
- ✅ `emergency-publish.yml` (new safety feature)