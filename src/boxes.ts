import { Sample } from "./sample";
import { AudioTrack, Track, VideoTrack } from "./track";
import { MAX_UINT32 } from "./utils";

const boxTypesStr = [
  "avc1", // codingname
  "avcC",
  "btrt",
  "dinf",
  "dref",
  "esds",
  "ftyp",
  "hdlr",
  "mdat",
  "mdhd",
  "mdia",
  "mfhd",
  "minf",
  "moof",
  "moov",
  "mp4a", // codingname
  "mvex",
  "mvhd",
  "pasp",
  "sdtp",
  "smhd",
  "stbl",
  "stco",
  "stsc",
  "stsd",
  "stsz",
  "stts",
  "styp",
  "tfdt",
  "tfhd",
  "traf",
  "trak",
  "trun",
  "trex",
  "tkhd",
  "vmhd",
] as const;

type BoxType = typeof boxTypesStr[number];

const boxTypes = boxTypesStr.reduce((curr, type) => {
  return {
    ...curr,
    type: [
      type.charCodeAt(0),
      type.charCodeAt(1),
      type.charCodeAt(2),
      type.charCodeAt(3),
    ],
  };
}, {} as { [type in BoxType]: Uint8Array });

const MAJOR_BRAND = new Uint8Array([
  "i".charCodeAt(0),
  "s".charCodeAt(0),
  "o".charCodeAt(0),
  "m".charCodeAt(0),
]);
const AVC1_BRAND = new Uint8Array([
  "a".charCodeAt(0),
  "v".charCodeAt(0),
  "c".charCodeAt(0),
  "1".charCodeAt(0),
]);
const MINOR_VERSION = new Uint8Array([0, 0, 0, 1]);
const VIDEO_HDLR = new Uint8Array([
  0x00, // version 0
  0x00,
  0x00,
  0x00, // flags
  0x00,
  0x00,
  0x00,
  0x00, // pre_defined
  0x76,
  0x69,
  0x64,
  0x65, // handler_type: 'vide'
  0x00,
  0x00,
  0x00,
  0x00, // reserved
  0x00,
  0x00,
  0x00,
  0x00, // reserved
  0x00,
  0x00,
  0x00,
  0x00, // reserved
  0x56,
  0x69,
  0x64,
  0x65,
  0x6f,
  0x48,
  0x61,
  0x6e,
  0x64,
  0x6c,
  0x65,
  0x72,
  0x00, // name: 'VideoHandler'
]);
const AUDIO_HDLR = new Uint8Array([
  0x00, // version 0
  0x00,
  0x00,
  0x00, // flags
  0x00,
  0x00,
  0x00,
  0x00, // pre_defined
  0x73,
  0x6f,
  0x75,
  0x6e, // handler_type: 'soun'
  0x00,
  0x00,
  0x00,
  0x00, // reserved
  0x00,
  0x00,
  0x00,
  0x00, // reserved
  0x00,
  0x00,
  0x00,
  0x00, // reserved
  0x53,
  0x6f,
  0x75,
  0x6e,
  0x64,
  0x48,
  0x61,
  0x6e,
  0x64,
  0x6c,
  0x65,
  0x72,
  0x00, // name: 'SoundHandler'
]);
const HDLR_TYPES = {
  video: VIDEO_HDLR,
  audio: AUDIO_HDLR,
};
const DREF = new Uint8Array([
  0x00, // version 0
  0x00,
  0x00,
  0x00, // flags
  0x00,
  0x00,
  0x00,
  0x01, // entry_count
  0x00,
  0x00,
  0x00,
  0x0c, // entry_size
  0x75,
  0x72,
  0x6c,
  0x20, // 'url' type
  0x00, // version 0
  0x00,
  0x00,
  0x01, // entry_flags
]);
const SMHD = new Uint8Array([
  0x00, // version
  0x00,
  0x00,
  0x00, // flags
  0x00,
  0x00, // balance, 0 means centered
  0x00,
  0x00, // reserved
]);
const STCO = new Uint8Array([
  0x00, // version
  0x00,
  0x00,
  0x00, // flags
  0x00,
  0x00,
  0x00,
  0x00, // entry_count
]);
const STSC = STCO;
const STSZ = new Uint8Array([
  0x00, // version
  0x00,
  0x00,
  0x00, // flags
  0x00,
  0x00,
  0x00,
  0x00, // sample_size
  0x00,
  0x00,
  0x00,
  0x00, // sample_count
]);
const STTS = STCO;
const VMHD = new Uint8Array([
  0x00, // version
  0x00,
  0x00,
  0x01, // flags
  0x00,
  0x00, // graphicsmode
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00, // opcolor
]);

