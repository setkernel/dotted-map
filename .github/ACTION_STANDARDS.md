# GitHub Actions Standards & Versions

This document outlines the standardized GitHub Actions versions and configurations used across all workflows in this repository.

## ✅ Standardized Actions & Versions

### Core GitHub Actions

| Action | Version | Latest | Status |
|--------|---------|--------|--------|
| `actions/checkout` | `v4` | v4.2.2 | ✅ Current |
| `actions/setup-node` | `v4` | v4.4.0 | ✅ Current |
| `actions/upload-artifact` | `v4` | v4.x | ✅ Current |

### Third-Party Actions

| Action | Version | Latest | Status |
|--------|---------|--------|--------|
| `peter-evans/create-pull-request` | `v7` | v7.0.8 | ✅ Current |
| `ncipollo/release-action` | `v1` | v1.18.0 | ✅ Current |

## 🔧 Standardized Configurations

### actions/checkout@v4

**Standard Configuration:**
```yaml
- name: 📥 Checkout repository
  uses: actions/checkout@v4
  with:
    fetch-depth: 1  # Default: single commit
```

**Release-specific Configuration:**
```yaml
- name: 📥 Checkout repository for release
  uses: actions/checkout@v4
  with:
    fetch-depth: 0  # Full history for changelog generation
    token: ${{ secrets.GITHUB_TOKEN }}
```

### actions/setup-node@v4

**Standard Configuration:**
```yaml
- name: ⚙️ Setup Node.js environment
  uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'npm'
```

**Publishing Configuration:**
```yaml
- name: ⚙️ Setup Node.js for publishing
  uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    registry-url: ${{ env.REGISTRY_URL }}
    cache: 'npm'
```

### actions/upload-artifact@v4

**Standard Configuration:**
```yaml
- name: 📤 Upload build artifacts
  uses: actions/upload-artifact@v4
  with:
    name: dotted-map-next-artifacts-${{ github.sha }}
    path: |
      index.js
      without-countries.js
      index.d.ts
      without-countries.d.ts
    retention-days: ${{ env.ARTIFACT_RETENTION_DAYS }}
```

### peter-evans/create-pull-request@v7

**Standard Configuration:**
```yaml
- name: 📝 Create pull request
  uses: peter-evans/create-pull-request@v7
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    commit-message: 'chore: automated update'
    title: 'chore: automated update'
    body: |
      ## Automated Update
      
      This PR was created by an automated workflow.
    branch: automated-updates
    delete-branch: true
```

### ncipollo/release-action@v1

**Standard Configuration:**
```yaml
- name: 🏷️ Create GitHub release
  uses: ncipollo/release-action@v1
  with:
    tag: ${{ steps.version.outputs.new_version }}
    name: ${{ steps.version.outputs.new_version }}
    bodyFile: RELEASE_NOTES.md
    draft: false
    prerelease: false
    token: ${{ secrets.GITHUB_TOKEN }}
```

## 🌍 Environment Variables

### Universal Environment Variables

All workflows use these standardized environment variables:

```yaml
env:
  NODE_VERSION: '20.x'
```

### Workflow-Specific Environment Variables

**CI & General Workflows:**
```yaml
env:
  NODE_VERSION: '20.x'
  ARTIFACT_RETENTION_DAYS: 30
```

**Publishing Workflows:**
```yaml
env:
  NODE_VERSION: '20.x'
  REGISTRY_URL: 'https://registry.npmjs.org'
  ARTIFACT_RETENTION_DAYS: 30
```

## 📋 Workflow-Specific Standards

### 🔄 Continuous Integration (`ci.yml`)
- Uses standard checkout with `fetch-depth: 1`
- Standard Node.js setup without registry
- Artifact retention: 30 days

### 🚀 Release & Publish (`release-and-publish.yml`)
- Uses checkout with `fetch-depth: 0` for changelog generation
- Registry-specific Node.js setup for publishing
- Matrix strategy for multiple registries
- Artifact retention: 30 days

### 🔒 Dependencies (`dependencies.yml`)
- Standard checkout with `fetch-depth: 1`
- Standard Node.js setup without registry
- Uses `peter-evans/create-pull-request@v7`

### 🆘 Emergency Publish (`emergency-publish.yml`)
- Standard checkout with `fetch-depth: 1`
- Registry-specific Node.js setup for NPM publishing
- Uses `REGISTRY_URL` environment variable

## 🚀 Benefits of Standardization

1. **Consistency**: All workflows use the same action versions
2. **Maintainability**: Easy to update versions across all workflows
3. **Reliability**: Proven, stable action versions
4. **Security**: Latest versions with security patches
5. **Performance**: Optimized configurations for each use case

## 🔄 Update Process

To update action versions:

1. **Check latest versions** in GitHub Marketplace
2. **Update version numbers** in all workflows
3. **Test changes** with dry-run modes where available
4. **Update this documentation** with new version numbers
5. **Commit changes** with descriptive commit message

## 📚 References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Marketplace](https://github.com/marketplace?type=actions)
- [actions/checkout](https://github.com/marketplace/actions/checkout)
- [actions/setup-node](https://github.com/marketplace/actions/setup-node-js-environment)
- [actions/upload-artifact](https://github.com/marketplace/actions/upload-a-build-artifact)
- [peter-evans/create-pull-request](https://github.com/marketplace/actions/create-pull-request)
- [ncipollo/release-action](https://github.com/marketplace/actions/create-release)

---

*Last updated: 2024-07-09*
*All actions verified against latest marketplace versions*