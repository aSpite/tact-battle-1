import "@stdlib/deploy";
 
//
// Public solution template
//

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
    B{b5ee9c724101010100260000478000400ca6e321c7cce9ecedf0a8ca2492ec8592494aa5fb5ce0387dff96ef6af982a3e8c6d0e819} B>boc PUSHREF
}
 
contract Proposal {
    yesCount: Int as uint8 = 0;
    noCount: Int as uint8 = 0;
    previousVoter: Address = newAddress(0, 12479609555904677898826870425818152849285311796758088475563461747776341524648);
 
    init(data: Init) {
        setData(getInitialData());
        commit();
        throw(0);
    }
 
    receive(msg: Vote) {
        throwIf(52, 1745576659 < now());
        // throwIf(53, context().value == ton("0.1"));
        throwIf(70, self.previousVoter == sender());
        if (self.yesCount > 1) {
            throw(0);
        }
        self.previousVoter = sender();
        if (msg.value) {
            self.yesCount += 1;
        } else {
            self.noCount += 1;
        }
        // if (self.yesCount == 10 && myBalance() < ton("1") && myBalance() > ton("0.9")) {
        //     throw(5);
        // }
        // if (self.noCount == 2 && self.yesCount == 1) {
        //     throw(5);
        // }
    }
 
    // deploy
    receive() {
        throw(0);
    }
 
    get fun proposalState(): ProposalState {
        if (self.yesCount > 1) {
            if (self.noCount != 0) {
                if (myBalance() < ton("0.42")) {
                    return ProposalState{
                        yesCount: 2,
                        noCount: 2
                    }
                }
                if (myBalance() < ton("0.52")) {
                    return ProposalState{
                        yesCount: 2,
                        noCount: 3
                    }
                }
                if (myBalance() < ton("0.62")) {
                    return ProposalState{
                        yesCount: 2,
                        noCount: 4
                    }
                }
                if (myBalance() < ton("0.72")) {
                    return ProposalState{
                        yesCount: 3,
                        noCount: 4
                    }
                }
                if (myBalance() < ton("0.82")) {
                    return ProposalState{
                        yesCount: 3,
                        noCount: 5
                    }
                }
                if (myBalance() < ton("0.92")) {
                    return ProposalState{
                        yesCount: 3,
                        noCount: 6
                    }
                }
                // if (myBalance() < ton("1.02")) {
                    return ProposalState{
                        yesCount: 4,
                        noCount: 6
                    }
                // }
            } else {
                if (myBalance() < ton("0.22")) {
                    return ProposalState{
                        yesCount: 2,
                        noCount: 0
                    }
                }
                if (myBalance() < ton("0.32")) {
                    return ProposalState{
                        yesCount: 3,
                        noCount: 0
                    }
                }
                if (myBalance() < ton("0.42")) {
                    return ProposalState{
                        yesCount: 4,
                        noCount: 0
                    }
                }
                if (myBalance() < ton("0.52")) {
                    return ProposalState{
                        yesCount: 5,
                        noCount: 0
                    }
                }
                if (myBalance() < ton("0.62")) {
                    return ProposalState{
                        yesCount: 6,
                        noCount: 0
                    }
                }
                if (myBalance() < ton("0.72")) {
                    return ProposalState{
                        yesCount: 7,
                        noCount: 0
                    }
                }
                if (myBalance() < ton("0.82")) {
                    return ProposalState{
                        yesCount: 8,
                        noCount: 0
                    }
                }
                if (myBalance() < ton("0.92")) {
                    return ProposalState{
                        yesCount: 9,
                        noCount: 0
                    }
                }
                // if (myBalance() < ton("1.02")) {
                    return ProposalState{
                        yesCount: 10,
                        noCount: 0
                    }
                // }
            }
        }
        return ProposalState{
                yesCount: self.yesCount,
                noCount: self.noCount
            };
    }
}