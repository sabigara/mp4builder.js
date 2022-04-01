export type Sample = {
  duration: number;
  size: number;
  flags: {
    isLeading: number;
    dependsOn: number;
    isDependedOn: number;
    hasRedundancy: number;
    paddingValue: number;
    isNonSyncSample: number;
    degradationPriority: number;
  };
  compositionTimeOffset: number;
};
