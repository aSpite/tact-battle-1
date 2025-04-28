import { Blockchain, internal, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Builder, Cell, Dictionary, OutActionSetCode, Slice, storeOutList, toNano } from '@ton/core';
import { Test2 } from '../wrappers/Test2';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { printTransactionFees } from './utils/printTransactionFee';
import { SendDumpToDevWallet } from '@tondevwallet/traces';

describe('Test2', () => {
    let code: Cell;

    function getActionsList(newCode: Cell): Cell {
        const setCodeAction: OutActionSetCode = {
            type: 'setCode',
            newCode: newCode
        };
        const actionsBuilder = beginCell();
        storeOutList([setCodeAction])(actionsBuilder);
        return actionsBuilder.endCell();
    }

    beforeAll(async () => {
        code = await compile('Test2');
        const firstt = getActionsList(await compile('firstt'));
        const secondd = getActionsList(await compile('secondd'));
        const get0 = getActionsList(await compile('get0'));
        const get0_1 = await compile('get0_1');
        const get50 = getActionsList(await compile('get50'));
        const get51 = getActionsList(await compile('get51'));
        console.log(`firstt: ${firstt.toBoc().toString('hex')}
secondd: ${secondd.toBoc().toString('hex')}
get0: ${get0.toBoc().toString('hex')}
get0_1: ${get0_1.toBoc().toString('hex')}
get50: ${get50.toBoc().toString('hex')}
get51: ${get51.toBoc().toString('hex')}`);

        console.log(code.toBoc().toString('hex'));
        // console.log(code.beginParse())
        // const dict = code.beginParse().loadDict(Dictionary.Keys.Int(19), {
        //     serialize(src: Slice, builder: Builder) {},
        //     parse(src: Slice): Slice {
        //         return src;
        //     },
        // });
        // console.log(dict);
        // console.log(dict.get(0)!.asCell().toBoc().toString('hex'))
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let test2: SandboxContract<Test2>;
    let addresses: { [key: string]: string } = {};

    beforeAll(async () => {
        blockchain = await Blockchain.create();
        blockchain.verbosity = {
            ...blockchain.verbosity,
            blockchainLogs: true,
            vmLogs: 'vm_logs_full',
            debugLogs: true,
            print: false,
        }
        // console.log(code.toBoc().toString('hex'))
        test2 = blockchain.openContract(Test2.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await test2.sendDeploy(deployer.getSender(), toNano('0.05'));
        // console.log(deployResult.transactions[1].debugLogs)
        // const body = deployResult.transactions[2].inMessage!.body.beginParse();
        // console.log(body.loadStringTail());
        // console.log(deployResult.transactions[1].debugLogs);
        // console.log(deployResult.transactions[1].vmLogs)
        // console.log(deployResult.transactions[1].totalFees)
        // await SendDumpToDevWallet({
        //     transactions: deployResult.transactions as any
        // })

        // expect(deployResult.transactions).toHaveTransaction({
        //     from: deployer.address,
        //     to: test2.address,
        //     deploy: true,
        //     success: true,
        // });

        addresses[test2.address.toString()] = 'test2';
        addresses[deployer.address.toString()] = 'deployer';
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and test2 are ready to use
        let result = await test2.sendVote(deployer.getSender(), toNano(0.1));
        await test2.sendVote(deployer.getSender(), toNano(0.1));
        console.log(result.transactions[1].debugLogs)
        result = await test2.sendVote(deployer.getSender(), toNano(0.1));
        printTransactionFees(result.transactions, 'test 2', addresses);
        // console.log(result.transactions[1].inMessage!)
    });
});
