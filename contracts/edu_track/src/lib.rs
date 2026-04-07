#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, Map, String, Symbol, Vec,
    token,
};

// ── Storage Keys ────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Admin,
    TokenId,
    Role(Address),
    Balance(Address),
    ActivityDone(Address, String),   // (student, activity_id) → bool
    MultisigThreshold,
    MultisigApprovals(Symbol),       // proposal_id → Vec<Address>
    Proposal(Symbol),                // proposal_id → Proposal
}

// ── Types ────────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum Role {
    Admin,
    Teacher,
    Student,
}

#[contracttype]
#[derive(Clone)]
pub struct Proposal {
    pub action: Symbol,   // "fund" | "transfer"
    pub amount: i128,
    pub target: Address,
    pub executed: bool,
}

// ── Events ───────────────────────────────────────────────────────────────────

const EVT_REWARD: Symbol    = symbol_short!("reward");
const EVT_REDEEM: Symbol    = symbol_short!("redeem");
const EVT_ROLE: Symbol      = symbol_short!("role");
const EVT_PROPOSAL: Symbol  = symbol_short!("proposal");
const EVT_EXECUTE: Symbol   = symbol_short!("execute");

// ── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct EduTrack;

#[contractimpl]
impl EduTrack {

    // ── Init ─────────────────────────────────────────────────────────────────

