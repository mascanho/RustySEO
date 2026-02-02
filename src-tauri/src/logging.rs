use serde::Serialize;
use std::sync::mpsc;
use tracing::{Event, Subscriber};
use tracing_subscriber::layer::Context;
use tracing_subscriber::{prelude::*, Registry};

#[derive(Serialize, Clone)]
pub struct LogPayload {
    pub timestamp: String,
    pub level: String,
    pub message: String,
}

pub struct Logger {
    sender: mpsc::Sender<LogPayload>,
}

impl Logger {
    pub fn new(sender: mpsc::Sender<LogPayload>) -> Self {
        Self { sender }
    }
}

impl<S: Subscriber> tracing_subscriber::Layer<S> for Logger {
    fn on_event(&self, event: &Event<'_>, _ctx: Context<'_, S>) {
        let mut visitor = LogVisitor::new();
        event.record(&mut visitor);

        let level = event.metadata().level().to_string();
        let timestamp = chrono::Local::now().format("%H:%M:%S").to_string();

        let payload = LogPayload {
            timestamp,
            level: level.to_lowercase(),
            message: visitor.message,
        };

        // Debug print to see if we are capturing anything
        eprintln!("[Backend Logger] Capturing event: {}", payload.message);

        let _ = self.sender.send(payload);
    }
}

struct LogVisitor {
    message: String,
}

impl LogVisitor {
    fn new() -> Self {
        Self {
            message: String::new(),
        }
    }
}

impl tracing::field::Visit for LogVisitor {
    fn record_debug(&mut self, field: &tracing::field::Field, value: &dyn std::fmt::Debug) {
        if field.name() == "message" {
            self.message = format!("{:?}", value);
        } else {
            if !self.message.is_empty() {
                self.message.push(' ');
            }
            self.message.push_str(&format!("{}={:?} ", field.name(), value));
        }
    }

    fn record_str(&mut self, field: &tracing::field::Field, value: &str) {
        if field.name() == "message" {
            self.message = value.to_string()
        }
    }
}

// THIS TRAIT ALLOWS TO LOG EASIALLY ON ANY PART OF THE APP
pub trait AppLogable {
    // INFO
    fn log_info(&self);
    // ERRRORS
    fn log_error(&self);
    // DEBUG
    fn log_debug(&self);
}

// SUPPORT DISPLAY
impl<T: std::fmt::Display> AppLogable for T {
    fn log_info(&self) {
        tracing::info!("{}", self)
    }

    fn log_error(&self) {
        tracing::error!("{}", self)
    }

    fn log_debug(&self) {
        tracing::debug!("{}", self)
    }
}

/// A macro similar to println! but for the TUI logs.
/// Supports standard formatting like {:?} for objects.
#[macro_export]
macro_rules! tui_println {
    ($($arg:tt)*) => {
        tracing::info!($($arg)*)
    };
}

/// A macro similar to dbg! but for the TUI logs.
/// Prints the file, line, and the debug representation of the expression.
#[macro_export]
macro_rules! tui_dbg {
    ($val:expr $(,)?) => {
        match $val {
            tmp => {
                tracing::info!(
                    "[{}:{}] {} = {:?}",
                    file!(),
                    line!(),
                    stringify!($val),
                    &tmp
                );
                tmp
            }
        }
    };
}

use tracing_subscriber::EnvFilter;

pub fn init() -> mpsc::Receiver<LogPayload> {
    let (tx, rx) = mpsc::channel();

    let tui_layer = Logger::new(tx);
    let fmt_layer = tracing_subscriber::fmt::layer()
        .with_target(false)
        .compact();
    
    // Default to 'info' level unless RUST_LOG is set
    // We explicitly enable logs for our own modules to be sure
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,rusty_seo=info,crawler=info"));

    let subscriber = Registry::default()
        .with(filter)
        .with(fmt_layer)
        .with(tui_layer);

    tracing::subscriber::set_global_default(subscriber).expect("setting default subscriber failed");

    rx
}
