#![cfg(test)]
use super::*;
use soroban_sdk::{Env, Address, testutils::Address as _};

// ─────────────────────────────────────────────────────────────
// Helper: spin up a fully-initialized contract + oracle
// ─────────────────────────────────────────────────────────────
fn setup_contract(env: &Env) -> (MirrorVaultContractClient<'_>, Address) {
    let admin          = Address::generate(env);
    let oracle_id      = env.register_contract(None, MockOracle);
    let collateral_tok = Address::generate(env);
    let synth_tok      = Address::generate(env);

    let contract_id = env.register_contract(None, MirrorVaultContract);
    let client = MirrorVaultContractClient::new(env, &contract_id);

    client.initialize(
        &admin,
        &oracle_id,
        &collateral_tok,
        &synth_tok,
        &15000, // min_ratio  = 150.00%
        &1000,  // liq_bonus  =  10.00%
        &50,    // red_fee    =   0.50%
    );

    (client, admin)
}

// ─────────────────────────────────────────────────────────────
// TEST 1 – Initialization: contract stores correct initial state
// ─────────────────────────────────────────────────────────────
#[test]
fn test_initialize_and_get_vault() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, admin) = setup_contract(&env);

    // A fresh vault for any address must start at zero balances
    let vault = client.get_vault(&admin);
    assert_eq!(vault.collateral_amount, 0,
        "New vault collateral must be zero after initialization");
    assert_eq!(vault.minted_amount, 0,
        "New vault debt must be zero after initialization");
}

// ─────────────────────────────────────────────────────────────
// TEST 2 – Double-init guard: second initialize() must fail
// ─────────────────────────────────────────────────────────────
#[test]
fn test_initialize_twice_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, admin) = setup_contract(&env);

    // Attempt a second initialization
    let dummy = Address::generate(&env);
    let result = client.try_initialize(
        &admin, &dummy, &dummy, &dummy,
        &15000, &1000, &50,
    );
    assert!(result.is_err(), "Re-initializing must return AlreadyInitialized error");
}

// ─────────────────────────────────────────────────────────────
// TEST 3 – Collateral deposit: vault balance increases correctly
// ─────────────────────────────────────────────────────────────
#[test]
fn test_deposit_collateral() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _) = setup_contract(&env);
    let user = Address::generate(&env);

    // Deposit 100 XLM (7 decimals → 100_0000000)
    client.deposit_collateral(&user, &100_0000000);

    let vault = client.get_vault(&user);
    assert_eq!(vault.collateral_amount, 100_0000000,
        "Collateral must equal the deposited amount");
    assert_eq!(vault.minted_amount, 0,
        "No synths have been minted yet");
}

// ─────────────────────────────────────────────────────────────
// TEST 4 – Negative-amount guard: deposit of 0 / negative fails
// ─────────────────────────────────────────────────────────────
#[test]
fn test_deposit_zero_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _) = setup_contract(&env);
    let user = Address::generate(&env);

    let result = client.try_deposit_collateral(&user, &0);
    assert!(result.is_err(), "Zero-amount deposit must return NegativeAmount error");
}

// ─────────────────────────────────────────────────────────────
// TEST 5 – Ratio enforcement: minting beyond limit is rejected
// ─────────────────────────────────────────────────────────────
#[test]
fn test_mint_synths_and_ratio_enforcement() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _) = setup_contract(&env);
    let user = Address::generate(&env);

    // Deposit 1 000 XLM (7 dec).  At $0.12 / XLM → collateral value = $120.00
    client.deposit_collateral(&user, &1000_0000_000);

    // Mint 3 sXAU (7 dec).  At $2 300 / sXAU → mint value = $6 900 … wait,
    // price is stored with 7 decimals so 3_000_000 raw units = 0.3 sXAU
    // value = 0.3 * $2300 = $69.  Ratio = $120/$69 ≈ 173.9% ≥ 150% → OK
    client.mint_synths(&user, &3_000_000);

    let vault = client.get_vault(&user);
    assert_eq!(vault.collateral_amount, 1000_0000_000);
    assert_eq!(vault.minted_amount, 3_000_000);

    // Minting 1 more sXAU raw unit raises total to 4_000_000 → $92
    // Ratio = $120/$92 ≈ 130% < 150% → must fail
    let result = client.try_mint_synths(&user, &1_000_000);
    assert!(result.is_err(), "Mint exceeding ratio must return InsufficientCollateralRatio");
}

