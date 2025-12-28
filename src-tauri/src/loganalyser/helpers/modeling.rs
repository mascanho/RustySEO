use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use std::net::AddrParseError;

#[derive(Debug, Deserialize, Clone)]
pub struct BingBotRanges {
    #[serde(rename = "creationTime")]
    pub creation_time: String,
    pub prefixes: Vec<BingPrefix>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct BingPrefix {
    #[serde(rename = "ipv4Prefix")]
    pub ipv4_prefix: Option<String>,
    #[serde(rename = "ipv6Prefix")]
    pub ipv6_prefix: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct OpenAIBotRanges {
    #[serde(rename = "creationTime")]
    pub creation_time: String,
    pub prefixes: Vec<OpenAIPrefix>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct OpenAIPrefix {
    #[serde(rename = "ipv4Prefix")]
    pub ipv4_prefix: Option<String>,
    #[serde(rename = "ipv6Prefix")]
    pub ipv6_prefix: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogEntry {
    pub ip: String,
    pub timestamp: NaiveDateTime,
    pub method: String,
    pub path: String,
    pub position: Option<i32>,
    pub gsc_url: Option<String>,
    pub clicks: Option<i32>,
    pub impressions: Option<i32>,
    pub status: u16,
    pub user_agent: String,
    pub referer: Option<String>,
    pub response_size: u64,
    pub country: Option<String>,
    pub crawler_type: String,
    pub browser: String,
    pub file_type: String,
    pub verified: bool,
    pub segment: String,
    pub segment_match: Option<String>,
    pub taxonomy: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TaxonomyInfo {
    pub path: String,
    pub match_type: String,
    pub name: String,
}

/// Custom error type for IP verification
#[derive(Debug)]
pub enum IpVerificationError {
    InvalidIp(AddrParseError),
    InvalidCidr(ipnet::PrefixLenError),
    ReqwestError(reqwest::Error),
}

impl From<AddrParseError> for IpVerificationError {
    fn from(err: AddrParseError) -> Self {
        IpVerificationError::InvalidIp(err)
    }
}

impl From<ipnet::PrefixLenError> for IpVerificationError {
    fn from(err: ipnet::PrefixLenError) -> Self {
        IpVerificationError::InvalidCidr(err)
    }
}

impl From<reqwest::Error> for IpVerificationError {
    fn from(err: reqwest::Error) -> Self {
        IpVerificationError::ReqwestError(err)
    }
}
