import ByteBuffer from "bytebuffer";

const bufferSize = 4 * 1024 * 1024; //4 MiB

type Payload = ArrayBuffer | Uint8Array;

const textEncoder = new TextEncoder();

export default class AirPacker {
  private static readonly instance = new AirPacker(
    ByteBuffer.allocate(bufferSize)
  );

  public static get(): AirPacker {
    return this.instance;
  }

  public static initialize(bufferSize: number) {
    return new AirPacker(ByteBuffer.allocate(bufferSize));
  }

  private constructor(private readonly buffer: ByteBuffer) {}

  packBoolean(value: boolean) {
    this.buffer.writeByte(value ? 1 : 0);
  }

  packShort(value: number) {
    this.buffer.writeShort(value);
  }

  packInt(value: number) {
    this.buffer.writeInt(value);
  }
  //packInt alias
  packArrayHeader: (value: number) => void = this.packInt;

  packLong(value: number) {
    this.buffer.writeLong(value);
  }

  packDouble(value: number) {
    this.buffer.writeDouble(value);
  }

  packString(value: string) {
    this.packPayload(textEncoder.encode(value));
  }

  packNullableString(value: string | null) {
    if (value) {
      this.packBoolean(true);
      this.packString(value);
    } else {
      this.packBoolean(false);
    }
  }

  packStringArray(value: string[]) {
    this.packArrayHeader(value.length);
    for (const entry of value) this.packString(entry);
  }

  packPayload(value: Payload) {
    this.packInt(value.byteLength);
    this.buffer.append(value);
  }

  packNullablePayload(value: Payload | null) {
    if (value) {
      this.packBoolean(true);
      this.packPayload(value);
    } else {
      this.packBoolean(false);
    }
  }

  toArrayBuffer(): ArrayBuffer {
    return this.buffer.buffer.slice(0, this.buffer.offset);
  }

  reset() {
    this.buffer.reset();
  }
}
