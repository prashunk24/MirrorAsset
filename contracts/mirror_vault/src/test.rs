#![cfg(test)]
use super::*;
use soroban_sdk::{Env, Address, testutils::Address as _};

#[test]
fn test_initialize_and_get_vault() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let collateral_token = Address::generate(&env);
    let synth_token = Address::generate(&env);

    let contract_id = env.register_contract(None, MirrorVaultContract);
    let client = MirrorVaultContractClient::new(&env, &contract_id);

    client.initialize(
        &admin,
        &oracle,
        &collateral_token,
        &synth_token,
        &15000, // min_ratio (150%)
        &1000,  // liq_bonus (10%)
        &50,    // red_fee (0.5%)
    );

    let vault = client.get_vault(&admin);
    assert_eq!(vault.collateral_amount, 0);
    assert_eq!(vault.minted_amount, 0);
}

#[test]
fn test_deposit_collateral() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let collateral_token = Address::generate(&env);
    let synth_token = Address::generate(&env);

    let contract_id = env.register_contract(None, MirrorVaultContract);
    let client = MirrorVaultContractClient::new(&env, &contract_id);

    client.initialize(
        &admin,
        &oracle,
        &collateral_token,
        &synth_token,
        &15000,
        &1000,
        &50,
    );

    let user = Address::generate(&env);
    client.deposit_collateral(&user, &1000_0000); // 1.0 XLM/USDC in 7 decimals

    let vault = client.get_vault(&user);
    assert_eq!(vault.collateral_amount, 1000_0000);
    assert_eq!(vault.minted_amount, 0);
}

#[test]
fn test_mint_synths_and_ratio_enforcement() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    
    // Register Mock Oracle
    let oracle_id = env.register_contract(None, MockOracle);
    
    let collateral_token = Address::generate(&env);
    let synth_token = Address::generate(&env);

    let contract_id = env.register_contract(None, MirrorVaultContract);
    let client = MirrorVaultContractClient::new(&env, &contract_id);

    client.initialize(
        &admin,
        &oracle_id,
        &collateral_token,
        &synth_token,
        &15000, // 150.00% min ratio
        &1000,
        &50,
    );

    let user = Address::generate(&env);
    
    // Deposit 1000 XLM as collateral. At $0.12/XLM, collateral value is $120.00
    // 1000 XLM in 7 decimals = 1000_0000_000
    client.deposit_collateral(&user, &1000_0000_000);

    // Let's verify we can mint some synths (e.g. sXAU).
    // Let's try to mint 3.0 sXAU (value = $69.00).
    // 3.0 sXAU in 7 decimals = 3_000_000
    // Ratio = $120 / $69 = ~173.9% which is >= 150%, so it should succeed.
    client.mint_synths(&user, &3_000_000);

    let vault = client.get_vault(&user);
    assert_eq!(vault.collateral_amount, 1000_0000_000);
    assert_eq!(vault.minted_amount, 3_000_000);

    // Now let's try to mint too much so the ratio falls below 150%
    // Minting another 1.0 sXAU (bringing total to 4.0 sXAU, value $92.00) makes the ratio 130%.
    // This should return an error.
    let result = client.try_mint_synths(&user, &1_000_000);
    assert!(result.is_err());
}
