use rust_xlsxwriter::{Workbook, XlsxError};

pub fn export_to_xlsx() -> Result<(), String> {
    let mut workbook = Workbook::new();
    let worksheet = workbook.add_worksheet();

    worksheet.write_string(0, 0, "Hello").unwrap();
    worksheet.write_number(0, 1, 123).unwrap();

    workbook.save("output.xlsx").unwrap();
    println!("Data exported successfully!");
    Ok(())
}
