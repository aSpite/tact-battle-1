import { beginCell, Cell, Dictionary, TonClient } from '@ton/ton';
import dotenv from 'dotenv';

interface VoteState {
    yes: number;
    no: number;
}

function computeKey(yes: number, no: number, vote: "yes" | "no"): bigint {
    const cell = beginCell()
        .storeUint(yes, 8)
        .storeUint(no, 8)
        .endCell();

    const hashBuf = cell.hash();
    const hashBig = BigInt("0x" + hashBuf.toString("hex"));
    const prefix = hashBig >> BigInt(224);
    const voteBits = vote === "yes" ? BigInt(0b11) : BigInt(0b10);
    return (prefix << BigInt(2)) | voteBits;
}

const stateMap = Dictionary.empty(Dictionary.Keys.BigUint(34), Dictionary.Values.Cell());

function transition(
    state: VoteState,
    vote: "yes" | "no"
  ): bigint | null {
    if (state.yes + state.no >= 10) {
      return null;
    }
    const newState: VoteState = {
      yes: state.yes + (vote === "yes" ? 1 : 0),
      no: state.no + (vote === "no" ? 1 : 0),
    };
    const newCell = beginCell()
      .storeUint(newState.yes, 8)
      .storeUint(newState.no, 8)
      .endCell();
    const key = computeKey(state.yes, state.no, vote);
    stateMap.set(key, newCell);
    return key;
  }


function buildTransitionMap(maxVotes = 10): Dictionary<bigint, Cell> {
    const map = Dictionary.empty(Dictionary.Keys.BigUint(7), Dictionary.Values.Cell());

  for (let y = 0; y <= maxVotes; y++) {
    for (let n = 0; n <= maxVotes - y; n++) {
      const currentCell = beginCell()
        .storeUint(y, 8)
        .storeUint(n, 8)
        .endCell();

      const hashBuf = currentCell.hash();
      const hashBig = BigInt("0x" + hashBuf.toString("hex"));
      const prefix = hashBig >> BigInt(224);

      if (y < maxVotes) {
        const voteBits = BigInt(0b11);
        const key = (prefix << BigInt(2)) | voteBits;
        const nextCell = beginCell()
          .storeUint(y + 1, 8)
          .storeUint(n, 8)
          .endCell();
        map.set(key, nextCell);
      }

      if (n < maxVotes) {
        const voteBits = BigInt(0b10);
        const key = (prefix << BigInt(2)) | voteBits;
        const nextCell = beginCell()
          .storeUint(y, 8)
          .storeUint(n + 1, 8)
          .endCell();
        map.set(key, nextCell);
      }
    }
  }

  return map;
}
  