// ─────────────────────────────────────────────────────────────
// TEST 6 – Burn synths: reduces vault debt correctly
// ─────────────────────────────────────────────────────────────
#[test]
fn test_burn_synths_reduces_debt() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _) = setup_contract(&env);
    let user = Address::generate(&env);

    // Deposit large collateral so we can freely mint
    client.deposit_collateral(&user, &1000_0000_000);
    // Mint 3 raw synth units
    client.mint_synths(&user, &3_000_000);

    // Burn 2 raw synth units
    client.burn_synths(&user, &2_000_000);

    let vault = client.get_vault(&user);
    assert_eq!(vault.minted_amount, 1_000_000,
        "Debt must equal minted − burned amount");

    // Burning more than outstanding debt must fail
    let result = client.try_burn_synths(&user, &999_000_000);
    assert!(result.is_err(), "Over-burn must return BurnAmountExceedsDebt error");
}

// ─────────────────────────────────────────────────────────────
// TEST 7 – Redeem synths: event is published, positive amount succeeds
// ─────────────────────────────────────────────────────────────
#[test]
fn test_redeem_synths_succeeds_for_positive_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _) = setup_contract(&env);
    let redeemer = Address::generate(&env);

    // Redemption only validates amount > 0 and publishes an event;
    // it does not require the redeemer to hold a vault position.
    let result = client.try_redeem_synths(&redeemer, &5_000_000);
    assert!(result.is_ok(),
        "Redeeming a positive amount must succeed");

    // Redeeming zero must fail
    let result_zero = client.try_redeem_synths(&redeemer, &0);
    assert!(result_zero.is_err(),
        "Zero redemption must return NegativeAmount error");
}

// ─────────────────────────────────────────────────────────────
// TEST 8 – Withdraw collateral: ratio protection + happy path
// ─────────────────────────────────────────────────────────────
#[test]
fn test_withdraw_collateral_respects_ratio() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _) = setup_contract(&env);
    let user = Address::generate(&env);

    // Deposit 1000 XLM, mint 3 raw synth units
    client.deposit_collateral(&user, &1000_0000_000);
    client.mint_synths(&user, &3_000_000);

    // Withdraw a tiny amount — ratio still healthy → OK
    client.withdraw_collateral(&user, &1_0000_000); // 1 XLM

    let vault = client.get_vault(&user);
    assert_eq!(vault.collateral_amount, 999_0000_000,
        "Collateral must reflect the withdrawn amount");

    // Withdraw almost all — this collapses the ratio below 150% → must fail
    let result = client.try_withdraw_collateral(&user, &998_0000_000);
    assert!(result.is_err(),
        "Withdrawal that breaks ratio must return WithdrawalRatioTooLow");
}

// ─────────────────────────────────────────────────────────────
// TEST 9 – Liquidation: healthy vault cannot be liquidated
// ─────────────────────────────────────────────────────────────
#[test]
fn test_liquidate_healthy_vault_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _) = setup_contract(&env);
    let owner      = Address::generate(&env);
    let liquidator = Address::generate(&env);

    // Create a well-collateralized vault (≈ 174% ratio)
    client.deposit_collateral(&owner, &1000_0000_000);
    client.mint_synths(&owner, &3_000_000);

    // Liquidation attempt on a healthy vault must be rejected
    let result = client.try_liquidate(&liquidator, &owner, &1_000_000);
    assert!(result.is_err(),
        "Liquidating a healthy vault must return VaultIsHealthy error");
}
