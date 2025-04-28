import { Address, beginCell, Cell, Dictionary, fromNano, internal, JettonMaster, JettonWallet, loadOutAction, loadOutList, MessageRelaxed, OutActionSendMsg, OutActionSetCode, SendMode, storeMessageRelaxed, storeOutList, storeStateInit, toNano, TonClient, WalletContractV3R2, WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import fs from 'fs';
import { fromMicro } from './convert-micro';
import dotenv from 'dotenv';
import { DEX, pTON } from "@ston-fi/sdk";
import { mnemonicNew, mnemonicToWalletKey } from '@ton/crypto';
import { Blockchain } from '@ton/sandbox';

async function main() {
dotenv.config();
    const client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        apiKey: process.env.API_KEY
    });
    console.log(BigInt('0x' + Address.parse('EQBUKnXfyhdYpfZIpYbRwUYCbV4BHFYVxzyvtMiHYZ226Que').hash.toString('hex')));
    // task 1, 3, 5
    console.log(beginCell()
        // .storeUint(1, 1)
        .storeUint(0, 8)
        .storeUint(0, 8)
        // .storeUint(0, 2)
        .endCell().toBoc().toString('hex'));

    // task 2, 4
    console.log(beginCell()
        // .storeUint(1, 1)
        // .storeAddress(Address.parse('EQB-o6Cy04N0exXh_4XfXYq-6eQnv3jzaxf6XkZgmpaVM81K'))
        .storeUint(0, 8)
        // .storeUint(0, 8)
        // .storeAddress(Address.parse('UQDKbjIcfM6ezt8KjKJJLshZJJSqX7XOA4ff-W72r5gqPuwA'))
        .endCell().toBoc().toString('hex'));
        

    for (let i = 2; i <= 10; i++) {
        const cell = beginCell()
            .storeUint(1, 1)
            .storeUint(i, 8)
            .storeUint(0, 8)
            .storeAddress(Address.parse('EQAblzVtOrlm1vqwNs47LGX0QlMu0zAKXeN12sdAdHXAqQGy'))
            .endCell();
        console.log(`asm fun get_y_${i}_n_0(): Cell { B{${cell.toBoc().toString('hex')}} B>boc PUSHREF }`);
    }
    console.log();
    for (let i = 2; i <= 6; i++) {
        const cell = beginCell()
            .storeUint(1, 1)
            .storeUint(0, 8)
            .storeUint(i, 8)
            .storeAddress(Address.parse('EQAblzVtOrlm1vqwNs47LGX0QlMu0zAKXeN12sdAdHXAqQGy'))
            .endCell();
        console.log(`asm fun get_y_0_n_${i}(): Cell { B{${cell.toBoc().toString('hex')}} B>boc PUSHREF }`);
    }
    console.log();
    for (let i = 1; i <= 4; i++) {
        const cell = beginCell()
            .storeUint(1, 1)
            .storeUint(6, 8)
            .storeUint(i, 8)
            .storeAddress(Address.parse('EQAblzVtOrlm1vqwNs47LGX0QlMu0zAKXeN12sdAdHXAqQGy'))
            .endCell();
        console.log(`asm fun get_y_${i}_n_6(): Cell { B{${cell.toBoc().toString('hex')}} B>boc PUSHREF }`);
    }
    console.log();

    const voterAddress = Address.parse('EQAblzVtOrlm1vqwNs47LGX0QlMu0zAKXeN12sdAdHXAqQGy');
    const blockchain = await Blockchain.create();
    for (let i = 0; i < 10; i++) {
        const voter = await blockchain.treasury(`voter${i}`);
        console.log(`Voter ${i}: ${BigInt('0x' + voter.address.hash.toString('hex').toString())}, prefix: ${beginCell().storeUint(0b0110, 4).storeAddress(voter.address).endCell()
          .beginParse().loadUint(19)}`);

    }
    const voter = await blockchain.treasury(`voter`);
    console.log(`Voter: ${BigInt('0x' + voter.address.hash.toString('hex').toString())}`);
    console.log(`Voter: ${voter.address}`);
    console.log(beginCell().storeAddress(voter.address).endCell().beginParse(), voter.address)


    const task1Code = Cell.fromHex('b5ee9c7241010301007a0001b0ff00e3023331d074d721fa4030ed44d0d307d307fa403022c263f2728210680f52b4f823b9f2735230c705f2742202a4048020d721d70a0091a4de03c8cb0713cb0758cf16c9ed54708010c8cb0558cf16cb76c98040fb0001011882013962f4a413f4bcf2c80b02001ba64e58bb513434c1f4c1cc19a86019b6edbb');
    let setCodeAction: OutActionSetCode = {
        type: 'setCode',
        newCode: task1Code
    };
    let actionsBuilder = beginCell();
    storeOutList([setCodeAction])(actionsBuilder);
    console.log('set code actions task 1')
    console.log(actionsBuilder.endCell().toBoc().toString('hex'));

    console.log()

    const task2Code = Cell.fromHex('b5ee9c724101030100ab000228ff008e88f4a413f4bcf2c80bed5320e303ed43d901020029a64e58bb51343e9034c7f4c1f4c1cc0868569c006000f4303331d074d721fa403001d31f21c0028e3831ed44d0fa40d31fd307d307fa403021c263f27223f823b9f27426c705f273a404d70a0091a4dec85003cf16cb1fcb07cb0701cf16c9ed54e001c0018e28ed44d071d721fa40305203c705f2b7d31f307020c85004cf1612cb1f12cb07cb078b02cf16c9ed54e05b4bde9c70');
    setCodeAction = {
        type: 'setCode',
        newCode: task2Code
    };
    actionsBuilder = beginCell();
    storeOutList([setCodeAction])(actionsBuilder);
    console.log('set code actions task 2')
    console.log(actionsBuilder.endCell().toBoc().toString('hex'));

    console.log()
    const task3Code = Cell.fromHex('b5ee9c7241020f0100015500020cff0020e3023001020110f4a413f4bcf2c80b0d04986c228210680e9c5cf823b9f273ed44f900abfdc0009c01d0d3123082034001baf2759131e2d70b20ed44f90001b1807fb020c0378e843088ed54e020c0368e843088ed55e020c03ee302c03f0304070900060100530208ad4de08e0b050132ff008e88f4a413f4bcf2c80bed532095305f04f205e1ed43d906000ba64e589c1c60020e3088ed5588ed540a080004050102128f0688ed5588ed54e00a0e0208ad4de08e0b0c0000012eff008e88f4a413f4bcf2c80bed532093305f04e1ed43d90d00eda64e58bb513434c1f4c1cc08708063994c7e09dbc40070c0239388208406422c402e64cc1c883808208407bfa4802e64cc1c9cf8082084093d1cc02e64cc1c9d380820840aba95002e64cc1cdd380820840c380d402e64cc1cdd7820840db585802e649cddb81d1db82084017d78402a415ead821c382000040500aa46d0fd');
    setCodeAction = {
        type: 'setCode',
        newCode: task3Code
    };
    actionsBuilder = beginCell();
    storeOutList([setCodeAction])(actionsBuilder);
    console.log('set code actions task 3')
    console.log(actionsBuilder.endCell().toBoc().toString('hex'));

    console.log()

    const task4Code = Cell.fromHex('b5ee9c724101030100ab000228ff008e88f4a413f4bcf2c80bed5320e303ed43d901020029a64e58bb51343e9034c7f4c1f4c1cc0868569c006000f4303331d074d721fa403001d31f21c0028e3831ed44d0fa40d31fd307d307fa403021c263f27223f823b9f27426c705f273a404d70a0091a4dec85003cf16cb1fcb07cb0701cf16c9ed54e001c0018e28ed44d071d721fa40305203c705f2b7d31f307020c85004cf1612cb1f12cb07cb078b02cf16c9ed54e05b4bde9c70');
    setCodeAction = {
        type: 'setCode',
        newCode: task4Code
    };
    actionsBuilder = beginCell();
    storeOutList([setCodeAction])(actionsBuilder);
    console.log('set code actions task 4')
    console.log(actionsBuilder.endCell().toBoc().toString('hex'));

    console.log()

    const task5Code = Cell.fromHex('b5ee9c724101030100800001c0e30233d074d721fa4030ed44d0d307d307fa40308210680f67e6f823b9f27304820afaf080b9f2755132c705f27221c8cf8508ce70cf0b6ec98042fb00038020d7215da0c20a92f205ded70a009202a49301a458e2c8cb07cb0701cf16c9ed5401011882013962f4a413f4bcf2c80b020017a64e58bb513434c1f4c1cc2003a9ef50');
    setCodeAction = {
        type: 'setCode',
        newCode: task5Code
    };
    actionsBuilder = beginCell();
    storeOutList([setCodeAction])(actionsBuilder);
    console.log('set code actions task 5')
    console.log(actionsBuilder.endCell().toBoc().toString('hex'));

    console.log()
    console.log(Math.floor(Date.now() / 1000) + 24 * 60 * 60)

    console.log(beginCell().storeUint(1, 32).storeUint(0, 1).endCell().beginParse());
    console.log(beginCell().storeUint(1, 32).storeUint(1, 1).endCell().beginParse());
    console.log(beginCell().storeUint(213001, 19).endCell().beginParse());

    console.log(beginCell().storeUint(0b0110, 4).storeAddress(Address.parse('EQAblzVtOrlm1vqwNs47LGX0QlMu0zAKXeN12sdAdHXAqQGy')).endCell()
    .beginParse().loadUint(6));

    console.log();
    // for (let i = 0; i < 100; i++) {
    //   const hash = BigInt('0x' + beginCell().storeUint(i, 32).endCell().hash().toString('hex')) >> 255n;
    //   console.log(hash)
    // }
    const proxyCodeCell = Cell.fromHex('b5ee9c7241010101001800002c5bd074d721fa4030c8cf8508ce70cf0b6ec98042fb00f9c785bc');
    const proxyDataCell = beginCell().endCell();
    const proxyStateInit = {
      code: proxyCodeCell,
      data: proxyDataCell
    };
    const proxyStateInitCell = beginCell()
      .store(storeStateInit(proxyStateInit))
      .endCell();
    const proxyContractDeploy: OutActionSendMsg = {
      type: 'sendMsg',
      mode: SendMode.CARRY_ALL_REMAINING_INCOMING_VALUE,
      outMsg: internal({
          to: new Address(0, proxyStateInitCell.hash()),
          init: proxyStateInit,
          value: 0n,
          body: beginCell().endCell()
      })
    };
    const get_0_1Code = Cell.fromHex('b5ee9c724102140100011500037ae30230821068102a60f823b9f273ed44d074d721fa4031fa4031fa0031f40431fa0031fa00318060d72172d721d72c200000000e8e8388ed55e088ed5501030f011882013962f4a413f4bcf2c80b02000ba64e589c08200208ad4de08e10040336e30201d0d7281b40098030d72c200000000e8e8388ed55e088ed5505070b011882013962f4a413f4bcf2c80b06000ba64e589c5c200208ad4de08e10080104e30209011882013962f4a413f4bcf2c80b0a0027a64e58be09dbc42084017d78402a415ead821c200208ad4de08e100c0104e3020d011882013962f4a413f4bcf2c80b0e000ba64e589d1da00208ad4de08e101100000106e302cc12011882013962f4a413f4bcf2c80b13000ba64e589c1c6014fd5c11');
    setCodeAction = {
      type: 'setCode',
      newCode: get_0_1Code
    }
    actionsBuilder = beginCell();
    storeOutList([setCodeAction, proxyContractDeploy])(actionsBuilder);
    const actionsCell = actionsBuilder.endCell();
    console.log('proxy deploy + set code', actionsCell.toBoc().toString('hex'));
    
    console.log(beginCell().storeUint(1, 32).endCell().beginParse())
    return;
    console.log()
    console.log(Cell.fromHex('b5ee9c724101010100040000040500786e6f98').beginParse().skip(8).loadUint(8))
    console.log(beginCell().storeUint(3, 2).storeUint(0, 2).endCell().toBoc().toString('hex'));
    console.log(beginCell().storeUint(3, 2).storeUint(1, 2).endCell().toBoc().toString('hex'));
    
    console.log()
    // console.log(beginCell().storeUint(0, 8).storeUint(1, 8).endCell().toBoc().toString('hex'));
    // console.log(beginCell().storeUint(1, 8).storeUint(1, 8).endCell().toBoc().toString('hex'));

    // return;
    for (let i = 0; i < 4; i++) {
        const hash1 = BigInt('0x' + beginCell().storeUint(0, 2).storeUint(0, 2).storeUint(i, 2).endCell().hash().toString('hex')) >> 254n
        const hash2 = BigInt('0x' + beginCell().storeUint(0, 2).storeUint(1, 2).storeUint(i, 2).endCell().hash().toString('hex')) >> 254n
        const hash3 = BigInt('0x' + beginCell().storeUint(1, 2).storeUint(0, 2).storeUint(i, 2).endCell().hash().toString('hex')) >> 254n
        const hash4 = BigInt('0x' + beginCell().storeUint(1, 2).storeUint(1, 2).storeUint(i, 2).endCell().hash().toString('hex')) >> 254n

        // hash2 and hash3 should be greater than hash1 and hash4 or lower

        if (hash2 == hash3 && hash1 != hash2 && hash1 != hash4 && hash4 != hash2) {
            console.log(`i: ${i}, hash1: ${hash1}, hash2: ${hash2}, hash3: ${hash3}, hash4: ${hash4}`);
        }
    }
    // return;
    
    // console.log((((hash >> 224n) << 2n) | 2n) & 127n)
    // console.log(hash.toString(2))
    // console.log(Cell.fromHex('b5ee9c724101010100040000040500786e6f98').beginParse().skip(8).loadUint(8))
    const testSlice = beginCell().storeUint(11, 32).storeBit(false).endCell().beginParse();
    console.log(testSlice.loadUint(33))
    const cell1 = beginCell().storeUint(1, 8).storeUint(1, 8).endCell();
    const hash1 = BigInt('0x' + cell1.hash().toString('hex'));
    console.log(((hash1 >> 224n << 2n) | 3n) & 127n);
    // return;
    const finalCell = beginCell()
      .storeRef(Cell.fromHex('b5ee9c7241010101000600000801000140902f3380'))
      .storeRef(Cell.fromHex('b5ee9c7241010101000600000800010140561737f8'))
      .storeRef(Cell.fromHex('b5ee9c7241010101000600000801010140eebd7225'))
      .storeRef(Cell.fromHex('b5ee9c724101010100040000040500786e6f98'))
      .endCell();
    console.log(finalCell.asSlice());
    for (let i = 83; i <= 83; i++) {
      const cell1 = beginCell().storeUint(0, 8).storeUint(0, 8).storeUint(i, 8).endCell();
      const hash1 = BigInt('0x' + cell1.hash().toString('hex'));
      const cell2 = beginCell().storeUint(1, 8).storeUint(0, 8).storeUint(i, 8).endCell();
      const hash2 = BigInt('0x' + cell2.hash().toString('hex'));
      const cell3 = beginCell().storeUint(0, 8).storeUint(1, 8).storeUint(i, 8).endCell();
      const hash3 = BigInt('0x' + cell3.hash().toString('hex'));
      const cell4 = beginCell().storeUint(1, 8).storeUint(1, 8).storeUint(i, 8).endCell();
      const hash4 = BigInt('0x' + cell4.hash().toString('hex'));
      // const a = (hash1 | 3n) & 15n;
      // const b = (hash1 | 7n) & 15n;
      // const c1 = (hash2 | 3n) & 15n;
      // const c2 = (hash3 | 7n) & 15n;
      // const d1 = (hash2 | 3n) & 15n;
      // const d2 = (hash3 | 7n) & 15n;

      /*
        a  | y0 n0 -> y1 n0
        b  | y0 n0 -> y0 n1
        c1 | y1 n0 -> y2 n1
        c2 | y1 n0 -> y1 n1
        d1 | y0 n1 -> y1 n1
        d2 | y0 n1 -> y0 n2
      */
      // const a = (hash1 ^ 3n) & 15n;
      // const b = (hash1 ^ 2n) & 15n;
      // const c1 = (hash2 ^ 3n) & 15n;
      // const c2 = (hash3 ^ 2n) & 15n;
      // const d1 = (hash2 ^ 3n) & 15n;
      // const d2 = (hash3 ^ 2n) & 15n;

      
      // const aa = (hash4 ^ 3n) & 15n;

      const a = ((hash1) | 3n) & 127n;
      const b = ((hash1) | 2n) & 127n;
      const c1 = ((hash2) | 3n) & 127n;
      const c2 = ((hash2) | 2n) & 127n;
      const d1 = ((hash3) | 3n) & 127n;
      const d2 = ((hash3) | 2n) & 127n;

      const aa = ((hash4) | 3n) & 127n;
      
      const aa2 = ((hash4) | 2n) & 127n;

      // console.log(`i: ${i}, a: ${a}, b: ${b}, c1: ${c1}, c2: ${c2}, d1: ${d1}, d2: ${d2}, aa: ${aa}`);

      console.log(`i: ${i}, a: ${a}, b: ${b}, c1: ${c1}, c2: ${c2}, d1: ${d1}, d2: ${d2}, aa: ${aa}, aa2: ${aa2}`);
      
      if (c1 !== d1) continue;
      if (c2 !== d2) continue;
      if (a == b) continue;
      if (a == c1) continue;
      if (b == c1) continue;
      if (a == c2) continue;
      if (b == c2) continue;
      // const sum = a + b + c1 + c2;
      // if (sum != 6n) continue;
      if (c1 == c2) continue;
      // console.log(`${cell1.toBoc().toString('hex')}`);
      // console.log(`${cell2.toBoc().toString('hex')}`);
      // console.log(`${cell3.toBoc().toString('hex')}`);
      // console.log(`${cell4.toBoc().toString('hex')}`);
    }

    // console.log(BigInt('0x' + beginCell().storeUint(0, 8).storeUint(1, 8).endCell().hash().toString('hex')))
    // console.log(Cell.fromHex('b5ee9c7241010101002a00004fb40529400000400ca6e321c7cce9ecedf0a8ca2492ec8592494aa5fb5ce0387dff96ef6af982a3e8847ed2b1').beginParse().remainingBits)
        return;
    console.log(beginCell().storeAddress(Address.parse('UQDKbjIcfM6ezt8KjKJJLshZJJSqX7XOA4ff-W72r5gqPuwA')).endCell().beginParse())
    const dict = Dictionary.empty(Dictionary.Keys.Address(), Dictionary.Values.Cell());
    dict.set(Address.parse('UQDKbjIcfM6ezt8KjKJJLshZJJSqX7XOA4ff-W72r5gqPuwA'), beginCell().endCell());
    console.log(beginCell().storeDictDirect(dict).endCell().toBoc().toString('hex'));
    console.log(beginCell().storeUint(0, 256).storeUint(0, 256).storeUint(0, 256).storeUint(0, 255).endCell().toBoc().toString('hex'))
    // const slice = Cell.fromBase64('te6cckEBAQEAJAAAQ4AbML34RygUbXp4sevlTlZj0VfEs33fXGxGXxjICkHNCBBaI2eu').beginParse()
    // console.log(slice.loadAddress())
    
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main().finally(() => console.log("Exiting..."));