function box(type: Uint8Array, ...payload: Uint8Array[]) {
  let size = 0;

  let length = payload.length;

  // calculate the total size we need to allocate
  while (length--) {
    size += payload[length].byteLength;
  }
  const result = new Uint8Array(size + 8);
  const view = new DataView(
    result.buffer,
    result.byteOffset,
    result.byteLength
  );
  view.setUint32(0, result.byteLength);
  result.set(type, 4);

  // copy the payload into the result
  for (let i = 0, size = 8; i < payload.length; i++) {
    result.set(payload[i], size);
    size += payload[i].byteLength;
  }
  return result;
}

export function dinf() {
  return box(boxTypes.dinf, box(boxTypes.dref, DREF));
}

export function esds(track: AudioTrack) {
  return box(
    boxTypes.esds,
    new Uint8Array([
      0x00, // version
      0x00,
      0x00,
      0x00, // flags

      // ES_Descriptor
      0x03, // tag, ES_DescrTag
      0x19, // length
      0x00,
      0x00, // ES_ID
      0x00, // streamDependenceFlag, URL_flag, reserved, streamPriority

      // DecoderConfigDescriptor
      0x04, // tag, DecoderConfigDescrTag
      0x11, // length
      0x40, // object type
      0x15, // streamType
      0x00,
      0x06,
      0x00, // bufferSizeDB
      0x00,
      0x00,
      0xda,
      0xc0, // maxBitrate
      0x00,
      0x00,
      0xda,
      0xc0, // avgBitrate

      // DecoderSpecificInfo
      0x05, // tag, DecoderSpecificInfoTag
      0x02, // length
      // ISO/IEC 14496-3, AudioSpecificConfig
      // for samplingFrequencyIndex see ISO/IEC 13818-7:2006, 8.1.3.2.2, Table 35
      (track.audioobjecttype << 3) | (track.samplingfrequencyindex >>> 1),
      (track.samplingfrequencyindex << 7) | (track.channelcount << 3),
      0x06,
      0x01,
      0x02, // GASpecificConfig
    ])
  );
}

export function ftyp() {
  return box(
    boxTypes.ftyp,
    MAJOR_BRAND,
    MINOR_VERSION,
    MAJOR_BRAND,
    AVC1_BRAND
  );
}

export function hdlr(type: keyof typeof HDLR_TYPES) {
  return box(boxTypes.hdlr, HDLR_TYPES[type]);
}

export function mdat(data: Uint8Array) {
  return box(boxTypes.mdat, data);
}

export function mdhd(track: Track) {
  const result = new Uint8Array([
    0x00, // version 0
    0x00,
    0x00,
    0x00, // flags
    0x00,
    0x00,
    0x00,
    0x02, // creation_time
    0x00,
    0x00,
    0x00,
    0x03, // modification_time
    0x00,
    0x01,
    0x5f,
    0x90, // timescale, 90,000 "ticks" per second

    (track.duration >>> 24) & 0xff,
    (track.duration >>> 16) & 0xff,
    (track.duration >>> 8) & 0xff,
    track.duration & 0xff, // duration
    0x55,
    0xc4, // 'und' language (undetermined)
    0x00,
    0x00,
  ]);

  // Use the sample rate from the track metadata, when it is
  // defined. The sample rate can be parsed out of an ADTS header, for
  // instance.
  if (track.type === "audio") {
    result[12] = (track.samplerate >>> 24) & 0xff;
    result[13] = (track.samplerate >>> 16) & 0xff;
    result[14] = (track.samplerate >>> 8) & 0xff;
    result[15] = track.samplerate & 0xff;
  }

  return box(boxTypes.mdhd, result);
}

