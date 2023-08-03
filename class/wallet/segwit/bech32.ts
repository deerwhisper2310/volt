import {BaseWallet} from './../base';

import {TransactionType} from './../../../types/wallet';

export class SegWitNativeWallet extends BaseWallet {
    buildTx() {
        throw new Error('Not implemented');
    }

    updatedTransaction() {
        throw new Error('Not implemented');
    }

    updateTransanctions(transactions: TransactionType[]) {
        this.transactions = transactions;
    }
}
