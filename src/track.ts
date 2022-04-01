import { Sample } from "./sample";

export type TrackType = "video" | "audio";

type BaseTrack = {
  id: number;
  duration: number;
  width: number;
  height: number;
  baseMediaDecodeTime: number;
  samples?: Sample[];
  sps: Uint8Array[];
  pps: Uint8Array[];
};

export type VideoTrack = {
  type: "video";
  profileIdc: number;
  levelIdc: number;
  profileCompatibility: number;
  sarRatio: number[];
} & BaseTrack;

export type AudioTrack = {
  type: "audio";
  audioobjecttype: number;
  channelcount: number;
  samplerate: number;
  samplingfrequencyindex: number;
  samplesize: number;
} & BaseTrack;

export type Track = VideoTrack | AudioTrack;
