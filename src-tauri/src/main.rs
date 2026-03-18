// Prevent an extra console window on Windows release builds; do not remove.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    flavortown_desktop_app_lib::run()
}