export function mdia(track: Track) {
  return box(boxTypes.mdia, mdhd(track), hdlr(track.type), minf(track));
}

export function mfhd(sequenceNumber: number) {
  return box(
    boxTypes.mfhd,
    new Uint8Array([
      0x00,
      0x00,
      0x00,
      0x00, // flags
      (sequenceNumber & 0xff000000) >> 24,
      (sequenceNumber & 0xff0000) >> 16,
      (sequenceNumber & 0xff00) >> 8,
      sequenceNumber & 0xff, // sequence_number
    ])
  );
}

export function minf(track: Track) {
  return box(
    boxTypes.minf,
    track.type === "video"
      ? box(boxTypes.vmhd, VMHD)
      : box(boxTypes.smhd, SMHD),
    dinf(),
    stbl(track)
  );
}

export function moof(sequenceNumber: number, tracks: Track[]) {
  const trackFragments = [];
  let i = tracks.length;
  // build traf boxes for each track fragment
  while (i--) {
    trackFragments[i] = traf(tracks[i]);
  }
  return box(boxTypes.moof, mfhd(sequenceNumber), ...trackFragments);
}

export function moov(tracks: Track[]) {
  let i = tracks.length;
  const boxes = [];

  while (i--) {
    boxes[i] = trak(tracks[i]);
  }

  return box(boxTypes.moov, mvhd(0xffffffff), ...boxes, mvex(tracks));
}

export function mvex(tracks: Track[]) {
  let i = tracks.length;
  const boxes = [];

  while (i--) {
    boxes[i] = trex(tracks[i]);
  }
  return box(boxTypes.mvex, ...boxes);
}

export function mvhd(duration: number) {
  const bytes = new Uint8Array([
    0x00, // version 0
    0x00,
    0x00,
    0x00, // flags
    0x00,
    0x00,
    0x00,
    0x01, // creation_time
    0x00,
    0x00,
    0x00,
    0x02, // modification_time
    0x00,
    0x01,
    0x5f,
    0x90, // timescale, 90,000 "ticks" per second
    (duration & 0xff000000) >> 24,
    (duration & 0xff0000) >> 16,
    (duration & 0xff00) >> 8,
    duration & 0xff, // duration
    0x00,
    0x01,
    0x00,
    0x00, // 1.0 rate
    0x01,
    0x00, // 1.0 volume
    0x00,
    0x00, // reserved
    0x00,
    0x00,
    0x00,
    0x00, // reserved
    0x00,
    0x00,
    0x00,
    0x00, // reserved
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x40,
    0x00,
    0x00,
    0x00, // transformation: unity matrix
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00, // pre_defined
    0xff,
    0xff,
    0xff,
    0xff, // next_track_ID
  ]);
  return box(boxTypes.mvhd, bytes);
}

export function sdtp(track: Track) {
  const samples = track.samples ?? [];
  const bytes = new Uint8Array(4 + samples.length);
  let flags;

  // leave the full box header (4 bytes) all zero

  // write the sample table
  for (let i = 0; i < samples.length; i++) {
    flags = samples[i].flags;

    bytes[i + 4] =
      (flags.dependsOn << 4) | (flags.isDependedOn << 2) | flags.hasRedundancy;
  }

  return box(boxTypes.sdtp, bytes);
}

export function stbl(track: Track) {
  return box(
    boxTypes.stbl,
    stsd(track),
    box(boxTypes.stts, STTS),
    box(boxTypes.stsc, STSC),
    box(boxTypes.stsz, STSZ),
    box(boxTypes.stco, STCO)
  );
}