    /// Initialize contract: set admin, token, multisig threshold.
    pub fn initialize(env: Env, admin: Address, token_id: Address, threshold: u32) {
        assert!(!env.storage().instance().has(&DataKey::Admin), "already init");
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenId, &token_id);
        env.storage().instance().set(&DataKey::MultisigThreshold, &threshold);
        env.storage().persistent().set(&DataKey::Role(admin.clone()), &Role::Admin);
    }

    // ── Role Management ───────────────────────────────────────────────────────

    pub fn set_role(env: Env, caller: Address, target: Address, role: Role) {
        caller.require_auth();
        Self::assert_role(&env, &caller, Role::Admin);
        env.storage().persistent().set(&DataKey::Role(target.clone()), &role);
        env.events().publish((EVT_ROLE, target), role);
    }

    pub fn get_role(env: Env, addr: Address) -> Role {
        env.storage()
            .persistent()
            .get(&DataKey::Role(addr))
            .unwrap_or(Role::Student)
    }

    // ── Reward ────────────────────────────────────────────────────────────────

    /// Reward a student for a unique activity.
    pub fn reward_student(
        env: Env,
        caller: Address,
        student: Address,
        activity_id: String,
        amount: i128,
    ) {
        caller.require_auth();
        Self::assert_role_any(&env, &caller, &[Role::Admin, Role::Teacher]);
        assert!(amount > 0, "amount must be positive");

        let done_key = DataKey::ActivityDone(student.clone(), activity_id.clone());
        assert!(
            !env.storage().persistent().has(&done_key),
            "activity already rewarded"
        );

        Self::transfer_from_treasury(&env, &student, amount);
        env.storage().persistent().set(&done_key, &true);

        // update internal balance ledger
        let bal: i128 = env.storage()
            .persistent()
            .get(&DataKey::Balance(student.clone()))
            .unwrap_or(0);
        env.storage().persistent().set(&DataKey::Balance(student.clone()), &(bal + amount));

        env.events().publish((EVT_REWARD, student), (activity_id, amount));
    }

    /// Bulk reward distribution.
    pub fn bulk_reward(
        env: Env,
        caller: Address,
        students: Vec<Address>,
        activity_ids: Vec<String>,
        amounts: Vec<i128>,
    ) {
        caller.require_auth();
        Self::assert_role_any(&env, &caller, &[Role::Admin, Role::Teacher]);
        let n = students.len();
        assert!(n == activity_ids.len() && n == amounts.len(), "length mismatch");

        for i in 0..n {
            let student = students.get(i).unwrap();
            let activity_id = activity_ids.get(i).unwrap();
            let amount = amounts.get(i).unwrap();
            assert!(amount > 0, "amount must be positive");

            let done_key = DataKey::ActivityDone(student.clone(), activity_id.clone());
            if env.storage().persistent().has(&done_key) {
                continue; // skip duplicates silently in bulk
            }

            Self::transfer_from_treasury(&env, &student, amount);
            env.storage().persistent().set(&done_key, &true);

            let bal: i128 = env.storage()
                .persistent()
                .get(&DataKey::Balance(student.clone()))
                .unwrap_or(0);
            env.storage().persistent().set(&DataKey::Balance(student.clone()), &(bal + amount));

            env.events().publish((EVT_REWARD, student), (activity_id, amount));
        }
    }

    // ── Redemption ────────────────────────────────────────────────────────────

    pub fn redeem(env: Env, student: Address, reward_type: String, amount: i128) {
        student.require_auth();
        assert!(amount > 0, "amount must be positive");

        let bal_key = DataKey::Balance(student.clone());
        let bal: i128 = env.storage().persistent().get(&bal_key).unwrap_or(0);
        assert!(bal >= amount, "insufficient balance");

        // burn / send back to treasury
        let token_id: Address = env.storage().instance().get(&DataKey::TokenId).unwrap();
        let token_client = token::Client::new(&env, &token_id);
        let contract_addr = env.current_contract_address();
        token_client.transfer(&student, &contract_addr, &amount);

        env.storage().persistent().set(&bal_key, &(bal - amount));
        env.events().publish((EVT_REDEEM, student), (reward_type, amount));
    }

    // ── Balance ───────────────────────────────────────────────────────────────

    pub fn balance(env: Env, student: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(student))
            .unwrap_or(0)
    }

    // ── Multisig Treasury ─────────────────────────────────────────────────────

    /// Admin proposes a treasury action (fund or large transfer).
    pub fn propose(
        env: Env,
        proposer: Address,
        proposal_id: Symbol,
        action: Symbol,
        amount: i128,
        target: Address,
    ) {
        proposer.require_auth();
        Self::assert_role(&env, &proposer, Role::Admin);
        assert!(
            !env.storage().persistent().has(&DataKey::Proposal(proposal_id.clone())),
            "proposal exists"
        );

        let proposal = Proposal { action, amount, target, executed: false };
        env.storage().persistent().set(&DataKey::Proposal(proposal_id.clone()), &proposal);

        let approvals: Vec<Address> = Vec::new(&env);
        env.storage().persistent().set(&DataKey::MultisigApprovals(proposal_id.clone()), &approvals);

        env.events().publish((EVT_PROPOSAL, proposer), proposal_id);
    }

    /// Admin approves a proposal; executes when threshold is reached.
    pub fn approve(env: Env, approver: Address, proposal_id: Symbol) {
        approver.require_auth();
        Self::assert_role(&env, &approver, Role::Admin);

        let mut proposal: Proposal = env.storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id.clone()))
            .expect("proposal not found");
        assert!(!proposal.executed, "already executed");

        let mut approvals: Vec<Address> = env.storage()
            .persistent()
            .get(&DataKey::MultisigApprovals(proposal_id.clone()))
            .unwrap_or(Vec::new(&env));

        // prevent double approval
        for a in approvals.iter() {
            assert!(a != approver, "already approved");
        }
        approvals.push_back(approver.clone());
        env.storage().persistent().set(&DataKey::MultisigApprovals(proposal_id.clone()), &approvals);

        let threshold: u32 = env.storage().instance().get(&DataKey::MultisigThreshold).unwrap();
        if approvals.len() >= threshold {
            Self::execute_proposal(&env, &mut proposal);
            proposal.executed = true;
            env.storage().persistent().set(&DataKey::Proposal(proposal_id.clone()), &proposal);
            env.events().publish((EVT_EXECUTE, approver), proposal_id);
        }
    }

    // ── Internal Helpers ──────────────────────────────────────────────────────

    fn assert_role(env: &Env, addr: &Address, expected: Role) {
        let role: Role = env.storage()
            .persistent()
            .get(&DataKey::Role(addr.clone()))
            .unwrap_or(Role::Student);
        assert!(role == expected, "unauthorized");
    }

    fn assert_role_any(env: &Env, addr: &Address, allowed: &[Role]) {
        let role: Role = env.storage()
            .persistent()
            .get(&DataKey::Role(addr.clone()))
            .unwrap_or(Role::Student);
        assert!(allowed.contains(&role), "unauthorized");
    }

    fn transfer_from_treasury(env: &Env, to: &Address, amount: i128) {
        let token_id: Address = env.storage().instance().get(&DataKey::TokenId).unwrap();
        let token_client = token::Client::new(env, &token_id);
        let contract_addr = env.current_contract_address();
        token_client.transfer(&contract_addr, to, &amount);
    }

    fn execute_proposal(env: &Env, proposal: &mut Proposal) {
        let token_id: Address = env.storage().instance().get(&DataKey::TokenId).unwrap();
        let token_client = token::Client::new(env, &token_id);
        let contract_addr = env.current_contract_address();

        let fund_sym = symbol_short!("fund");
        let transfer_sym = symbol_short!("transfer");

        if proposal.action == fund_sym {
            // mint / transfer into treasury (contract holds funds)
            token_client.transfer(&proposal.target, &contract_addr, &proposal.amount);
        } else if proposal.action == transfer_sym {
            token_client.transfer(&contract_addr, &proposal.target, &proposal.amount);
        }
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
        token::{Client as TokenClient, StellarAssetClient},
        Address, Env, String, Symbol, Vec,
    };

    fn setup() -> (Env, Address, Address, EduTrackClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let token_admin = Address::generate(&env);

        // deploy a test token
        let token_id = env.register_stellar_asset_contract(token_admin.clone());
        let token_sac = StellarAssetClient::new(&env, &token_id);
        token_sac.mint(&admin, &1_000_000);

        let contract_id = env.register_contract(None, EduTrack);
        let client = EduTrackClient::new(&env, &contract_id);

        client.initialize(&admin, &token_id, &2u32);

        // fund treasury (contract address)
        let token_client = TokenClient::new(&env, &token_id);
        token_client.transfer(&admin, &contract_id, &500_000);

        (env, admin, contract_id, client)
    }

    #[test]
    fn test_reward_and_balance() {
        let (env, admin, _contract_id, client) = setup();
        let student = Address::generate(&env);
        client.set_role(&admin, &student, &Role::Student);

        let activity = String::from_str(&env, "course:rust101");
        client.reward_student(&admin, &student, &activity, &100);
        assert_eq!(client.balance(&student), 100);
    }

    #[test]
    #[should_panic(expected = "activity already rewarded")]
    fn test_no_duplicate_reward() {
        let (env, admin, _contract_id, client) = setup();
        let student = Address::generate(&env);
        let activity = String::from_str(&env, "course:rust101");
        client.reward_student(&admin, &student, &activity, &100);
        client.reward_student(&admin, &student, &activity, &100); // should panic
    }

    #[test]
    fn test_bulk_reward() {
        let (env, admin, _contract_id, client) = setup();
        let s1 = Address::generate(&env);
        let s2 = Address::generate(&env);

        let mut students = Vec::new(&env);
        students.push_back(s1.clone());
        students.push_back(s2.clone());

        let mut acts = Vec::new(&env);
        acts.push_back(String::from_str(&env, "quiz:1"));
        acts.push_back(String::from_str(&env, "quiz:1"));

        let mut amounts = Vec::new(&env);
        amounts.push_back(50i128);
        amounts.push_back(75i128);

        client.bulk_reward(&admin, &students, &acts, &amounts);
        assert_eq!(client.balance(&s1), 50);
        assert_eq!(client.balance(&s2), 75);
    }

    #[test]
    fn test_redeem() {
        let (env, admin, contract_id, client) = setup();
        let student = Address::generate(&env);
        let activity = String::from_str(&env, "exam:final");
        client.reward_student(&admin, &student, &activity, &200);

        let reward_type = String::from_str(&env, "scholarship");
        client.redeem(&student, &reward_type, &50);
        assert_eq!(client.balance(&student), 150);
    }

    #[test]
    #[should_panic(expected = "unauthorized")]
    fn test_role_enforcement() {
        let (env, admin, _contract_id, client) = setup();
        let rando = Address::generate(&env);
        let student = Address::generate(&env);
        let activity = String::from_str(&env, "course:x");
        // rando has no teacher/admin role → should panic
        client.reward_student(&rando, &student, &activity, &10);
    }

    #[test]
    fn test_multisig_proposal() {
        let (env, admin, _contract_id, client) = setup();
        let admin2 = Address::generate(&env);
        client.set_role(&admin, &admin2, &Role::Admin);

        let target = Address::generate(&env);
        let pid = Symbol::new(&env, "prop1");
        let action = symbol_short!("transfer");

        client.propose(&admin, &pid, &action, &100, &target);
        client.approve(&admin, &pid);
        client.approve(&admin2, &pid); // threshold=2, executes here
    }
}
