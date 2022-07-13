import ByteBuffer from "bytebuffer";

const textDecoder = new TextDecoder();

export default class AirUnpacker {
  private readonly buffer: ByteBuffer;

  constructor(data: ArrayBuffer) {
    this.buffer = ByteBuffer.wrap(data);
  }

  unpackBoolean(): boolean {
    return this.buffer.readByte() === 1;
  }

  unpackShort(): number {
    return this.buffer.readShort();
  }

  unpackInt(): number {
    return this.buffer.readInt();
  }
  //unpackInt alias
  unpackArrayHeader: () => number = this.unpackInt;

  //https://stackoverflow.com/questions/14200071/javascript-read-8-bytes-to-64-bit-integer
  //https://stackoverflow.com/questions/14002205/read-int64-from-node-js-buffer-with-precision-loss
  unpackLong(): number {
    const high = this.buffer.readUint32();
    const low = this.buffer.readUint32();

    let val: number = high * 4294967296 + low;
    if (val < 0) val += 4294967296;
    return val;
  }

  unpackDouble(): number {
    return this.buffer.readDouble();
  }

  unpackString(): string {
    return textDecoder.decode(this.unpackPayload());
  }

  unpackNullableString(): string | undefined {
    if (this.unpackBoolean()) {
      return this.unpackString();
    } else {
      return undefined;
    }
  }

  unpackStringArray(): string[] {
    const length = this.unpackArrayHeader();
    const value: string[] = [];
    for (let i = 0; i < length; i++) value[i] = this.unpackString();
    return value;
  }

  unpackPayload(): ArrayBuffer {
    const length = this.unpackInt();
    return this.buffer.readBytes(length).toArrayBuffer();
  }

  unpackNullablePayload(): ArrayBuffer | undefined {
    if (this.unpackBoolean()) {
      return this.unpackPayload();
    } else {
      return undefined;
    }
  }
}