export function stsd(track: Track) {
  return box(
    boxTypes.stsd,
    new Uint8Array([
      0x00, // version 0
      0x00,
      0x00,
      0x00, // flags
      0x00,
      0x00,
      0x00,
      0x01,
    ]),
    track.type === "video" ? videoSample(track) : audioSample(track)
  );
}

function videoSample(track: VideoTrack) {
  const sps = track.sps || [];
  const pps = track.pps || [];
  let sequenceParameterSets: number[] = [];
  let pictureParameterSets: number[] = [];

  // assemble the SPSs
  for (let i = 0; i < sps.length; i++) {
    sequenceParameterSets.push((sps[i].byteLength & 0xff00) >>> 8);
    sequenceParameterSets.push(sps[i].byteLength & 0xff); // sequenceParameterSetLength
    sequenceParameterSets = sequenceParameterSets.concat(
      Array.prototype.slice.call(sps[i])
    ); // SPS
  }

  // assemble the PPSs
  for (let i = 0; i < pps.length; i++) {
    pictureParameterSets.push((pps[i].byteLength & 0xff00) >>> 8);
    pictureParameterSets.push(pps[i].byteLength & 0xff);
    pictureParameterSets = pictureParameterSets.concat(
      Array.prototype.slice.call(pps[i])
    );
  }

  const avc1Box = [
    boxTypes.avc1,
    new Uint8Array([
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // reserved
      0x00,
      0x01, // data_reference_index
      0x00,
      0x00, // pre_defined
      0x00,
      0x00, // reserved
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // pre_defined
      (track.width & 0xff00) >> 8,
      track.width & 0xff, // width
      (track.height & 0xff00) >> 8,
      track.height & 0xff, // height
      0x00,
      0x48,
      0x00,
      0x00, // horizresolution
      0x00,
      0x48,
      0x00,
      0x00, // vertresolution
      0x00,
      0x00,
      0x00,
      0x00, // reserved
      0x00,
      0x01, // frame_count
      0x13,
      0x76,
      0x69,
      0x64,
      0x65,
      0x6f,
      0x6a,
      0x73,
      0x2d,
      0x63,
      0x6f,
      0x6e,
      0x74,
      0x72,
      0x69,
      0x62,
      0x2d,
      0x68,
      0x6c,
      0x73,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // compressorname
      0x00,
      0x18, // depth = 24
      0x11,
      0x11, // pre_defined = -1
    ]),
    box(
      boxTypes.avcC,
      new Uint8Array(
        [
          0x01, // configurationVersion
          track.profileIdc, // AVCProfileIndication
          track.profileCompatibility, // profile_compatibility
          track.levelIdc, // AVCLevelIndication
          0xff, // lengthSizeMinusOne, hard-coded to 4 bytes
        ].concat(
          [sps.length], // numOfSequenceParameterSets
          sequenceParameterSets, // "SPS"
          [pps.length], // numOfPictureParameterSets
          pictureParameterSets // "PPS"
        )
      )
    ),
    box(
      boxTypes.btrt,
      new Uint8Array([
        0x00,
        0x1c,
        0x9c,
        0x80, // bufferSizeDB
        0x00,
        0x2d,
        0xc6,
        0xc0, // maxBitrate
        0x00,
        0x2d,
        0xc6,
        0xc0, // avgBitrate
      ])
    ),
  ];

  if (track.sarRatio) {
    const hSpacing = track.sarRatio[0],
      vSpacing = track.sarRatio[1];

    avc1Box.push(
      box(
        boxTypes.pasp,
        new Uint8Array([
          (hSpacing & 0xff000000) >> 24,
          (hSpacing & 0xff0000) >> 16,
          (hSpacing & 0xff00) >> 8,
          hSpacing & 0xff,
          (vSpacing & 0xff000000) >> 24,
          (vSpacing & 0xff0000) >> 16,
          (vSpacing & 0xff00) >> 8,
          vSpacing & 0xff,
        ])
      )
    );
  }

  const [avc1, ...data] = avc1Box;
  return box(avc1, ...data);
}

