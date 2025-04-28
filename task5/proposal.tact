import "@stdlib/deploy";
 
//
// Public solution template
//

asm fun test() {
    NOP
    """;

() hack_tact() impure asm """
        B{b5ee9c724101070100a100022c5f04ed44d0d749c0418f0a88ed5588ed54f80ff200de01060208ad4de08e0203000001b0e30233d074d721fa4030ed44d0d307d307fa40308210680f67e6f823b9f27304820afaf080b9f2755132c705f27221c8cf8508ce70cf0b6ec98042fb00038020d721d70a009202a49301a458e2c8cb07cb0701cf16c9ed5404011882013962f4a413f4bcf2c80b050017a64e58bb513434c1f4c1cc200005000020870f569a} B>boc
        dup hashB B>X      $>B "hex" B>file
            boc>B B>base64 $>B "boc" B>file

        quit
}

asm fun test2() {
    NOP
    """;

() hack() method_id(333) {
    hack_tact();
}

() hackk() impure asm """
        NOP
}



asm fun getEmptyCell(): Cell {
    B{b5ee9c724101010100020000004cacb9cd} B>boc PUSHREF
}

asm fun getAddress(): Address {
    x{80194DC6438F99D3D9DBE151944925D90B2492954BF6B9C070FBFF2DDED5F30547D_} PUSHSLICE
}


asm fun myDeploy(mode: Int, msgValue: Bool, code: Cell, data: Cell) {
    4 1 BLKPUSH // pushes 2 copies of `init.code` and `init.data`
    HASHCU // `init.data` hash
    SWAP
    HASHCU // `init.code` hash
    SWAP2
    CDEPTH // `init.data` depth
    SWAP
    CDEPTH // `init.code` depth

    // Group 2: Calculating destination address
    // For almost identical logic and instructions,
    // see comments inside `contractHash()` function in contract.tact
    131380 INT // (2 << 16) | (1 << 8) | 0x34
    NEWC
    24 STU
    16 STU
    16 STU
    256 STU
    256 STU
    ONE HASHEXT_SHA256 // obtains hash part (account id) of the address
    // → Stack state
    // s0: destAddr(hash part)
    // s1: `init.data`
    // s2: `init.code`
    // s3 and below: `bounce`, `value`, `body`, `mode`

    // Group 3: Building a message (CommonMsgInfoRelaxed)
    ROTREV           // swaps `bounce` with destAddr(hash part)
    NEWC
    b{011} STSLICECONST // store tag = $0 and ihr_disabled = true
    // 1 STI              // store `bounce`
    s1 s2 XCHG         // swap `init.data` with `init.code`, placing code on s1
    STREF              // store `init.code`
    STREF              // store `init.data`
    // Inline StateInit:
    b{00010000000000} STSLICECONST
    // 0 + 00 + 10 + 0 + 00000000
    // 1) 0 - bounced = false
    // 2) 00 - src = addr_none
    // 3) 10 - tag of addr_std (part of dest)
    // 4) 0 - Maybe Anycast = false
    // 5) 00000000 - workchain_id (part of dest)
    //
    256 STU     // store destAddr(hash part)
    // SWAP        // Builder on top, `value` below
    // STGRAMS     // store `value`
    109 PUSHINT // 1 + 4 + 4 + 64 + 32
    STZEROES    // store currency_collection, ihr_fee, fwd_fee, created_lt and created_at

    // Group 4: Continue building a message (CommonMsgInfoRelaxed into MessageRelaxed)
    // Remaining bits of MessageRelaxed:
    b{10001100} STSLICECONST
    // 10 + 0 + 0 + 1 + 1 + 0
    // 10 - Maybe (Either StateInit ^StateInit) = true false
    // 0 - split_depth:(Maybe (## 5)) = false
    // 0 = special:(Maybe TickTock) = false
    // 1 = code:(Maybe ^Cell) = true
    // 1 = data:(Maybe ^Cell) = true
    // 0 = library:(Maybe ^Cell) = false
    //
    423322573 PUSHINT
    SWAP
    32 STU
    1 STI
    ENDC   // finalize the message
    // → Stack state
    // s0: Cell
    // s1: params.`mode`

    // Group 5: Sending the message, with `mode` on top
    SWAP
    SENDRAWMSG
}

asm fun myMessage(mode: Int, body: Builder, to: Address) {
    NEWC            // store `bounce`
    b{011000} STSLICECONST // store bounced = false and src = addr_none
    STSLICE             // store `to`
    111 PUSHINT         // 1 + 4 + 4 + 64 + 32 + 1
    STZEROES
    // → Stack state
    // s0: Builder
    // s1: `data`
    // s2: `code`
    // s3: `body`
    // s4: `mode`
    SWAP
    STBR
    ENDC
    SWAP
    SENDRAWMSG
}
 
message(1) Vote {
    value: Bool;
}
 
struct ProposalState {
    yesCount: Int as uint8;
    noCount: Int as uint8;
}
 
struct Init {
    proposalId: Int as uint32;
    votingEndingAt: Int as uint32;
}

@name(set_data)
native setData(data: Cell);

asm fun getInitialData(): Cell {
    B{b5ee9c72410101010026000047000080194dc6438f99d3d9dbe151944925d90b2492954bf6b9c070fbff2dded5f30547d0c807c453} B>boc PUSHREF
}
 
asm fun actions(): Cell {
    B{b5ee9c72410104010074000208ad4de08e0102000001b2ff008e88f4a413f4bcf2c80bed53208e44303331d074d721fa403001d31f01c0018e30ed44d0d307d307fa40308210680ba0f1f823b9f27324c705f27202d70a0091a49301a401e2c8cb07cb0701cf16c9ed54e05be1ed43d9030017a64e58bb513434c1f4c1cc208a2d7e11} B>boc PUSHREF
}
asm fun setC5(actions: Cell) {
    c5 POP
}

contract Proposal {
    yesCount: Int as uint8 = 0;
    noCount: Int as uint8 = 0;
    // previousVoter: Address = newAddress(0, 12479609555904677898826870425818152849285311796758088475563461747776341524648);
 
    init(data: Init) {
        setC5(actions());
        setData(getInitialData());
        commit();
        test();
        test2();
        throw(0);
    }
 
    receive(msg: Vote) {
        throw(0);
        // throwIf(52, 1745506422 < now());
        // throwIf(53, (self.yesCount + self.noCount) > 0 && sender() == newAddress(0, 12479609555904677898826870425818152849285311796758088475563461747776341524649));
        // // throwIf(70, self.previousVoter == sender());
        // // self.previousVoter = sender();
        // if (msg.value) {
        //     self.yesCount += 1;
        // } else {
        //     self.noCount += 1;
        // }
    }
 
    receive() {
        throw(0);
    }
 
    get fun proposalState(): ProposalState {
        return ProposalState{
                yesCount: self.yesCount,
                noCount: self.noCount
            };
    }
}