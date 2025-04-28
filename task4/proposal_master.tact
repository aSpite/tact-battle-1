import "@stdlib/deploy";

struct ProposalInit {
    master: Address;
    proposalId: Int as uint8;
}

message(1) DeployNewProposal {
    votingEndingAt: Int as uint32;
}

message(2) DeployNewProposalChild {
    votingEndingAt: Int as uint32;
    initiator: Address;
}

asm fun myCashback(to: Address) {
    NEWC
    x{42_} STSLICECONST            // .storeUint(0x10, 6)
    STSLICE          // .storeAddress(to)
    0 PUSHINT        // 0
    111 STUR         // .storeUint(0, 111)
                     // 4 zeros for coins and 107 zeros for lt, fees, etc.
    ENDC
    64 PUSHINT       // SendRemainingValue | SendIgnoreErrors
    SENDRAWMSG
}

asm fun myMessage(mode: Int, to: Address) {
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
    ENDC
    SWAP
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

contract ProposalMaster {
    proposalId: Int as uint8 = 0;
    // deploy
    receive() {
        if (myBalance() > ton("0.1")) {  
            nativeReserve(ton("0.1"), 0);
            message(MessageParameters{
                body: null,
                value: 0,
                to: sender(),
                mode: SendRemainingBalance | SendIgnoreErrors,
                bounce: true,
            });
            // myMessage(130, sender());
        }
     }

    receive(msg: DeployNewProposal) {
        throwIf(43, msg.votingEndingAt < now());
        let stateInit = initOf Proposal(ProposalInit{
                master: myAddress(),
                proposalId: self.proposalId
            });
        myDeploy(64, beginCell().storeUint(2, 32).storeUint(msg.votingEndingAt, 32).storeAddress(sender()), stateInit.code, stateInit.data);
        self.proposalId += 1;
    }

    get fun nextProposalId(): Int {
        return self.proposalId;
    }
}

message(3) Vote {
    value: Bool;
}

struct ProposalState {
    yesCount: Int as uint8;
    noCount: Int as uint8;
    master: Address;
    proposalId: Int as uint8;
    votingEndingAt: Int as uint32;
}

asm fun toInt(bool: Bool): Int {}

asm fun getEmptyCell(): Cell {
    B{b5ee9c724101010100020000004cacb9cd} B>boc PUSHREF
}

contract Proposal {
    masterAddress: Address;
    votingEndingAt: Int as uint32 = 0;
    yesCount: Int as uint8 = 0;
    voteCount: Int as uint8 = 0;
    previousVoter: Address;

    init(data: ProposalInit) {
        self.masterAddress = data.master;
        throwUnless(2025, self.masterAddress == sender());
        self.previousVoter = myAddress();
    }

    receive(msg: DeployNewProposalChild) {
        throwUnless(2025, self.masterAddress == sender());
        throwIf(44, msg.votingEndingAt < now());
        self.votingEndingAt = msg.votingEndingAt;
        myCashback(msg.initiator);
    }

    receive(msg: Vote) {
        throwIf(50, self.voteCount > 99);
        throwIf(52, self.votingEndingAt < now());
        throwIf(51, self.previousVoter == sender());
        self.previousVoter = sender();
        myCashback(sender());
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