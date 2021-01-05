import pako from "pako";

export abstract class TransferAccumulator {
	public abstract push(data: ArrayBuffer): void;
	public abstract get data(): ArrayBuffer;
	public abstract get offset(): number;
}

export class BasicAccumulator extends TransferAccumulator {
	private readonly accumulatedData: Uint8Array | undefined;
	private accumulatedDataOffset: number = 0;
	
	
	constructor(length: number) {
		super()
		this.accumulatedData = new Uint8Array(length);
	}
	
	push(data: ArrayBuffer) {
		//Adding the data to the array
		this.accumulatedData!.set(new Uint8Array(data), this.accumulatedDataOffset);
		this.accumulatedDataOffset += data.byteLength;
	}
	
	get data() {
		return this.accumulatedData!;
	}
	
	get offset() {
		return this.accumulatedDataOffset;
	}
}

export class InflatorAccumulator extends TransferAccumulator {
	private inflator = new pako.Inflate();
	private accumulatedDataOffset: number = 0;
	
	push(data: ArrayBuffer) {
		//Adding the data to the array
		this.inflator.push(data);
		this.accumulatedDataOffset += data.byteLength;
	}
	
	get data() {
		if(this.inflator.err) throw this.inflator.err;
		return (this.inflator.result as Uint8Array).buffer;
	}
	
	get offset() {
		return this.accumulatedDataOffset;
	}
}