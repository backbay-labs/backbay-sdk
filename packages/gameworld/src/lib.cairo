//! Glia Fab World - Onchain game state with asset attestations
//!
//! This Dojo world manages:
//! - Asset references (IPFS CIDs + Membrane attestation UIDs)
//! - Asset instances in game worlds
//! - Player state and inventory
//!
//! Integration with Membrane:
//! - Assets are first attested via Membrane (EAS on Base L2)
//! - Attestation UIDs are stored here for verification
//! - IPFS CIDs reference the actual 3D assets

pub mod models {
    pub mod asset;
    pub mod player;
    pub mod world_meta;
}

pub mod systems {
    pub mod asset_registry;
    pub mod spawn;
    pub mod attestation_verifier;
    pub mod verified_registry;
}

#[cfg(test)]
mod tests {
    mod test_asset;
}
