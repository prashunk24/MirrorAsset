#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, Symbol, symbol_short};

// Struct to store vault data
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Vault {
    pub collateral_amount: i128,
    pub minted_amount: i128,
}

// Ledger keys
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Oracle,
    CollateralToken,
    SynthToken,
    Vault(Address),
    MinCollateralRatio, // e.g. 15000 for 150.00%
    LiquidationBonus,   // e.g. 1000 for 10.00%
    RedemptionFee,      // e.g. 50 for 0.50%
}

// Custom errors for structured error handling
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NegativeAmount = 3,
    InsufficientCollateralRatio = 4,
    BurnAmountExceedsDebt = 5,
    InsufficientCollateral = 6,
    WithdrawalRatioTooLow = 7,
    VaultIsHealthy = 8,
}

// Interface for Oracle
#[contract]
pub struct MockOracle;

#[contractimpl]
impl MockOracle {
    // Returns price in 7 decimal places (e.g., $1.00 = 10_000_000)
    pub fn get_price(_env: Env, asset: Symbol) -> i128 {
        if asset == symbol_short!("XLM") {
            1_200_000 // $0.12
        } else if asset == symbol_short!("USDC") {
            10_000_000 // $1.00
        } else if asset == symbol_short!("sXAU") {
            2300_000_000 // $2300.00 (Gold)
        } else if asset == symbol_short!("sAAPL") {
            170_000_000 // $170.00 (Apple)
        } else {
            0
        }
    }
}

#[contract]
pub struct MirrorVaultContract;

