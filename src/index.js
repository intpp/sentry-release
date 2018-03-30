const fs = require('fs');
const path = require('path');

const FormData = require('form-data');
const { request, log } = require('./utils');

class SentryRelease {
  constructor(options) {
    if (!options.token) {
      throw new Error('Missing require field "token" in constructor');
    }
    if (!options.organization) {
      throw new Error('Missing require field "organization" in constructor');
    }
    if (!options.project) {
      throw new Error('Missing require field "project" in constructor');
    }
    if (!options.releaseVersion) {
      throw new Error('Missing require field "releaseVersion" in constructor');
    }
    if (!options.distPath) {
      throw new Error('Missing require field "distPath" in constructor');
    }

    this.token = options.token;
    this.organization = options.organization;
    this.project = options.project;
    this.releaseVersion = options.releaseVersion;
    this.distPath = options.distPath;
    this.apiRoot = options.apiRoot || 'https://sentry.io/api/';
  }

  get sentryReleaseApiRoot() {
    return `${this.apiRoot}/0/projects/${this.organization}/${this.project}/releases/`;
  }

  createVersion(version) {
    return request(this.sentryReleaseApiRoot, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ version }),
    });
  }

  addFileToRelease(version, filePath) {
    const form = new FormData();
    const stats = fs.statSync(filePath);
    const readStream = fs.createReadStream(filePath);

    form.append('name', path.basename(filePath));
    form.append('file', readStream);

    log(`Upload file: ${filePath}, size: ${stats.size} bytes`);

    return request(`${this.sentryReleaseApiRoot}${version}/files/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
      body: form,
    });
  }

  async release() {
    try {
      const createReleaseResponse = await this.createVersion(this.releaseVersion);

      if (createReleaseResponse.error) {
        throw new Error(`${createReleaseResponse.status} - ${JSON.stringify(createReleaseResponse.error)}`);
      }

      log('Release created', createReleaseResponse.data);

      const files = fs.readdirSync(path.resolve(this.distPath))
        .filter(file => !!file.match(/.*\.(js|map)$/));

      log(`Start uploading files count: ${files.length}`);

      const uploadedFiles = await Promise.all(
        files.map(async fileName => this.addFileToRelease(this.releaseVersion, path.resolve(this.distPath, fileName)))
      );

      const uploadedFilesCount = uploadedFiles.filter(response => !response.error).length;

      log(`Files uploaded: ${uploadedFilesCount}/${files.length}`);

      if (uploadedFilesCount !== files.length) {
        uploadedFiles.filter(response => !!response.error && response.status !== 409).forEach(console.log);
      }

      return uploadedFilesCount === files.length;
    } catch (err) {
      log(err.message);

      return false;
    }
  }
}

module.exports = SentryRelease;
