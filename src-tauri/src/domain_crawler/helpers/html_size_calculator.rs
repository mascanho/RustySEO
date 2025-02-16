use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Sizes {
    pub kb: usize,
    pub length: usize,
}

pub fn calculate_html_size(number: Option<usize>) -> Vec<Sizes> {
    let mut sizes = Vec::new();

    if let Some(size) = number {
        // Calculate KB from bytes
        let kb = size / 1024;

        sizes.push(Sizes { length: size, kb });
    }

    sizes
}
