import pako from "pako";

export abstract class TransferAccumulator {
  public abstract push(data: ArrayBuffer): void;
  public abstract get data(): Blob;
  public abstract get length(): number;
}

export class BasicAccumulator extends TransferAccumulator {
  private readonly accumulatedData: ArrayBuffer[] = [];
  private dataLength = 0;

  push(data: ArrayBuffer) {
    //Adding the data to the array
    this.accumulatedData.push(data);
    this.dataLength += data.byteLength;
  }

  get data() {
    return new Blob(this.accumulatedData);
  }

  get length() {
    return this.dataLength;
  }
}

export class InflatorAccumulator extends TransferAccumulator {
  private readonly inflator = new pako.Inflate();
  private accumulatedDataOffset: number = 0;

  push(data: ArrayBuffer) {
    //Adding the data to the array
    this.inflator.push(data);
    this.accumulatedDataOffset += data.byteLength;
  }

  get data() {
    if (this.inflator.err) throw this.inflator.err;
    return new Blob([this.inflator.result as Uint8Array]);
  }

  get length() {
    return this.accumulatedDataOffset;
  }
}
