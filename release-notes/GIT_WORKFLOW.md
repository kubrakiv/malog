# Generate release notes

git log --no-merges `  --date='format:%Y-%m-%d %H:%M'`
--pretty=format:'- %s%n%w(0,2,2)%b%n (%h, %an, %ad)%n' `
origin/develop..HEAD |
Out-File release-notes\RELEASE_NOTES_v1.0.0.md -Encoding utf8

# Commit release notes

git add release-notes\RELEASE_NOTES_v1.0.1.md
git commit -m "Add release notes for v1.0.0"
git push origin develop

# Merge and tag on staging

git checkout staging
git merge developgit push --atomic origin staging v1.0.0
git tag -a v1.0.1 -F release-notes\RELEASE_NOTES_v1.0.1.md
