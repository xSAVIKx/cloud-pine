const { Logging } = require('@google-cloud/logging')

class CloudLogging {
  constructor (logName, options = {}) {
    this.name = logName
    this.logging = new Logging(options.googleCloudOptions)
    this._resource = Object.assign({ type: 'global' }, options.resourceSettings)
    this._defaultLabels = Object.assign(
      {},
      { logger: 'pino', agent: 'cloud_pine' },
      options.defaultLabels
    )
    this._log = null
    this._skipInit = options.skipInit ?? false
    // Indicates whether the logs will be forward to stdout or
    // through networking to GCP
    this._sync = options.sync ?? false
    this._logOptions = options.logOptions
    this._logEntryDataTransformer = options.logEntryDataTransformer
  }

  mapSeverity (logLevel) {
    return (
      CloudLogging.SEVERITY_MAP[logLevel] || CloudLogging.SEVERITY_MAP['30']
    )
  }

  get resource () {
    return this._resource
  }

  get sync () {
    return this._sync
  }

  async init () {
    if (this._skipInit === false) {
      await this.logging.setProjectId()
      await this.logging.setDetectedResource()
    }

    const labels = Object.assign(
      {},
      this._resource.labels,
      this.logging.detectedResource?.labels
    )

    this._resource = Object.assign(
      this._resource,
      this.logging.detectedResource
    )

    this._resource.labels = labels

    this._log = this._sync
      ? this.logging.logSync(this.name, this._logOptions)
      : this.logging.log(this.name, this._logOptions)

    return this._log
  }

  parseLine (line) {
    let log

    try {
      log = JSON.parse(line)
    } catch (error) {
      const meta = {
        severity: CloudLogging.SEVERITY_MAP['50'],
        resource: this._resource,
        labels: this._defaultLabels
      }
      const entry = this._log.entry(meta, {
        error,
        message: 'Malformed log entry'
      })

      this._log.write(entry)

      // We do nothing else as the log was malformed
      return
    }

    let meta = typeof (log.meta) === 'object'
      ? Object.assign(log.meta, { severity: this.mapSeverity(log.level) })
      : { severity: this.mapSeverity(log.level) }

    if (log.meta) {
      delete log.meta
    }

    meta.resource = Object.assign({}, this._resource, meta.resource)
    meta.labels = Object.assign({}, this._defaultLabels, meta.labels)

    if (log.httpRequest) {
      meta.httpRequest = log.httpRequest
      delete log.httpRequest
    }

    log.message = log.message ?? log.msg

    if (log.msg) {
      delete log.msg
    }

    if (this._logEntryDataTransformer) {
      const updatedLogEntryData = this._logEntryDataTransformer({ metadata: meta, data: log })
      meta = updatedLogEntryData.metadata
      log = updatedLogEntryData.data
    }
    const logEntry = this._log.entry(meta, log)
    this._log.write(logEntry)
  }
}

CloudLogging.SEVERITY_MAP = {
  10: 'DEBUG',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARNING',
  50: 'ERROR',
  60: 'CRITICAL'
}

module.exports = {
  CloudLogging
}
