/// <reference types="node" />
import { Transform } from 'stream';
import { LoggingOptions, Log, LogSync } from '@google-cloud/logging';
import {LogEntry} from "@google-cloud/logging/build/src/entry";

declare function CloudPine(options?: CloudPineOptions): Transform;

type LogEntryData = {
    /**
     * The metadata that is about to be logged.
     */
    metadata?: LogEntry,
    /**
     * The data that is about to be logged.
     */
    data?: string | {}
}

type LogEntryDataTransformer = (logEntry: LogEntryData) => LogEntryData

type CloudPineOptions = {
  logName?: string;
  cloudLoggingOptions: {
    googleCloudOptions?: LoggingOptions;
    resourceSettings?: {
      type?: string;
      labels: Record<string, string>;
    };
    defaultLabels?: Record<string, string>;
    skipInit?: boolean;
    sync?: boolean;
    logOptions?: ConstructorParameters<typeof Log> | ConstructorParameters<typeof LogSync>;
  };
    /**
     * A function that transforms the data before logging it.
     *
     * This function is called with the data that is about to be logged. It
     * should return the data that should be logged.
     *
     * For example, you could use this function to remove sensitive data from
     * the log entry.
     *
     * @param {LogEntryData} logEntryData
     * @returns {LogEntryData} The data that should be logged.
     */
    logEntryDataTransformer?: LogEntryDataTransformer
};

export default CloudPine;
export { CloudPineOptions };
