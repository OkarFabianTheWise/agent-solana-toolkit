import {
    Connection,
    PublicKey,
    Keypair,
    LAMPORTS_PER_SOL,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    VersionedTransaction
} from '@solana/web3.js';

import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    transfer,
} from '@solana/spl-token';

// Connection setup - make URL configurable
const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';

// Create a new wallet
export async function createWallet(): Promise<Keypair> {
    const wallet = Keypair.generate();
    console.log('New wallet created:', wallet.publicKey.toBase58());
    return wallet;
}

// Create a token
export async function createToken(
    payer: Keypair,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null,
    decimals: number
): Promise<PublicKey> {
    try {
        const token = await createMint(
            connection,
            payer,
            mintAuthority,
            freezeAuthority,
            decimals
        );
        console.log('New token created:', token.toBase58());
        return token;
    } catch (error) {
        console.error('Error creating token:', error);
        throw error;
    }
}

// Create an NFT
export async function createNFT(
    payer: Keypair,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null
): Promise<PublicKey> {
    return await createToken(payer, mintAuthority, freezeAuthority, 0);
}

// Transfer SOL
export async function transferSol(
    from: Keypair,
    to: PublicKey,
    amount: number
): Promise<string> {
    try {
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: from.publicKey,
                toPubkey: to,
                lamports: Math.round(amount * LAMPORTS_PER_SOL), // Ensure whole lamports
            })
        );
        const signature = await sendAndConfirmTransaction(connection, transaction, [from]);
        console.log('Transfer SOL signature:', signature);
        return signature;
    } catch (error) {
        console.error('Error transferring SOL:', error);
        throw error;
    }
}

// Transfer tokens
export async function transferToken(
    from: Keypair,
    to: PublicKey,
    tokenMint: PublicKey,
    amount: number
): Promise<string> {
    try {
        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            from,
            tokenMint,
            from.publicKey
        );
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            from,
            tokenMint,
            to
        );

        const signature = await transfer(
            connection,
            from,
            fromTokenAccount.address,
            toTokenAccount.address,
            from.publicKey,
            amount // Ensure amount is in the token's smallest unit
        );
        console.log('Transfer token signature:', signature);
        return signature;
    } catch (error) {
        console.error('Error transferring token:', error);
        throw error;
    }
}

// Swap tokens
export async function swapToken(
    connection: Connection,
    wallet: Keypair,
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: number, // amount in the smallest unit (e.g., lamports for SOL or decimals for tokens)
    slippageBps: number = 50 // Slippage in basis points (0.5%)
): Promise<string> {
    try {
        // Fetch quote for the swap
        const quoteResponse = await (
            await fetch(
                `${JUPITER_QUOTE_API}?inputMint=${inputMint.toString()}&outputMint=${outputMint.toString()}&amount=${amount}&slippageBps=${slippageBps}`
            )
        ).json();

        if (!quoteResponse || !quoteResponse.data) {
            throw new Error('Failed to fetch swap quote.');
        }

        // Fetch swap transaction from Jupiter
        const { swapTransaction } = await (
            await fetch(JUPITER_SWAP_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quoteResponse: quoteResponse.data,
                    userPublicKey: wallet.publicKey.toString(),
                    wrapAndUnwrapSol: true,
                }),
            })
        ).json();

        if (!swapTransaction) {
            throw new Error('Failed to fetch swap transaction.');
        }

        // Deserialize and sign the transaction
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        transaction.sign([wallet]);

        // Get the latest block hash for confirmation
        const latestBlockHash = await connection.getLatestBlockhash();

        // Serialize and send the transaction
        const rawTransaction = transaction.serialize();
        const txid = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 2,
        });

        // Confirm the transaction
        await connection.confirmTransaction({
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: txid,
        });

        console.log(`Transaction successful: https://solscan.io/tx/${txid}`);
        return txid;
    } catch (error: any) {
        console.error('Error during Jupiter swap:', error);
        throw new Error(`Jupiter swap failed: ${error.message}`);
    }
}

