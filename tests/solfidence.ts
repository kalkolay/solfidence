import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Solfidence } from "../target/types/solfidence";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    MintLayout,
    createInitializeMintInstruction,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { assert } from "chai";

describe("solfidence", () => {
    // Configure the client to use the local cluster.
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.Solfidence as Program<Solfidence>;
    const user = provider.wallet;

    let userAccount: Keypair;

    it("Initializes User Account", async () => {
        userAccount = Keypair.generate();

        await program.methods
            .initialize("test_user")
            .accounts({
                userAccount: userAccount.publicKey,
                // 'user' and 'systemProgram' are inferred
            })
            .signers([userAccount])
            .rpc();

        const account = await program.account.userAccount.fetch(
            userAccount.publicKey
        );
        assert.ok(account.owner.equals(user.publicKey));
        assert.equal(account.userName, "test_user");
        assert.equal(account.reputation.toNumber(), 0);
    });

    it("Creates Reputation NFT", async () => {
        // Derive the mint authority PDA
        const [mintAuthorityPda, mintAuthorityBump] =
            await PublicKey.findProgramAddress(
                [Buffer.from("mint_authority")],
                program.programId
            );

        // Create a Keypair for the mint account
        const mintKeypair = Keypair.generate();

        // Allocate memory for the account
        const mintRent = await provider.connection.getMinimumBalanceForRentExemption(
            MintLayout.span
        );

        // Create and initialize the mint account
        const createMintTx = new anchor.web3.Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: user.publicKey,
                newAccountPubkey: mintKeypair.publicKey,
                space: MintLayout.span,
                lamports: mintRent,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(
                mintKeypair.publicKey,
                0,
                mintAuthorityPda,
                null,
                TOKEN_PROGRAM_ID
            )
        );

        // Send the transaction to create and initialize the mint
        await provider.sendAndConfirm(createMintTx, [mintKeypair]);

        // Get the associated token account address for the user
        const userTokenAccount = await getAssociatedTokenAddress(
            mintKeypair.publicKey,
            user.publicKey,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // Create the associated token account
        const createAtaTx = new anchor.web3.Transaction().add(
            createAssociatedTokenAccountInstruction(
                user.publicKey, // payer
                userTokenAccount, // associated token account
                user.publicKey, // owner
                mintKeypair.publicKey, // mint
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            )
        );

        // Send the transaction to create the associated token account
        await provider.sendAndConfirm(createAtaTx, []);

        // Call the create_reputation_nft instruction
        await program.methods
            .createReputationNft()
            .accounts({
                userAccount: userAccount.publicKey,
                // 'owner', 'systemProgram', and 'rent' are inferred
                mint: mintKeypair.publicKey,
                userTokenAccount: userTokenAccount,
                mintAuthority: mintAuthorityPda,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();

        // Fetch the token account to confirm the NFT was minted
        const tokenAccountInfo =
            await provider.connection.getTokenAccountBalance(userTokenAccount);
        assert.equal(tokenAccountInfo.value.amount, "1");
    });

    it("Updates User Reputation", async () => {
        await program.methods
            .updateReputation(new BN(10))
            .accounts({
                userAccount: userAccount.publicKey,
                // 'owner' is inferred
            })
            .rpc();

        const account = await program.account.userAccount.fetch(
            userAccount.publicKey
        );
        assert.equal(account.reputation.toNumber(), 10);
    });
});
