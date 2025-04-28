import { Blockchain, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { fromNano, toNano } from '@ton/core';
import { Proposal } from '../wrappers/Proposal';
import '@ton/test-utils';
import { SendDumpToDevWallet } from '@tondevwallet/traces';

describe('Proposal', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let proposal: SandboxContract<Proposal>;
    let proposal2: SandboxContract<Proposal>;
    let voter: SandboxContract<TreasuryContract>;
    let voter2: SandboxContract<TreasuryContract>;

    let sended = false;

    let dump = false

    beforeEach(async () => {
        console.log(BigInt(Math.floor(Date.now() / 1000)) + 30n)
        blockchain = await Blockchain.create();
        blockchain.verbosity = {
            ...blockchain.verbosity,
            blockchainLogs: true,
            vmLogs: 'vm_logs_full',
            debugLogs: true,
            print: false,
        }
        blockchain.now = Math.floor(Date.now() / 1000);

        // create contract from init()
        proposal = blockchain.openContract(
            await Proposal.fromInit({
                $$type: 'Init',
                proposalId: 0n,
                votingEndingAt: BigInt(Math.floor(Date.now() / 1000)) + 24n * 60n * 60n,
            }),
        );
        proposal2 = blockchain.openContract(
            await Proposal.fromInit({
                $$type: 'Init',
                proposalId: 1n,
                votingEndingAt: BigInt(Math.floor(Date.now() / 1000)) + 24n * 60n * 60n,
            }),
        );

        voter = await blockchain.treasury('voter');
        voter2 = await blockchain.treasury('voter2');

        // deploy contract
        deployer = await blockchain.treasury('deployer');
        let result = await proposal.send(
            deployer.getSender(),
            {
                value: toNano('0.01'),
            },
            null, // empty message, handled by `receive()` without parameters
        );
        // console.log(result.transactions[1].vmLogs)
        // console.log(result.transactions[1].vmLogs)
        // expect(result.transactions).toHaveTransaction({
        //     to: proposal.address,
        //     deploy: true,
        //     success: true,
        // });
        // expect(await proposal.getProposalState()).toMatchObject({ yesCount: 0n, noCount: 0n });

        if (!sended && dump) {
            await SendDumpToDevWallet({
                transactions: result.transactions as any
            });
            sended = true;
        }
        // result = await proposal2.send(
        //     deployer.getSender(),
        //     {
        //         value: toNano('0.01'),
        //     },
        //     null, // empty message, handled by `receive()` without parameters
        // );
        // expect(result.transactions).toHaveTransaction({
        //     to: proposal2.address,
        //     deploy: true,
        //     success: true,
        // });
        // expect(await proposal2.getProposalState()).toMatchObject({ yesCount: 0n, noCount: 0n });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and proposal are ready to use
    });

    it('hack', async () => {
        let j = 0;
        let k = 0;
        let result;
         for (let i = 1; i <= 5; i++) {
             voter = await blockchain.treasury('voter' + i + 1);
             result = await proposal.send(
                 voter.getSender(),
                 { value: toNano('0.1') },
                 {
                     $$type: 'Vote',
                     value: false,
                 },
             );
             // if (i == 1 && dump) {
             //     await SendDumpToDevWallet({
             //            transactions: result.transactions as any
             //     });
             // }
             let balance = (await blockchain.getContract(proposal.address)).balance;
             voter = await blockchain.treasury('voter' + i + 2);
             j++;
             console.log(`n: ${j}, y: ${k}`, fromNano(balance));
             result = await proposal.send(
                    voter.getSender(),
                    { value: toNano('0.1') },
                    {
                        $$type: 'Vote',
                        value: true,
                    },
                );
                k++;
                balance = (await blockchain.getContract(proposal.address)).balance;
                console.log(`n: ${j}, y: ${k}`, fromNano(balance));
         }
         // if (dump) {
         //     await SendDumpToDevWallet({
         //         transactions: result!.transactions as any
         //     });
         // }
    });

    it('hack2', async () => {
        let result;
        for (let i = 0; i <= 9; i++) {
            voter = await blockchain.treasury('voter' + i);
            result = await proposal.send(
                voter.getSender(),
                { value: toNano('0.1') },
                {
                    $$type: 'Vote',
                    value: true,
                },
            );
            if ((i == 0) && dump) {
                await SendDumpToDevWallet({
                    transactions: result.transactions as any
                });
            }
            printTransactionFees(result.transactions)
            // console.log(result.transactions[1].vmLogs)
            expect(result.transactions).toHaveTransaction({
                to: proposal.address,
                success: true
            });
            const state = await proposal.getProposalState();
            console.log(state)
            expect(state.yesCount).toStrictEqual(BigInt(i+1));
            let balance = (await blockchain.getContract(proposal.address)).balance;
            console.log(`n: 0, y: ${i}`, fromNano(balance));
        }

        try {
            const getResult = await blockchain.runGetMethod(proposal.address, 'proposalState');
            console.log(getResult);
        } catch (e) {
            console.log(e);
        }
        // if (dump) {
        //     await SendDumpToDevWallet({
        //         transactions: result!.transactions as any
        //     });
        // }
    });

    it('firstt', async () => {
        let result = await proposal.send(
            voter.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Vote',
                value: true,
            },
        );

        result = await proposal.send(
            voter2.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Vote',
                value: false,
            },
        )

        if (dump) {
            // await SendDumpToDevWallet({
            //     transactions: result.transactions as any
            // });
        }
    });



    it('voter 1', async () => {
        // vote
        const initialBalance = (await blockchain.getContract(proposal.address)).balance;
        let result = await proposal.send(
            voter.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Vote',
                value: true,
            },
        );

        // console.log(result.transactions[1].inMessage!)
        const balanceAfter = (await blockchain.getContract(proposal.address)).balance;
        console.log(fromNano(balanceAfter - initialBalance), fromNano(initialBalance), fromNano(balanceAfter));
        // console.log(result.transactions[1].vmLogs)
        expect(result.transactions).toHaveTransaction({
            to: proposal.address,
            success: true
        });
        printTransactionFees(result.transactions)
        result = await proposal.send(
            voter.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Vote',
                value: true,
            },
        );


        result = await proposal.send(
            voter2.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Vote',
                value: true,
            },
        );


        // await SendDumpToDevWallet({
        //     transactions: result.transactions as any
        // });
        // console.log(result.transactions[2].vmLogs)

        console.log(result.transactions[1].vmLogs)
        // console.log(result.transactions[1].inMessage!)
        expect(await proposal.getProposalState()).toMatchObject({ yesCount: 1n, noCount: 0n });
    });

    it ('voter 2', async () => {
        let result = await proposal.send(
            voter2.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Vote',
                value: false,
            },
        );
        console.log(result.transactions[1])
        await proposal.send(
            voter2.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Vote',
                value: false,
            },
        );
        expect(await proposal.getProposalState()).toMatchObject({ yesCount: 0n, noCount: 1n });
    });

    it ('proposal 2', async () => {
        let result = await proposal2.send(
            voter.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Vote',
                value: true,
            },
        );
        expect(result.transactions).toHaveTransaction({
            to: proposal2.address,
            success: true
        });
        result = await proposal2.send(
            voter.getSender(),
            { value: toNano('0.1') },
            {
                $$type: 'Vote',
                value: true,
            },
        );

        expect(await proposal2.getProposalState()).toMatchObject({ yesCount: 1n, noCount: 0n });
    })

    it('test', async () => {
        blockchain.now! += 24 * 60 * 60;
        const result = await proposal.send(
            deployer.getSender(),
            {
                value: toNano('0.01'),
            },
            {
                $$type: 'Vote',
                value: true,
            },
        );

        console.log(result.transactions[1])
    });

    it ('test2', async () => {
        let result = await proposal.send(
            deployer.getSender(),
            {
                value: toNano('0.01'),
            },
            {
                $$type: 'Vote',
                value: false,
            },
        )
        result = await proposal.send(
            voter.getSender(),
            {
                value: toNano('0.01'),
            },
            {
                $$type: 'Vote',
                value: false,
            },
        );

        console.log(result.transactions[1].vmLogs)
        const getResult = await blockchain.runGetMethod(proposal.address, 'proposalState');
        console.log(getResult.vmLogs);
    });

    it('accept after fail', async () => {
        // blockchain.now! += 24 * 60 * 60;
        let result = await proposal.send(
            deployer.getSender(),
            {
                value: toNano('0.01'),
            },
            {
                $$type: 'Vote',
                value: true,
            },
        )
        await SendDumpToDevWallet({
            transactions: result.transactions as any
        })
        expect(await proposal.getProposalState()).toMatchObject({ yesCount: 1n, noCount: 0n });
        // blockchain.now! -= 16 * 60 * 60;
        result = await proposal.send(
            voter.getSender(),
            {
                value: toNano('0.01'),
            },
            {
                $$type: 'Vote',
                value: true,
            },
        )
        await SendDumpToDevWallet({
            transactions: result.transactions as any
        });

    });
});
