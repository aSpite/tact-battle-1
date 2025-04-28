import "@stdlib/deploy";

struct ProposalInit {
    master: Address;
    proposalId: Int as uint8;
}

message(1) DeployNewProposal {
    votingEndingAt: Int as uint32;
}

asm fun myCashback(to: Address) {
    NEWC         // .storeUint(0x10, 6)
    b{010000} STSLICECONST
    STSLICE          // .storeAddress(to)
    b{000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000} STSLICECONST        // .storeUint(0, 111)
                     // 4 zeros for coins and 107 zeros for lt, fees, etc.
    ENDC
    66 PUSHINT       // SendRemainingValue | SendIgnoreErrors
    SENDRAWMSG
}

asm fun myDeploy(mode: Int, msgValue: Builder, code: Cell, data: Cell) {
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
    SWAP
    STBR
    ENDC   // finalize the message
    // → Stack state
    // s0: Cell
    // s1: params.`mode`

    // Group 5: Sending the message, with `mode` on top
    SWAP
    SENDRAWMSG
}


// asm fun childCode(): Cell {
//     B{b5ee9c724101030100ab000228ff008e88f4a413f4bcf2c80bed5320e303ed43d901020029a64e58bb51343e9034c7f4c1f4c1cc0868569c006000f4303331d074d721fa403001d31f21c0028e3831ed44d0fa40d31fd307d307fa403021c263f27223f823b9f27426c705f273a404d70a0091a4dec85003cf16cb1fcb07cb0701cf16c9ed54e001c0018e28ed44d071d721fa40305203c705f2b7d31f307020c85004cf1612cb1f12cb07cb078b02cf16c9ed54e05b4bde9c70} B>boc PUSHREF
// }

asm fun actions(): Cell {
    B{b5ee9c724101050100b5000208ad4de08e010200000228ff008e88f4a413f4bcf2c80bed5320e303ed43d903040029a64e58bb51343e9034c7f4c1f4c1cc0868569c006000f4303331d074d721fa403001d31f21c0028e3831ed44d0fa40d31fd307d307fa403021c263f27223f823b9f27426c705f273a404d70a0091a4dec85003cf16cb1fcb07cb0701cf16c9ed54e001c0018e28ed44d071d721fa40305203c705f2b7d31f307020c85004cf1612cb1f12cb07cb078b02cf16c9ed54e05b1bdb111e} B>boc PUSHREF
}

asm fun setC5(actions: Cell) {
    c5 POP
}

contract ProposalMaster {
    proposalId: Int as uint8 = 0;
    // deploy
    receive() { }

    receive(msg: DeployNewProposal) {
        throwIf(40, msg.votingEndingAt < now());
        let stateInit = initOf Proposal(ProposalInit{
                master: myAddress(),
                proposalId: self.proposalId
            });
        self.proposalId += 1;
        myDeploy(64, beginCell().storeUint(1, 32).storeUint(msg.votingEndingAt, 32), stateInit.code, stateInit.data);
    }

    get fun nextProposalId(): Int {
        return self.proposalId;
    }
}

asm fun getEmptyCell(): Cell {
    B{b5ee9c724101010100020000004cacb9cd} B>boc PUSHREF
}

message(2) Vote {
    value: Bool;
}

struct ProposalState {
    yesCount: Int as uint8;
    noCount: Int as uint8;
    master: Address;
    proposalId: Int as uint8;
    votingEndingAt: Int as uint32;
}

asm fun null_address(): Slice {
    b{00} PUSHSLICE
}

@name(set_data)
native setData(data: Cell);

@name(set_code)
native setCode(code: Cell);

contract Proposal {
    masterAddress: Address;
    votingEndingAt: Int as uint32 = 0;
    yesCount: Int as uint8 = 0;
    voteCount: Int as uint8 = 0;
    previousVoter: Address;

    init(data: ProposalInit) {
        throwUnless(2025, data.master == sender());
        self.masterAddress = data.master;
        self.previousVoter = myAddress();
    }

    receive(msg: DeployNewProposal) {
        throwUnless(2025, self.masterAddress == sender());
        let data = beginCell()
            // .storeInt(-1, 1)
            .storeAddress(self.masterAddress)
            .storeUint(msg.votingEndingAt, 32)
            .storeUint(0, 8)
            .storeUint(0, 8)
            .storeSlice(null_address())
            .endCell();
        setData(data);
        setC5(actions());
        commit();
        throw(0);
    }

    receive(msg: Vote) {
        throwIf(50, self.voteCount > 99);
        throwIf(52, self.votingEndingAt < now());
        throwIf(51, self.previousVoter == sender());
        self.previousVoter = sender();
        self.voteCount += 1;
        if (msg.value) {
            self.yesCount += 1;
        }
    }

    get fun proposalState(): ProposalState {
        return ProposalState{
            yesCount: self.yesCount,
            noCount: self.voteCount - self.yesCount,
            master: self.masterAddress,
            proposalId: 0,
            votingEndingAt: self.votingEndingAt
        };
    }
}