function audioSample(track: AudioTrack) {
  return box(
    boxTypes.mp4a,
    new Uint8Array([
      // SampleEntry, ISO/IEC 14496-12
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // reserved
      0x00,
      0x01, // data_reference_index

      // AudioSampleEntry, ISO/IEC 14496-12
      0x00,
      0x00,
      0x00,
      0x00, // reserved
      0x00,
      0x00,
      0x00,
      0x00, // reserved
      (track.channelcount & 0xff00) >> 8,
      track.channelcount & 0xff, // channelcount
      (track.samplesize & 0xff00) >> 8,
      track.samplesize & 0xff, // samplesize
      0x00,
      0x00, // pre_defined
      0x00,
      0x00, // reserved

      (track.samplerate & 0xff00) >> 8,
      track.samplerate & 0xff,
      0x00,
      0x00, // samplerate, 16.16

      // MP4AudioSampleEntry, ISO/IEC 14496-14
    ]),
    esds(track)
  );
}

export function tkhd(track: Track) {
  const result = new Uint8Array([
    0x00, // version 0
    0x00,
    0x00,
    0x07, // flags
    0x00,
    0x00,
    0x00,
    0x00, // creation_time
    0x00,
    0x00,
    0x00,
    0x00, // modification_time
    (track.id & 0xff000000) >> 24,
    (track.id & 0xff0000) >> 16,
    (track.id & 0xff00) >> 8,
    track.id & 0xff, // track_ID
    0x00,
    0x00,
    0x00,
    0x00, // reserved
    (track.duration & 0xff000000) >> 24,
    (track.duration & 0xff0000) >> 16,
    (track.duration & 0xff00) >> 8,
    track.duration & 0xff, // duration
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00, // reserved
    0x00,
    0x00, // layer
    0x00,
    0x00, // alternate_group
    0x01,
    0x00, // non-audio track volume
    0x00,
    0x00, // reserved
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x40,
    0x00,
    0x00,
    0x00, // transformation: unity matrix
    (track.width & 0xff00) >> 8,
    track.width & 0xff,
    0x00,
    0x00, // width
    (track.height & 0xff00) >> 8,
    track.height & 0xff,
    0x00,
    0x00, // height
  ]);

  return box(boxTypes.tkhd, result);
}

export function traf(track: Track) {
  const trackFragmentHeader = box(
    boxTypes.tfhd,
    new Uint8Array([
      0x00, // version 0
      0x00,
      0x00,
      0x3a, // flags
      (track.id & 0xff000000) >> 24,
      (track.id & 0xff0000) >> 16,
      (track.id & 0xff00) >> 8,
      track.id & 0xff, // track_ID
      0x00,
      0x00,
      0x00,
      0x01, // sample_description_index
      0x00,
      0x00,
      0x00,
      0x00, // default_sample_duration
      0x00,
      0x00,
      0x00,
      0x00, // default_sample_size
      0x00,
      0x00,
      0x00,
      0x00, // default_sample_flags
    ])
  );

  const upperWordBaseMediaDecodeTime = Math.floor(
    track.baseMediaDecodeTime / MAX_UINT32
  );
  const lowerWordBaseMediaDecodeTime = Math.floor(
    track.baseMediaDecodeTime % MAX_UINT32
  );

  const trackFragmentDecodeTime = box(
    boxTypes.tfdt,
    new Uint8Array([
      0x01, // version 1
      0x00,
      0x00,
      0x00, // flags
      // baseMediaDecodeTime
      (upperWordBaseMediaDecodeTime >>> 24) & 0xff,
      (upperWordBaseMediaDecodeTime >>> 16) & 0xff,
      (upperWordBaseMediaDecodeTime >>> 8) & 0xff,
      upperWordBaseMediaDecodeTime & 0xff,
      (lowerWordBaseMediaDecodeTime >>> 24) & 0xff,
      (lowerWordBaseMediaDecodeTime >>> 16) & 0xff,
      (lowerWordBaseMediaDecodeTime >>> 8) & 0xff,
      lowerWordBaseMediaDecodeTime & 0xff,
    ])
  );

  // the data offset specifies the number of bytes from the start of
  // the containing moof to the first payload byte of the associated
  // mdat
  const dataOffset =
    32 + // tfhd
    20 + // tfdt
    8 + // traf header
    16 + // mfhd
    8 + // moof header
    8; // mdat header

  // audio tracks require less metadata
  if (track.type === "audio") {
    const trackFragmentRun = trun(track, dataOffset);
    return box(
      boxTypes.traf,
      trackFragmentHeader,
      trackFragmentDecodeTime,
      trackFragmentRun
    );
  }

  // video tracks should contain an independent and disposable samples
  // box (sdtp)
  // generate one and adjust offsets to match
  const sampleDependencyTable = sdtp(track);
  const trackFragmentRun = trun(
    track,
    sampleDependencyTable.length + dataOffset
  );
  return box(
    boxTypes.traf,
    trackFragmentHeader,
    trackFragmentDecodeTime,
    trackFragmentRun,
    sampleDependencyTable
  );
}

