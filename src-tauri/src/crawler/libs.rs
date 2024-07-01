use reqwest::Client;
use std::error::Error;
use xml::reader::{EventReader, XmlEvent};

pub async fn get_sitemap() -> Result<(), Box<dyn Error>> {
    // URL of the website's sitemap.xml
    let url = "https://relexsolutions.com/sitemap.xml";

    // Create a reqwest Client
    let client = Client::new();

    // Send GET request to fetch the sitemap.xml asynchronously
    let response = client.get(url).send().await?;

    // Check if the request was successful
    if !response.status().is_success() {
        println!(
            "Error: Request was not successful. Status code: {}",
            response.status()
        );
        return Ok(());
    }

    // Parse the XML response asynchronously
    let body = response.text().await?;

    // Print the sitemap XML to the user
    println!("Sitemap XML:");
    println!("{}", body);

    // Optionally, you can parse the XML content here if needed
    // let parser = EventReader::new(body.as_bytes());
    // let mut parser = parser.into_iter();
    // while let Some(event) = parser.next() {
    //     match event {
    //         Ok(XmlEvent::StartElement { name, .. }) => {
    //             println!("Start element: {}", name);
    //         }
    //         Ok(XmlEvent::EndElement { name }) => {
    //             println!("End element: {}", name);
    //         }
    //         Ok(XmlEvent::Characters(text)) => {
    //             println!("Text: {}", text);
    //         }
    //         Err(e) => {
    //             println!("Error parsing XML: {}", e);
    //             break;
    //         }
    //         _ => {}
    //     }
    // }

    println!("Sitemap parsing completed");

    Ok(())
}