async function main() {
dotenv.config();
    const client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        apiKey: process.env.API_KEY
    });
    
    // let currentState: VoteState = { yes: 0, no: 0 };
    // for (const v of ["yes", "no", "yes", "no", "yes"] as const) {
    // const idx = transition(currentState, v);
    // if (idx === null) {
    //     console.log("Лимит голосов достигнут");
    //     break;
    // }
    // console.log(`Перешли к индексу ${idx} с состоянием`, currentState);
    // currentState = {
    //     yes: currentState.yes + (v === "yes" ? 1 : 0),
    //     no: currentState.no + (v === "no" ? 1 : 0),
    // };
    // }

    const stateMap = buildTransitionMap(10);

    let keys = stateMap.keys();
    for (const key of keys) {
        const cs = stateMap.get(key).beginParse();
        const y = cs.loadUint(8);
        const n = cs.loadUint(8);

        if (y > 4 && n != 0) {
          stateMap.delete(key);
        }
        if (n > 6) {
          stateMap.delete(key);
        }
        if (n == 6 && y != 3 && y != 4) {
          stateMap.delete(key);
        }
        if (n == 5 && y != 3) {
          stateMap.delete(key);
        }
        if (n == 4 && y != 3 && y != 2) {
          stateMap.delete(key);
        }
        if (n == 3 && y != 2) {
          stateMap.delete(key);
        }
        if (n == 2 && y != 2 && y != 1) {
          stateMap.delete(key);
        }
    }

    const keysCannotDelete = [
      7389025331n, 7389025330n, 10421635399n, 11909471423n, 11802084775n, 8156173283n, 6988983567n,
      13014691187n, 13293499035n, 11676693335n, 2872772475n,


      10421635398n, 8343328186n, 3006463599n, 14801658350n, 7552972838n, 16392205659n, 4647051278n,
      5874079990n, 7931456463n
    ];
    const keysToDelete = [
      8156173282n, 11802084774n, 15991633595n, 14827545091n, 1646123847n, 8343328187n, 11909471422n,
      11682353647n, 14827545090n, 11520433091n, 4936402879n, 9861469054n, 11045553191n, 1086416171n,
      10835554674n
    ];
    for (const key of keysToDelete) {
        if (keysCannotDelete.includes(key)) {
          throw new Error(`Cannot delete key ${key}`);
        }
        stateMap.delete(key);
    }

    keys = stateMap.keys();
    for (let key of keys) {
        const cs = stateMap.get(key);
        const css = cs.beginParse();
        const y = css.loadUint(8);
        const n = css.loadUint(8);
        stateMap.delete(key);
        key = key & 0b1111111n;
        if (y > 2) {
          continue;
        }
        if (key == 110n || key == 38n || key == 71n || key == 111n || key == 58n) {
          continue;
        }
        stateMap.set(key, cs);
    }

    keys = stateMap.keys();
    for (const key of keys) {
        const cs = stateMap.get(key).beginParse();
        const y = cs.loadUint(8);
        const n = cs.loadUint(8);
        if (keysCannotDelete.includes(key)) {
          // continue;
        }
        console.log(`Key: ${key}, y: ${y}, n: ${n}`)
    }
    
    // console.log(stateMap)
    const dictCell = beginCell().storeDictDirect(stateMap).endCell();
    console.log(dictCell.toBoc().toString('hex'));
    console.log(`Сгенерировано переходов: ${stateMap.size}`);

    // console.log(beginCell().storeUint(1, 8).storeUint(0, 8).endCell().toBoc().toString('hex'));
    // console.log(beginCell().storeUint(0, 8).storeUint(1, 8).endCell().toBoc().toString('hex'));
    // console.log(beginCell().storeUint(1, 8).storeUint(1, 8).endCell().toBoc().toString('hex'));
    // console.log(beginCell().storeUint(1, 8).storeUint(2, 8).endCell().toBoc().toString('hex'));

    // console.log(BigInt('0x' + beginCell().storeUint(1, 8).storeUint(0, 8).endCell().hash().toString('hex')) >> 254n);
    // console.log(BigInt('0x' + beginCell().storeUint(0, 8).storeUint(1, 8).endCell().hash().toString('hex')) >> 254n);
    // console.log(BigInt('0x' + beginCell().storeUint(1, 8).storeUint(1, 8).endCell().hash().toString('hex')) >> 254n);
    // console.log(BigInt('0x' + beginCell().storeUint(1, 8).storeUint(2, 8).endCell().hash().toString('hex')) >> 254n);

    const key = 7389025331n;
    // const dict = dictCell.beginParse().loadDictDirect(Dictionary.Keys.BigUint(34), Dictionary.Values.Cell());

    console.log(Math.floor(Date.now() / 1000) + 24 * 60 * 60)
    // console.log(beginCell().storeUint(5, 8).storeUint(1, 8).endCell().toBoc().toString('hex'))
    // console.log(beginCell().storeUint(5, 8).storeUint(0, 8).endCell().toBoc().toString('hex'))
    
    
    // console.log(BigInt('0x' + beginCell().storeUint(1, 8).storeUint(0, 8).endCell().hash().toString('hex')) >> 254n);
    // console.log(BigInt('0x' + beginCell().storeUint(0, 8).storeUint(1, 8).endCell().hash().toString('hex')) >> 254n);
}


function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main().finally(() => console.log("Exiting..."));