export function trak(track: Track) {
  track.duration = track.duration || 0xffffffff;
  return box(boxTypes.trak, tkhd(track), mdia(track));
}

export function trek(track: Track) {
  const result = new Uint8Array([
    0x00, // version 0
    0x00,
    0x00,
    0x00, // flags
    (track.id & 0xff000000) >> 24,
    (track.id & 0xff0000) >> 16,
    (track.id & 0xff00) >> 8,
    track.id & 0xff, // track_ID
    0x00,
    0x00,
    0x00,
    0x01, // default_sample_description_index
    0x00,
    0x00,
    0x00,
    0x00, // default_sample_duration
    0x00,
    0x00,
    0x00,
    0x00, // default_sample_size
    0x00,
    0x01,
    0x00,
    0x01, // default_sample_flags
  ]);
  // the last two bytes of default_sample_flags is the sample
  // degradation priority, a hint about the importance of this sample
  // relative to others. Lower the degradation priority for all sample
  // types other than video.
  if (track.type !== "video") {
    result[result.length - 1] = 0x00;
  }

  return box(boxTypes.trex, result);
}

// This method assumes all samples are uniform. That is, if a
// duration is present for the first sample, it will be present for
// all subsequent samples.
// see ISO/IEC 14496-12:2012, Section 8.8.8.1
function trunHeader(samples: Sample[], offset: number) {
  let durationPresent = 0,
    sizePresent = 0,
    flagsPresent = 0,
    compositionTimeOffset = 0;

  // trun flag constants
  if (samples.length) {
    if (samples[0].duration !== undefined) {
      durationPresent = 0x1;
    }
    if (samples[0].size !== undefined) {
      sizePresent = 0x2;
    }
    if (samples[0].flags !== undefined) {
      flagsPresent = 0x4;
    }
    if (samples[0].compositionTimeOffset !== undefined) {
      compositionTimeOffset = 0x8;
    }
  }

  return [
    0x00, // version 0
    0x00,
    durationPresent | sizePresent | flagsPresent | compositionTimeOffset,
    0x01, // flags
    (samples.length & 0xff000000) >>> 24,
    (samples.length & 0xff0000) >>> 16,
    (samples.length & 0xff00) >>> 8,
    samples.length & 0xff, // sample_count
    (offset & 0xff000000) >>> 24,
    (offset & 0xff0000) >>> 16,
    (offset & 0xff00) >>> 8,
    offset & 0xff, // data_offset
  ];
}

