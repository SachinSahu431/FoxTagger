import {
  OnRpcRequestHandler,
  OnTransactionHandler,
  OnCronjobHandler,
} from '@metamask/snap-types';
import { checkLimits, getSummary, updateAmount } from './cron';
import { getDetails } from './transaction';
import {
  SUMMARY_HEADER,
  SUMMARY_EXCEEDED,
  SUMMARY_EXCEEDED_FOOTER,
  SUMMARY_FOOTER,
  SUMMARY_SAFE_FOOTER,
} from './utils/constants';
import {
  compact,
  getPersistentStorage,
  setPersistentStorage,
} from './utils/functions';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.request - A validated JSON-RPC request object.
 * @returns `null` if the request succeeded.
 * @throws If the request method is not valid for this snap.
 * @throws If the `snap_confirm` call failed.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  switch (request.method) {
    case 'notify':
      // for debugging
      return await wallet.request({
        method: 'snap_notify',
        params: [
          {
            type: 'inApp',
            message: `He\nllo,\r\nwo<br />rld!`,
          },
        ],
      });
    case 'getPersistentStorage':
      return await getPersistentStorage();
    case 'setPersistentStorage':
      await setPersistentStorage(
        request.params as void | Record<string, unknown>,
      );
      return null;
    case 'clearPersistentStorage':
      await wallet.request({
        method: 'snap_manageState',
        params: ['clear'],
      });
      return null;

    default:
      throw new Error('Method not found.');
  }
};

export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  const insights = await getDetails(transaction);

  return {
    insights,
  };
};

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  switch (request.method) {
    case 'walletSummary': {
      const completeStorage = (await getPersistentStorage()) as any;

      if (!completeStorage) {
        return;
      }

      const accounts: string[] = [];

      for (const account in completeStorage) {
        if (Object.prototype.hasOwnProperty.call(completeStorage, account)) {
          if (account.startsWith('0x')) {
            accounts.push(account);
          }
        }
      }

      let message = null;
      let exceededAccounts = '';
      if (accounts.length > 0) {
        message = SUMMARY_HEADER;
      }

      for (const account of accounts) {
        const exceeded = await getSummary(account, completeStorage);

        if (exceeded) {
          exceededAccounts += `${compact(account)}, `;
        }
      }

      if (exceededAccounts.length > 0) {
        message +=
          SUMMARY_EXCEEDED + exceededAccounts + SUMMARY_EXCEEDED_FOOTER;
      } else {
        message += SUMMARY_SAFE_FOOTER;
      }
      message += SUMMARY_FOOTER;

      await wallet.request({
        method: 'snap_notify',
        params: [
          {
            type: 'inApp',
            message,
          },
        ],
      });

      return;
    }

    case 'checkLimits': {
      const completeStorage = (await getPersistentStorage()) as any;

      if (!completeStorage) {
        return;
      }

      const accounts: string[] = [];

      for (const account in completeStorage) {
        if (Object.prototype.hasOwnProperty.call(completeStorage, account)) {
          if (account.startsWith('0x')) {
            accounts.push(account);
          }
        }
      }

      for (const account of accounts) {
        const message = await checkLimits(account, completeStorage);
        if (message !== null && message !== undefined) {
          await wallet.request({
            method: 'snap_notify',
            params: [
              {
                type: 'inApp',
                message,
              },
            ],
          });
        }
      }
      return;
    }

    case 'updateAmount': {
      let completeStorage = (await getPersistentStorage()) as any;

      if (!completeStorage) {
        return;
      }

      const accounts: string[] = [];

      for (const account in completeStorage) {
        if (Object.prototype.hasOwnProperty.call(completeStorage, account)) {
          if (account.startsWith('0x')) {
            accounts.push(account);
          }
        }
      }

      for (const account of accounts) {
        const tempStorage = await updateAmount(account, completeStorage);
        if (tempStorage !== undefined && tempStorage !== null) {
          completeStorage = tempStorage;
        }
      }

      await setPersistentStorage(completeStorage);
      return;
    }

    default:
      throw new Error('Method not found.');
  }
};
