import "@stdlib/deploy";
 
//
// Public solution template
//

asm fun test() {
    NOP
    """;

() hack_tact() impure asm """
        B{b5ee9c724101160100fc00010688ed55010208ad4de08e1202032ce302f82cc201f27388ed55d72c200000000edc88ed55030511011882013962f4a413f4bcf2c80b04000ba64e589c08200208ad4de08e12060336e30201d0d7281b40098030d72c200000000e8e8388ed55e088ed5507090d011882013962f4a413f4bcf2c80b08000ba64e589c5c200208ad4de08e120a0104e3020b011882013962f4a413f4bcf2c80b0c0027a64e58be09dbc42084017d78402a415ead821c200208ad4de08e120e0104e3020f011882013962f4a413f4bcf2c80b10000ba64e589d1da00208ad4de08e121300000106e302cc14011882013962f4a413f4bcf2c80b15000ba64e589c1c60ee4a9a9c} B>boc
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

contract Proposal {
    yesCount: Int as uint8 = 0;
    noCount: Int as uint8 = 0;
    // previousVoter: Address = newAddress(0, 12479609555904677898826870425818152849285311796758088475563461747776341524648);
 
    init(data: Init) {
        test();
        test2();
    }
 
    receive(msg: Vote) {
        throw(0);
        // thr  owIf(52,            1745506422 < now());
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