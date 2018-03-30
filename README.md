# SentryRelease tool

Best tool for create release in sentry and upload all `dist` files (.js, .map)

### Usage

```javascript
const config = {
    token: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    organization: 'xxxxxxxxx',
    project: 'xxxxxxx',
    releaseVersion: 'xxxxx',
    distPath: '/path_to_dist/',
};

(new SentryRelease(config))
    .release()
    .than(released => ... );
```
