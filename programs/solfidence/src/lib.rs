use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token};
use anchor_lang::solana_program::account_info::AccountInfo;

declare_id!("3jtLP8v7HDJf7vPWRps7y8sUNgDnWy29RVMKkCtGNFbP");

#[program]
pub mod solfidence {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, user_name: String) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        user_account.owner = ctx.accounts.user.key();
        user_account.user_name = user_name;
        user_account.reputation = 0;
        Ok(())
    }

    pub fn create_reputation_nft(ctx: Context<CreateReputationNFT>) -> Result<()> {
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.mint.clone(),
            to: ctx.accounts.user_token_account.clone(),
            authority: ctx.accounts.mint_authority.clone(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();

        // Get the bump seed for mint_authority
        let mint_authority_bump = ctx.bumps.mint_authority;

        // Mint one token (NFT)
        token::mint_to(
            CpiContext::new_with_signer(
                cpi_program,
                cpi_accounts,
                &[&[
                    b"mint_authority",
                    &[mint_authority_bump],
                ]],
            ),
            1,
        )?;

        Ok(())
    }

    pub fn update_reputation(ctx: Context<UpdateReputation>, delta: i64) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        let new_reputation = (user_account.reputation as i64) + delta;
        user_account.reputation = new_reputation.max(0) as u64;
        Ok(())
    }
}

#[account]
pub struct UserAccount {
    pub owner: Pubkey,
    pub user_name: String,
    pub reputation: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32 + (4 + 32) + 8)]
    pub user_account: Account<'info, UserAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateReputationNFT<'info> {
    #[account(mut, has_one = owner)]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: This is the mint account. It's safe because we control its creation.
    #[account(mut)]
    pub mint: AccountInfo<'info>,

    /// CHECK: This is the user's token account.
    #[account(mut)]
    pub user_token_account: AccountInfo<'info>,

    /// CHECK: This is the mint authority PDA.
    #[account(
        seeds = [b"mint_authority"],
        bump,
    )]
    pub mint_authority: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(mut, has_one = owner)]
    pub user_account: Account<'info, UserAccount>,
    pub owner: Signer<'info>,
}
