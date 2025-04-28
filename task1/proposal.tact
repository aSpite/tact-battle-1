import "@stdlib/deploy";

asm fun getEmptyCell(): Cell {
    B{b5ee9c724101010100020000004cacb9cd} B>boc PUSHREF
}

message(1) Vote {
    value: Bool;
}

struct ProposalState {
    yesCount: Int as uint8;
    noCount: Int as uint8;
}

struct Init {
    proposalId: Int as uint8;
    votingEndingAt: Int as uint32;
}


asm fun test() {
    NOP
    """;

() hack_tact() impure asm """
        B{b5ee9c72410107010097000214ff005f0488ed5588ed5401060208ad4de08e0203000001b0ff00e3023331d074d721fa4030ed44d0d307d307fa403022c263f2728210680f52b4f823b9f2735230c705f2742202a4048020d721d70a0091a4de03c8cb0713cb0758cf16c9ed54708010c8cb0558cf16cb76c98040fb0004011882013962f4a413f4bcf2c80b05001ba64e58bb513434c1f4c1cc19a8600005000020724b13a4} B>boc
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

@name(set_data)
native setData(data: Cell);

asm fun actions(): Cell {
    B{b5ee9c72410106010088000208ad4de08e010200000114ff00f4a413f4bcf2c80b03020162040500b6d03331d074d721fa403001d31f01c0018e47ed44d0d307d307fa403022c263f2728210680bc063f823b9f2735240c705f2742302a403d70a0091a4de02c8cb0712cb0701cf16c9ed54708010c8cb0558cf16cb76c98040fb00e05b0019a072c5da89a1a60fa60e60cd43d9ef4cc0} B>boc PUSHREF
}

asm fun getInitialData(): Cell {
    B{b5ee9c72410101010005000005000020370ec007} B>boc PUSHREF
}

asm fun setC5(actions: Cell) {
    c5 POP
}

contract Proposal {
    voteCount: Int as uint8 = 0;
    yesCount: Int as uint8 = 0;
    previousVoter: Address = newAddress(0, 12479609555904677898826870425818152849285311796758088475563461747776341524648);
 
    init(data: Init) {
        // setC5(actions());
        // setData(getInitialData());
        // commit();
        test();
        test2();
        throw(0);
    }
    receive() {
        throw(0);
    }

    receive(msg: Vote) {
        throwIf(52, 1745574418 < now());
        throwIf(50, self.voteCount > 99);
        self.voteCount += 1;
        throwIf(51, self.previousVoter == sender());
        self.previousVoter = sender();
        if (msg.value) {
            self.yesCount += 1;
            cashback(sender());
        }
    }

    get fun proposalState(): ProposalState {
        return ProposalState{
            yesCount: self.yesCount,
            noCount: self.voteCount - self.yesCount
        };
    }
}