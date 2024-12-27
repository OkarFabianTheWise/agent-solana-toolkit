import {
    createWallet,
    createToken,
    createNFT,
    transferSol,
    transferToken,
    swapToken,
} from './handlers'; // Import the handler functions
import { Keypair, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';

/**
 * Analyzes the response from the AI and invokes the appropriate blockchain function.
 * @param aiResponse - The response text from the AI.
 */
export async function analyzeResponse(aiResponse: string): Promise<string> {
    try {
        const responseLower = aiResponse.toLowerCase();

        if (responseLower.includes('create') && responseLower.includes('wallet')) {
            const wallet = await createWallet();
            // Convert the secret key (private key) to a base64 or hex string for export
            // const secretKeyBase64 = Buffer.from(wallet.secretKey).toString('base64');
            const secretKeyHex = Buffer.from(wallet.secretKey).toString('hex');

            return `New wallet created successfully.\n\n **Private key:** ${secretKeyHex} \n **Public key:** ${wallet.publicKey.toBase58()}`;
        } else if (responseLower.includes('create') && responseLower.includes('token')) {
            const payer = Keypair.generate(); // Replace with actual payer logic
            const mintAuthority = payer.publicKey;
            const freezeAuthority = null; // Adjust based on requirements
            const decimals = 6; // Replace with the appropriate decimal value
            const token = await createToken(payer, mintAuthority, freezeAuthority, decimals);
            return `New token created successfully. Token mint: ${token.toBase58()}`;
        } else if (responseLower.includes('create') && responseLower.includes('nft')) {
            const payer = Keypair.generate(); // Replace with actual payer logic
            const mintAuthority = payer.publicKey;
            const nft = await createNFT(payer, mintAuthority, null);
            return `New NFT created successfully. NFT mint: ${nft.toBase58()}`;
        } else if (responseLower.includes('transfer sol')) {
            const from = Keypair.generate(); // Replace with the actual sender wallet
            const to = new PublicKey('TO_PUBLIC_KEY_HERE'); // Replace with the user's provided destination address
            const amount = 0.1; // Replace with the parsed amount
            const signature = await transferSol(from, to, amount);
            return `Transfer successful. Transaction signature: ${signature}`;
        } else if (responseLower.includes('transfer token')) {
            const from = Keypair.generate(); // Replace with the actual sender wallet
            const to = new PublicKey('TO_PUBLIC_KEY_HERE'); // Replace with the user's provided destination address
            const tokenMint = new PublicKey('TOKEN_MINT_HERE'); // Replace with the actual token mint
            const amount = 10; // Replace with the parsed amount
            const signature = await transferToken(from, to, tokenMint, amount);
            return `Token transfer successful. Transaction signature: ${signature}`;
        } else if (responseLower.includes('swap token')) {
            const from = Keypair.generate(); // Replace with the actual user's wallet
            const inputToken = new PublicKey('INPUT_TOKEN_MINT_HERE'); // Replace with actual input token mint
            const outputToken = new PublicKey('OUTPUT_TOKEN_MINT_HERE'); // Replace with actual output token mint
            const amount = 100; // Replace with the parsed amount in the smallest unit
            const txid = await swapToken(from, inputToken, outputToken, amount);
            return `Token swap successful. Transaction ID: ${txid}`;
        } else {
            return "Sorry, I couldn't determine the requested operation.";
        }
    } catch (error: any) {
        console.error("Error analyzing response:", error);
        return `An error occurred while processing the request: ${error.message}`;
    }
}