#[contractimpl]
impl MirrorVaultContract {
    /// Initialize the contract state
    pub fn initialize(
        env: Env,
        admin: Address,
        oracle: Address,
        collateral_token: Address,
        synth_token: Address,
        min_ratio: i128,
        liq_bonus: i128,
        red_fee: i128,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Oracle, &oracle);
        env.storage().instance().set(&DataKey::CollateralToken, &collateral_token);
        env.storage().instance().set(&DataKey::SynthToken, &synth_token);
        env.storage().instance().set(&DataKey::MinCollateralRatio, &min_ratio);
        env.storage().instance().set(&DataKey::LiquidationBonus, &liq_bonus);
        env.storage().instance().set(&DataKey::RedemptionFee, &red_fee);
        Ok(())
    }

    /// Query the current state of a user's vault
    pub fn get_vault(env: Env, user: Address) -> Vault {
        let key = DataKey::Vault(user);
        if env.storage().persistent().has(&key) {
            env.storage().persistent().get(&key).unwrap()
        } else {
            Vault {
                collateral_amount: 0,
                minted_amount: 0,
            }
        }
    }

    /// Query the oracle price for an asset symbol
    pub fn get_asset_price(env: Env, asset: Symbol) -> i128 {
        let oracle_addr: Address = env.storage().instance().get(&DataKey::Oracle).unwrap();
        if oracle_addr == env.current_contract_address() {
            // Self-mock fallback if oracle is self
            if asset == symbol_short!("XLM") {
                1_200_000 // $0.12
            } else if asset == symbol_short!("USDC") {
                10_000_000 // $1.00
            } else if asset == symbol_short!("sXAU") {
                2300_000_000 // $2300.00 (Gold)
            } else if asset == symbol_short!("sAAPL") {
                170_000_000 // $170.00 (Apple)
            } else {
                0
            }
        } else {
            // Invoke oracle contract's `get_price` method (Inter-contract communication)
            env.invoke_contract(&oracle_addr, &Symbol::new(&env, "get_price"), soroban_sdk::vec![&env, asset.to_val()])
        }
    }

    /// Deposit collateral into a user's vault
    pub fn deposit_collateral(env: Env, user: Address, amount: i128) -> Result<(), Error> {
        user.require_auth();
        if amount <= 0 {
            return Err(Error::NegativeAmount);
        }

        let mut vault = Self::get_vault(env.clone(), user.clone());
        vault.collateral_amount += amount;
        
        env.storage().persistent().set(&DataKey::Vault(user.clone()), &vault);

        // Publish event for tracking on-chain changes
        env.events().publish((symbol_short!("deposit"), user), amount);

        Ok(())
    }

    /// Mint synthetic tokens against the deposited collateral
    pub fn mint_synths(env: Env, user: Address, amount: i128) -> Result<(), Error> {
        user.require_auth();
        if amount <= 0 {
            return Err(Error::NegativeAmount);
        }

        let mut vault = Self::get_vault(env.clone(), user.clone());
        vault.minted_amount += amount;

        // Calculate if position is healthy
        let min_ratio: i128 = env.storage().instance().get(&DataKey::MinCollateralRatio).unwrap();
        let collateral_value = Self::calculate_collateral_value(env.clone(), vault.collateral_amount);
        let mint_value = Self::calculate_synth_value(env.clone(), vault.minted_amount);

        // Required Collateral = Minted Value * Min Ratio / 10000
        let required_collateral = (mint_value * min_ratio) / 10000;
        if collateral_value < required_collateral {
            return Err(Error::InsufficientCollateralRatio);
        }
        
        env.storage().persistent().set(&DataKey::Vault(user.clone()), &vault);

        // Publish event
        env.events().publish((symbol_short!("mint"), user), amount);

        Ok(())
    }

    /// Burn synthetic tokens to reduce debt and unlock collateral
    pub fn burn_synths(env: Env, user: Address, amount: i128) -> Result<(), Error> {
        user.require_auth();
        if amount <= 0 {
            return Err(Error::NegativeAmount);
        }

        let mut vault = Self::get_vault(env.clone(), user.clone());
        if vault.minted_amount < amount {
            return Err(Error::BurnAmountExceedsDebt);
        }

        vault.minted_amount -= amount;

        env.storage().persistent().set(&DataKey::Vault(user.clone()), &vault);

        // Publish event
        env.events().publish((symbol_short!("burn"), user), amount);

        Ok(())
    }

    /// Withdraw collateral from the vault
    pub fn withdraw_collateral(env: Env, user: Address, amount: i128) -> Result<(), Error> {
        user.require_auth();
        if amount <= 0 {
            return Err(Error::NegativeAmount);
        }

        let mut vault = Self::get_vault(env.clone(), user.clone());
        if vault.collateral_amount < amount {
            return Err(Error::InsufficientCollateral);
        }

        vault.collateral_amount -= amount;

        // If user has minted assets, verify the health of the remaining collateral
        if vault.minted_amount > 0 {
            let min_ratio: i128 = env.storage().instance().get(&DataKey::MinCollateralRatio).unwrap();
            let collateral_value = Self::calculate_collateral_value(env.clone(), vault.collateral_amount);
            let mint_value = Self::calculate_synth_value(env.clone(), vault.minted_amount);
            
            let required_collateral = (mint_value * min_ratio) / 10000;
            if collateral_value < required_collateral {
                return Err(Error::WithdrawalRatioTooLow);
            }
        }

        env.storage().persistent().set(&DataKey::Vault(user.clone()), &vault);

        // Publish event
        env.events().publish((symbol_short!("withdraw"), user), amount);

        Ok(())
    }

    /// Direct Redemption: swap synthetic asset directly for collateral at oracle prices
    pub fn redeem_synths(env: Env, redeemer: Address, amount: i128) -> Result<(), Error> {
        redeemer.require_auth();
        if amount <= 0 {
            return Err(Error::NegativeAmount);
        }

        // Calculate USD value of synthetic tokens being redeemed
        let synth_value = Self::calculate_synth_value(env.clone(), amount);
        
        // Apply redemption fee
        let red_fee: i128 = env.storage().instance().get(&DataKey::RedemptionFee).unwrap();
        let fee_value = (synth_value * red_fee) / 10000;
        let redeemable_value_usd = synth_value - fee_value;

        // Calculate how much collateral matches this USD value
        let collateral_price = Self::get_collateral_price(env.clone());
        let collateral_amount = (redeemable_value_usd * 10_000_000) / collateral_price;

        // Publish event
        env.events().publish((symbol_short!("redeem"), redeemer), (amount, collateral_amount));

        Ok(())
    }

    /// Liquidate an unhealthy vault
    pub fn liquidate(env: Env, liquidator: Address, vault_owner: Address, debt_to_cover: i128) -> Result<(), Error> {
        liquidator.require_auth();
        if debt_to_cover <= 0 {
            return Err(Error::NegativeAmount);
        }

        let mut vault = Self::get_vault(env.clone(), vault_owner.clone());
        if vault.minted_amount < debt_to_cover {
            return Err(Error::BurnAmountExceedsDebt);
        }

        // Verify that the vault is actually under-collateralized (ratio < min_ratio)
        let min_ratio: i128 = env.storage().instance().get(&DataKey::MinCollateralRatio).unwrap();
        let collateral_value = Self::calculate_collateral_value(env.clone(), vault.collateral_amount);
        let mint_value = Self::calculate_synth_value(env.clone(), vault.minted_amount);

        let current_ratio = if mint_value > 0 {
            (collateral_value * 10000) / mint_value
        } else {
            i128::MAX
        };

        if current_ratio >= min_ratio {
            return Err(Error::VaultIsHealthy);
        }

        // Calculate collateral value corresponding to covered debt + liquidation bonus
        let liq_bonus: i128 = env.storage().instance().get(&DataKey::LiquidationBonus).unwrap();
        let debt_value_usd = Self::calculate_synth_value(env.clone(), debt_to_cover);
        
        // Collateral value to seize = debt_value_usd * (1 + bonus)
        let collateral_value_to_seize = (debt_value_usd * (10000 + liq_bonus)) / 10000;
        
        let collateral_price = Self::get_collateral_price(env.clone());
        let collateral_to_seize = (collateral_value_to_seize * 10_000_000) / collateral_price;

        // Ensure we don't seize more collateral than what's in the vault
        let final_seize_amount = if collateral_to_seize > vault.collateral_amount {
            vault.collateral_amount
        } else {
            collateral_to_seize
        };

        // Update vault state
        vault.collateral_amount -= final_seize_amount;
        vault.minted_amount -= debt_to_cover;

        env.storage().persistent().set(&DataKey::Vault(vault_owner.clone()), &vault);

        // Publish event
        env.events().publish((symbol_short!("liquidate"), liquidator, vault_owner), (debt_to_cover, final_seize_amount));

        Ok(())
    }

    // Helper functions
    fn get_collateral_price(env: Env) -> i128 {
        Self::get_asset_price(env, symbol_short!("XLM"))
    }

    fn calculate_collateral_value(env: Env, amount: i128) -> i128 {
        let price = Self::get_collateral_price(env);
        (amount * price) / 10_000_000
    }

    fn calculate_synth_value(env: Env, amount: i128) -> i128 {
        let price = Self::get_asset_price(env, symbol_short!("sXAU"));
        (amount * price) / 10_000_000
    }
}

#[cfg(test)]
mod test;