export function videoTrun(track: VideoTrack, offset: number) {
  const samples = track.samples ?? [];
  const header = trunHeader(samples, offset + 8 + 12 + 16 * samples.length);
  const bytes = new Uint8Array(header.length + samples.length * 16);
  bytes.set(header);
  let bytesOffset = header.length;

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];

    bytes[bytesOffset++] = (sample.duration & 0xff000000) >>> 24;
    bytes[bytesOffset++] = (sample.duration & 0xff0000) >>> 16;
    bytes[bytesOffset++] = (sample.duration & 0xff00) >>> 8;
    bytes[bytesOffset++] = sample.duration & 0xff; // sample_duration
    bytes[bytesOffset++] = (sample.size & 0xff000000) >>> 24;
    bytes[bytesOffset++] = (sample.size & 0xff0000) >>> 16;
    bytes[bytesOffset++] = (sample.size & 0xff00) >>> 8;
    bytes[bytesOffset++] = sample.size & 0xff; // sample_size
    bytes[bytesOffset++] =
      (sample.flags.isLeading << 2) | sample.flags.dependsOn;
    bytes[bytesOffset++] =
      (sample.flags.isDependedOn << 6) |
      (sample.flags.hasRedundancy << 4) |
      (sample.flags.paddingValue << 1) |
      sample.flags.isNonSyncSample;
    bytes[bytesOffset++] = sample.flags.degradationPriority & (0xf0 << 8);
    bytes[bytesOffset++] = sample.flags.degradationPriority & 0x0f; // sample_flags
    bytes[bytesOffset++] = (sample.compositionTimeOffset & 0xff000000) >>> 24;
    bytes[bytesOffset++] = (sample.compositionTimeOffset & 0xff0000) >>> 16;
    bytes[bytesOffset++] = (sample.compositionTimeOffset & 0xff00) >>> 8;
    bytes[bytesOffset++] = sample.compositionTimeOffset & 0xff; // sample_composition_time_offset
  }
  return box(boxTypes.trun, bytes);
}

export function trex(track: Track) {
  const result = new Uint8Array([
    0x00, // version 0
    0x00,
    0x00,
    0x00, // flags
    (track.id & 0xff000000) >> 24,
    (track.id & 0xff0000) >> 16,
    (track.id & 0xff00) >> 8,
    track.id & 0xff, // track_ID
    0x00,
    0x00,
    0x00,
    0x01, // default_sample_description_index
    0x00,
    0x00,
    0x00,
    0x00, // default_sample_duration
    0x00,
    0x00,
    0x00,
    0x00, // default_sample_size
    0x00,
    0x01,
    0x00,
    0x01, // default_sample_flags
  ]);
  // the last two bytes of default_sample_flags is the sample
  // degradation priority, a hint about the importance of this sample
  // relative to others. Lower the degradation priority for all sample
  // types other than video.
  if (track.type !== "video") {
    result[result.length - 1] = 0x00;
  }

  return box(boxTypes.trex, result);
}

function audioTrun(track: AudioTrack, offset: number) {
  const samples = track.samples ?? [];
  offset += 8 + 12 + 8 * samples.length;

  const header = trunHeader(samples, offset);
  const bytes = new Uint8Array(header.length + samples.length * 8);
  bytes.set(header);
  let bytesOffset = header.length;

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    bytes[bytesOffset++] = (sample.duration & 0xff000000) >>> 24;
    bytes[bytesOffset++] = (sample.duration & 0xff0000) >>> 16;
    bytes[bytesOffset++] = (sample.duration & 0xff00) >>> 8;
    bytes[bytesOffset++] = sample.duration & 0xff; // sample_duration
    bytes[bytesOffset++] = (sample.size & 0xff000000) >>> 24;
    bytes[bytesOffset++] = (sample.size & 0xff0000) >>> 16;
    bytes[bytesOffset++] = (sample.size & 0xff00) >>> 8;
    bytes[bytesOffset++] = sample.size & 0xff; // sample_size
  }

  return box(boxTypes.trun, bytes);
}

export function trun(track: Track, offset: number) {
  if (track.type === "audio") {
    return audioTrun(track, offset);
  }

  return videoTrun(track, offset);
}
